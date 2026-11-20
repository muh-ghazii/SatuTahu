---
title: Streaming & platform data
minutes: 50
summary: Banyak keputusan tidak bisa menunggu batch esok pagi, misalnya deteksi penipuan, stok real-time, atau notifikasi. Modul ini membahas Kafka (topic, partition, consumer group), stream processing, Change Data Capture, monitoring pipeline, dan persiapan wawancara data engineer.
objectives:
  - Menjelaskan model log Kafka dan bagaimana partisi menentukan paralelisme dan urutan
  - Memahami windowing, event time, dan watermark dalam stream processing
  - Menangkap perubahan database dengan CDC
  - Memantau pipeline dengan metrik, alert, dan observability data
  - Menyiapkan diri untuk wawancara DE
sources:
  - repo: DataTalksClub/data-engineering-zoomcamp
    note: Modul streaming (Kafka, stream processing)
  - repo: igorbarinov/awesome-data-engineering
    note: Peta alat platform data
  - repo: OBenner/data-engineering-interview-questions
    note: Bank pertanyaan wawancara data engineer
quiz:
  - q: "Urutan pesan di Kafka dijamin…"
    options: ["Di seluruh topic", "Di dalam satu partisi", "Tidak pernah", "Hanya untuk consumer pertama"]
    answer: 1
    explain: "Karena itu pesan dengan kunci yang sama (mis. order_id) dikirim ke partisi yang sama."
  - q: "Topic punya 6 partisi dan consumer group punya 8 consumer. Berapa consumer yang aktif?"
    options: ["8", "6 — dua sisanya menganggur", "1", "14"]
    answer: 1
    explain: "Satu partisi hanya dibaca satu consumer dalam satu group."
  - q: "Watermark dalam stream processing berfungsi untuk…"
    options: ["Menandai data rahasia", "Memutuskan seberapa lama menunggu event terlambat sebelum window ditutup", "Mengompresi pesan", "Mengenkripsi stream"]
    answer: 1
    explain: "Watermark menyeimbangkan kelengkapan (menunggu event terlambat) dengan latensi dan ukuran state."
  - q: "Keunggulan CDC berbasis log (mis. Debezium) dibanding query ‘WHERE updated_at > X’…"
    options: ["Lebih mudah dipasang", "Menangkap semua perubahan termasuk DELETE tanpa membebani tabel dengan query berulang", "Tidak butuh database", "Selalu batch"]
    answer: 1
    explain: "CDC berbasis log membaca WAL/binlog sehingga semua perubahan, termasuk DELETE, tertangkap dengan beban rendah."
---

Batch menjawab "apa yang terjadi kemarin". **Streaming** menjawab "apa yang terjadi sekarang". Tetapi streaming juga lebih kompleks dan mahal untuk dioperasikan; gunakan ketika latensi benar-benar bernilai bisnis, bukan karena terdengar modern.

## Kafka: topic, partition, consumer group

**Apache Kafka** adalah **log terdistribusi**: pesan ditambahkan ke ujung log dan disimpan selama periode retensi, sehingga banyak konsumen bisa membaca secara independen, bahkan memutar ulang dari awal.

```viz
{"type":"tree","root":{"label":"Topic: orders","detail":"Log append-only, retensi mis. 7 hari","children":[{"label":"Partition 0","detail":"offset 0,1,2,… — urutan dijamin di sini","children":[{"label":"Consumer A (group analitik)"}]},{"label":"Partition 1","children":[{"label":"Consumer B (group analitik)"}]},{"label":"Partition 2","children":[{"label":"Consumer B (group analitik)"}]}]}}
```

- **Producer** menulis pesan; **kunci** pesan menentukan partisi (hash(key) % jumlah partisi), sehingga semua event satu order_id berurutan di partisi yang sama.
- **Partisi** = unit paralelisme dan urutan. Jumlah partisi membatasi jumlah consumer aktif per group.
- **Consumer group**: setiap partisi dibaca tepat satu consumer di dalam group; group berbeda membaca secara independen (analitik, notifikasi, fraud).
- **Offset**: posisi baca yang di-commit consumer; setelah crash, consumer melanjutkan dari offset terakhir.
- **Replikasi**: setiap partisi direplikasi ke beberapa broker untuk ketahanan.

