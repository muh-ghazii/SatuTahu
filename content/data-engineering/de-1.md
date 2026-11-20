---
title: "Fondasi data engineering: Python, SQL, Linux, Docker"
minutes: 55
summary: Data engineer membangun jalur yang membawa data dari sumber ke tempat ia dianalisis, dengan andal dan berulang. Modul ini membahas fondasi yang dipakai setiap hari, yaitu Python untuk scripting, SQL lanjutan, Linux dan shell, Docker dan docker-compose, serta dasar Infrastructure as Code dengan Terraform.
objectives:
  - Menulis script Python ingest yang tangguh (retry, logging, konfigurasi)
  - Memakai SQL lanjutan untuk transformasi (window, MERGE/upsert)
  - Bekerja nyaman di shell Linux untuk inspeksi data dan otomasi
  - Menjalankan stack data lokal dengan docker-compose
  - Mendefinisikan resource cloud sebagai kode dengan Terraform
sources:
  - repo: DataTalksClub/data-engineering-zoomcamp
    note: Modul 1 (Docker, Postgres, Terraform) zoomcamp gratis
  - repo: DataExpert-io/data-engineer-handbook
    note: Peta jalan & rujukan data engineering
  - repo: dabeaz-course/python-mastery
    note: Python tingkat lanjut (generator, iterasi data besar)
quiz:
  - q: "Kenapa script ingest sebaiknya memproses file besar dengan chunk/generator?"
    options: ["Agar kode lebih pendek", "Agar memori tetap kecil walau data jauh lebih besar dari RAM", "Agar lebih aman", "Karena Python tidak bisa membaca file besar"]
    answer: 1
    explain: "Membaca seluruh file ke memori gagal ketika data tumbuh."
  - q: "Operasi ‘upsert’ berarti…"
    options: ["Menghapus lalu menyisipkan semua data", "Update jika kunci sudah ada, insert jika belum", "Hanya insert", "Membuat tabel baru"]
    answer: 1
    explain: "Upsert (MERGE / INSERT … ON CONFLICT) membuat load dapat diulang tanpa duplikat."
  - q: "Dalam docker-compose, service ‘pipeline’ menghubungi Postgres dengan host…"
    options: ["localhost", "Nama service, mis. ‘postgres’", "127.0.0.1:5432 selalu", "IP laptop"]
    answer: 1
    explain: "Compose membuat jaringan internal dengan DNS berdasarkan nama service."
  - q: "Keuntungan utama Terraform dibanding membuat resource lewat klik di konsol cloud…"
    options: ["Lebih murah", "Infrastruktur terdokumentasi, dapat di-review, dan dapat dibuat ulang secara konsisten", "Tidak perlu akun cloud", "Lebih cepat diketik"]
    answer: 1
    explain: "Kode infrastruktur masuk Git, ditinjau, dan diterapkan secara deklaratif."
---

**Data engineering** adalah pekerjaan memastikan data yang benar tiba di tempat yang tepat, tepat waktu, dalam bentuk yang bisa dipakai. Analyst dan data scientist hanya bisa sebaik data yang mereka terima. Sebelum menyentuh Spark atau Kafka, kuasai dulu fondasi yang muncul di setiap pekerjaan DE.

```viz
{"type":"flow","title":"Gambaran besar pipeline data","caption":"Modul-modul jalur ini membahas setiap tahap secara berurutan.","steps":[{"label":"Sumber","detail":"Database aplikasi, API, file, event."},{"label":"Ingest","detail":"Ekstraksi batch atau streaming."},{"label":"Penyimpanan","detail":"Data lake (Parquet) / warehouse."},{"label":"Transformasi","detail":"Pembersihan & pemodelan (dbt, Spark)."},{"label":"Penyajian","detail":"Dashboard, ML, reverse ETL."}]}
```

## Python untuk scripting

Script ingest produksi berbeda dari notebook: ia harus berjalan tanpa diawasi, gagal dengan jelas, dan aman dijalankan ulang.

```python
import logging, os, time
from pathlib import Path
import pandas as pd
import requests
from sqlalchemy import create_engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("ingest")
DB_URL = os.environ["DB_URL"]                       # konfigurasi dari environment, bukan hardcode

def unduh(url: str, tujuan: Path, percobaan: int = 3) -> Path:
    for i in range(1, percobaan + 1):
        try:
            with requests.get(url, stream=True, timeout=30) as r:
                r.raise_for_status()
                with tujuan.open("wb") as f:
                    for chunk in r.iter_content(1 << 20):
                        f.write(chunk)
            return tujuan
        except requests.RequestException as e:
            log.warning("percobaan %d gagal: %s", i, e)
            time.sleep(2 ** i)                       # exponential backoff
    raise RuntimeError(f"gagal mengunduh {url}")

def muat(file: Path, tabel: str) -> None:
    engine = create_engine(DB_URL)
    for n, chunk in enumerate(pd.read_csv(file, chunksize=100_000, parse_dates=["created_at"])):
        chunk.to_sql(tabel, engine, if_exists="append", index=False)
        log.info("chunk %d: %d baris", n, len(chunk))
```

Kebiasaan penting: **logging** alih-alih print, **konfigurasi lewat environment variable**, **retry dengan backoff**, **chunk/generator** untuk data besar, dan **type hints** + test untuk fungsi transformasi.

## SQL lanjutan

SQL adalah bahasa utama transformasi data. Selain window function dan CTE (lihat [SQL untuk analisis](/belajar/data-analyst/da-2)), DE sering memakai:

