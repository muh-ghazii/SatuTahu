---
title: UI, layout & navigasi aplikasi mobile
minutes: 45
summary: UI mobile modern bersifat deklaratif, yaitu layar digambarkan sebagai pohon komponen dari state. Modul ini membahas cara menyusun pohon widget/composable, membuat layout yang menyesuaikan berbagai ukuran layar, berpindah layar dan menangani deep link, menerapkan Material Design 3, serta menambahkan animasi yang bermakna.
objectives:
  - Menyusun UI sebagai pohon widget (Flutter) atau composable (Compose)
  - Membuat layout yang adaptif untuk HP kecil sampai tablet
  - Mengatur navigasi, back stack, dan deep link
  - Menerapkan tema Material 3 dan animasi dasar
sources:
  - repo: flutter/samples
    note: Contoh resmi layout, navigasi, dan animasi Flutter
  - repo: android/compose-samples
    note: Pola UI Compose dari aplikasi contoh resmi (Jetnews, Reply)
  - repo: mitesh77/Best-Flutter-UI-Templates
    note: Contoh UI untuk latihan membangun ulang
  - repo: android/codelab-android-compose
    note: Urutan codelab layout, tema, dan animasi Compose
quiz:
  - q: "Di Flutter, widget untuk menyusun anak secara horizontal adalah…"
    options: ["Column", "Row", "Stack", "Container"]
    answer: 1
    explain: "Row horizontal, Column vertikal, Stack menumpuk anak di atas satu sama lain."
  - q: "Pengguna menekan tombol Back di Android. Secara konsep, yang terjadi pada navigasi adalah…"
    options: ["Queue: layar pertama ditutup", "Stack: layar teratas di-pop, kembali ke layar sebelumnya", "Semua layar ditutup", "Aplikasi restart"]
    answer: 1
    explain: "Navigasi bekerja seperti stack (LIFO). Navigasi baru = push; back = pop."
  - q: "Deep link berguna untuk…"
    options: ["Mempercepat animasi", "Membuka layar tertentu di aplikasi langsung dari URL (mis. link promo di WhatsApp)", "Menyimpan data", "Mengganti tema"]
    answer: 1
    explain: "Deep link/App Link memetakan URL ke rute dalam aplikasi, misalnya https://toko.id/produk/12 membuka detail produk 12."
  - q: "Material 3 dynamic color berarti…"
    options: ["Warna acak setiap dibuka", "Palet aplikasi bisa diturunkan dari wallpaper pengguna (Android 12+)", "Hanya mode gelap", "Warna ditentukan server"]
    answer: 1
    explain: "Dari satu warna sumber, Material 3 membangkitkan seluruh skema warna, termasuk varian gelap yang kontrasnya terjaga."
---

Flutter dan Jetpack Compose sama-sama menganut **UI deklaratif**: kamu tidak menulis ‘ubah teks label ini’, melainkan ‘untuk state seperti ini, tampilannya seperti itu’. Ketika state berubah, framework menggambar ulang bagian yang perlu. Pola pikir ini sama dengan React di web, jadi pengalaman di satu platform mudah dipindahkan ke platform lain.

## Widget/Composable tree

Di Flutter semua adalah **widget**; di Compose semua adalah fungsi **@Composable**. Keduanya membentuk pohon:

```viz
{"type":"tree","title":"Pohon UI layar detail produk","caption":"Pecah layar menjadi komponen kecil yang bisa dipakai ulang. Komponen daun (KartuHarga, TombolBeli) hanya menerima data dan callback.","root":{"label":"Scaffold","detail":"Kerangka layar Material: app bar, body, bottom bar, FAB.","children":[{"label":"AppBar(title)","detail":"Judul & tombol kembali."},{"label":"body: Column / ListView","detail":"Isi layar yang bisa di-scroll.","children":[{"label":"Image (foto produk)","detail":"Dimuat dari jaringan dengan placeholder & cache."},{"label":"Padding → Column","detail":"Nama, rating, deskripsi.","children":[{"label":"Text(nama, style: titleLarge)","detail":"Gunakan gaya dari tema, bukan ukuran huruf manual."},{"label":"KartuHarga(harga, diskon)","detail":"Komponen kustom yang dipakai ulang di daftar & detail."}]}]},{"label":"bottomBar: TombolBeli(onPressed)","detail":"Callback ke state holder; tombol tidak tahu soal API."}]}}
```

```dart
// Flutter
class DetailProduk extends StatelessWidget {
  const DetailProduk({super.key, required this.produk, required this.onBeli});
  final Produk produk;
  final VoidCallback onBeli;

  @override
  Widget build(BuildContext context) {
    final teks = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: Text(produk.nama)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AspectRatio(aspectRatio: 1, child: Image.network(produk.foto, fit: BoxFit.cover)),
          const SizedBox(height: 16),
          Text(produk.nama, style: teks.titleLarge),
          Text('Rp${produk.harga}', style: teks.headlineSmall),
        ],
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: FilledButton(onPressed: onBeli, child: const Text('Beli sekarang')),
      ),
    );
  }
}
```

```kotlin
// Jetpack Compose
@Composable
fun DetailProduk(produk: Produk, onBeli: () -> Unit) {
    Scaffold(
        topBar = { TopAppBar(title = { Text(produk.nama) }) },
        bottomBar = { Button(onClick = onBeli, modifier = Modifier.fillMaxWidth().padding(16.dp)) { Text("Beli sekarang") } },
    ) { padding ->
        LazyColumn(contentPadding = padding) {
            item { AsyncImage(model = produk.foto, contentDescription = produk.nama, modifier = Modifier.aspectRatio(1f)) }
            item { Text(produk.nama, style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(16.dp)) }
        }
    }
}
```

