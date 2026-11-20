---
title: Data modeling & warehouse
minutes: 50
summary: Cara data disusun di warehouse menentukan seberapa cepat, murah, dan benar setiap pertanyaan dijawab. Modul ini membahas star dan snowflake schema, tabel fakta dan dimensi, slowly changing dimension, penyimpanan kolumnar dengan Parquet, serta partitioning.
objectives:
  - Merancang star schema dari proses bisnis
  - Menentukan grain tabel fakta dan atribut dimensi
  - Menerapkan SCD tipe 1 dan tipe 2
  - Menjelaskan kenapa format kolumnar dan partitioning mempercepat query analitik
sources:
  - repo: andkret/Cookbook
    note: Data Engineering Cookbook (bab modeling & warehouse)
  - repo: duckdb/duckdb
    note: Engine OLAP lokal untuk latihan Parquet
  - repo: DataTalksClub/data-engineering-zoomcamp
    note: Modul data warehouse (BigQuery, partisi, klaster)
quiz:
  - q: "‘Grain’ tabel fakta penjualan sebaiknya…"
    options: ["Ditentukan setelah tabel jadi", "Dinyatakan eksplisit, mis. satu baris per item per pesanan", "Campuran per pesanan dan per hari", "Tidak penting"]
    answer: 1
    explain: "Grain yang campur aduk menyebabkan double counting."
  - q: "Pelanggan pindah dari Banjarmasin ke Kotabaru dan laporan historis harus tetap mencatat penjualan lama di Banjarmasin. Gunakan…"
    options: ["SCD tipe 1 (timpa)", "SCD tipe 2 (baris baru dengan periode berlaku)", "Hapus pelanggan", "Tabel fakta baru"]
    answer: 1
    explain: "Tipe 2 menyimpan riwayat dengan valid_from/valid_to dan surrogate key baru."
  - q: "Query ‘SUM(omzet) WHERE tanggal di Oktober’ pada Parquet yang dipartisi per bulan cepat karena…"
    options: ["Parquet dikompresi ZIP", "Hanya kolom omzet & tanggal dibaca (kolumnar) dan hanya partisi Oktober dipindai (partition pruning)", "Parquet adalah database", "Datanya di-cache"]
    answer: 1
    explain: "Format kolumnar membaca kolom yang diperlukan saja, dan partisi yang tidak cocok filter dilewati."
  - q: "Snowflake schema berbeda dari star schema karena…"
    options: ["Tidak punya tabel fakta", "Dimensinya dinormalisasi menjadi beberapa tabel", "Hanya untuk Snowflake Inc.", "Tidak memakai foreign key"]
    answer: 1
    explain: "Snowflake schema memecah dimensi menjadi tabel-tabel ternormalisasi, misalnya produk → kategori."
---

Pertanyaan bisnis berubah setiap minggu, tetapi proses bisnis (pesanan, pembayaran, pengiriman) relatif stabil. **Data modeling** menyusun data mengikuti proses itu sehingga pertanyaan baru bisa dijawab tanpa membangun ulang pipeline.

## Star & snowflake schema

**Dimensional modeling** (Ralph Kimball) memisahkan **kejadian yang diukur** (fakta) dari **konteks** kejadian itu (dimensi). Hasilnya berbentuk bintang:

```viz
{"type":"tree","root":{"label":"fakta_penjualan (1 baris = 1 item per pesanan)","detail":"qty, harga, diskon, omzet","children":[{"label":"dim_tanggal","detail":"tanggal, bulan, kuartal, hari libur, Ramadan?"},{"label":"dim_produk","detail":"nama, kategori, ukuran, bahan"},{"label":"dim_pelanggan","detail":"nama, kota, segmen, tgl daftar"},{"label":"dim_toko","detail":"cabang, wilayah"},{"label":"dim_kanal","detail":"offline, WhatsApp, marketplace"}]}}
```

- **Star schema**: setiap dimensi satu tabel yang didenormalisasi (kategori langsung di dim_produk). Join sedikit, mudah dipahami, cocok untuk BI.
- **Snowflake schema**: dimensi dinormalisasi (dim_produk → dim_kategori). Hemat penyimpanan, tetapi join lebih banyak.

Di warehouse kolumnar modern, penyimpanan murah dan join mahal, sehingga **star schema** atau bahkan **tabel lebar (OBT)** untuk use case tertentu lebih umum dipakai.

## Fact & dimension

Langkah desain Kimball:

```viz
{"type":"flow","title":"Empat langkah dimensional modeling","steps":[{"label":"Pilih proses bisnis","detail":"Penjualan, pembayaran, stok."},{"label":"Nyatakan grain","detail":"Satu baris = satu item per pesanan. Paling penting!"},{"label":"Tentukan dimensi","detail":"Siapa, apa, kapan, di mana, bagaimana."},{"label":"Tentukan fakta","detail":"Angka yang diukur pada grain itu."}]}
```

Jenis fakta:

- **Additive**: bisa dijumlahkan di semua dimensi (qty, omzet).
- **Semi-additive**: tidak bisa dijumlahkan melintasi waktu (saldo stok, saldo rekening — gunakan nilai akhir periode).
- **Non-additive**: rasio dan persentase; simpan pembilang dan penyebut, hitung rasionya saat query.

