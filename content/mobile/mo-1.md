---
title: Pilih platform & kuasai bahasanya
minutes: 40
summary: Sebelum membuat layar pertama, ada dua keputusan penting, yaitu teknologi apa yang dipakai dan bahasa apa yang harus dikuasai. Modul ini membandingkan Flutter, Kotlin, dan React Native, lalu membahas fitur bahasa Dart dan Kotlin yang paling sering dipakai, prinsip OOP dan fungsional, serta cara menyiapkan emulator dan perangkat nyata.
objectives:
  - Memilih teknologi mobile berdasarkan tujuan, bukan tren
  - Menulis Dart dengan null safety dan async/await
  - Menulis Kotlin dengan data class, null safety, dan coroutines
  - Menerapkan OOP dan gaya fungsional serta menyiapkan lingkungan pengembangan
sources:
  - repo: flutter/codelabs
    note: Alur codelab resmi Flutter dan Dart
  - repo: google-developer-training/basic-android-kotlin-compose-training-courses
    note: Urutan materi Kotlin dasar dalam kursus Android Basics with Compose
  - repo: bellshade/Kotlin
    note: Padanan istilah Kotlin dalam Bahasa Indonesia
quiz:
  - q: "Di Dart dengan null safety, apa arti tipe String? (dengan tanda tanya)?"
    options: ["String wajib berisi", "Nilainya boleh null", "String kosong", "Tipe dinamis"]
    answer: 1
    explain: "Tanda ? membuat tipe nullable. Tanpa ?, compiler menjamin variabel tidak pernah null, sehingga crash karena null bisa dicegah sejak kompilasi."
  - q: "Keuntungan utama data class di Kotlin adalah…"
    options: ["Lebih cepat", "equals, hashCode, toString, dan copy dibuat otomatis", "Bisa diwarisi bebas", "Tidak butuh konstruktor"]
    answer: 1
    explain: "data class cocok untuk model data seperti Produk atau Pesanan dan mengurangi kode berulang."
  - q: "Kenapa operasi jaringan tidak boleh dijalankan di main/UI thread?"
    options: ["Karena dilarang hukum", "UI akan membeku sampai operasi selesai, bahkan Android bisa menampilkan dialog ‘App Not Responding’", "Agar baterai awet", "Tidak ada alasan"]
    answer: 1
    explain: "Gunakan async/await (Dart) atau coroutines dengan dispatcher IO (Kotlin) agar UI tetap responsif."
  - q: "Kamu ingin satu kode untuk Android dan iOS dengan UI yang konsisten dan performa tinggi. Pilihan paling sesuai?"
    options: ["Kotlin + Jetpack Compose saja", "Flutter", "Swift saja", "HTML statis"]
    answer: 1
    explain: "Flutter merender UI-nya sendiri sehingga tampil konsisten di kedua platform. (Kotlin Multiplatform juga berkembang, tetapi Compose untuk iOS masih lebih baru.)"
---

Indonesia adalah salah satu pasar smartphone terbesar di dunia, dan banyak orang mengakses internet pertama kali lewat HP, bukan laptop. Karena itu kemampuan membuat aplikasi mobile sangat dicari. Jalur ini membahas konsep yang berlaku di semua teknologi mobile, dengan contoh utama **Flutter (Dart)** dan **Android native (Kotlin + Jetpack Compose)**.

## Dart: null safety, async

**Dart** adalah bahasa di balik Flutter: bertipe statis, sintaksnya mirip Java/JavaScript, dan mendukung *hot reload* sehingga perubahan kode tampil dalam hitungan detik.

