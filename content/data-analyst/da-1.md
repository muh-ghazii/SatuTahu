---
title: Spreadsheet & statistik deskriptif
minutes: 40
summary: Sebelum Python dan dashboard, alat analisis paling banyak dipakai di dunia kerja adalah spreadsheet. Modul ini membahas formula dan pivot table, ukuran pemusatan dan sebaran, membaca distribusi dan outlier, membedakan korelasi dari kausalitas, serta membersihkan data dengan teliti.
objectives:
  - Memakai formula lookup, agregasi bersyarat, dan pivot table
  - Memilih antara mean dan median serta mengukur sebaran
  - Membaca distribusi dan mendeteksi outlier dengan IQR
  - Menghindari kesimpulan kausal dari korelasi dan membersihkan data mentah
sources:
  - repo: microsoft/Data-Science-For-Beginners
    note: Pelajaran statistik deskriptif dan bekerja dengan data
  - repo: datasciencemasters/go
    note: Daftar bacaan matematika & statistik dasar
quiz:
  - q: "Gaji 9 karyawan sekitar Rp5 juta dan 1 direktur Rp200 juta. Ukuran ‘gaji khas’ yang paling jujur adalah…"
    options: ["Mean", "Median", "Maksimum", "Jumlah"]
    answer: 1
    explain: "Median tahan terhadap outlier. Mean akan melonjak menjadi sekitar Rp24,5 juta dan tidak mewakili siapa pun."
  - q: "Formula yang menjumlahkan penjualan hanya untuk kota ‘Kotabaru’ adalah…"
    options: ["SUM", "SUMIFS", "COUNT", "VLOOKUP"]
    answer: 1
    explain: "SUMIFS(rentang_jumlah, rentang_kriteria, kriteria) menjumlahkan baris yang memenuhi syarat; bisa banyak syarat sekaligus."
  - q: "Penjualan es krim dan kasus tenggelam sama-sama naik di bulan tertentu. Kesimpulan yang tepat?"
    options: ["Es krim menyebabkan tenggelam", "Keduanya berkorelasi, kemungkinan karena variabel ketiga (musim panas/kemarau)", "Tenggelam menyebabkan orang membeli es krim", "Data pasti salah"]
    answer: 1
    explain: "Korelasi tidak membuktikan sebab-akibat. Cari confounder: faktor yang memengaruhi keduanya."
  - q: "Dengan metode IQR, nilai disebut outlier jika berada di luar…"
    options: ["Mean ± 1 SD", "Q1 − 1,5×IQR dan Q3 + 1,5×IQR", "Min dan max", "Median ± 10"]
    answer: 1
    explain: "IQR = Q3 − Q1. Batas 1,5×IQR adalah aturan yang dipakai box plot."
---

Data analyst menjawab pertanyaan bisnis dengan data: produk mana yang paling laku? kenapa penjualan bulan ini turun? cabang mana yang perlu perhatian? Sebagian besar pertanyaan itu bisa dijawab dengan **spreadsheet** dan **statistik deskriptif**, asalkan datanya bersih dan cara membacanya benar.

Contoh sepanjang modul: data penjualan toko seragam dengan kolom `tanggal`, `kota`, `produk`, `ukuran`, `qty`, `harga_satuan`.

## Formula & pivot table

Formula yang paling sering dipakai analyst (Excel dan Google Sheets hampir sama):

| Kebutuhan | Formula | Contoh |
|---|---|---|
| Omzet per baris | aritmatika | `=E2*F2` |
| Jumlah bersyarat | `SUMIFS` | `=SUMIFS(G:G, B:B, "Kotabaru", C:C, "Gamis")` |
| Hitung bersyarat | `COUNTIFS` | `=COUNTIFS(B:B, "Banjarmasin")` |
| Rata-rata bersyarat | `AVERAGEIFS` | `=AVERAGEIFS(E:E, C:C, "Jilbab")` |
| Mengambil data dari tabel lain | `XLOOKUP` (atau `VLOOKUP`) | `=XLOOKUP(C2, Produk!A:A, Produk!C:C, "tidak ada")` |
| Kondisi | `IF`, `IFS` | `=IF(G2>=1000000, "Besar", "Kecil")` |
| Teks & tanggal | `TRIM`, `PROPER`, `TEXT`, `EOMONTH` | `=TEXT(A2, "yyyy-mm")` |