Dimensi memakai **surrogate key** (integer buatan warehouse) alih-alih kunci dari sistem sumber, agar tahan terhadap perubahan sistem sumber dan mendukung riwayat. Tabel **dim_tanggal** dibuat sekali dan memuat atribut seperti hari kerja, hari libur nasional, dan periode Ramadan, sehingga analisis musiman cukup dengan join.

```sql
SELECT d.bulan, p.kategori, SUM(f.omzet) AS omzet
FROM fakta_penjualan f
JOIN dim_tanggal d ON f.tanggal_key = d.tanggal_key
JOIN dim_produk  p ON f.produk_key  = p.produk_key
WHERE d.tahun = 2026
GROUP BY 1, 2;
```

## Slowly changing dimension

Atribut dimensi berubah: pelanggan pindah kota, produk pindah kategori. Bagaimana menangani riwayat?

```viz
{"type":"compare","columns":["Tipe","Cara","Dampak historis"],"rows":[{"label":"SCD 0","values":["Tidak pernah diubah","Nilai asli selamanya (mis. tanggal daftar)"]},{"label":"SCD 1","values":["Timpa nilai lama","Laporan lama ikut berubah — riwayat hilang"]},{"label":"SCD 2","values":["Baris baru + valid_from, valid_to, is_current","Fakta lama tetap menunjuk versi lama — riwayat benar"]},{"label":"SCD 3","values":["Kolom ‘nilai_sebelumnya’","Hanya satu perubahan terakhir"]}]}
```

Contoh SCD 2 untuk dim_pelanggan:

```text
pelanggan_key | pelanggan_id | kota         | valid_from | valid_to   | is_current
101           | P-77         | Banjarmasin  | 2024-01-10 | 2026-06-30 | false
245           | P-77         | Kotabaru     | 2026-07-01 | 9999-12-31 | true
```

Fakta penjualan Maret 2025 menunjuk `pelanggan_key = 101`, sehingga omzetnya tetap tercatat di Banjarmasin. dbt menyediakan **snapshots** untuk mengotomasi pola ini (dibahas di modul berikutnya).

## Columnar storage & Parquet

Database aplikasi menyimpan data **per baris**: efisien untuk mengambil satu pesanan lengkap. Query analitik justru membaca **sedikit kolom dari banyak baris**. Penyimpanan **kolumnar** menyimpan setiap kolom berdampingan:

```viz
{"type":"compare","columns":["Row-oriented (CSV, Postgres)","Column-oriented (Parquet, BigQuery)"],"rows":[{"label":"Baca SUM(omzet)","values":["Membaca semua kolom setiap baris","Hanya membaca kolom omzet"]},{"label":"Kompresi","values":["Sedang","Sangat baik — nilai sejenis berdekatan (dictionary, RLE)"]},{"label":"Tulis satu baris","values":["Cepat","Lambat — cocok untuk batch"]},{"label":"Cocok untuk","values":["OLTP","OLAP / analitik"]}]}
```

**Parquet** adalah format kolumnar terbuka yang menyimpan skema, tipe data, dan statistik min/max per blok (**row group**), sehingga engine dapat melewati blok yang tidak relevan (**predicate pushdown**).

```python
import duckdb
duckdb.sql("COPY (SELECT * FROM read_csv_auto('orders.csv')) TO 'orders.parquet' (FORMAT parquet, COMPRESSION zstd)")
duckdb.sql("SELECT kota, SUM(omzet) FROM 'orders.parquet' GROUP BY kota").show()
```

Biasanya file CSV beberapa GB menyusut menjadi sepersekian ukurannya dan query-nya jauh lebih cepat. Format tabel seperti **Apache Iceberg** dan **Delta Lake** menambahkan transaksi ACID, time travel, dan evolusi skema di atas file Parquet.

## Partitioning

**Partitioning** membagi tabel menjadi bagian berdasarkan nilai kolom (biasanya tanggal), sehingga query yang memfilter kolom itu hanya memindai partisi yang relevan (**partition pruning**).

```text
s3://lake/orders/tahun=2026/bulan=10/part-000.parquet
s3://lake/orders/tahun=2026/bulan=11/part-000.parquet
```

```sql
-- BigQuery
CREATE TABLE gudang_data.fakta_penjualan
PARTITION BY DATE(tanggal)
CLUSTER BY kota, produk_id AS SELECT ...;
```

Panduan memilih: partisi pada kolom yang **hampir selalu difilter** dan berkardinalitas sedang (tanggal). Hindari partisi terlalu kecil (jutaan file kecil memperlambat semuanya — **small files problem**). **Clustering/sort** pada kolom filter sekunder membantu pruning di dalam partisi.

:::latihan
Milestone: rancang star schema untuk usaha penjualan (pesanan, item, pelanggan, produk, kanal) dengan grain tertulis; buat dim_tanggal lengkap dengan hari libur nasional; implementasikan SCD 2 untuk dim_pelanggan di DuckDB; ubah data mentah ke Parquet yang dipartisi per bulan dan bandingkan waktu query serta ukuran file dengan CSV.
:::

## Rangkuman

- Star schema: fakta di tengah, dimensi denormalisasi di sekeliling; snowflake menormalisasi dimensi.
- Nyatakan grain dulu; kenali fakta additive, semi-additive, non-additive; pakai surrogate key.
- SCD 2 menjaga riwayat dengan baris baru dan periode berlaku.
- Parquet kolumnar: baca kolom seperlunya, kompresi tinggi, predicate pushdown.
- Partisi pada kolom filter utama; hindari small files; clustering untuk filter sekunder.
