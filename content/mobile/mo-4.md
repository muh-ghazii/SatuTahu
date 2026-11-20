---
title: "Data di aplikasi mobile: API, penyimpanan lokal & offline-first"
minutes: 45
summary: Pengguna mobile sering berada di koneksi yang lambat atau putus-sambung. Aplikasi yang baik tetap bisa dibuka dan dipakai dalam kondisi itu. Modul ini membahas pemanggilan API dan parsing JSON, database lokal, strategi offline-first, Firebase untuk autentikasi dan data real-time, serta push notification.
objectives:
  - Memanggil REST API dan mengubah JSON menjadi model bertipe
  - Memilih dan memakai database lokal (Room, sqflite/Drift, Hive)
  - Merancang alur offline-first dengan database lokal sebagai sumber kebenaran
  - Memakai Firebase Auth/Firestore dan memahami alur push notification
sources:
  - repo: iampawan/FlutterExampleApps
    note: Contoh aplikasi Flutter dengan API, Firebase, dan database lokal
  - repo: dwyl/learn-flutter
    note: Penjelasan langkah demi langkah integrasi data di Flutter
  - repo: public-apis/public-apis
    note: Sumber API gratis untuk latihan
quiz:
  - q: "Dalam pola offline-first, UI sebaiknya menampilkan data dari…"
    options: ["Langsung dari API setiap saat", "Database lokal, yang disinkronkan dengan server di latar belakang", "Variabel global", "SharedPreferences"]
    answer: 1
    explain: "Database lokal menjadi sumber kebenaran sehingga aplikasi tetap bisa dibuka saat offline; jaringan hanya memperbarui isinya."
  - q: "Data mana yang cocok disimpan di SharedPreferences/DataStore, bukan di database?"
    options: ["10.000 transaksi", "Pengaturan tema gelap & bahasa", "Riwayat chat", "Katalog produk"]
    answer: 1
    explain: "Key-value store untuk preferensi kecil; data terstruktur dan banyak cocok di SQLite/Room/Drift."
  - q: "Keamanan data di Firestore ditentukan oleh…"
    options: ["Menyembunyikan API key di aplikasi", "Security Rules di server Firebase", "Obfuscation kode", "Nama koleksi yang rahasia"]
    answer: 1
    explain: "Konfigurasi Firebase di aplikasi tidak bersifat rahasia. Yang melindungi data adalah Security Rules yang dievaluasi di server."
  - q: "Token FCM (push notification) dikirim aplikasi ke backend untuk…"
    options: ["Login", "Agar server tahu alamat perangkat mana yang harus dikirimi notifikasi", "Mengenkripsi data", "Menghapus cache"]
    answer: 1
    explain: "Server memakai token itu untuk meminta FCM mengirim pesan ke perangkat tertentu."
---

Di laptop dengan Wi-Fi kampus, aplikasimu terasa cepat. Di HP pengguna yang sedang di kapal penyeberangan, di jalan antar kabupaten, atau di area sinyal lemah, cerita bisa berbeda. Modul ini membahas cara membuat aplikasi yang **tetap berguna saat jaringan tidak bisa diandalkan**.

## HTTP client & JSON

Aplikasi mobile berbicara dengan backend lewat HTTP, biasanya dengan data berformat JSON. Langkahnya: kirim request → cek status → ubah JSON menjadi **model bertipe**, bukan `Map` yang diakses dengan string di mana-mana.

```dart
// Flutter: package http + model dengan fromJson
class Produk {
  final int id;
  final String nama;
  final int harga;
  Produk({required this.id, required this.nama, required this.harga});

  factory Produk.fromJson(Map<String, dynamic> j) =>
      Produk(id: j['id'] as int, nama: j['title'] as String, harga: (j['price'] as num).round());
}

class ProdukApi {
  ProdukApi(this._client);
  final http.Client _client;

  Future<List<Produk>> ambilSemua() async {
    final res = await _client
        .get(Uri.parse('https://dummyjson.com/products?limit=30'))
        .timeout(const Duration(seconds: 10));          // jangan menunggu selamanya
    if (res.statusCode != 200) throw HttpException('HTTP ${res.statusCode}');
    final list = jsonDecode(res.body)['products'] as List;
    return list.map((e) => Produk.fromJson(e)).toList();
  }
}
```

