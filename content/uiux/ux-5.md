---
title: Usability testing & studi kasus portofolio
minutes: 35
summary: Desain belum selesai sampai diuji oleh orang yang akan memakainya. Modul ini mengajarkan cara merancang skenario uji, menjalankan sesi usability testing, mengukur hasilnya dengan metrik standar seperti SUS dan success rate, mengiterasi desain berdasarkan bukti, dan menceritakan semuanya dalam case study portofolio.
objectives:
  - Menulis skenario dan tugas uji yang realistis dan tidak menggiring
  - Menjalankan sesi usability test moderated dan mencatat temuan
  - Menghitung success rate, waktu tugas, dan skor SUS
  - Memprioritaskan perbaikan dan menulis case study yang meyakinkan
sources:
  - repo: ttt30ga/awesome-product-design
    note: Rujukan metode usability testing dan contoh case study
  - repo: nilbuild/developer-roadmap
    note: Roadmap UX Design untuk memetakan keterampilan lanjutan
quiz:
  - q: "Tugas uji mana yang paling baik?"
    options: ["Klik tombol ‘Tambah Tugas’ di pojok kanan bawah", "Dosen baru saja mengumumkan tugas esai deadline Jumat. Catat tugas itu agar kamu tidak lupa.", "Apakah desain ini bagus?", "Coba semua fitur"]
    answer: 1
    explain: "Skenario realistis tanpa menyebut label/letak tombol menguji apakah pengguna bisa menemukan caranya sendiri."
  - q: "Kenapa 5 peserta sering dianggap cukup untuk satu putaran usability test kualitatif?"
    options: ["Karena aturan hukum", "Sebagian besar masalah utama sudah terlihat; lebih efektif menguji 5 orang lalu memperbaiki dan menguji lagi", "Agar murah saja", "Karena SUS hanya untuk 5 orang"]
    answer: 1
    explain: "Temuan Nielsen: beberapa putaran kecil dengan perbaikan di antaranya mengungkap lebih banyak masalah daripada satu tes besar."
  - q: "Skor SUS rata-rata acuan industri sekitar…"
    options: ["10", "50", "68", "100"]
    answer: 2
    explain: "Skor 68 dianggap rata-rata; di atas ~80 tergolong sangat baik. Skor SUS bukan persentase."
  - q: "Bagian terpenting case study bagi perekrut adalah…"
    options: ["Koleksi mockup paling indah", "Proses berpikir: masalah, keputusan, bukti, dan hasil", "Daftar alat yang dipakai", "Biodata panjang"]
    answer: 1
    explain: "Perekrut menilai cara kamu berpikir dan mengambil keputusan, bukan hanya hasil visualnya."
---

Desainer selalu ‘tahu’ cara memakai desainnya sendiri, dan justru karena itu ia penguji yang buruk. Usability testing menempatkan desain di tangan orang lain dan menunjukkan dengan jujur di mana mereka bingung. Hasilnya sering mengejutkan, dan itulah gunanya.

## Skenario & task test

Mulai dari **tujuan pengujian**: pertanyaan apa yang ingin dijawab? Misalnya: ‘Apakah mahasiswa bisa menambahkan tugas dari pengumuman kelas tanpa bantuan dalam 1 menit?’

Lalu tulis **skenario** (konteks yang realistis) dan **tugas** (apa yang harus dicapai), tanpa menyebut nama tombol atau letak menu:

| Buruk (menggiring) | Baik (berbasis tujuan) |
|---|---|
| ‘Ketuk ikon + di kanan bawah, lalu isi form.’ | ‘Dosen Basis Data baru mengumumkan tugas ERD, deadline Jumat. Pastikan kamu tidak lupa.’ |
| ‘Gunakan filter minggu ini.’ | ‘Kamu ingin tahu tugas apa saja yang harus selesai sebelum akhir pekan.’ |
| ‘Apakah halaman ini mudah?’ | (amati perilakunya, tanyakan pendapat di akhir) |

Jalannya sesi *moderated* (tatap muka/daring, 30–45 menit):

```viz
{"type":"flow","title":"Alur satu sesi usability test","caption":"Peran moderator adalah mengamati, bukan membantu. Saat peserta bertanya ‘ini harus diklik?’, kembalikan: ‘Menurutmu bagaimana?’","steps":[{"label":"Pembukaan","detail":"Jelaskan: ‘Yang diuji desainnya, bukan kamu. Tidak ada jawaban salah.’ Minta izin merekam."},{"label":"Pemanasan","detail":"Pertanyaan konteks: bagaimana biasanya mencatat tugas?"},{"label":"Tugas & think-aloud","detail":"Peserta mengerjakan tugas sambil menyuarakan pikirannya. Moderator diam dan mencatat."},{"label":"Pertanyaan per tugas","detail":"Seberapa mudah (skala 1–7)? Apa yang kamu harapkan terjadi tadi?"},{"label":"Kuesioner SUS","detail":"10 pernyataan standar di akhir sesi."},{"label":"Penutup","detail":"Kesan keseluruhan, terima kasih, insentif kecil bila ada."}]}
```

Catat **apa yang dilakukan**, bukan hanya yang dikatakan: ragu lama di satu layar, mengetuk elemen yang tidak bisa diketuk, kembali ke layar sebelumnya. Pengguna sering bilang ‘mudah kok’ padahal baru saja kesulitan selama 40 detik.

## Metrik (SUS, success rate)

