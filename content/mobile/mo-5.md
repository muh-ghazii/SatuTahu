---
title: Testing, performa & rilis ke store
minutes: 40
summary: Langkah terakhir membawa aplikasi dari emulator ke tangan pengguna. Modul ini membahas tiga level testing mobile, cara menemukan bagian yang membuat aplikasi patah-patah, menandatangani dan membangun versi rilis, mengotomasi build dengan CI/CD, dan menyiapkan halaman di Play Store.
objectives:
  - Menulis unit, widget/UI, dan E2E test untuk aplikasi mobile
  - Memakai profiler untuk menemukan jank dan pemborosan memori
  - Menandatangani aplikasi dan membangun AAB rilis dengan aman
  - Mengotomasi build/test dan menyiapkan listing di Play Store
sources:
  - repo: mobile-dev-inc/maestro
    note: Pendekatan E2E testing mobile berbasis YAML
  - repo: amitshekhariitbhu/android-interview-questions
    note: Topik performa, memori, dan rilis Android
  - repo: expo/expo
    note: Alur build & rilis (EAS) untuk proyek React Native
quiz:
  - q: "Test yang memeriksa ‘saat tombol Tambah diketuk, angka keranjang menjadi 1’ tanpa menjalankan aplikasi penuh di perangkat termasuk…"
    options: ["Unit test fungsi murni", "Widget/UI test komponen", "E2E test", "Load test"]
    answer: 1
    explain: "Widget test (Flutter) atau Compose UI test me-render komponen dan berinteraksi dengannya secara cepat tanpa aplikasi penuh."
  - q: "Agar animasi terasa mulus di layar 60 Hz, setiap frame harus selesai dalam sekitar…"
    options: ["1 detik", "100 ms", "16 ms", "1 ms"]
    answer: 2
    explain: "1000 ms / 60 ≈ 16,7 ms. Frame yang melewati batas ini terlihat sebagai jank (patah-patah). Di layar 120 Hz, batasnya ≈ 8 ms."
  - q: "Apa akibatnya jika upload key/keystore aplikasi hilang dan tidak memakai Play App Signing?"
    options: ["Tidak ada masalah", "Tidak bisa lagi merilis update untuk aplikasi yang sama", "Aplikasi otomatis terhapus", "Hanya ikon yang berubah"]
    answer: 1
    explain: "Update harus ditandatangani dengan kunci yang sama. Play App Signing membuat Google menyimpan kunci aplikasi, sehingga upload key yang hilang bisa direset."
  - q: "Format yang diunggah ke Google Play untuk aplikasi baru adalah…"
    options: ["APK debug", "Android App Bundle (.aab)", "File .zip kode sumber", "IPA"]
    answer: 1
    explain: "Play menghasilkan APK yang dioptimalkan per perangkat dari AAB, sehingga ukuran unduhan lebih kecil."
---

Aplikasi yang crash di hari pertama rilis akan menerima ulasan bintang satu yang sulit dihapus. Modul ini membahas kebiasaan yang membuat rilis menjadi peristiwa yang membosankan, karena semuanya sudah diuji dan diotomasi.

## Unit, widget & E2E testing

```viz
{"type":"layers","title":"Piramida testing aplikasi mobile","caption":"Unit dan widget test berjalan dalam detik di laptop/CI. E2E butuh emulator/perangkat sehingga lebih lambat. Simpan untuk alur paling penting.","layers":[{"label":"E2E / integration","tag":"sedikit","detail":"Aplikasi utuh di emulator/perangkat: buka → login → cari → checkout. Alat: Maestro, integration_test (Flutter), Espresso/UI Automator."},{"label":"Widget / UI test","tag":"sedang","detail":"Me-render satu layar/komponen dengan data palsu dan berinteraksi: tap, scroll, cek teks. Alat: flutter_test, Compose UI test."},{"label":"Unit test","tag":"banyak","detail":"Logika murni: ViewModel/Notifier dengan repository palsu, validasi, format harga."}]}
```

```dart
// Flutter widget test
testWidgets('menambah produk memperbarui badge keranjang', (tester) async {
  await tester.pumpWidget(ProviderScope(
    overrides: [produkRepositoryProvider.overrideWithValue(FakeProdukRepository())],
    child: const MaterialApp(home: KatalogScreen()),
  ));
  await tester.pumpAndSettle();                         // tunggu data & animasi
  await tester.tap(find.widgetWithText(FilledButton, 'Tambah').first);
  await tester.pump();
  expect(find.text('1'), findsOneWidget);
});
```

E2E dengan **Maestro** ditulis dalam YAML yang mudah dibaca, dan cukup tangguh terhadap UI yang lambat dimuat:

```yaml
# flows/checkout.yaml
appId: id.tokoseragam.app
---
- launchApp
- tapOn: "Gamis BKMT"
- tapOn: "Tambah ke keranjang"
- tapOn:
    id: "ikon_keranjang"
- assertVisible: "Total: Rp150.000"
- tapOn: "Checkout"
- assertVisible: "Pesanan berhasil dibuat"
```

## Profiling performa

Pengguna merasakan performa sebagai: **waktu buka aplikasi**, **kelancaran scroll/animasi**, dan **pemakaian baterai/memori**. Jangan mengoptimalkan dengan menebak. Ukur dulu, selalu di **mode profile/release di perangkat nyata**, karena mode debug jauh lebih lambat.

```viz
{"type":"game-loop"}
```

