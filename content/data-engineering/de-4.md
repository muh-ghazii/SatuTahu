---
title: Batch processing dengan Spark
minutes: 55
summary: Ketika data tidak lagi muat di satu mesin, Apache Spark membagi pekerjaan ke banyak mesin. Modul ini membahas RDD versus DataFrame, Spark SQL, partisi dan shuffle yang menentukan performa, strategi join, serta cara menjalankan Spark di cluster dan cloud.
objectives:
  - Menjelaskan arsitektur Spark (driver, executor, lazy evaluation)
  - Menulis transformasi dengan DataFrame API dan Spark SQL
  - Mengenali shuffle dan mengatur partisi
  - Memilih strategi join (broadcast, sort-merge) dan menangani skew
  - Menjalankan job di cluster dan cloud
sources:
  - repo: databricks/LearningSparkV2
    note: Kode buku Learning Spark edisi 2
  - repo: apache/spark
    note: Kode sumber & dokumentasi resmi Spark
quiz:
  - q: "df.filter(...).groupBy(...).agg(...) belum dieksekusi sampai…"
    options: ["Baris kode berikutnya", "Sebuah action dipanggil, mis. .count(), .show(), .write", "Spark dimulai ulang", "Data diunduh"]
    answer: 1
    explain: "Transformasi bersifat lazy; Spark menyusun rencana dan mengoptimasinya saat action."
  - q: "Operasi yang menyebabkan shuffle adalah…"
    options: ["filter", "select", "groupBy dan join (umumnya)", "withColumn"]
    answer: 2
    explain: "Data dengan kunci sama harus dipindah ke partisi yang sama melalui jaringan."
  - q: "Join tabel transaksi 2 miliar baris dengan tabel kota 500 baris paling efisien dengan…"
    options: ["Sort-merge join", "Broadcast join tabel kecil ke semua executor", "Cross join", "Mengumpulkan semuanya ke driver"]
    answer: 1
    explain: "Broadcast menghindari shuffle tabel besar."
  - q: "Satu task berjalan 40 menit sementara task lain 30 detik. Penyebab paling mungkin…"
    options: ["Cluster terlalu besar", "Data skew: satu kunci punya jauh lebih banyak baris", "Parquet rusak", "Terlalu banyak kolom"]
    answer: 1
    explain: "Skew membuat satu partisi jauh lebih besar; solusinya AQE skew join, penanganan kunci null, atau salting."
---

Pandas bekerja di satu mesin dan di dalam memori. Saat data mencapai ratusan GB atau TB, kamu butuh **pemrosesan terdistribusi**. **Apache Spark** adalah mesin pemrosesan data terdistribusi yang paling banyak dipakai, dengan API Python (**PySpark**), SQL, Scala, dan R.

:::tip[Apakah kamu benar-benar butuh Spark?]
Sebelum ke Spark, cek apakah DuckDB atau Polars di satu mesin besar sudah cukup. Banyak dataset ‘big data’ (puluhan GB) diproses lebih cepat dan murah tanpa cluster. Spark bersinar ketika data benar-benar besar atau pipeline sudah berada di ekosistem Spark (Databricks, EMR, Dataproc).
:::

## RDD vs DataFrame

Arsitektur Spark: **driver** menyusun rencana kerja, **executor** di banyak mesin menjalankan **task** pada **partisi** data.

```viz
{"type":"tree","root":{"label":"Driver (SparkSession)","detail":"Menyusun DAG eksekusi, membagi menjadi stage & task","children":[{"label":"Executor 1","detail":"Task pada partisi 1–4, cache di memori"},{"label":"Executor 2","detail":"Task pada partisi 5–8"},{"label":"Executor 3","detail":"Task pada partisi 9–12"}]}}
```

```viz
{"type":"compare","columns":["RDD","DataFrame / Dataset"],"rows":[{"label":"Abstraksi","values":["Koleksi objek terdistribusi, API fungsional (map, reduce)","Tabel dengan skema dan kolom bernama"]},{"label":"Optimasi","values":["Tidak ada — Spark tidak tahu isi fungsi","Catalyst optimizer + Tungsten (codegen)"]},{"label":"Performa Python","values":["Lambat (serialisasi objek Python)","Cepat — eksekusi di JVM"]},{"label":"Kapan dipakai","values":["Kasus sangat khusus / legacy","Hampir selalu"]}]}
```

Konsep kunci: **lazy evaluation**. Transformasi (`filter`, `select`, `groupBy`) hanya membangun rencana; eksekusi terjadi saat **action** (`count`, `show`, `write`). Ini memungkinkan Spark mengoptimasi seluruh rencana, misalnya mendorong filter ke pembacaan Parquet.

```python
from pyspark.sql import SparkSession, functions as F
spark = SparkSession.builder.appName("penjualan").getOrCreate()

orders = spark.read.parquet("s3a://lake/orders/")             # belum membaca apa pun
harian = (orders
    .filter(F.col("status") == "selesai")
    .withColumn("tanggal", F.to_date("created_at"))
    .groupBy("tanggal", "kota")
    .agg(F.sum("nilai").alias("omzet"), F.countDistinct("pelanggan_id").alias("pembeli")))
harian.write.mode("overwrite").partitionBy("tanggal").parquet("s3a://lake/marts/harian/")   # action
```

Hindari **UDF Python** biasa jika fungsi bawaan `F.*` tersedia; UDF memaksa data keluar dari JVM. Jika terpaksa, gunakan **pandas UDF** (vektor, via Arrow).

## Spark SQL