Metrik membuat hasil bisa dibandingkan antar versi desain.

```viz
{"type":"compare","title":"Metrik usability yang umum","columns":["Task success rate","Waktu penyelesaian","Error rate","SUS"],"rows":[{"label":"Mengukur","values":["% peserta yang berhasil menyelesaikan tugas","Berapa lama tugas selesai","Kesalahan/jalan buntu per tugas","Persepsi kemudahan keseluruhan"]},{"label":"Cara hitung","values":["berhasil ÷ total peserta","median detik (lebih tahan outlier daripada rata-rata)","jumlah kesalahan yang diamati","10 pernyataan skala 1–5 → skor 0–100"]},{"label":"Acuan","values":["± 78% rata-rata lintas studi","bandingkan antar versi","semakin kecil semakin baik","68 = rata-rata; > 80 sangat baik"]}]}
```

**Cara menghitung SUS** (System Usability Scale):

1. Peserta menilai 10 pernyataan standar dari 1 (sangat tidak setuju) sampai 5 (sangat setuju). Pernyataan bernomor ganjil bernada positif (‘Saya rasa sistem ini mudah digunakan’), yang genap bernada negatif (‘Saya merasa sistem ini terlalu rumit’).
2. Pernyataan ganjil: skor − 1. Pernyataan genap: 5 − skor.
3. Jumlahkan kesepuluh hasilnya lalu kalikan **2,5**.

Contoh: jawaban `4,2,5,1,4,2,4,2,5,1` → ganjil: 3+4+3+3+4 = 17; genap: 3+4+3+3+4 = 17; total 34 × 2,5 = **85**. Ingat, SUS **bukan persentase**: skor 68 berada di sekitar persentil ke-50.

Dengan 5 peserta, angka-angka ini bersifat **indikatif**. Gunakan untuk melihat arah perubahan antar iterasi, bukan untuk klaim statistik.

## Iterasi desain

Setelah sesi, kumpulkan temuan dan beri **tingkat keparahan** agar perbaikan diprioritaskan dengan jujur:

| Keparahan | Arti | Contoh |
|---|---|---|
| Kritis | menghalangi tugas selesai | 3/5 peserta tidak menemukan cara menambah tugas |
| Mayor | memperlambat/membingungkan | peserta ragu memilih tanggal karena format tidak jelas |
| Minor | mengganggu kecil | ikon kurang jelas tetapi labelnya membantu |
| Saran | ide peserta | ‘bisa sinkron ke Google Calendar?’ |

Prioritaskan berdasarkan **keparahan × frekuensi**, perbaiki, lalu **uji lagi** dengan peserta baru. Siklus kecil yang cepat (5 peserta → perbaiki → 5 peserta) lebih efektif daripada satu tes besar di akhir.

```viz
{"type":"flow","title":"Siklus iterasi desain","loop":true,"steps":[{"label":"Desain","detail":"Prototipe versi n."},{"label":"Uji","detail":"5 peserta, tugas yang sama."},{"label":"Analisis","detail":"Temuan + keparahan + metrik."},{"label":"Putuskan","detail":"Perbaiki yang kritis & mayor; catat keputusan dan alasannya."}]}
```

## Menulis case study

Case study adalah cerita tentang **bagaimana kamu berpikir**. Perekrut membaca puluhan portofolio. Yang menonjol bukan mockup paling mengilap, melainkan proses yang jelas dan keputusan yang beralasan.

Struktur yang terbukti efektif:

1. **Ringkasan** (3–4 kalimat + satu gambar hasil): masalah, peranmu, durasi, hasil utama.
2. **Masalah & konteks**: siapa penggunanya, kenapa penting, batasan yang ada.
3. **Riset**: metode, temuan kunci (kutipan peserta yang kuat), persona/journey map.
4. **Ide & keputusan**: alternatif yang dipertimbangkan dan **kenapa** dipilih atau dibuang.
5. **Desain**: alur, wireframe → hi-fi, komponen penting.
6. **Pengujian & iterasi**: apa yang gagal di versi pertama dan bagaimana diperbaiki (ini bagian yang paling meyakinkan!).
7. **Hasil**: metrik sebelum/sesudah (success rate 40% → 100%, SUS 58 → 82), atau dampak nyata.
8. **Refleksi**: apa yang akan dilakukan berbeda.

:::tip
Jujurlah tentang kerja tim dan batasan. ‘Saya memimpin riset dan desain alur; visual dikerjakan bersama Sinta’ lebih dipercaya daripada mengklaim semuanya sendirian.
:::

:::latihan
Milestone: uji prototipe dari modul sebelumnya dengan 5 peserta (3 tugas, think-aloud, SUS). Hitung success rate per tugas dan skor SUS, buat tabel temuan dengan keparahan, perbaiki desain, lalu uji ulang dengan 3–5 peserta baru. Tulis dua case study lengkap mengikuti struktur di atas dan publikasikan (Notion, Behance, atau situs portofolio).
:::

## Rangkuman

- Skenario realistis + tugas berbasis tujuan, tanpa menyebut letak/label tombol.
- Moderator mengamati, bukan membantu; catat perilaku, bukan hanya ucapan.
- Metrik: success rate, waktu (median), error, SUS (68 = rata-rata; bukan persentase).
- Prioritaskan berdasarkan keparahan × frekuensi; iterasi kecil dan sering.
- Case study menceritakan proses, keputusan, bukti, hasil, dan refleksi.
