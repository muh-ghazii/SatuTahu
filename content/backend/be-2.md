---
title: Database & SQL untuk backend
minutes: 50
summary: Hampir semua bug serius di backend berujung ke data, entah data yang duplikat, hilang karena race condition, atau query yang membuat server tumbang. Modul ini membahas desain skema, SQL tingkat menengah, index, transaksi, alat akses data, dan kapan memilih NoSQL.
objectives:
  - Merancang skema ternormalisasi dengan ERD
  - Menulis JOIN, agregasi, dan subquery untuk laporan
  - Membaca query plan dan menambahkan index yang tepat
  - Memakai transaksi dengan isolation level yang sesuai serta memilih ORM/NoSQL dengan sadar
sources:
  - repo: enochtangg/quick-SQL-cheatsheet
    note: Rujukan sintaks JOIN, agregasi, dan subquery
  - repo: dhamaniasad/awesome-postgres
    note: Rujukan fitur PostgreSQL, index, dan tuning
  - repo: prisma/prisma-examples
    note: Contoh pola akses data dengan ORM
quiz:
  - q: "Query lambat: SELECT * FROM pesanan WHERE pelanggan_id = 42. Tabel berisi 5 juta baris. Langkah pertama?"
    options: ["Tambah RAM server", "Jalankan EXPLAIN dan pertimbangkan index pada pelanggan_id", "Ganti ke NoSQL", "Hapus data lama"]
    answer: 1
    explain: "Tanpa index, database memindai seluruh tabel (sequential scan). Index B-tree membuat pencarian menjadi O(log n)."
  - q: "Kenapa index tidak dipasang di semua kolom?"
    options: ["Index membuat SELECT lambat", "Setiap index memperlambat INSERT/UPDATE dan memakan ruang", "Index hanya boleh satu per tabel", "SQL tidak mengizinkan"]
    answer: 1
    explain: "Setiap perubahan data harus memperbarui semua index terkait. Pasang index sesuai pola query yang nyata."
  - q: "Dua pembeli membeli stok terakhir bersamaan dan keduanya berhasil. Masalah ini disebut…"
    options: ["Deadlock", "Race condition / lost update", "SQL injection", "Normalisasi"]
    answer: 1
    explain: "Solusinya: UPDATE ... SET stok = stok - 1 WHERE id = ? AND stok > 0 (atomik), atau SELECT ... FOR UPDATE di dalam transaksi."
  - q: "WHERE vs HAVING: mana yang memfilter hasil SETELAH GROUP BY?"
    options: ["WHERE", "HAVING", "Keduanya sama", "ORDER BY"]
    answer: 1
    explain: "WHERE menyaring baris sebelum dikelompokkan; HAVING menyaring kelompok setelah agregasi, mis. HAVING SUM(total) > 1000000."
---

Database bukan sekadar ‘tempat menyimpan’. Ia adalah sistem yang menjamin data tetap benar ketika ratusan request datang bersamaan, server mati mendadak, atau ada bug di kode aplikasi. Backend developer yang memahami database dengan baik menulis lebih sedikit kode dan menghasilkan sistem yang jauh lebih andal.

Contoh di modul ini memakai **PostgreSQL**, database open source yang paling banyak direkomendasikan untuk aplikasi baru. Jalankan cepat dengan Docker: `docker run -e POSTGRES_PASSWORD=rahasia -p 5432:5432 postgres:17`.

## Normalisasi & ERD

**ERD** (*Entity Relationship Diagram*) memetakan entitas dan hubungannya sebelum tabel dibuat. Tiga jenis relasi:

- **One-to-one**: pengguna ↔ profil.
- **One-to-many**: pelanggan → banyak pesanan (FK di sisi ‘many’).
- **Many-to-many**: pesanan ↔ produk, diwujudkan lewat tabel penghubung `item_pesanan`.

```viz
{"type":"tree","title":"ERD toko online","caption":"Harga disalin ke item_pesanan dengan sengaja: harga produk bisa berubah besok, tetapi pesanan lama harus mencatat harga saat transaksi. Ini bukan duplikasi, melainkan fakta yang berbeda.","root":{"label":"toko","detail":"Skema untuk milestone tahap ini.","children":[{"label":"pelanggan (id PK, nama, email UNIQUE, dibuat_pada)","detail":"Satu pelanggan → banyak pesanan."},{"label":"produk (id PK, nama, harga, stok CHECK ≥ 0)","detail":"Katalog produk dengan stok terkini."},{"label":"pesanan (id PK, pelanggan_id FK, status, dibuat_pada)","detail":"Header transaksi. status: baru | dibayar | dikirim | selesai | batal."},{"label":"item_pesanan (pesanan_id FK, produk_id FK, qty, harga_saat_beli)","detail":"Tabel penghubung many-to-many. PK gabungan (pesanan_id, produk_id)."}]}}
```

