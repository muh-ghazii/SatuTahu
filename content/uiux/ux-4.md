---
title: Design system & aksesibilitas
minutes: 40
summary: Design system adalah ‘bahasa bersama’ antara desainer dan developer. Ia berisi token, komponen, dan aturan pemakaiannya, sehingga produk tetap konsisten walau dibangun banyak orang. Modul ini membahas cara menyusunnya, mendokumentasikannya, memastikannya inklusif sesuai WCAG, dan menyerahkannya ke developer tanpa salah tafsir.
objectives:
  - Menyusun design token bertingkat (primitive, semantic, component)
  - Membangun komponen dengan varian dan properti di Figma
  - Mendokumentasikan aturan pemakaian komponen
  - Mengaudit aksesibilitas dan melakukan handoff yang rapi
sources:
  - repo: alexpate/awesome-design-systems
    note: Contoh design system publik sebagai pembanding
  - repo: shadcn-ui/ui
    note: Contoh komponen berbasis token di sisi kode
  - repo: brunopulis/awesome-a11y
    note: Sumber panduan dan alat uji aksesibilitas
  - repo: a11yproject/a11yproject.com
    note: Checklist aksesibilitas praktis
quiz:
  - q: "Token ‘color.text.primary’ yang menunjuk ke ‘navy-900’ adalah contoh token…"
    options: ["Primitive", "Semantic", "Component", "Random"]
    answer: 1
    explain: "Token semantic memberi makna/peran. Saat mode gelap, cukup arahkan ‘color.text.primary’ ke nilai lain tanpa mengubah komponen."
  - q: "Komponen Button dengan pilihan variant=primary/secondary, size=sm/md, state=default/disabled sebaiknya dibuat di Figma sebagai…"
    options: ["Banyak komponen terpisah tanpa hubungan", "Satu component set dengan variant properties", "Gambar statis", "Frame biasa"]
    answer: 1
    explain: "Variant properties membuat satu komponen fleksibel dan mudah dipetakan ke props di kode."
  - q: "Apa yang tidak bisa dipastikan hanya dengan pemeriksa kontras otomatis?"
    options: ["Rasio kontras teks", "Urutan fokus keyboard yang logis dan label yang bermakna", "Warna latar", "Ukuran font"]
    answer: 1
    explain: "Banyak aspek aksesibilitas (urutan fokus, kejelasan label, alt text yang bermakna) membutuhkan penilaian manusia."
  - q: "Handoff yang baik menyertakan…"
    options: ["Hanya screenshot", "Spesifikasi token, semua state, perilaku responsif, edge case, dan aset", "Hanya file PNG", "Kode CSS final buatan desainer"]
    answer: 1
    explain: "Developer membutuhkan perilaku, bukan hanya tampilan: apa yang terjadi saat teks panjang, data kosong, error, dan layar sempit."
---

Tanpa design system, setiap layar baru adalah kesempatan untuk inkonsistensi: abu-abu ke-17, tombol dengan sudut 6px di satu tempat dan 8px di tempat lain, jarak yang ‘kira-kira’. Design system mengubah keputusan berulang menjadi **keputusan yang sudah dibuat sekali**, sehingga desainer dan developer bisa fokus pada masalah yang sebenarnya.

Contoh publik yang layak dibedah: Material Design (Google), Carbon (IBM), Atlassian Design System, dan Polaris (Shopify).

## Design token

**Design token** adalah keputusan desain yang disimpan sebagai nama → nilai: warna, ukuran huruf, jarak, radius, bayangan, durasi animasi. Token dipakai di Figma (sebagai *variables*) dan di kode (sebagai CSS variable/tema), sehingga keduanya selalu sinkron.

```viz
{"type":"layers","title":"Tiga tingkat design token","caption":"Komponen sebaiknya hanya memakai token semantic/component. Dengan begitu, ganti tema atau mode gelap cukup dilakukan di tingkat semantic.","layers":[{"label":"Component token","tag":"spesifik","detail":"button.primary.bg → {color.action.primary}. Untuk kebutuhan khusus satu komponen."},{"label":"Semantic token","tag":"peran","detail":"color.action.primary → {sun-400}; color.text.default → {navy-900}; color.surface → {cream-50}. Di mode gelap, token yang sama menunjuk nilai berbeda."},{"label":"Primitive token","tag":"nilai mentah","detail":"sun-400 = #FEC536; navy-900 = #12203A; space-4 = 16px; radius-lg = 16px. Palet lengkap tanpa makna."}]}
```

```css
/* hasil di kode: tokens.css */
:root {
  --sun-400: #fec536;  --navy-900: #12203a;  --cream-50: #fdf9ee;     /* primitive */
  --color-action-primary: var(--sun-400);                              /* semantic */
  --color-text-default: var(--navy-900);
  --space-2: 8px; --space-4: 16px; --radius-lg: 16px;
}
[data-theme="dark"] { --color-text-default: var(--cream-50); }
```

## Komponen & varian

Komponen adalah blok bangunan yang dipakai ulang: tombol, input, kartu, dialog. Di Figma, satu **component set** dengan **variant properties** mewakili semua kombinasinya, dan sebaiknya dipetakan 1:1 ke props komponen di kode.