```kotlin
// Android: Retrofit + kotlinx.serialization
@Serializable data class ProdukDto(val id: Int, val title: String, val price: Double)
@Serializable data class ProdukResponse(val products: List<ProdukDto>)

interface ProdukService {
    @GET("products") suspend fun semua(@Query("limit") limit: Int = 30): ProdukResponse
}
```

Untuk model yang banyak, gunakan *code generation* (`json_serializable`/`freezed` di Flutter, `kotlinx.serialization` di Kotlin) agar tidak menulis parsing manual. Pisahkan juga **DTO** (bentuk data dari API) dari **model domain**, agar perubahan nama field di API tidak merambat ke seluruh aplikasi.

## SQLite/Room/Hive

```viz
{"type":"compare","title":"Pilihan penyimpanan lokal","columns":["SharedPreferences / DataStore","SQLite (Room / Drift / sqflite)","Hive / Isar (NoSQL lokal)"],"rows":[{"label":"Model","values":["Key-value sederhana","Tabel relasional + SQL","Box/objek key-value"]},{"label":"Cocok untuk","values":["Pengaturan, token kecil, flag onboarding","Data terstruktur & banyak: transaksi, katalog, chat","Data objek sederhana, cepat dibaca"]},{"label":"Query kompleks","values":["Tidak","Ya (JOIN, index, agregasi)","Terbatas"]},{"label":"Reaktif (otomatis update UI)","values":["DataStore: Flow","Room/Drift: Flow/Stream","Ya (watch)"]}]}
```

**Room** (Android) menambahkan pemeriksaan query saat kompilasi dan mengembalikan `Flow`, sehingga UI otomatis terbarui saat data berubah:

```kotlin
@Entity data class ProdukEntity(@PrimaryKey val id: Int, val nama: String, val harga: Int, val diperbarui: Long)

@Dao interface ProdukDao {
    @Query("SELECT * FROM ProdukEntity ORDER BY nama") fun semua(): Flow<List<ProdukEntity>>
    @Upsert suspend fun simpanSemua(list: List<ProdukEntity>)
}
```

Di Flutter, **Drift** memberi pengalaman serupa (SQLite bertipe + stream). Data sensitif seperti token login disimpan di penyimpanan terenkripsi (`flutter_secure_storage`, Android Keystore), bukan di preferensi biasa.

## Caching & offline-first

Pola **offline-first**: database lokal adalah **sumber kebenaran** untuk UI; jaringan hanya bertugas menyinkronkan.

```viz
{"type":"sequence","title":"Alur offline-first: membaca dan menulis","caption":"Pengguna tidak pernah menunggu jaringan untuk melihat data atau mencatat transaksi. Jaringan hanya memperbarui di latar belakang.","actors":["UI","Repository","DB lokal","Server"],"messages":[{"from":0,"to":1,"label":"amati daftar transaksi","note":"UI berlangganan Flow/Stream dari repository."},{"from":1,"to":2,"label":"SELECT (stream)","note":"Data tersimpan langsung tampil, bahkan dalam mode pesawat."},{"from":1,"to":3,"label":"GET /transaksi?sejak=…","note":"Di latar belakang, ambil perubahan baru dari server."},{"from":3,"to":1,"label":"data baru","note":"Jika gagal (offline), tidak apa-apa: UI tetap menampilkan data lokal."},{"from":1,"to":2,"label":"upsert","note":"Database berubah → stream memancarkan → UI terbarui otomatis."},{"from":0,"to":1,"label":"catat transaksi baru","note":"Disimpan lokal dengan status ‘belum sinkron’ dan langsung tampil."},{"from":1,"to":3,"label":"POST (antrean sinkron)","note":"WorkManager/background task mengirim saat online; retry jika gagal."}]}
```

```viz
{"type":"cache"}
```