**Normalisasi** menghilangkan redundansi agar setiap fakta tersimpan di satu tempat. Ringkasnya: (1NF) setiap sel berisi satu nilai, bukan daftar; (2NF) setiap kolom bergantung pada seluruh primary key; (3NF) kolom non-kunci tidak bergantung pada kolom non-kunci lain (mis. `kota_pelanggan` tidak disimpan di tabel pesanan). Untuk laporan berat, kadang sengaja dilakukan **denormalisasi** demi kecepatan baca, asalkan disadari trade-off-nya.

## SQL: JOIN, agregasi, subquery

```viz
{"type":"sql-join"}
```

Query laporan nyata menggabungkan semuanya:

```sql
-- Omzet per produk bulan ini, hanya produk dengan omzet > 1 juta
SELECT p.nama,
       SUM(i.qty)                     AS terjual,
       SUM(i.qty * i.harga_saat_beli) AS omzet
FROM item_pesanan i
JOIN pesanan  o ON o.id = i.pesanan_id
JOIN produk   p ON p.id = i.produk_id
WHERE o.status IN ('dibayar', 'dikirim', 'selesai')
  AND o.dibuat_pada >= date_trunc('month', now())
GROUP BY p.nama
HAVING SUM(i.qty * i.harga_saat_beli) > 1000000
ORDER BY omzet DESC;

-- Subquery: pelanggan yang belum pernah memesan
SELECT nama FROM pelanggan
WHERE id NOT IN (SELECT pelanggan_id FROM pesanan WHERE pelanggan_id IS NOT NULL);

-- CTE (WITH) membuat query panjang lebih terbaca
WITH belanja AS (
  SELECT pelanggan_id, SUM(i.qty * i.harga_saat_beli) AS total
  FROM pesanan o JOIN item_pesanan i ON i.pesanan_id = o.id
  GROUP BY pelanggan_id
)
SELECT c.nama, b.total FROM belanja b JOIN pelanggan c ON c.id = b.pelanggan_id
ORDER BY b.total DESC LIMIT 10;
```

:::warning[Jebakan NOT IN dan NULL]
Jika subquery `NOT IN` mengembalikan satu saja nilai `NULL`, hasilnya kosong. Itulah sebabnya contoh di atas menyaring `IS NOT NULL`. Alternatif yang lebih aman: `NOT EXISTS` atau `LEFT JOIN ... WHERE x IS NULL`.
:::

## Index & query plan

Tanpa index, mencari `WHERE email = '...'` berarti memeriksa seluruh tabel (**sequential scan**), O(n). **Index B-tree** adalah pohon seimbang yang disimpan terpisah, sehingga pencarian menjadi O(log n), seperti BST yang bisa kamu coba di bawah ini (database memakai varian dengan banyak anak per node agar pohonnya lebih pendek).

```viz
{"type":"bst"}
```

```sql
EXPLAIN ANALYZE SELECT * FROM pesanan WHERE pelanggan_id = 42;
-- Seq Scan on pesanan  (actual time=0.02..412.7 ms rows=31)   ← lambat

CREATE INDEX idx_pesanan_pelanggan ON pesanan (pelanggan_id);

EXPLAIN ANALYZE SELECT * FROM pesanan WHERE pelanggan_id = 42;
-- Index Scan using idx_pesanan_pelanggan  (actual time=0.03..0.09 ms)
```

Panduan memasang index:

- Kolom yang sering ada di `WHERE`, `JOIN ... ON`, dan `ORDER BY`. Foreign key hampir selalu butuh index.
- **Index gabungan** `(status, dibuat_pada)` membantu query yang memfilter keduanya. Urutan kolom penting: kolom yang dibandingkan dengan `=` diletakkan lebih dulu.
- Index tidak gratis: memperlambat tulis dan memakan disk. Ukur dulu dengan `EXPLAIN ANALYZE`, jangan menebak.
- Waspadai **N+1 query**: mengambil 100 pesanan lalu 100 kali query terpisah untuk pelanggannya. Gunakan JOIN atau fitur *include/eager loading* ORM.

## Transaksi & isolation level

**Transaksi** mengelompokkan beberapa perintah agar memenuhi **ACID**: *Atomic* (semua atau tidak sama sekali), *Consistent* (aturan/constraint terjaga), *Isolated* (transaksi bersamaan tidak saling mengacaukan), *Durable* (yang sudah commit tidak hilang walau server mati).

```sql
BEGIN;
  -- kurangi stok hanya jika masih ada: atomik, aman dari race condition
  UPDATE produk SET stok = stok - 2 WHERE id = 7 AND stok >= 2;
  -- (di aplikasi: jika baris terpengaruh = 0 → ROLLBACK, stok habis)
  INSERT INTO pesanan (pelanggan_id, status) VALUES (42, 'baru') RETURNING id;
  INSERT INTO item_pesanan VALUES (981, 7, 2, 150000);
COMMIT;
```

