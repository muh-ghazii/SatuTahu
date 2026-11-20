---
title: Portofolio & wawancara data scientist
minutes: 40
summary: Wawancara data scientist menguji tiga hal sekaligus — fondasi statistik & ML, kemampuan teknis (SQL & Python), dan cara berpikir produk. Modul ini membahas pola soal statistik & ML, studi kasus produk, soal SQL yang paling sering keluar, serta cara mempresentasikan proyek.
objectives:
  - Menjawab soal teori statistik & ML dengan intuisi dan contoh
  - Menyelesaikan studi kasus produk dengan kerangka yang terstruktur
  - Menyelesaikan pola soal SQL wawancara
  - Mempresentasikan proyek portofolio secara meyakinkan
sources:
  - repo: alexeygrigorev/data-science-interviews
    note: Kumpulan pertanyaan teori & teknis wawancara DS
  - repo: academic/awesome-datascience
    note: Rujukan belajar & dataset
quiz:
  - q: "Metrik ‘pesanan per pengguna aktif’ naik 10%. Langkah pertama yang baik dalam studi kasus adalah…"
    options: ["Langsung menyimpulkan kampanye sukses", "Memeriksa definisi & data (apakah penyebutnya berubah?), lalu memecah per segmen", "Membuat model deep learning", "Menghapus data outlier"]
    answer: 1
    explain: "Rasio bisa naik karena penyebut turun; cek data dulu, baru dekomposisi."
  - q: "Soal ‘3 produk terlaris per kategori’ paling tepat diselesaikan dengan…"
    options: ["GROUP BY saja", "Window function ROW_NUMBER/RANK di-PARTITION BY kategori", "DISTINCT", "UNION"]
    answer: 1
    explain: "Top-N per grup adalah pola window function klasik."
  - q: "Ditanya ‘jelaskan regularisasi L1 vs L2’, jawaban yang kuat menyertakan…"
    options: ["Hanya rumus", "Intuisi (L1 membuat koefisien nol → seleksi fitur; L2 mengecilkan merata), kapan dipakai, dan contoh", "Nama library", "Sejarah penemuannya"]
    answer: 1
    explain: "Pewawancara menguji pemahaman, bukan hafalan: intuisi dan kapan memakainya."
  - q: "Saat mempresentasikan proyek, bagian yang paling sering dikejar pewawancara adalah…"
    options: ["Warna grafik", "Keputusan & trade-off yang kamu ambil serta apa yang akan dilakukan berbeda", "Jumlah baris kode", "Nama dosen pembimbing"]
    answer: 1
    explain: "Keputusan dan trade-off menunjukkan cara berpikir dan kedewasaan teknis."
---

Wawancara data scientist berbeda-beda antar perusahaan, tetapi polanya cukup konsisten: **skrining** (rekruter), **teknis** (SQL/Python, statistik, ML), **studi kasus produk**, dan **presentasi proyek atau take-home**. Modul ini membekalimu untuk keempatnya.

## Soal statistik & ML

Pewawancara tidak mencari hafalan rumus, tetapi **intuisi + kapan dipakai + jebakannya**. Gunakan pola jawaban: definisi singkat → intuisi/contoh → trade-off.

```viz
{"type":"compare","columns":["Pertanyaan umum","Inti jawaban yang kuat"],"rows":[{"label":"p-value","values":["Peluang data seekstrem ini jika H0 benar; bukan peluang H0 benar. Sebut power dan besar efek."]},{"label":"Bias–variance","values":["Model sederhana: bias tinggi (underfit); kompleks: variance tinggi (overfit). Atasi dengan regularisasi, data, CV."]},{"label":"L1 vs L2","values":["L1 mendorong koefisien tepat nol (seleksi fitur); L2 mengecilkan merata, stabil saat fitur berkorelasi."]},{"label":"Precision vs recall","values":["Kaitkan dengan biaya: spam filter (precision) vs deteksi penipuan (recall)."]},{"label":"Data tidak seimbang","values":["Metrik PR-AUC, class weight, threshold tuning; resampling dengan hati-hati di dalam CV."]},{"label":"Random forest vs boosting","values":["Paralel vs sekuensial; variance vs bias; boosting lebih kuat tapi sensitif tuning."]}]}
```

Soal probabilitas juga sering muncul. Contoh: *"Dua dadu dilempar; peluang jumlahnya 7?"* → 6/36 = 1/6. *"Peluang setidaknya satu enam dari 4 lemparan?"* → 1 − (5/6)⁴ ≈ 0,52. Latih dengan menyimulasikan jawabanmu di Python untuk memastikannya.

```viz
{"type":"overfit"}
```

## Case study produk

Pertanyaan seperti *"DAU turun 8% minggu ini, apa yang kamu lakukan?"* menguji cara berpikir terstruktur:

```viz
{"type":"flow","title":"Kerangka investigasi perubahan metrik","steps":[{"label":"Klarifikasi","detail":"Definisi metrik, periode pembanding, besar & mendadak atau bertahap?"},{"label":"Cek data","detail":"Bug logging, perubahan definisi, pipeline terlambat?"},{"label":"Faktor eksternal","detail":"Libur, musim, kompetitor, berita, gangguan layanan."},{"label":"Dekomposisi","detail":"Pecah per platform, wilayah, versi app, kanal akuisisi, kohort baru vs lama."},{"label":"Hipotesis & uji","detail":"Rilis terbaru? Cocokkan waktu dan segmen yang terdampak."},{"label":"Rekomendasi","detail":"Tindakan, pemilik, dan cara memantau."}]}
```

Jenis lain: **mendefinisikan metrik sukses** fitur baru (sebut metrik utama, guardrail, dan cara mengukurnya dengan eksperimen), serta **mendesain eksperimen** (unit randomisasi, ukuran sampel, efek jaringan). Selalu bicarakan trade-off: menaikkan notifikasi bisa menaikkan DAU tetapi juga uninstall.

## SQL interview

Soal SQL wawancara berulang pada beberapa pola. Kuasai ini dan kebanyakan soal terasa familier:

```sql
-- 1. Top-N per grup
SELECT * FROM (
  SELECT kategori, produk, SUM(omzet) AS total,
         ROW_NUMBER() OVER (PARTITION BY kategori ORDER BY SUM(omzet) DESC) AS rn
  FROM penjualan GROUP BY kategori, produk
) t WHERE rn <= 3;

-- 2. Pengguna yang aktif 3 hari berturut-turut (gaps & islands)
WITH h AS (
  SELECT DISTINCT user_id, tanggal,
         tanggal - CAST(ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY tanggal) AS INTEGER) AS grp
  FROM login
)
SELECT user_id FROM h GROUP BY user_id, grp HAVING COUNT(*) >= 3;

-- 3. Pertumbuhan bulan ke bulan
SELECT bulan, omzet,
       omzet * 1.0 / LAG(omzet) OVER (ORDER BY bulan) - 1 AS growth
FROM omzet_bulanan;
```

Pola lain: **running total** (`SUM() OVER (ORDER BY ...)`), **retensi/cohort** (lihat [SQL untuk analisis](/belajar/data-analyst/da-2)), **self-join** untuk pasangan, dan **anti-join** (`LEFT JOIN ... WHERE kanan IS NULL`) untuk "pelanggan yang belum pernah…". Ucapkan asumsimu dengan lantang: duplikat? NULL? zona waktu?

```viz
{"type":"sql-join"}
```

## Presentasi proyek

Presentasi proyek (atau pembahasan take-home) menilai kemampuan **menjelaskan keputusan**. Struktur 10 menit yang efektif:

1. **Masalah & dampak** (1 menit): siapa yang peduli dan kenapa.
2. **Data** (1–2 menit): sumber, ukuran, keterbatasan.
3. **Pendekatan** (3 menit): baseline → model, skema validasi, kenapa memilih ini.
4. **Hasil** (2 menit): metrik dibanding baseline, dalam bahasa bisnis.
5. **Trade-off & pelajaran** (2 menit): apa yang gagal, apa yang akan dilakukan berbeda, langkah produksi.

Siapkan jawaban untuk pertanyaan lanjutan yang hampir pasti datang: *Bagaimana kamu tahu tidak ada leakage?* *Kenapa metrik itu?* *Bagaimana jika datanya 100× lebih besar?* *Bagaimana memantau model setelah rilis?*

Portofolio yang mendukung presentasi ini sebaiknya berisi 2–3 proyek dengan peran berbeda: satu analisis kausal/eksperimen, satu model prediktif end-to-end (sampai API atau dashboard sederhana), dan satu proyek yang memakai data tidak rapi yang kamu kumpulkan sendiri. Variasi ini menunjukkan bahwa kamu bisa bergerak dari pertanyaan ke dampak, bukan hanya melatih model.

:::tip
Untuk take-home, kualitas lebih penting daripada kelengkapan. README yang menjelaskan asumsi, keputusan, dan apa yang akan dikerjakan dengan waktu lebih, sering lebih menentukan daripada skor model.
:::

:::latihan
Milestone akhir jalur: (1) jawab 20 pertanyaan teori dari `data-science-interviews` secara lisan dan rekam dirimu, (2) selesaikan 15 soal SQL dengan pola di atas, (3) latihan 3 studi kasus produk dengan teman (bergantian menjadi pewawancara), dan (4) presentasikan satu proyek portofolio dalam 10 menit dengan struktur di atas.
:::

## Rangkuman

- Teori: definisi → intuisi/contoh → trade-off; simulasikan soal probabilitas.
- Studi kasus: klarifikasi → cek data → faktor eksternal → dekomposisi → hipotesis → rekomendasi.
- SQL: kuasai top-N per grup, gaps & islands, LAG/growth, running total, cohort, anti-join.
- Presentasi: masalah → data → pendekatan → hasil → trade-off; siapkan pertanyaan lanjutan.