```dart
// Null safety: compiler membedakan yang boleh dan tidak boleh null
String nama = 'Ayu';          // tidak boleh null
String? panggilan;            // boleh null

int panjang = panggilan?.length ?? 0;   // ?. akses aman, ?? nilai cadangan
// panggilan.length;          // ❌ error kompilasi: bisa null!

// late: diinisialisasi nanti, tapi dijamin sebelum dipakai
late final String token;

// class dengan konstruktor ringkas & named parameter
class Produk {
  final int id;
  final String nama;
  final int harga;
  const Produk({required this.id, required this.nama, this.harga = 0});
}
```

Operasi yang lama, seperti jaringan, file, dan database, bersifat **asinkron**. Dart memakai `Future` (satu nilai di masa depan) dan `Stream` (rangkaian nilai dari waktu ke waktu).

```dart
Future<List<Produk>> ambilProduk() async {
  final res = await http.get(Uri.parse('https://dummyjson.com/products?limit=10'));
  if (res.statusCode != 200) throw Exception('Gagal memuat (${res.statusCode})');
  final data = jsonDecode(res.body)['products'] as List;
  return data.map((p) => Produk(id: p['id'], nama: p['title'], harga: (p['price'] as num).round())).toList();
}

Stream<int> hitungMundur(int dari) async* {
  for (var i = dari; i >= 0; i--) {
    await Future.delayed(const Duration(seconds: 1));
    yield i;                       // kirim nilai satu per satu
  }
}
```

Seperti JavaScript, Dart berjalan pada **event loop** satu thread per *isolate*. `await` tidak memblokir UI. Ia ‘menitipkan’ sisa fungsi untuk dilanjutkan setelah hasilnya tersedia.

## Kotlin: data class, coroutines

**Kotlin** adalah bahasa utama Android modern: ringkas, aman dari null, dan sepenuhnya kompatibel dengan Java.

```kotlin
// data class: equals/hashCode/toString/copy otomatis
data class Produk(val id: Int, val nama: String, val harga: Int = 0)

val gamis = Produk(1, "Gamis BKMT", 150_000)
val diskon = gamis.copy(harga = 135_000)      // salinan dengan satu field berubah

// null safety mirip Dart
var catatan: String? = null
val panjang = catatan?.length ?: 0            // Elvis operator

// when: switch yang lebih kuat
fun label(status: String) = when (status) {
    "baru" -> "Menunggu pembayaran"
    "dikirim" -> "Dalam perjalanan"
    else -> "Selesai"
}
```

**Coroutines** adalah cara Kotlin menulis kode asinkron yang terbaca seperti kode biasa. Fungsi `suspend` bisa ‘berhenti sementara’ tanpa memblokir thread.

```kotlin
suspend fun ambilProduk(): List<Produk> = withContext(Dispatchers.IO) {
    api.getProduk()          // berjalan di thread pool untuk IO, bukan main thread
}

// di ViewModel: viewModelScope otomatis dibatalkan saat layar ditutup
fun muat() = viewModelScope.launch {
    _state.value = UiState.Loading
    _state.value = try {
        UiState.Sukses(ambilProduk())
    } catch (e: IOException) {
        UiState.Error("Periksa koneksi internet")
    }
}
```

```viz
{"type":"compare","title":"Konsep yang sama di dua bahasa","columns":["Dart","Kotlin"],"rows":[{"label":"Nullable","values":["String?","String?"]},{"label":"Akses aman / cadangan","values":["a?.b ?? c","a?.b ?: c"]},{"label":"Model data","values":["class + final fields (atau freezed)","data class"]},{"label":"Asinkron satu nilai","values":["Future<T> + async/await","suspend fun + coroutine"]},{"label":"Aliran nilai","values":["Stream<T>","Flow<T>"]},{"label":"Konstanta waktu kompilasi","values":["const","const val"]}]}
```

## OOP & functional dasar

Kode aplikasi mobile memadukan dua gaya.

**OOP** (*object-oriented programming*) memodelkan dunia sebagai objek dengan data dan perilaku. Empat pilarnya: **enkapsulasi** (sembunyikan detail, sediakan antarmuka), **abstraksi** (fokus pada ‘apa’, bukan ‘bagaimana’), **pewarisan**, dan **polimorfisme** (objek berbeda merespons pesan yang sama dengan caranya sendiri).