Isolation level menentukan seberapa ‘terisolasi’ transaksi dari transaksi lain yang berjalan bersamaan:

```viz
{"type":"compare","title":"Isolation level & anomali yang dicegah","caption":"PostgreSQL defaultnya Read Committed. Level lebih tinggi lebih aman tetapi bisa membuat transaksi gagal dan harus diulang (serialization failure).","columns":["Read Committed","Repeatable Read","Serializable"],"rows":[{"label":"Dirty read","values":["Dicegah","Dicegah","Dicegah"]},{"label":"Non-repeatable read","values":["Bisa terjadi","Dicegah","Dicegah"]},{"label":"Phantom read","values":["Bisa terjadi","Dicegah di PostgreSQL","Dicegah"]},{"label":"Anomali serialisasi","values":["Bisa terjadi","Bisa terjadi","Dicegah"]},{"label":"Kapan dipakai","values":["Default, sebagian besar CRUD","Laporan yang butuh snapshot konsisten","Logika uang/stok yang kompleks"]}]}
```

## ORM vs query builder

Ada tiga cara mengakses database dari kode:

| Pendekatan | Contoh | Kelebihan | Kekurangan |
|---|---|---|---|
| SQL mentah (parameterized) | `pg`, `database/sql`, `psycopg` | kontrol penuh, performa jelas | banyak kode berulang, tanpa type safety |
| Query builder | Knex, Kysely, Drizzle, sqlc | SQL tetap terlihat, type-safe | tetap harus paham SQL |
| ORM | Prisma, TypeORM, GORM, SQLAlchemy, Django ORM | cepat untuk CRUD, migrasi bawaan | query kompleks bisa tidak efisien, ‘magic’ tersembunyi |

```ts
// Prisma: ambil pesanan + pelanggan + item dalam satu panggilan (menghindari N+1)
const pesanan = await prisma.pesanan.findMany({
  where: { status: "dibayar" },
  include: { pelanggan: true, item: { include: { produk: true } } },
  orderBy: { dibuatPada: "desc" },
  take: 20,
});
```

Apa pun pilihannya, gunakan **migrasi** (perubahan skema yang tercatat dalam file dan di-commit) agar skema di laptop, staging, dan produksi selalu sama. ORM mempercepat pekerjaan, tetapi **tidak menggantikan pemahaman SQL**; saat performa bermasalah, kamu tetap harus membaca query yang dihasilkannya.

## NoSQL: kapan dipakai

‘NoSQL’ adalah payung untuk database non-relasional dengan model data berbeda:

```viz
{"type":"compare","title":"Jenis database NoSQL","columns":["Document","Key-value","Wide-column","Graph"],"rows":[{"label":"Contoh","values":["MongoDB, Firestore","Redis, DynamoDB","Cassandra, ScyllaDB","Neo4j"]},{"label":"Model","values":["Dokumen JSON bersarang","Kunci → nilai","Baris dengan kolom dinamis, dipartisi","Simpul & relasi"]},{"label":"Unggul untuk","values":["Skema fleksibel, data hierarkis","Cache, session, counter, antrean","Tulis masif terdistribusi (log, IoT)","Relasi berlapis: rekomendasi, fraud"]},{"label":"Kelemahan","values":["JOIN & transaksi lintas dokumen terbatas","Query selain berdasarkan kunci sulit","Pola query harus dirancang di awal","Kurang cocok untuk agregasi tabular"]}]}
```

Panduan praktis: **mulailah dengan PostgreSQL** untuk data bisnis inti (pengguna, transaksi, stok). Ia sudah mendukung kolom `JSONB` untuk data semi-terstruktur. Tambahkan NoSQL untuk kebutuhan spesifik yang terukur, misalnya **Redis** sebagai cache dan rate limiter, bukan karena tren.

:::latihan
Milestone: buat skema toko online di PostgreSQL sesuai ERD di atas (dengan constraint `CHECK`, `UNIQUE`, `FOREIGN KEY`). Isi data dummy (mis. 10.000 pesanan lewat `generate_series`). Tulis 15 query laporan: produk terlaris, omzet per bulan, pelanggan teratas, rata-rata nilai pesanan. Ukur 3 query paling lambat dengan `EXPLAIN ANALYZE`, tambahkan index, lalu bandingkan waktunya.
:::

## Rangkuman

- Rancang ERD dulu; normalisasi sampai 3NF, denormalisasi hanya dengan alasan terukur.
- JOIN menggabungkan tabel, GROUP BY + HAVING untuk agregasi, CTE untuk keterbacaan; waspadai `NOT IN` + NULL.
- Index B-tree mengubah O(n) menjadi O(log n), tetapi memperlambat tulis; ukur dengan `EXPLAIN ANALYZE` dan hindari N+1.
- Transaksi ACID + update atomik mencegah race condition; pahami isolation level.
- Pilih alat akses data dengan sadar; PostgreSQL dulu, NoSQL untuk kebutuhan spesifik.
