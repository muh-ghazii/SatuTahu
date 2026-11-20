---
title: Prinsip desain visual
minutes: 40
summary: Desain yang baik bukan soal selera, melainkan soal membuat informasi mudah ditemukan dan dipahami. Modul ini membahas prinsip yang bisa diukur dan dipelajari, yaitu hierarki visual dan prinsip Gestalt, skala tipografi, warna dan kontras, grid dan spacing, serta dasar bekerja di Figma.
objectives:
  - Menciptakan hierarki visual dengan ukuran, bobot, warna, dan jarak
  - Menerapkan prinsip Gestalt untuk mengelompokkan informasi
  - Membuat skala tipografi dan palet warna yang lolos uji kontras
  - Memakai grid 8-pt dan Auto Layout di Figma
sources:
  - repo: gztchan/awesome-design
    note: Kurasi sumber tipografi, warna, dan prinsip desain
  - repo: bradtraversy/design-resources-for-developers
    note: Sumber font, ikon, dan palet gratis
  - repo: nicolesaidy/awesome-web-design
    note: Daftar bacaan dasar desain digital
quiz:
  - q: "Kartu produk yang jarak antar elemennya di dalam kartu lebih kecil daripada jarak antar kartu memanfaatkan prinsip Gestalt…"
    options: ["Closure", "Proximity (kedekatan)", "Continuity", "Figure-ground"]
    answer: 1
    explain: "Elemen yang berdekatan dianggap satu kelompok. Jarak dalam kelompok harus lebih kecil daripada jarak antar kelompok."
  - q: "Dengan ukuran dasar 16px dan rasio 1,25, ukuran heading dua tingkat di atas body adalah…"
    options: ["20px", "25px", "32px", "18px"]
    answer: 1
    explain: "16 × 1,25² = 25px. Skala modular membuat ukuran konsisten, bukan acak."
  - q: "Kenapa warna saja tidak boleh menjadi satu-satunya penanda status (mis. merah = error)?"
    options: ["Warna mahal", "Pengguna buta warna dan layar di bawah terik matahari bisa tidak membedakannya", "Warna tidak terlihat di HP", "Aturan Figma"]
    answer: 1
    explain: "Tambahkan ikon, teks, atau pola. Sekitar 1 dari 12 laki-laki memiliki kelainan penglihatan warna."
  - q: "Fitur Figma yang membuat frame menyesuaikan ukuran isinya secara otomatis (seperti Flexbox) adalah…"
    options: ["Components", "Auto Layout", "Prototype", "Plugins"]
    answer: 1
    explain: "Auto Layout mengatur arah, jarak, dan padding sehingga tombol melebar saat teksnya bertambah panjang."
---

Banyak orang mengira desain adalah bakat. Faktanya, sebagian besar tampilan yang terlihat ‘profesional’ mengikuti aturan yang konsisten: ukuran huruf dari skala yang sama, jarak dari kelipatan yang sama, dan warna dengan peran yang jelas. Modul ini mengajarkan aturan-aturan itu.

## Hierarki visual & Gestalt

**Hierarki visual** menentukan apa yang dilihat pertama, kedua, dan seterusnya. Alat untuk menciptakannya: **ukuran**, **bobot** (tebal/tipis), **warna & kontras**, **posisi**, dan **ruang kosong**. Uji sederhana: sipitkan mata saat melihat desainmu (*squint test*). Elemen yang masih terlihat adalah yang paling dominan. Apakah itu memang yang paling penting?

Psikologi **Gestalt** menjelaskan bagaimana otak mengelompokkan elemen secara otomatis:

```viz
{"type":"compare","title":"Prinsip Gestalt dalam antarmuka","columns":["Proximity","Similarity","Common region","Continuity","Figure–ground"],"rows":[{"label":"Artinya","values":["Yang berdekatan dianggap satu kelompok","Yang mirip (warna/bentuk) dianggap sejenis","Yang berada dalam satu bingkai dianggap satu kesatuan","Mata mengikuti garis/alur","Otak memisahkan objek dari latarnya"]},{"label":"Contoh UI","values":["Label menempel ke input-nya, bukan ke input sebelumnya","Semua tautan berwarna sama","Kartu produk dengan latar & border","Langkah-langkah checkout dalam satu garis","Modal di atas latar yang digelapkan"]},{"label":"Kesalahan umum","values":["Jarak seragam di mana-mana, sehingga tidak ada kelompok","Tombol utama & sekunder tampak sama","Terlalu banyak kotak bersarang","Alur zig-zag","Kontras latar terlalu rendah"]}]}
```

## Tipografi & skala

Tipografi adalah 90% isi antarmuka. Prinsip yang membuat teks nyaman dibaca:

- **Batasi** keluarga huruf: satu sans-serif yang baik (mis. Inter, Plus Jakarta Sans) sering sudah cukup; bedakan hierarki dengan ukuran dan bobot.
- **Ukuran body** minimal 16px untuk web dan HP.
- **Line height** 1,4–1,6 untuk paragraf, lebih rapat (1,1–1,3) untuk judul besar.
- **Panjang baris** ideal 45–75 karakter; terlalu panjang membuat mata ‘tersesat’ saat pindah baris.
- Gunakan **skala modular**: setiap tingkat = ukuran sebelumnya × rasio.