```python
from confluent_kafka import Producer, Consumer
import json

p = Producer({"bootstrap.servers": "localhost:9092", "enable.idempotence": True})
p.produce("orders", key="ORD-1029", value=json.dumps({"order_id": "ORD-1029", "nilai": 450000}))
p.flush()

c = Consumer({"bootstrap.servers": "localhost:9092", "group.id": "analitik",
              "auto.offset.reset": "earliest", "enable.auto.commit": False})
c.subscribe(["orders"])
while True:
    msg = c.poll(1.0)
    if msg is None or msg.error():
        continue
    proses(json.loads(msg.value()))
    c.commit(msg)            # commit SETELAH berhasil diproses → at-least-once
```

**Semantik pengiriman**: at-most-once (bisa hilang), **at-least-once** (bisa duplikat — paling umum, jadi konsumen harus idempoten), dan exactly-once (dengan transaksi Kafka, dalam batas tertentu).

## Stream processing

Memproses aliran tanpa akhir membutuhkan konsep yang tidak ada di batch:

```viz
{"type":"compare","columns":["Konsep","Arti"],"rows":[{"label":"Event time vs processing time","values":["Waktu kejadian sebenarnya vs waktu event tiba di sistem — bisa berbeda menit/jam (sinyal HP hilang)."]},{"label":"Tumbling window","values":["Jendela tetap tanpa tumpang tindih: omzet per 5 menit."]},{"label":"Sliding/hopping window","values":["Jendela tumpang tindih: transaksi 10 menit terakhir, diperbarui tiap menit."]},{"label":"Session window","values":["Dikelompokkan oleh jeda aktivitas: satu sesi belanja."]},{"label":"Watermark","values":["Batas toleransi keterlambatan; setelah lewat, window ditutup dan event terlambat diabaikan/ditangani khusus."]},{"label":"State","values":["Hitungan berjalan yang harus disimpan & dipulihkan saat gagal (checkpoint)."]}]}
```

Contoh Spark Structured Streaming:

```python
events = (spark.readStream.format("kafka")
          .option("kafka.bootstrap.servers", "broker:9092").option("subscribe", "orders").load()
          .select(F.from_json(F.col("value").cast("string"), skema).alias("e")).select("e.*"))

per5menit = (events
    .withWatermark("event_time", "10 minutes")
    .groupBy(F.window("event_time", "5 minutes"), "kota")
    .agg(F.sum("nilai").alias("omzet")))

(per5menit.writeStream.outputMode("append").format("delta")
    .option("checkpointLocation", "s3a://lake/_chk/per5menit").start("s3a://lake/rt/omzet"))
```

Alat lain: **Apache Flink** (latensi sangat rendah, state besar), **Kafka Streams** (library Java), dan **RisingWave/Materialize** (streaming dengan SQL).

## Change Data Capture

**CDC** menangkap setiap INSERT, UPDATE, DELETE dari database aplikasi dan mengalirkannya sebagai event, tanpa membebani database dengan query berulang.

```viz
{"type":"flow","title":"Pipeline CDC berbasis log","steps":[{"label":"Postgres/MySQL","detail":"Aplikasi menulis seperti biasa; perubahan tercatat di WAL/binlog."},{"label":"Debezium","detail":"Membaca log replikasi, mengubah tiap perubahan menjadi event before/after."},{"label":"Kafka","detail":"Satu topic per tabel."},{"label":"Sink","detail":"Lake (Iceberg/Delta), warehouse, cache, atau search index."}]}
```