```kotlin
interface MetodeBayar { fun bayar(total: Int): String }        // abstraksi

class Qris : MetodeBayar {
    override fun bayar(total: Int) = "Scan QRIS sebesar Rp$total"
}
class TransferBank(private val bank: String) : MetodeBayar {     // enkapsulasi
    override fun bayar(total: Int) = "Transfer Rp$total ke $bank"
}

fun checkout(m: MetodeBayar, total: Int) = println(m.bayar(total)) // polimorfisme
```

:::tip[Komposisi di atas pewarisan]
Pewarisan yang dalam (`A extends B extends C`) membuat kode kaku. Framework UI modern, baik Flutter maupun Compose, dibangun dari **komposisi**: komponen kecil yang dirangkai, bukan diwariskan.
:::

**Gaya fungsional** memperlakukan data sebagai nilai yang tidak diubah (*immutable*) dan transformasi sebagai fungsi. Inilah yang membuat UI deklaratif mudah dipahami:

```dart
final produk = [Produk(id: 1, nama: 'Gamis', harga: 150000), Produk(id: 2, nama: 'Jilbab', harga: 45000)];

final murah = produk.where((p) => p.harga < 100000).map((p) => p.nama).toList();   // ['Jilbab']
final total = produk.fold<int>(0, (sum, p) => sum + p.harga);                       // 195000
```

## Setup emulator & device

```viz
{"type":"flow","title":"Menyiapkan lingkungan pengembangan","caption":"Laptop dengan RAM 8 GB masih bisa, tetapi emulator terasa berat. Perangkat Android sungguhan lewat USB/Wi-Fi debugging sering lebih nyaman dan lebih realistis.","steps":[{"label":"Pasang SDK","detail":"Flutter SDK (cek dengan flutter doctor) atau Android Studio yang sudah membawa Android SDK & JDK."},{"label":"Editor","detail":"Android Studio untuk Kotlin; VS Code atau Android Studio + plugin Flutter/Dart untuk Flutter."},{"label":"Emulator","detail":"Buat Android Virtual Device (AVD) di Device Manager. Pilih image x86_64 dan aktifkan akselerasi hardware."},{"label":"Perangkat nyata","detail":"Aktifkan Opsi Developer (ketuk Nomor Build 7×) → USB debugging. Hubungkan, lalu cek dengan adb devices atau flutter devices."},{"label":"Jalankan","detail":"flutter run atau tombol Run di Android Studio. Uji hot reload dengan mengubah teks di layar."}]}
```

Untuk iOS, build dan uji di simulator membutuhkan **macOS dengan Xcode**. Jika tidak punya Mac, fokus ke Android dulu; layanan CI dengan runner macOS bisa membangun versi iOS kelak.

:::latihan
Milestone: aplikasi konversi satuan (suhu, panjang, mata uang dengan kurs tetap) di platform pilihanmu. Modelkan setiap jenis konversi sebagai class yang mengimplementasikan satu interface `Konverter` (polimorfisme), tampilkan riwayat konversi memakai list immutable, dan jalankan di emulator **dan** HP sungguhan.
:::

## Rangkuman

- Flutter (Dart) untuk satu kode dua platform; Kotlin + Compose untuk Android native; React Native jika timmu kuat di JavaScript.
- Null safety mencegah crash karena null sejak kompilasi; `?.`, `??`/`?:` untuk akses aman.
- Asinkron: `Future`/`Stream` di Dart, `suspend`/`Flow` + coroutines di Kotlin; jangan blokir UI thread.
- OOP untuk memodelkan domain, komposisi di atas pewarisan, dan transformasi data gaya fungsional.
- Siapkan SDK, emulator, dan perangkat nyata; iOS membutuhkan macOS.
