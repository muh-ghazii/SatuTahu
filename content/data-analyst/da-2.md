---
title: SQL untuk analisis
minutes: 45
summary: SQL adalah bahasa yang paling sering diminta di lowongan data analyst, karena data perusahaan tinggal di database. Modul ini fokus pada SQL dari sudut pandang analisis, yaitu menyaring dan mengelompokkan, menggabungkan banyak tabel, window function untuk peringkat dan tren, CTE agar query tetap terbaca, serta menghitung metrik bisnis seperti retensi dan cohort.
objectives:
  - Menulis query agregasi dengan WHERE, GROUP BY, dan HAVING
  - Menggabungkan beberapa tabel dengan JOIN yang tepat
  - Memakai window function untuk ranking, running total, dan perbandingan periode
  - Menyusun query bertahap dengan CTE untuk metrik retensi dan cohort
sources:
  - repo: enochtangg/quick-SQL-cheatsheet
    note: Rujukan sintaks query analisis
  - repo: duckdb/duckdb
    note: Database analitik lokal untuk menjalankan contoh pada file CSV/Parquet
  - repo: awesomedata/awesome-public-datasets
    note: Sumber dataset publik untuk latihan
quiz:
  - q: "Perbedaan GROUP BY dan window function (OVER) adalah…"
    options: ["Tidak ada", "GROUP BY meringkas banyak baris menjadi satu per kelompok; window function menghitung per kelompok tetapi tetap mempertahankan setiap baris", "Window function hanya untuk tanggal", "GROUP BY lebih modern"]
    answer: 1
    explain: "Contoh: menampilkan setiap transaksi beserta total omzet kota-nya membutuhkan SUM(...) OVER (PARTITION BY kota)."
  - q: "Fungsi untuk mengambil nilai bulan sebelumnya dalam urutan waktu adalah…"
    options: ["LEAD", "LAG", "RANK", "NTILE"]
    answer: 1
    explain: "LAG(omzet) OVER (ORDER BY bulan) mengambil baris sebelumnya, cocok untuk pertumbuhan month-over-month."
  - q: "Retensi bulan ke-1 untuk cohort Januari dihitung sebagai…"
    options: ["Pelanggan Januari ÷ semua pelanggan", "Pelanggan pertama kali beli di Januari yang beli lagi di Februari ÷ total pelanggan cohort Januari", "Omzet Februari ÷ omzet Januari", "Jumlah transaksi Februari"]
    answer: 1
    explain: "Cohort dikelompokkan berdasarkan waktu pertama kali beli, lalu dilacak berapa persen yang kembali di periode berikutnya."
  - q: "Kenapa COUNT(DISTINCT pelanggan_id) berbeda dari COUNT(*)?"
    options: ["Sama saja", "COUNT(*) menghitung baris/transaksi, COUNT(DISTINCT ...) menghitung pelanggan unik", "COUNT(*) mengabaikan NULL", "DISTINCT lebih cepat"]
    answer: 1
    explain: "Salah memilih antara jumlah transaksi dan jumlah pelanggan unik adalah kesalahan pelaporan yang sangat umum."
---

Spreadsheet mulai kewalahan di ratusan ribu baris, sedangkan data perusahaan bisa jutaan baris dan tersimpan di database. **SQL** memungkinkanmu bertanya langsung ke data itu. Kabar baiknya: untuk analisis, kamu hanya perlu membaca data (`SELECT`), bukan mengubahnya.

Untuk latihan tanpa server, gunakan **DuckDB**: database analitik yang bisa langsung membaca file CSV/Parquet. Jalankan di terminal (`duckdb`) atau dari Python (`pip install duckdb`).

```sql
-- DuckDB bisa query file CSV langsung, tanpa import
CREATE TABLE penjualan AS SELECT * FROM 'penjualan.csv';
DESCRIBE penjualan;
```

## SELECT, WHERE, GROUP BY

Urutan menulis dan urutan **eksekusi** SQL berbeda, dan memahaminya mencegah banyak error:

```viz
{"type":"flow","title":"Urutan eksekusi query SQL","caption":"Itulah sebabnya alias dari SELECT tidak bisa dipakai di WHERE, tetapi boleh di ORDER BY.","steps":[{"label":"FROM / JOIN","detail":"Tentukan tabel sumber dan gabungkan."},{"label":"WHERE","detail":"Saring BARIS sebelum dikelompokkan."},{"label":"GROUP BY","detail":"Kelompokkan baris berdasarkan kolom."},{"label":"HAVING","detail":"Saring KELOMPOK setelah agregasi."},{"label":"SELECT","detail":"Hitung kolom & agregasi, beri alias."},{"label":"ORDER BY / LIMIT","detail":"Urutkan dan batasi hasil."}]}
```

```sql
SELECT
  produk,
  COUNT(*)                         AS jumlah_transaksi,
  COUNT(DISTINCT pelanggan_id)     AS pelanggan_unik,
  SUM(qty * harga_satuan)          AS omzet,
  ROUND(AVG(qty * harga_satuan))   AS rata_nilai_transaksi
FROM penjualan
WHERE tanggal >= DATE '2026-01-01'
  AND status <> 'batal'
GROUP BY produk
HAVING SUM(qty * harga_satuan) > 5000000
ORDER BY omzet DESC;
```

```viz
{"type":"groupby"}
```

Kesalahan umum analyst pemula: membandingkan dengan `= NULL` (harus `IS NULL`), lupa mengecualikan transaksi batal/retur, dan menjumlahkan kolom yang sudah merupakan total.

## JOIN multi-tabel

Data biasanya tersebar: `penjualan` (transaksi), `pelanggan` (profil), `produk` (kategori & harga modal). JOIN menyatukannya.

```viz
{"type":"sql-join"}
```

```sql
-- Margin per kategori produk dan per kota pelanggan
SELECT
  pr.kategori,
  pl.kota,
  SUM(p.qty * p.harga_satuan)                          AS omzet,
  SUM(p.qty * (p.harga_satuan - pr.harga_modal))       AS laba_kotor
FROM penjualan p
JOIN produk    pr ON pr.id = p.produk_id
LEFT JOIN pelanggan pl ON pl.id = p.pelanggan_id      -- LEFT: transaksi tanpa data pelanggan tetap dihitung
GROUP BY pr.kategori, pl.kota
ORDER BY laba_kotor DESC;
```

:::warning[Baris berlipat setelah JOIN]
Jika satu pesanan punya banyak item dan kamu JOIN ke tabel item lalu menjumlahkan `ongkir` dari tabel pesanan, ongkir terhitung berkali-kali. Selalu periksa jumlah baris sebelum dan sesudah JOIN, dan pahami **grain** (satu baris mewakili apa) setiap tabel.
:::

## Window function

**Window function** menghitung sesuatu ‘di atas sekelompok baris’ tanpa meringkasnya menjadi satu. Ini senjata utama analyst untuk ranking, persentase, running total, dan perbandingan antar periode.

```sql
-- Omzet bulanan + pertumbuhan dari bulan sebelumnya + total berjalan
WITH bulanan AS (
  SELECT date_trunc('month', tanggal) AS bulan, SUM(qty * harga_satuan) AS omzet
  FROM penjualan GROUP BY 1
)
SELECT
  bulan,
  omzet,
  LAG(omzet) OVER (ORDER BY bulan)                                   AS omzet_bulan_lalu,
  ROUND(100.0 * (omzet - LAG(omzet) OVER (ORDER BY bulan))
        / LAG(omzet) OVER (ORDER BY bulan), 1)                      AS growth_pct,
  SUM(omzet) OVER (ORDER BY bulan)                                   AS omzet_kumulatif,
  AVG(omzet) OVER (ORDER BY bulan ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rata_bergerak_3bln
FROM bulanan
ORDER BY bulan;

-- 3 produk terlaris di SETIAP kota
SELECT * FROM (
  SELECT kota, produk, SUM(qty) AS terjual,
         RANK() OVER (PARTITION BY kota ORDER BY SUM(qty) DESC) AS peringkat
  FROM penjualan GROUP BY kota, produk
) WHERE peringkat <= 3;
```

| Fungsi | Kegunaan |
|---|---|
| `ROW_NUMBER()` / `RANK()` / `DENSE_RANK()` | peringkat (beda perlakuan nilai seri) |
| `LAG()` / `LEAD()` | nilai baris sebelum/sesudah |
| `SUM() OVER (ORDER BY …)` | running total |
| `AVG() OVER (ROWS BETWEEN …)` | rata-rata bergerak |
| `x / SUM(x) OVER (PARTITION BY …)` | kontribusi % dalam kelompok |