Simulasi di atas memperlihatkan hubungan FPS dan kelancaran. Di aplikasi, layar 60 Hz memberi waktu ±16 ms per frame. Pekerjaan berat di main thread (parsing JSON besar, decode gambar besar, query database) membuat frame terlewat (*jank*).

Alat dan kebiasaan:

- **Flutter DevTools** (Performance & Memory) dan **Android Studio Profiler** untuk melihat frame lambat, CPU, dan memori.
- Hindari membangun ulang pohon UI yang besar setiap perubahan kecil: pecah widget, gunakan `const` di Flutter, dan perhatikan *recomposition* yang tidak perlu di Compose.
- Muat gambar sesuai ukuran tampilan dan gunakan cache (`cached_network_image`, Coil).
- Pindahkan kerja berat ke background (`compute`/Isolate di Flutter, `Dispatchers.Default` di Kotlin).
- Ukur **waktu startup**; tunda inisialisasi SDK yang tidak dibutuhkan di layar pertama.

## Signing & build release

Setiap aplikasi Android harus **ditandatangani secara digital**. Tanda tangan membuktikan bahwa update berasal dari pengembang yang sama.

```bash
# buat upload keystore (SEKALI, simpan aman, jangan di-commit!)
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload

# build rilis
flutter build appbundle --release            # Flutter → build/app/outputs/bundle/release/app-release.aab
./gradlew bundleRelease                      # Android native
```

```viz
{"type":"compare","title":"Debug vs release build","columns":["Debug","Release"],"rows":[{"label":"Tujuan","values":["Pengembangan: hot reload, debugger","Untuk pengguna"]},{"label":"Kecepatan","values":["Lambat (assertion, JIT)","Cepat (AOT, dioptimasi)"]},{"label":"Ukuran","values":["Besar","Diperkecil (R8/ProGuard, tree shaking)"]},{"label":"Tanda tangan","values":["Kunci debug otomatis","Upload key milikmu"]},{"label":"Log & API","values":["Verbose, bisa ke server dev","Log minimal, ke server produksi"]}]}
```

Aktifkan **Play App Signing**: Google menyimpan *app signing key*, dan kamu hanya memegang *upload key*. Jika upload key hilang, ia bisa direset, sedangkan tanpa fitur ini kehilangan kunci berarti tidak bisa merilis update lagi. Simpan keystore dan password-nya di password manager dan secret CI, **bukan** di repository.

## CI/CD mobile

Otomasi membuat setiap commit diuji dan setiap rilis dibangun dengan cara yang sama persis.

```viz
{"type":"flow","title":"Pipeline CI/CD aplikasi mobile","steps":[{"label":"Push / PR","detail":"Trigger workflow di GitHub Actions/Codemagic."},{"label":"Analyze & test","detail":"flutter analyze / ./gradlew lint, lalu unit & widget test."},{"label":"Build AAB","detail":"Keystore didekode dari secret CI, nomor versi dinaikkan otomatis."},{"label":"E2E (opsional)","detail":"Maestro di emulator/cloud device untuk alur kritis."},{"label":"Upload ke Play","detail":"Internal testing track lewat Fastlane/Gradle Play Publisher."},{"label":"Promosi bertahap","detail":"Internal → closed → production dengan staged rollout (mis. 10% → 50% → 100%)."}]}
```

```yaml
# .github/workflows/android.yml (Flutter, ringkas)
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with: { channel: stable }
      - run: flutter pub get && flutter analyze && flutter test
      - run: echo "${{ secrets.UPLOAD_KEYSTORE_B64 }}" | base64 -d > android/app/upload-keystore.jks
      - run: flutter build appbundle --release --build-number=${{ github.run_number }}
      - uses: actions/upload-artifact@v4
        with: { name: aab, path: build/app/outputs/bundle/release/app-release.aab }
```

**Staged rollout** sangat penting: rilis ke sebagian kecil pengguna dulu, pantau crash rate (Firebase Crashlytics/Play Console), baru perluas.

## Store listing

Halaman Play Store adalah ‘etalase’. Yang perlu disiapkan:

- **Ikon** 512×512, **feature graphic** 1024×500, dan screenshot yang menunjukkan manfaat (bukan sekadar tampilan kosong).
- **Judul & deskripsi singkat** yang menjelaskan nilai dalam satu kalimat, lalu deskripsi lengkap dengan kata kunci yang relevan.
- **Kebijakan privasi** (URL) dan formulir **Data safety** yang jujur tentang data apa yang dikumpulkan.
- **Content rating** dan target audiens.
- Untuk akun developer **pribadi baru**, Google Play mewajibkan *closed testing* dengan sejumlah penguji selama periode tertentu sebelum boleh rilis produksi. Cek persyaratan terbaru di Play Console karena aturannya berubah dari waktu ke waktu.

:::latihan
Milestone: rilis aplikasimu ke **internal testing** Play Store. Lengkapi dengan 5 unit test, 2 widget test, 1 flow Maestro untuk alur utama, workflow CI yang membangun AAB bertanda tangan dari secret, serta listing dengan screenshot dan kebijakan privasi. Undang teman sebagai penguji dan kumpulkan masukan mereka.
:::

## Rangkuman

- Piramida testing: banyak unit, cukup widget/UI test, sedikit E2E (Maestro/integration_test).
- Ukur performa di mode profile/release pada perangkat nyata; jaga frame < 16 ms dan pindahkan kerja berat dari main thread.
- Tanda tangani dengan upload key, aktifkan Play App Signing, jangan commit keystore.
- CI/CD: analyze → test → build AAB → upload → staged rollout.
- Listing yang jelas, kebijakan privasi, dan Data safety yang jujur.