```viz
{"type":"tree","title":"Anatomi komponen Button","caption":"Nama properti di Figma sama dengan props di kode, sehingga desainer dan developer berbicara bahasa yang sama.","root":{"label":"Button (component set)","detail":"Satu komponen induk dengan semua varian.","children":[{"label":"variant: primary | secondary | ghost | danger","detail":"Peran visual. Satu layar idealnya hanya punya satu tombol primary."},{"label":"size: sm | md | lg","detail":"md = tinggi 44px (target sentuh aman)."},{"label":"state: default | hover | pressed | focus | disabled | loading","detail":"Semua state didesain, bukan hanya default."},{"label":"iconLeading / iconTrailing (boolean + instance swap)","detail":"Ikon opsional yang bisa ditukar."},{"label":"label (text property)","detail":"Teks yang bisa diubah tanpa melepas instance."},{"label":"Auto Layout: padding 12/20, gap 8","detail":"Tombol melebar mengikuti teks; nilai diambil dari token spacing."}]}}
```

```tsx
// padanan di kode
<Button variant="primary" size="md" iconLeading={<Plus />} loading={mengirim}>Tambah tugas</Button>
```

Mulailah kecil: warna, tipografi, spacing, lalu 8–10 komponen yang paling sering dipakai (button, input, select, checkbox, card, badge, dialog, toast, navigation). Design system tumbuh dari kebutuhan nyata, bukan dibuat lengkap di awal.

## Dokumentasi

Komponen tanpa dokumentasi akan dipakai dengan cara yang salah. Setiap komponen sebaiknya punya:

- **Deskripsi & kapan dipakai** (dan kapan **tidak**): ‘Gunakan Dialog untuk konfirmasi aksi yang tidak bisa dibatalkan; untuk informasi singkat gunakan Toast.’
- **Anatomi**: bagian-bagiannya beserta nama.
- **Varian & state** dengan contoh visual.
- **Do & Don’t** bergambar.
- **Konten/UX writing**: label tombol berupa kata kerja (‘Simpan perubahan’, bukan ‘OK’).
- **Aksesibilitas**: perilaku keyboard, label pembaca layar, kontras.

Di Figma, dokumentasi bisa ditulis di halaman khusus dan di deskripsi komponen. Di kode, **Storybook** menjadi katalog komponen hidup yang bisa dicoba developer.

## WCAG & kontras

Aksesibilitas harus menjadi bagian dari design system, bukan pemeriksaan di akhir. Jika token warna sudah lolos kontras, setiap layar yang memakainya otomatis lolos.

```viz
{"type":"contrast"}
```

Checklist aksesibilitas untuk desainer:

1. **Kontras**: teks normal ≥ 4,5:1, teks besar & ikon penting ≥ 3:1, batas input ≥ 3:1 terhadap latar.
2. **Jangan andalkan warna saja**: error ditandai ikon + teks, bukan hanya merah.
3. **Target sentuh** ≥ 44–48 dp dengan jarak cukup.
4. **Fokus terlihat**: desain state focus untuk setiap elemen interaktif.
5. **Ukuran teks fleksibel**: layout tidak rusak saat teks diperbesar 200%.
6. **Label & instruksi**: setiap input punya label yang terlihat (placeholder bukan label).
7. **Gerak**: animasi besar punya alternatif untuk pengguna yang memilih ‘kurangi gerakan’.

Uji dengan alat (plugin kontras Figma, axe/Lighthouse di hasil kode) **dan** dengan manusia: navigasi keyboard, pembaca layar, dan pengguna dengan disabilitas jika memungkinkan.

## Handoff ke developer

Handoff bukan ‘lempar file lalu selesai’, melainkan kolaborasi. Developer perlu tahu **perilaku**, bukan hanya tampilan.

```viz
{"type":"flow","title":"Handoff yang rapi","caption":"Libatkan developer sejak wireframe. Banyak masalah implementasi bisa dicegah dengan satu pertanyaan ‘ini sulit dibangun tidak?’ di awal.","steps":[{"label":"Rapikan file","detail":"Layer bernama, komponen dari library (bukan detached), token dipakai konsisten, halaman ‘Ready for dev’ terpisah dari eksplorasi."},{"label":"Spesifikasi perilaku","detail":"Semua state, perilaku responsif (compact/medium/expanded), animasi (durasi, easing), dan navigasi."},{"label":"Edge case","detail":"Teks sangat panjang, nama satu huruf, data kosong, 1.000 item, gambar gagal dimuat, offline, error server."},{"label":"Aset & konten","detail":"Ikon SVG, gambar dalam ukuran yang tepat, teks final (bukan lorem ipsum)."},{"label":"Walkthrough","detail":"Sesi singkat menjelaskan alur & alasan desain; tanya jawab."},{"label":"Review hasil","detail":"Desainer meninjau build/staging (design QA) sebelum rilis."}]}
```

Figma **Dev Mode** membantu developer membaca ukuran, token, dan CSS. Tetapi angka yang tepat tidak berarti apa-apa jika perilaku saat teks panjang atau data kosong tidak pernah didesain.

:::latihan
Milestone: buat mini design system di Figma: (1) variabel token tiga tingkat dengan mode terang & gelap, (2) skala tipografi, (3) 10 komponen dengan variant properties dan semua state, (4) halaman dokumentasi untuk 3 komponen (kapan dipakai, do & don’t, aksesibilitas), (5) satu layar ‘Ready for dev’ lengkap dengan edge case. Pastikan semua pasangan warna teks/latar lolos 4,5:1.
:::

## Rangkuman

- Token tiga tingkat: primitive → semantic → component; komponen memakai token semantic.
- Komponen dengan variant properties yang dipetakan 1:1 ke props kode; mulai dari yang paling sering dipakai.
- Dokumentasi: kapan dipakai/tidak, anatomi, state, do & don’t, UX writing, aksesibilitas.
- Aksesibilitas dibangun ke dalam token dan komponen; uji dengan alat dan manusia.
- Handoff = perilaku + edge case + aset + walkthrough + design QA.