## CTE

**CTE** (`WITH ... AS`) memecah query panjang menjadi langkah-langkah bernama yang bisa dibaca dari atas ke bawah, seperti resep. Analisis yang kompleks hampir selalu ditulis dengan CTE berantai.

```sql
WITH
transaksi_valid AS (
  SELECT * FROM penjualan WHERE status = 'selesai'
),
per_pelanggan AS (
  SELECT pelanggan_id, COUNT(*) AS frekuensi, SUM(qty * harga_satuan) AS total_belanja
  FROM transaksi_valid GROUP BY pelanggan_id
)
SELECT
  CASE WHEN frekuensi >= 5 THEN 'loyal' WHEN frekuensi >= 2 THEN 'kembali' ELSE 'sekali' END AS segmen,
  COUNT(*)                AS jumlah_pelanggan,
  SUM(total_belanja)      AS omzet
FROM per_pelanggan
GROUP BY segmen;
```

## Query untuk metrik bisnis (retensi, cohort)

**Cohort analysis** mengelompokkan pelanggan berdasarkan **kapan pertama kali mereka membeli**, lalu melacak berapa persen yang kembali di bulan-bulan berikutnya. Ini menjawab pertanyaan penting: apakah pelanggan baru kita bertahan?

```sql
WITH pertama AS (
  SELECT pelanggan_id, MIN(date_trunc('month', tanggal)) AS cohort
  FROM penjualan GROUP BY pelanggan_id
),
aktivitas AS (
  SELECT DISTINCT p.pelanggan_id, f.cohort,
         date_diff('month', f.cohort, date_trunc('month', p.tanggal)) AS bulan_ke
  FROM penjualan p JOIN pertama f USING (pelanggan_id)
)
SELECT cohort,
       COUNT(*) FILTER (WHERE bulan_ke = 0)                                        AS pelanggan_baru,
       ROUND(100.0 * COUNT(*) FILTER (WHERE bulan_ke = 1) / COUNT(*) FILTER (WHERE bulan_ke = 0), 1) AS retensi_b1,
       ROUND(100.0 * COUNT(*) FILTER (WHERE bulan_ke = 2) / COUNT(*) FILTER (WHERE bulan_ke = 0), 1) AS retensi_b2,
       ROUND(100.0 * COUNT(*) FILTER (WHERE bulan_ke = 3) / COUNT(*) FILTER (WHERE bulan_ke = 0), 1) AS retensi_b3
FROM aktivitas
GROUP BY cohort ORDER BY cohort;
```

Hasilnya biasanya divisualkan sebagai **tabel segitiga** (heatmap): baris = cohort, kolom = bulan ke-n. Jika cohort yang lebih baru punya retensi lebih tinggi, perubahan yang kamu lakukan (mis. program member) kemungkinan berdampak, tetapi tetap periksa faktor musiman.

Metrik bisnis lain yang sering diminta: **AOV** (rata-rata nilai pesanan), **repeat purchase rate**, **churn**, **customer lifetime value** sederhana, dan **konversi funnel** (lihat → tambah ke keranjang → bayar).

:::latihan
Milestone: dengan DuckDB pada dataset penjualan (milikmu atau publik, mis. dataset e-commerce dari awesome-public-datasets), tulis 15 query: 5 agregasi dasar, 3 JOIN, 4 window function (growth MoM, top-N per kategori, running total, kontribusi %), dan tabel cohort retensi 3 bulan. Simpan semuanya di file `.sql` dengan komentar yang menjelaskan pertanyaan bisnis setiap query.
:::

## Rangkuman

- Urutan eksekusi: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.
- Pahami grain setiap tabel sebelum JOIN; periksa jumlah baris sesudahnya.
- Window function untuk ranking, LAG/LEAD, running total, rata-rata bergerak, dan kontribusi %.
- CTE membuat analisis kompleks terbaca langkah demi langkah.
- Cohort & retensi menjawab ‘apakah pelanggan bertahan?’; bedakan transaksi dan pelanggan unik.