**Pivot table** meringkas ribuan baris dalam hitungan detik tanpa formula: tarik `kota` ke *Rows*, `produk` ke *Columns*, dan `omzet` ke *Values* (Sum). Konsep di baliknya adalah **split–apply–combine**, sama persis dengan `GROUP BY` di SQL dan `groupby` di pandas yang akan kamu pelajari nanti:

```viz
{"type":"groupby"}
```

:::tip[Format data yang ‘pivot-friendly’]
Satu baris = satu transaksi, satu kolom = satu atribut, tanpa sel gabungan (*merged cells*), tanpa baris subtotal di tengah, dan header hanya satu baris. Data berbentuk ‘tabel laporan’ yang sudah dirangkum harus dikembalikan ke bentuk panjang dulu.
:::

## Mean, median, sebaran

**Ukuran pemusatan** menjawab ‘berapa nilai khasnya?’:

- **Mean** (rata-rata): jumlah ÷ banyak data. Sensitif terhadap nilai ekstrem.
- **Median**: nilai tengah setelah diurutkan. Tahan terhadap outlier, cocok untuk gaji, harga rumah, dan durasi.
- **Modus**: nilai yang paling sering muncul. Berguna untuk data kategori (ukuran baju terlaris).

**Ukuran sebaran** menjawab ‘seberapa beragam?’:

- **Range**: maks − min (mudah terpengaruh outlier).
- **Simpangan baku (standard deviation)**: rata-rata jarak data dari mean.
- **IQR** (*interquartile range*): Q3 − Q1, yaitu rentang 50% data di tengah.

```text
Penjualan harian (pcs): 12, 15, 14, 13, 16, 15, 90
Mean   = 175 / 7 ≈ 25      ← tertarik oleh hari ke-7 (pesanan borongan)
Median = 15                 ← lebih mewakili hari biasa
```

Dua toko bisa punya rata-rata penjualan sama tetapi sebaran sangat berbeda: satu stabil, satu naik-turun drastis. Melaporkan rata-rata tanpa sebaran menyembunyikan risiko.

## Distribusi & outlier

**Distribusi** menunjukkan bagaimana nilai tersebar. Selalu lihat histogram sebelum menghitung apa pun:

```viz
{"type":"distribution"}
```

Bentuk yang perlu dikenali: **normal/simetris** (mean ≈ median), **miring kanan** (ekor panjang ke nilai besar, seperti pendapatan dan nilai transaksi; mean > median), dan **bimodal** (dua puncak, sering tanda ada dua kelompok berbeda yang tercampur, mis. pembeli eceran dan grosir).

**Outlier** adalah nilai yang jauh dari mayoritas. Aturan box plot: outlier jika < Q1 − 1,5×IQR atau > Q3 + 1,5×IQR. Tetapi **jangan otomatis menghapusnya**. Tanyakan dulu:

- Kesalahan input? (qty `1000` padahal `10`) → perbaiki atau buang.
- Peristiwa nyata yang penting? (pesanan borongan seragam untuk satu kabupaten) → justru informasi bisnis berharga, analisis terpisah.

## Korelasi vs kausalitas

**Korelasi** mengukur seberapa kuat dua variabel bergerak bersama (koefisien Pearson −1 sampai 1). Korelasi berguna untuk menemukan petunjuk, tetapi **tidak membuktikan sebab-akibat**.