```viz
{"type":"compare","columns":["Query-based (updated_at)","Log-based (Debezium)"],"rows":[{"label":"DELETE","values":["Tidak tertangkap","Tertangkap"]},{"label":"Perubahan antar polling","values":["Hanya keadaan terakhir","Setiap perubahan"]},{"label":"Beban database","values":["Query berulang","Rendah — membaca log"]},{"label":"Kompleksitas","values":["Sederhana","Butuh izin replikasi & operasi Kafka"]}]}
```

Tantangan CDC: **evolusi skema** (kolom ditambah/diubah), **snapshot awal** tabel besar, dan **urutan & duplikat** (gunakan kunci primer dan MERGE di sisi tujuan).

## Monitoring pipeline

Pipeline yang tidak dipantau akan gagal diam-diam. Pantau dua lapisan:

```viz
{"type":"layers","layers":[{"label":"Infrastruktur & job","detail":"Status run, durasi, retry, penggunaan CPU/memori, consumer lag Kafka.","tag":"Prometheus/Grafana"},{"label":"Data","detail":"Freshness, volume (jumlah baris vs normal), skema berubah, distribusi nilai, test gagal.","tag":"data observability"},{"label":"Bisnis","detail":"KPI tiba-tiba nol atau melonjak di dashboard.","tag":"anomaly alert"}]}
```

Prinsip alert yang baik: **actionable** (ada yang harus dilakukan), dikirim ke **pemilik yang jelas**, dengan **runbook** singkat (apa cek pertama, cara rerun). Terlalu banyak alert yang tidak penting membuat alert penting diabaikan (**alert fatigue**). Untuk Kafka, metrik terpenting adalah **consumer lag**: selisih offset terbaru dengan offset yang sudah diproses.

## Wawancara DE

Wawancara data engineer biasanya terdiri dari: **SQL** (window, dedup, SCD, query optimasi), **coding Python** (manipulasi data, struktur data dasar), **data modeling** (rancang skema untuk sebuah bisnis), **system design** pipeline, dan **behavioral**.

```viz
{"type":"flow","title":"Kerangka menjawab system design pipeline","steps":[{"label":"Kebutuhan","detail":"Volume, latensi (batch/streaming), konsumen data, SLA, kualitas."},{"label":"Ingest","detail":"API/CDC/event; batch atau stream; skema & kontrak."},{"label":"Storage","detail":"Lake (Parquet + Iceberg/Delta) vs warehouse; partisi."},{"label":"Proses","detail":"dbt/Spark/Flink; idempoten; backfill."},{"label":"Serve","detail":"BI, ML features, API, reverse ETL."},{"label":"Operasi","detail":"Orkestrasi, kualitas data, monitoring, biaya, keamanan & PII."}]}
```

Pertanyaan yang sering muncul: perbedaan ETL vs ELT; kapan streaming vs batch; bagaimana membuat pipeline idempoten; cara menangani event terlambat dan duplikat; merancang SCD 2; mengoptimasi query lambat; menangani data skew di Spark. Jawab dengan **trade-off**, bukan satu jawaban "benar".

:::latihan
Milestone akhir jalur: bangun mini platform data — Postgres sebagai database aplikasi, Debezium + Kafka (docker-compose) untuk CDC, consumer/stream job yang menulis agregat per 5 menit, batch dbt harian ke warehouse, dan dashboard. Tambahkan monitoring consumer lag dan freshness dengan alert. Dokumentasikan arsitekturnya dan latih menjelaskannya dalam 10 menit seperti wawancara system design.
:::

## Rangkuman

- Kafka: log terpartisi; kunci menentukan partisi & urutan; consumer group membagi partisi; commit offset setelah proses.
- Streaming: event time, window, watermark, state & checkpoint; konsumen harus idempoten.
- CDC berbasis log menangkap semua perubahan termasuk DELETE.
- Monitoring: job, data (freshness, volume, skema), bisnis; alert actionable + runbook.
- Wawancara: SQL, modeling, system design dengan kerangka kebutuhan → ingest → storage → proses → serve → operasi.