```sql
-- Upsert: load yang aman diulang (PostgreSQL)
INSERT INTO dim_pelanggan (pelanggan_id, nama, kota, updated_at)
SELECT pelanggan_id, nama, kota, updated_at FROM staging_pelanggan
ON CONFLICT (pelanggan_id) DO UPDATE
SET nama = EXCLUDED.nama, kota = EXCLUDED.kota, updated_at = EXCLUDED.updated_at
WHERE dim_pelanggan.updated_at < EXCLUDED.updated_at;

-- Deduplikasi: ambil versi terbaru per kunci
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) AS rn
  FROM raw_orders
) t WHERE rn = 1;

-- Membaca rencana eksekusi
EXPLAIN ANALYZE SELECT ... ;
```

Pahami juga **indeks** (B-tree mempercepat filter & join tetapi memperlambat tulis), **transaksi** (ACID), dan perbedaan **OLTP** (database aplikasi, banyak transaksi kecil) vs **OLAP** (warehouse, scan agregat besar).

## Linux & shell

Server data hampir semuanya Linux. Perintah shell sering menjadi cara tercepat memeriksa data sebelum menulis kode:

```bash
ls -lh data/                       # ukuran file yang mudah dibaca
head -n 5 orders.csv               # intip header
wc -l orders.csv                   # jumlah baris
cut -d, -f3 orders.csv | sort | uniq -c | sort -rn | head    # frekuensi kolom ke-3
grep -c "ERROR" pipeline.log
zcat dump.csv.gz | head
du -sh /data/* | sort -h           # folder mana yang besar
crontab -e                         # jadwal sederhana: 0 2 * * * /opt/etl/run.sh
```

Pahami juga **permission** (`chmod`, `chown`), **proses** (`ps`, `top`, `kill`), **SSH** dan kunci publik, serta **pipe** (`|`) dan **redirect** (`>`, `2>&1`). Pembahasan Linux lebih lengkap ada di [Fondasi backend](/belajar/backend/be-1).

## Docker & docker-compose

**Docker** mengemas aplikasi beserta dependensinya ke dalam **image** yang berjalan sama di laptop maupun server. **docker-compose** menjalankan beberapa container yang saling terhubung, ideal untuk stack data lokal:

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: de
      POSTGRES_PASSWORD: rahasia
      POSTGRES_DB: gudang
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U de"]
      interval: 5s
  pipeline:
    build: .
    environment:
      DB_URL: postgresql://de:rahasia@postgres:5432/gudang   # host = nama service
    depends_on:
      postgres: { condition: service_healthy }
volumes:
  pgdata:
```

```dockerfile
# Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "ingest.py"]
```

```viz
{"type":"layers","layers":[{"label":"Container","detail":"Proses yang berjalan dari image; sementara.","tag":"docker run"},{"label":"Image","detail":"Lapisan read-only hasil build Dockerfile.","tag":"docker build"},{"label":"Volume","detail":"Data persisten di luar siklus hidup container.","tag":"pgdata"},{"label":"Network","detail":"DNS internal antar service compose.","tag":"postgres:5432"}]}
```

## Infrastructure as Code (Terraform) dasar

Saat pindah ke cloud, resource seperti bucket penyimpanan dan dataset warehouse sebaiknya didefinisikan sebagai **kode**. **Terraform** bersifat deklaratif: kamu menulis keadaan yang diinginkan, Terraform menghitung perubahan yang diperlukan.

```hcl
terraform {
  required_providers { google = { source = "hashicorp/google" } }
}
provider "google" {
  project = var.project
  region  = "asia-southeast2"          # Jakarta
}
resource "google_storage_bucket" "lake" {
  name          = "${var.project}-datalake"
  location      = "ASIA-SOUTHEAST2"
  force_destroy = false
  lifecycle_rule {
    condition { age = 90 }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
}
resource "google_bigquery_dataset" "dw" {
  dataset_id = "gudang_data"
  location   = "asia-southeast2"
}
```

```viz
{"type":"flow","title":"Siklus Terraform","steps":[{"label":"init","detail":"Unduh provider."},{"label":"plan","detail":"Tampilkan perubahan yang akan dilakukan — review di PR."},{"label":"apply","detail":"Terapkan perubahan."},{"label":"state","detail":"Terraform mencatat keadaan; simpan di remote backend, jangan di laptop."}]}
```

:::warning
Jangan pernah commit kredensial (service account JSON, password) ke Git. Gunakan environment variable, secret manager, atau file `.env` yang masuk `.gitignore`.
:::

:::latihan
Milestone: ikuti Modul 1 `data-engineering-zoomcamp`. Jalankan Postgres + pgAdmin dengan docker-compose, tulis script Python ter-container yang mengunduh dataset publik (mis. NYC taxi) dan memuatnya per chunk dengan logging dan retry, lalu buat bucket dan dataset cloud dengan Terraform (free tier) dan hapus kembali dengan `terraform destroy`.
:::

## Rangkuman

- Script produksi: logging, konfigurasi env, retry + backoff, chunk, test.
- SQL DE: upsert, deduplikasi dengan ROW_NUMBER, EXPLAIN, indeks, OLTP vs OLAP.
- Shell: head/wc/cut/sort/uniq/grep untuk inspeksi cepat; cron untuk jadwal sederhana.
- Docker: image, container, volume, network; compose dengan healthcheck.
- Terraform: init → plan → apply; state di remote; jangan commit rahasia.