```viz
{"type":"compare","title":"Kenapa dua hal bisa berkorelasi tanpa saling menyebabkan","columns":["Confounder","Kebetulan","Sebab terbalik","Bias seleksi"],"rows":[{"label":"Penjelasan","values":["Variabel ketiga memengaruhi keduanya","Banyak variabel diuji, sebagian pasti tampak berkorelasi","Arah sebab-akibatnya kebalikan","Data hanya dari kelompok tertentu"]},{"label":"Contoh","values":["Penjualan seragam & iklan naik bersamaan menjelang Ramadan; penyebab utamanya musim acara","Jumlah follower toko berkorelasi dengan curah hujan selama 3 bulan","‘Toko yang memakai aplikasi kasir lebih laris’: mungkin toko laris yang mampu membeli aplikasi","Survei kepuasan hanya diisi pelanggan setia"]},{"label":"Cara mengecek","values":["Bandingkan dalam periode/kelompok yang sama","Uji di data baru","Lihat urutan waktu","Periksa siapa yang tidak ada di data"]}]}
```

Cara paling kuat membuktikan sebab-akibat adalah **eksperimen terkontrol** (A/B test, dibahas di modul terakhir jalur ini). Tanpa itu, gunakan bahasa yang jujur: ‘berkaitan dengan’, ‘bersamaan dengan’, bukan ‘menyebabkan’.

## Data cleaning manual

Data nyata hampir selalu kotor, dan analis menghabiskan banyak waktunya di tahap ini. Masalah yang paling sering ditemui di spreadsheet:

```viz
{"type":"flow","title":"Checklist membersihkan data","caption":"Jangan pernah membersihkan di file asli. Simpan data mentah, kerjakan di salinan, dan catat setiap langkah agar bisa diulang dan diperiksa orang lain.","steps":[{"label":"Duplikat","detail":"Transaksi tercatat dua kali. Data → Remove duplicates (berdasarkan kolom kunci, bukan semua kolom)."},{"label":"Spasi & kapitalisasi","detail":"‘ Kotabaru’, ‘kotabaru’, ‘KOTABARU’ dihitung sebagai 3 kota. Gunakan TRIM + PROPER."},{"label":"Tipe data","detail":"Angka tersimpan sebagai teks (rata kiri, tidak bisa dijumlah); tanggal campur format dd/mm dan mm/dd."},{"label":"Nilai kosong","detail":"Kosong karena belum diisi atau memang nol? Jangan menyamakan. Tandai dan putuskan per kasus."},{"label":"Nilai tidak valid","detail":"qty negatif, harga Rp0, tanggal di masa depan. Gunakan filter atau conditional formatting untuk menemukannya."},{"label":"Konsistensi kategori","detail":"‘XL’, ‘Xl’, ‘extra large’ → satu standar; buat tabel pemetaan dan XLOOKUP."}]}
```

:::latihan
Milestone: ambil data penjualan (dari usaha sendiri/keluarga atau dataset publik), lalu (1) bersihkan mengikuti checklist dan catat setiap langkah, (2) buat pivot table omzet per bulan × produk dan per kota, (3) hitung mean, median, SD, dan IQR qty per transaksi serta identifikasi outlier, (4) tulis 5 insight dalam kalimat bisnis, misalnya ‘60% omzet berasal dari 2 produk’, dan tandai mana yang hanya korelasi.
:::

## Rangkuman

- SUMIFS/COUNTIFS/XLOOKUP + pivot table menjawab sebagian besar pertanyaan awal; data harus berbentuk satu baris per transaksi.
- Median untuk data miring, mean untuk data simetris; selalu laporkan sebaran.
- Lihat histogram dulu; kenali distribusi miring dan bimodal; selidiki outlier sebelum menghapus.
- Korelasi ≠ kausalitas: waspadai confounder, kebetulan, sebab terbalik, dan bias seleksi.
- Bersihkan di salinan, catat langkahnya: duplikat, spasi, tipe, kosong, tidak valid, kategori.