Tantangan sebenarnya ada pada **konflik**: data yang sama diubah di dua perangkat saat offline. Strategi paling sederhana adalah *last-write-wins* berdasarkan waktu; untuk data penting (stok, uang), lebih aman memodelkan perubahan sebagai **transaksi yang ditambahkan**, bukan menimpa angka total.

## Firebase Auth & Firestore

**Firebase** menyediakan backend siap pakai: autentikasi, database real-time, penyimpanan file, dan notifikasi. Cocok untuk prototipe dan aplikasi kecil–menengah tanpa membangun server sendiri.

```dart
// Login dengan email/password
final cred = await FirebaseAuth.instance.signInWithEmailAndPassword(email: email, password: password);

// Firestore: dengarkan perubahan secara real-time
FirebaseFirestore.instance
    .collection('toko').doc(tokoId).collection('pesanan')
    .where('status', isEqualTo: 'baru')
    .orderBy('dibuatPada', descending: true)
    .snapshots()                                   // Stream: otomatis update
    .listen((snap) => print('${snap.docs.length} pesanan baru'));
```

Firestore juga punya **cache offline bawaan**: penulisan saat offline disimpan dan dikirim saat online.

:::warning[Security Rules adalah pertahananmu]
Konfigurasi Firebase di dalam aplikasi (API key, project ID) **bukan rahasia**, karena siapa pun bisa membongkar APK. Data dilindungi oleh **Security Rules** yang dievaluasi di server, misalnya `allow read, write: if request.auth.uid == resource.data.pemilik;`. Jangan pernah merilis dengan rules ‘test mode’ yang mengizinkan semua orang membaca dan menulis.
:::

## Push notification

Push notification dikirim lewat layanan platform: **FCM** (Firebase Cloud Messaging) untuk Android dan juga meneruskan ke **APNs** untuk iOS.

```viz
{"type":"sequence","title":"Alur push notification","actors":["Aplikasi","FCM","Backend-mu"],"messages":[{"from":0,"to":1,"label":"minta token","note":"Di Android 13+ dan iOS, aplikasi harus meminta izin notifikasi dulu. Jelaskan manfaatnya sebelum meminta."},{"from":1,"to":0,"label":"FCM token","note":"Token unik per pemasangan aplikasi; bisa berubah sewaktu-waktu."},{"from":0,"to":2,"label":"simpan token untuk user","note":"Kirim ke backend dan perbarui setiap kali token berubah."},{"from":2,"to":1,"label":"kirim pesan ke token","note":"Mis. ‘Pesanan #981 sudah dikirim’ + data {pesananId: 981}."},{"from":1,"to":0,"label":"notifikasi tampil","note":"Saat diketuk, buka layar detail pesanan lewat deep link dari data."}]}
```

Notifikasi yang terlalu sering atau tidak relevan membuat pengguna mematikan izinnya, atau menghapus aplikasimu. Kirim yang **personal, tepat waktu, dan bisa ditindaklanjuti**, serta sediakan pengaturan kategori notifikasi di aplikasi.

:::latihan
Milestone: aplikasi berita/resep offline-first. Ambil data dari API publik, simpan ke database lokal (Room/Drift), tampilkan dari database lewat stream, sinkronkan saat dibuka dan saat tarik-untuk-muat-ulang, serta tandai item favorit yang tetap tersimpan offline. Uji dengan mode pesawat. Bonus: notifikasi lokal saat ada artikel baru.
:::

## Rangkuman

- Panggil API dengan timeout, cek status, dan ubah JSON menjadi model bertipe; pisahkan DTO dari model domain.
- Preferensi kecil di DataStore/SharedPreferences, data terstruktur di SQLite (Room/Drift), rahasia di penyimpanan terenkripsi.
- Offline-first: database lokal = sumber kebenaran; jaringan menyinkronkan di latar belakang dengan antrean dan retry.
- Firebase mempercepat backend; keamanan ditentukan Security Rules, bukan kerahasiaan config.
- Push: izin → token → simpan di backend → kirim lewat FCM; kirim yang relevan saja.