Perhatikan `contentDescription`: nilainya dibacakan TalkBack untuk pengguna tunanetra. Aksesibilitas berlaku juga di mobile.

## Layout responsif

Aplikasi berjalan di HP 5 inci, HP lipat, tablet, bahkan Chromebook. Prinsip layout yang tahan banting:

- Gunakan **ukuran relatif** dan **flex** (`Expanded`/`Flexible` di Flutter, `weight` di Compose), bukan lebar piksel tetap.
- Daftar panjang selalu **lazy** (`ListView.builder`, `LazyColumn`) agar hanya item yang terlihat yang dibuat.
- Sesuaikan tata letak dengan **window size class**: *compact* (<600dp, HP), *medium* (600–840dp, tablet potret/HP lipat), *expanded* (>840dp).

```viz
{"type":"responsive"}
```

```dart
LayoutBuilder(builder: (context, c) {
  final kolom = c.maxWidth < 600 ? 2 : c.maxWidth < 840 ? 3 : 4;
  return GridView.count(crossAxisCount: kolom, children: [...]);
});
```

Pola **list–detail** adalah contoh nyata: di HP, daftar dan detail adalah dua layar; di tablet, keduanya tampil berdampingan.

## Navigasi & deep link

Navigasi aplikasi bekerja seperti **stack**: membuka layar baru = *push*, tombol back = *pop*.

```viz
{"type":"stack-queue"}
```

```dart
// Flutter dengan go_router: rute berbasis URL, mendukung deep link
final router = GoRouter(routes: [
  GoRoute(path: '/', builder: (_, __) => const Beranda()),
  GoRoute(
    path: '/produk/:id',
    builder: (_, state) => DetailProdukScreen(id: int.parse(state.pathParameters['id']!)),
  ),
]);

// berpindah:
context.push('/produk/12');   // tambah ke stack (bisa back)
context.go('/');              // ganti stack menjadi rute ini
```

```kotlin
// Compose Navigation (type-safe dengan Kotlin serialization)
@Serializable object Beranda
@Serializable data class Detail(val id: Int)

NavHost(navController, startDestination = Beranda) {
    composable<Beranda> { BerandaScreen(onBuka = { navController.navigate(Detail(it)) }) }
    composable<Detail> { entry -> DetailScreen(entry.toRoute<Detail>().id) }
}
```

**Deep link** memetakan URL ke layar di dalam aplikasi, misalnya link promo `https://tokoseragam.id/produk/12` yang dibagikan lewat WhatsApp langsung membuka detail produk. Di Android ini disebut **App Links** (butuh verifikasi kepemilikan domain lewat file `assetlinks.json`), di iOS **Universal Links**. Selalu tangani kasus ketika ID di link sudah tidak ada.

## Tema & Material Design 3

**Material Design 3 (Material You)** adalah sistem desain Google untuk Android. Kekuatannya ada pada **token**: warna, tipografi, dan bentuk didefinisikan sekali di tema, lalu komponen memakainya secara konsisten.

```dart
MaterialApp.router(
  theme: ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFFEC536)),   // satu warna → seluruh palet
    useMaterial3: true,
  ),
  darkTheme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFFEC536), brightness: Brightness.dark)),
  routerConfig: router,
);
```

Dari satu *seed color*, Material 3 membangkitkan peran warna (`primary`, `onPrimary`, `surface`, `error`, …) dengan kontras yang dijaga, termasuk untuk mode gelap. Gunakan peran ini (`colorScheme.primary`) alih-alih kode warna langsung, agar mode gelap dan *dynamic color* bekerja otomatis.

```viz
{"type":"type-scale"}
```

## Animasi dasar

Animasi yang baik **menjelaskan perubahan**: dari mana elemen datang, ke mana ia pergi, dan apa yang baru saja terjadi. Animasi yang hanya hiasan justru mengganggu.

Mulailah dari **animasi implisit**: cukup ubah nilai, dan framework yang menganimasikan transisinya.

```dart
AnimatedContainer(
  duration: const Duration(milliseconds: 250),
  curve: Curves.easeOut,
  height: terbuka ? 200 : 64,
  color: terpilih ? scheme.primaryContainer : scheme.surface,
  child: ...,
);
```

```kotlin
val tinggi by animateDpAsState(if (terbuka) 200.dp else 64.dp, label = "tinggi")
AnimatedVisibility(visible = tampil) { PesanSukses() }
```

Panduan praktis: durasi 150–300 ms untuk interaksi kecil; gunakan *easing* (bukan linear); animasikan `transform`/`opacity` daripada ukuran layout bila bisa; dan hormati pengaturan **kurangi animasi** di perangkat pengguna.

:::latihan
Milestone: bangun ulang UI e-commerce 3–5 layar (beranda dengan grid produk, detail, keranjang, profil) dari salah satu template di `Best-Flutter-UI-Templates` atau desain Figma komunitas, **tanpa melihat kodenya**. Gunakan tema Material 3 dari satu seed color, navigasi berbasis rute dengan satu deep link, grid adaptif 2–4 kolom, dan satu animasi implisit yang bermakna.
:::

## Rangkuman

- UI deklaratif: layar = pohon widget/composable yang digambar dari state.
- Layout adaptif dengan flex, daftar lazy, dan window size class (compact/medium/expanded).
- Navigasi adalah stack; deep link/App Links memetakan URL ke layar.
- Material 3: seed color → skema warna lengkap; pakai token tema, bukan nilai mentah.
- Animasi implisit yang singkat dan bermakna; hormati preferensi kurangi animasi.