DataFrame dan SQL berbagi optimizer yang sama, jadi pilih yang paling terbaca:

```python
orders.createOrReplaceTempView("orders")
spark.sql("""
    SELECT kota, date_trunc('month', created_at) AS bulan, SUM(nilai) AS omzet,
           SUM(SUM(nilai)) OVER (PARTITION BY kota ORDER BY date_trunc('month', created_at)) AS kumulatif
    FROM orders WHERE status = 'selesai'
    GROUP BY 1, 2
""").show()

harian.explain(mode="formatted")     # lihat rencana fisik: scan, filter pushdown, exchange (shuffle)
```

Biasakan membaca `explain()` dan **Spark UI** (port 4040): durasi stage, jumlah data shuffle, dan task yang lambat adalah petunjuk utama optimasi.

## Partisi & shuffle

Data dibagi menjadi **partisi**; satu partisi diproses satu task di satu core. Operasi seperti `filter` bekerja per partisi (**narrow**). Operasi seperti `groupBy`, `join`, `distinct` membutuhkan semua baris dengan kunci sama berkumpul, sehingga data dipindah lewat jaringan: **shuffle** (**wide**), operasi termahal di Spark.

```viz
{"type":"flow","title":"Narrow vs wide transformation","steps":[{"label":"Stage 1 (narrow)","detail":"read → filter → withColumn, per partisi tanpa pindah data"},{"label":"Shuffle","detail":"Tulis per kunci ke disk, kirim lewat jaringan"},{"label":"Stage 2","detail":"groupBy agregasi per kunci"},{"label":"Tulis","detail":"Output per partisi"}]}
```

Pengaturan praktis:

- `spark.sql.shuffle.partitions` (default 200) — terlalu sedikit untuk data besar (task raksasa), terlalu banyak untuk data kecil (overhead). **Adaptive Query Execution** (AQE, aktif default sejak Spark 3.2) menyesuaikannya otomatis saat runtime.
- Target ukuran partisi sekitar **100–200 MB**.
- `repartition(n, kol)` memicu shuffle penuh; `coalesce(n)` mengurangi partisi tanpa shuffle (berguna sebelum menulis agar tidak menghasilkan ribuan file kecil).
- `cache()` hanya untuk DataFrame yang dipakai ulang beberapa kali.

## Optimasi join

```viz
{"type":"compare","columns":["Strategi","Kapan","Biaya"],"rows":[{"label":"Broadcast hash join","values":["Satu sisi kecil (default < 10 MB, bisa dinaikkan)","Tanpa shuffle sisi besar — tercepat"]},{"label":"Sort-merge join","values":["Kedua sisi besar","Shuffle + sort kedua sisi"]},{"label":"Bucketed join","values":["Tabel sering di-join dengan kunci sama","Shuffle dihemat di muka saat menulis"]}]}
```

```python
from pyspark.sql.functions import broadcast
hasil = transaksi.join(broadcast(dim_kota), "kota_id")
```

**Data skew** terjadi ketika satu kunci (mis. pelanggan ‘umum’/null, atau satu kota besar) memiliki porsi data yang jauh lebih besar, sehingga satu task bekerja jauh lebih lama dari yang lain. Solusi: AQE skew join (`spark.sql.adaptive.skewJoin.enabled`), memfilter atau menangani kunci null secara terpisah, dan **salting** (menambahkan angka acak ke kunci skew agar tersebar ke beberapa partisi). Filter dan pilih kolom **sebelum** join untuk memperkecil data yang di-shuffle.

## Menjalankan Spark di cluster/cloud

```viz
{"type":"layers","layers":[{"label":"Lokal","detail":"master local[*] — belajar & uji dengan sampel.","tag":"pip install pyspark"},{"label":"Cluster manager","detail":"Standalone, YARN, atau Kubernetes mengalokasikan executor.","tag":"spark-submit"},{"label":"Managed","detail":"Databricks, AWS EMR, Google Dataproc (termasuk serverless).","tag":"cloud"}]}
```

```bash
spark-submit --master yarn --deploy-mode cluster \
  --num-executors 10 --executor-cores 4 --executor-memory 8g \
  --conf spark.sql.adaptive.enabled=true \
  jobs/penjualan_harian.py --tanggal 2026-11-19
```

Tips biaya: gunakan **autoscaling** dan **spot/preemptible instance** untuk executor, matikan cluster setelah job batch selesai (job cluster, bukan cluster yang hidup terus), dan simpan data di object storage (S3/GCS) dalam Parquet/Delta/Iceberg sehingga compute bisa dipisah dari storage.

:::latihan
Milestone: proses dataset NYC taxi beberapa tahun (puluhan juta baris) dengan PySpark lokal: baca Parquet, bersihkan, agregasi per hari dan zona, join dengan tabel zona menggunakan broadcast, tulis hasil terpartisi. Bandingkan `explain()` dan waktu eksekusi dengan dan tanpa broadcast serta dengan berbagai `shuffle.partitions`. Bonus: jalankan job yang sama di Dataproc Serverless atau Databricks Free Edition.
:::

## Rangkuman

- Driver merencanakan, executor mengerjakan partisi; transformasi lazy, action memicu eksekusi.
- DataFrame/SQL > RDD karena optimizer; hindari UDF Python biasa.
- Shuffle termahal: atur partisi, manfaatkan AQE, coalesce sebelum menulis.
- Broadcast tabel kecil; tangani skew dengan AQE, pemisahan null, atau salting.
- Cluster: YARN/K8s/managed; hemat dengan autoscaling, spot, dan job cluster.
