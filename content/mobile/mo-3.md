---
title: State management & arsitektur aplikasi mobile
minutes: 45
summary: Aplikasi kecil bisa bertahan dengan setState di mana-mana, tetapi begitu fitur bertambah, kode menjadi sulit dirawat dan diuji. Modul ini membahas arsitektur yang direkomendasikan Google dan komunitas Flutter, yaitu memisahkan state, membangun lapisan data lewat repository, menyuntikkan dependensi, dan menjaga aliran data satu arah.
objectives:
  - Membedakan state lokal (ephemeral) dan state aplikasi
  - Memakai ViewModel (Android) atau Riverpod/Bloc (Flutter) sebagai state holder
  - Menerapkan repository pattern sebagai satu pintu akses data
  - Memahami dependency injection dan aliran data satu arah
sources:
  - repo: android/architecture-samples
    note: Contoh resmi arsitektur berlapis dengan ViewModel dan repository
  - repo: android/nowinandroid
    note: Arsitektur aplikasi produksi (offline-first, modular, UDF)
  - repo: Solido/awesome-flutter
    note: Peta pustaka state management Flutter
quiz:
  - q: "Status ‘tab mana yang sedang aktif’ di satu layar sebaiknya disimpan sebagai…"
    options: ["State global di seluruh aplikasi", "State lokal di widget/composable tersebut", "Di database", "Di server"]
    answer: 1
    explain: "State yang hanya relevan untuk satu komponen tidak perlu global. Global state hanya untuk data yang dipakai banyak layar (mis. user login, keranjang)."
  - q: "Peran utama ViewModel adalah…"
    options: ["Menggambar UI", "Menyimpan & mengolah state layar, bertahan saat rotasi, dan mengekspos state ke UI", "Menyimpan data ke disk", "Mengganti database"]
    answer: 1
    explain: "UI hanya menampilkan state dari ViewModel dan mengirim event ke sana."
  - q: "Keuntungan repository pattern adalah…"
    options: ["UI bisa langsung memanggil SQL", "Sumber data (API/cache/DB) tersembunyi di balik satu antarmuka sehingga mudah diganti dan diuji", "Aplikasi lebih berwarna", "Tidak perlu internet"]
    answer: 1
    explain: "ViewModel tidak perlu tahu data datang dari jaringan atau cache lokal."
  - q: "Dalam unidirectional data flow, arah yang benar adalah…"
    options: ["UI mengubah data di repository langsung", "State mengalir turun ke UI, event mengalir naik ke state holder", "Data bebas mengalir ke mana saja", "Repository memanggil UI"]
    answer: 1
    explain: "Satu sumber kebenaran, state turun, event naik: perilaku mudah diprediksi dan di-debug."
---

Bayangkan aplikasi kasir yang setiap layarnya memanggil API sendiri, menyimpan salinan data keranjang sendiri, dan saling mengubah variabel milik layar lain. Bug ‘jumlah di keranjang berbeda dengan di checkout’ hampir pasti terjadi. Arsitektur yang baik mencegah hal ini dengan aturan sederhana: **setiap data punya satu pemilik, dan semua perubahan lewat jalur yang sama**.

## State lokal vs global

Tidak semua state sama pentingnya:

```viz
{"type":"compare","title":"Jenis state dan tempatnya","columns":["State lokal (ephemeral)","State layar (UI state)","State aplikasi (app state)"],"rows":[{"label":"Contoh","values":["Tab aktif, teks yang sedang diketik, animasi expand","Daftar produk + status loading di layar katalog","User yang login, isi keranjang, pengaturan tema"]},{"label":"Dipakai oleh","values":["Satu widget/composable","Satu layar","Banyak layar"]},{"label":"Disimpan di","values":["setState / remember","ViewModel / Notifier / Bloc layar","Repository + state holder level aplikasi"]},{"label":"Bertahan saat","values":["Tidak perlu","Rotasi layar","Pindah layar, kadang restart aplikasi (disimpan ke disk)"]}]}
```

Kesalahan umum ada di dua arah: semua dijadikan global (sulit dilacak siapa yang mengubah), atau data bersama diduplikasi di banyak layar (tidak sinkron). Prinsipnya sama dengan React: letakkan state **setinggi yang dibutuhkan, tidak lebih tinggi**.

## Provider/Riverpod/Bloc atau ViewModel