```viz
{"type":"type-scale"}
```

## Teori warna & kontras

Warna di antarmuka punya **peran**, bukan sekadar hiasan. Struktur palet yang umum:

| Peran | Fungsi | Contoh di SatuTahu |
|---|---|---|
| Primary | aksi utama, identitas brand | kuning `#FEC536` |
| Neutral | teks, latar, garis (porsi terbesar) | navy `#12203A`, krem `#FDF9EE` |
| Semantic | status: sukses, peringatan, error, info | hijau, oranye, merah, biru |
| Accent | penekanan sesekali | variasi kuning muda |

Aturan **60-30-10** menjadi titik awal yang baik: 60% warna netral/latar, 30% warna sekunder, 10% warna aksen untuk aksi penting. Selalu uji **kontras**: teks normal minimal 4,5:1 (WCAG AA).

```viz
{"type":"contrast"}
```

Perhatikan contoh bawaan: kuning SatuTahu di atas putih hanya ±1,6:1, sehingga **tidak boleh** dipakai untuk teks. Itulah keputusan desain di situs ini: kuning sebagai latar tombol dan aksen, navy untuk teks.

## Grid & spacing

Konsistensi jarak adalah perbedaan terbesar antara desain amatir dan profesional. Gunakan **sistem 8-pt**: semua jarak dan ukuran adalah kelipatan 8 (4 untuk penyesuaian kecil): 4, 8, 12, 16, 24, 32, 48, 64.

```viz
{"type":"box-model"}
```

Prinsip spacing:

- **Jarak dalam kelompok < jarak antar kelompok** (proximity). Misalnya label 8px dari input-nya, dan 24px dari field berikutnya.
- **Ruang kosong bukan ruang terbuang**: ia memberi napas dan menegaskan hierarki.
- **Grid kolom** menyelaraskan elemen: 4 kolom untuk HP, 8 untuk tablet, 12 untuk desktop, dengan *gutter* (jarak antar kolom) 16–24px dan margin tepi yang konsisten.

```viz
{"type":"responsive"}
```

## Dasar Figma

**Figma** adalah alat desain antarmuka berbasis browser yang menjadi standar industri, dan versi gratisnya cukup untuk belajar. Konsep yang perlu dikuasai sejak awal:

```viz
{"type":"tree","title":"Konsep inti Figma","caption":"Menguasai Auto Layout dan Components sejak awal menghemat ratusan jam: desain bisa diubah tanpa menggeser elemen satu per satu.","root":{"label":"File Figma","detail":"Satu file bisa berisi banyak halaman (Pages).","children":[{"label":"Frame","detail":"Wadah, mirip <div>. Bisa berupa satu layar HP (mis. 390×844) atau satu komponen. Gunakan frame, bukan group, untuk tata letak."},{"label":"Auto Layout (Shift+A)","detail":"Membuat frame menyusun isinya otomatis dengan arah, gap, dan padding, seperti Flexbox. Tombol ikut melebar saat teksnya panjang."},{"label":"Components & instances","detail":"Komponen utama (master) dan salinannya. Ubah master → semua instance ikut berubah. Dasar design system."},{"label":"Variants & properties","detail":"Satu komponen dengan beberapa varian: Button/primary/hover/disabled."},{"label":"Styles & variables","detail":"Warna, teks, efek, dan jarak yang disimpan sebagai token. Mendukung mode terang/gelap."},{"label":"Dev Mode / Inspect","detail":"Developer melihat ukuran, warna, dan CSS dari desain."}]}}
```

Kebiasaan sejak hari pertama: beri **nama layer** yang jelas, gunakan **Auto Layout** untuk hampir semua hal, simpan warna dan teks sebagai **style/variable**, dan buat **komponen** begitu sebuah elemen muncul lebih dari dua kali.

:::latihan
Milestone: pilih satu halaman aplikasi lokal yang menurutmu membingungkan (mis. halaman pembayaran UKT atau aplikasi ojek lokal). Screenshot, lalu di Figma: (1) tandai masalah hierarki, kontras, dan spacing dengan anotasi; (2) desain ulang memakai skala tipografi 1,25, grid 4 kolom, sistem 8-pt, dan palet dengan kontras ≥ 4,5:1; (3) tulis 5 poin alasan perubahanmu.
:::

## Rangkuman

- Hierarki = ukuran, bobot, warna, posisi, ruang; uji dengan squint test.
- Gestalt: proximity, similarity, common region, continuity, figure–ground.
- Tipografi: sedikit font, body ≥ 16px, line height 1,4–1,6, skala modular.
- Warna punya peran; aturan 60-30-10; kontras teks ≥ 4,5:1; jangan andalkan warna saja.
- Sistem 8-pt + grid kolom; Figma: frame, Auto Layout, components, styles.