State holder adalah objek yang memegang state layar, menerima event dari UI, dan memanggil lapisan data.

```viz
{"type":"fsm","title":"State layar katalog sebagai sealed class","caption":"Memodelkan state sebagai tipe tertutup memaksa UI menangani setiap kemungkinan: tidak ada lagi layar kosong tanpa penjelasan.","start":"Loading","states":[{"id":"Loading","detail":"Tampilkan skeleton/shimmer."},{"id":"Sukses","detail":"Tampilkan daftar produk (bisa juga kosong → ilustrasi ‘belum ada produk’)."},{"id":"Error","detail":"Pesan manusiawi + tombol coba lagi."},{"id":"Refreshing","detail":"Data lama tetap tampil + indikator tarik-untuk-muat-ulang."}],"transitions":[{"from":"Loading","to":"Sukses","event":"data diterima"},{"from":"Loading","to":"Error","event":"gagal"},{"from":"Error","to":"Loading","event":"coba lagi"},{"from":"Sukses","to":"Refreshing","event":"tarik ke bawah"},{"from":"Refreshing","to":"Sukses","event":"data baru"},{"from":"Refreshing","to":"Error","event":"gagal"}]}
```

**Android: ViewModel + StateFlow**

```kotlin
sealed interface KatalogUi {
    data object Loading : KatalogUi
    data class Sukses(val produk: List<Produk>) : KatalogUi
    data class Error(val pesan: String) : KatalogUi
}

class KatalogViewModel(private val repo: ProdukRepository) : ViewModel() {
    val ui: StateFlow<KatalogUi> = repo.semuaProduk()          // Flow dari repository
        .map<List<Produk>, KatalogUi> { KatalogUi.Sukses(it) }
        .catch { emit(KatalogUi.Error("Gagal memuat produk")) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), KatalogUi.Loading)

    fun refresh() = viewModelScope.launch { repo.sinkronkan() }
}

@Composable
fun KatalogScreen(vm: KatalogViewModel = koinViewModel()) {
    when (val s = vm.ui.collectAsStateWithLifecycle().value) {
        KatalogUi.Loading -> Skeleton()
        is KatalogUi.Error -> PesanError(s.pesan, onCobaLagi = vm::refresh)
        is KatalogUi.Sukses -> DaftarProduk(s.produk)
    }
}
```

**Flutter: Riverpod**

```dart
final katalogProvider = FutureProvider.autoDispose<List<Produk>>((ref) {
  return ref.watch(produkRepositoryProvider).semuaProduk();
});

class KatalogScreen extends ConsumerWidget {
  const KatalogScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final katalog = ref.watch(katalogProvider);
    return katalog.when(
      loading: () => const Skeleton(),
      error: (e, _) => PesanError(onCobaLagi: () => ref.invalidate(katalogProvider)),
      data: (produk) => DaftarProduk(produk),
    );
  }
}
```

Di ekosistem Flutter ada banyak pilihan: **Provider** (sederhana, cocok untuk pemula), **Riverpod** (penerus Provider, aman saat kompilasi, mudah diuji), **Bloc** (event → state yang sangat eksplisit, populer di tim besar). Pilih satu dan konsisten. Konsepnya sama: state holder terpisah dari UI.

## Repository pattern

**Repository** adalah satu-satunya pintu ke data untuk satu jenis entitas. Di baliknya bisa ada API, database lokal, atau keduanya, dan ViewModel tidak perlu tahu.

```viz
{"type":"layers","title":"Arsitektur berlapis yang direkomendasikan","caption":"Dependensi mengarah ke bawah. Lapisan domain bersifat opsional, berguna jika logika bisnis dipakai di banyak ViewModel.","layers":[{"label":"UI layer","tag":"Widget / Composable","detail":"Hanya menampilkan state dan meneruskan event. Tidak ada logika bisnis, tidak ada pemanggilan API."},{"label":"State holder","tag":"ViewModel / Notifier / Bloc","detail":"Mengubah data menjadi UI state, menangani event, bertahan saat rotasi."},{"label":"Domain (opsional)","tag":"Use case","detail":"Logika bisnis yang dapat dipakai ulang, mis. HitungTotalCheckout, ValidasiAlamat."},{"label":"Repository","tag":"data","detail":"Satu pintu per entitas. Memutuskan: ambil dari cache lokal atau jaringan, sinkronisasi, penanganan error."},{"label":"Data source","tag":"remote & lokal","detail":"Klien API (Retrofit/Dio/http) dan database lokal (Room/Drift/Hive). Detail teknis tersembunyi di sini."}]}
```

```dart
abstract interface class ProdukRepository {
  Future<List<Produk>> semuaProduk();
  Future<Produk?> detail(int id);
}

class ProdukRepositoryImpl implements ProdukRepository {
  ProdukRepositoryImpl(this._api, this._db);
  final ProdukApi _api;
  final ProdukDao _db;

  @override
  Future<List<Produk>> semuaProduk() async {
    try {
      final segar = await _api.ambilSemua();
      await _db.simpanSemua(segar);          // perbarui cache
      return segar;
    } catch (_) {
      return _db.semua();                    // offline: pakai cache
    }
  }

  @override
  Future<Produk?> detail(int id) => _db.cari(id);
}
```

## Dependency injection

**Dependency injection (DI)** berarti sebuah kelas **menerima** dependensinya dari luar (lewat konstruktor), bukan membuatnya sendiri. Perhatikan `ProdukRepositoryImpl(this._api, this._db)` di atas: ia tidak membuat `ProdukApi` sendiri.

Manfaatnya terasa saat testing: kamu bisa menyuntikkan repository palsu.

```kotlin
class FakeProdukRepository : ProdukRepository {
    override fun semuaProduk() = flowOf(listOf(Produk(1, "Gamis", 150_000)))
    override suspend fun sinkronkan() {}
}

@Test fun menampilkanProdukDariRepository() = runTest {
    val vm = KatalogViewModel(FakeProdukRepository())
    vm.ui.first { it is KatalogUi.Sukses }.let { assertEquals(1, (it as KatalogUi.Sukses).produk.size) }
}
```

Di aplikasi nyata, ‘siapa membuat apa’ dikelola oleh **container DI**: **Hilt** atau **Koin** di Android, sedangkan di Flutter Riverpod sudah berfungsi sebagai DI lewat provider (atau `get_it`).

## Unidirectional data flow

Semua bagian di atas disatukan oleh satu aturan: **state mengalir turun, event mengalir naik**.

```viz
{"type":"flow","title":"Unidirectional data flow (UDF)","caption":"Karena hanya ada satu jalur perubahan, setiap state di layar bisa ditelusuri asal-usulnya. Inilah yang membuat bug lebih mudah ditemukan.","loop":true,"steps":[{"label":"Event","detail":"Pengguna menekan ‘Tambah ke keranjang’. UI memanggil vm.tambah(produk), tanpa mengubah apa pun sendiri."},{"label":"State holder","detail":"ViewModel/Notifier memvalidasi dan memanggil repository."},{"label":"Repository","detail":"Menyimpan ke database lokal (sumber kebenaran) dan menjadwalkan sinkronisasi ke server."},{"label":"State baru","detail":"Flow/Stream dari database memancarkan isi keranjang terbaru → state holder memperbarui UI state."},{"label":"UI","detail":"Semua layar yang mengamati keranjang otomatis menampilkan jumlah yang sama."}]}
```

Bandingkan dengan pendekatan tanpa UDF: tombol langsung menambah ke list milik layar katalog, lalu layar keranjang punya list sendiri yang harus ‘diberi tahu’. Di situlah bug sinkronisasi lahir.

:::latihan
Milestone: aplikasi catatan dengan arsitektur berlapis, terdiri dari `CatatanRepository` (antarmuka + implementasi dengan database lokal), state holder dengan sealed UI state (Loading/Sukses/Error), DI lewat konstruktor, dan minimal 3 unit test pada state holder memakai repository palsu. Pastikan tidak ada satu pun pemanggilan database di kode UI.
:::

## Rangkuman

- State diletakkan setinggi yang dibutuhkan: lokal, layar, atau aplikasi.
- State holder (ViewModel/Riverpod/Bloc) memegang UI state yang dimodelkan sebagai tipe tertutup.
- Repository = satu pintu data; menyembunyikan API, cache, dan database.
- Dependency injection lewat konstruktor membuat kode bisa diuji dengan implementasi palsu.
- Unidirectional data flow: state turun, event naik, satu sumber kebenaran.
