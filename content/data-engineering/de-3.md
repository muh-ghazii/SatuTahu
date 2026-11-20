---
title: Orkestrasi & transformasi (Airflow, dbt)
minutes: 55
summary: Pipeline produksi terdiri dari puluhan langkah yang saling bergantung dan harus berjalan setiap hari tanpa diawasi. Modul ini membahas DAG dan penjadwalan, idempotensi dan backfill, transformasi dengan dbt (models, tests, docs), pengujian kualitas data, dan lineage.
objectives:
  - Menyusun pipeline sebagai DAG dengan dependensi, retry, dan jadwal
  - Merancang task yang idempoten sehingga aman di-rerun dan di-backfill
  - Membangun model dbt berlapis dengan test dan dokumentasi
  - Menerapkan pemeriksaan kualitas data dan membaca lineage
sources:
  - repo: apache/airflow
    note: Orkestrator workflow open source paling luas dipakai
  - repo: dbt-labs/dbt
    note: dbt Core untuk transformasi SQL
  - repo: mage-ai/mage-ai
    note: Alternatif orkestrator dengan UI notebook
  - repo: josephmachado/beginner_de_project
    note: Proyek DE pemula end-to-end (Airflow + warehouse)
quiz:
  - q: "Task ‘muat data tanggal X’ disebut idempoten jika…"
    options: ["Selalu berhasil", "Dijalankan sekali atau berkali-kali, hasil akhirnya sama", "Berjalan cepat", "Tidak punya dependensi"]
    answer: 1
    explain: "Contoh: hapus partisi tanggal X lalu tulis ulang, bukan append buta."
  - q: "Dalam dbt, ref('stg_orders') berfungsi untuk…"
    options: ["Mengimpor library", "Mereferensikan model lain sehingga dbt tahu urutan eksekusi dan lineage", "Membuat tabel sementara", "Menjalankan Python"]
    answer: 1
    explain: "ref() membangun DAG antar model sehingga urutan eksekusi, lingkungan, dan lineage otomatis benar."
  - q: "Backfill berarti…"
    options: ["Menghapus data lama", "Menjalankan pipeline untuk periode lampau, mis. setelah logika diperbaiki", "Menambah kolom", "Mengisi nilai kosong dengan rata-rata"]
    answer: 1
    explain: "Backfill memproses ulang periode lampau; aman jika task idempoten."
  - q: "Test dbt ‘unique’ dan ‘not_null’ pada order_id gagal. Tindakan yang tepat…"
    options: ["Matikan test-nya", "Hentikan publikasi model turunan dan selidiki sumber duplikat/kosong", "Abaikan karena dashboard tetap jalan", "Hapus kolom order_id"]
    answer: 1
    explain: "Test yang gagal adalah sinyal untuk berhenti; mematikannya hanya menyembunyikan masalah dari pengguna data."
---

Pipeline pertama biasanya berupa script yang dijalankan cron. Ketika jumlahnya bertambah — ingest lima sumber, transformasi tiga puluh tabel, ekspor ke dashboard — muncul pertanyaan: apa yang harus jalan duluan? apa yang terjadi jika satu langkah gagal jam 3 pagi? bagaimana memperbaiki data bulan lalu? **Orkestrasi** dan **transformasi terkelola** menjawab pertanyaan itu.

## DAG & scheduling

Pipeline dimodelkan sebagai **DAG** (Directed Acyclic Graph): node adalah task, panah adalah dependensi, dan tidak boleh ada siklus.

```viz
{"type":"graph-search"}
```

Contoh DAG Airflow (TaskFlow API):

```python
from datetime import datetime, timedelta
from airflow.decorators import dag, task

@dag(schedule="0 2 * * *", start_date=datetime(2026, 1, 1), catchup=False,
     default_args={"retries": 3, "retry_delay": timedelta(minutes=5)}, tags=["penjualan"])
def penjualan_harian():

    @task
    def ekstrak(ds=None) -> str:                 # ds = tanggal logis run, mis. '2026-11-19'
        return ambil_orders_ke_lake(tanggal=ds)  # kembalikan path file

    @task
    def muat(path: str, ds=None):
        muat_partisi("raw.orders", path, tanggal=ds)

    @task.bash
    def transformasi():
        return "cd /opt/dbt && dbt build --select tag:penjualan"

    muat(ekstrak()) >> transformasi()

penjualan_harian()
```

Konsep penting: **schedule** (cron atau dataset/event), **tanggal logis** (`ds`: periode data yang diproses, bukan waktu eksekusi), **retry** dan **timeout**, **sensor** (menunggu file/kondisi), dan **SLA/alert** ke Slack atau email. Orkestrator **mengatur** kerja; pekerjaan berat sebaiknya dijalankan di warehouse, Spark, atau container, bukan di worker Airflow.

## Idempotensi & backfill

Prinsip terpenting DE: **task harus idempoten**. Menjalankan ulang task untuk tanggal yang sama tidak boleh menggandakan data.

```viz
{"type":"compare","columns":["Tidak idempoten","Idempoten"],"rows":[{"label":"Load","values":["INSERT INTO ... (append) — rerun = duplikat","DELETE partisi tanggal lalu INSERT, atau MERGE/upsert"]},{"label":"Rentang data","values":["WHERE created_at > NOW() - 1 day","WHERE created_at >= '{{ ds }}' AND < '{{ next_ds }}'"]},{"label":"Nama file","values":["output_latest.csv","orders/tanggal=2026-11-19/part.parquet"]},{"label":"Efek samping","values":["Kirim email setiap run","Catat status terkirim, cek sebelum kirim"]}]}
```

Dengan task idempoten berbasis tanggal logis, **backfill** menjadi aman: setelah memperbaiki logika, jalankan ulang periode lampau:

```bash
airflow dags backfill penjualan_harian --start-date 2026-09-01 --end-date 2026-10-31
```

Hindari `NOW()` di dalam logika transformasi; gunakan parameter periode agar hasil run tanggal 19 November selalu sama kapan pun dijalankan ulang.

## dbt models, tests, docs

**dbt** (data build tool) membawa praktik rekayasa perangkat lunak ke SQL: setiap model adalah file `SELECT`, dbt yang membuat tabel/view, menentukan urutan dari `ref()`, menguji, dan mendokumentasikan.

```viz
{"type":"layers","layers":[{"label":"marts","detail":"fct_penjualan, dim_pelanggan — siap dipakai BI.","tag":"tabel"},{"label":"intermediate","detail":"Join & logika bisnis yang dipakai ulang.","tag":"ephemeral/view"},{"label":"staging","detail":"1:1 dengan sumber: rename, cast tipe, bersihkan. Tidak ada join.","tag":"view"},{"label":"sources","detail":"Tabel mentah hasil ingest, dideklarasikan di sources.yml.","tag":"raw"}]}
```

```sql
-- models/staging/stg_orders.sql
select
    cast(order_id as varchar)        as order_id,
    cast(customer_id as varchar)     as pelanggan_id,
    lower(trim(status))              as status,
    cast(created_at as timestamp)    as dibuat_pada,
    amount / 100.0                   as nilai_rp
from {{ source('toko', 'orders') }}

-- models/marts/fct_penjualan.sql
{{ config(materialized='incremental', unique_key='order_id') }}
select o.order_id, o.pelanggan_id, o.dibuat_pada, o.nilai_rp, c.kota
from {{ ref('stg_orders') }} o
left join {{ ref('stg_customers') }} c using (pelanggan_id)
where o.status = 'selesai'
{% if is_incremental() %}
  and o.dibuat_pada > (select max(dibuat_pada) from {{ this }})
{% endif %}
```

```yaml
# models/marts/schema.yml
models:
  - name: fct_penjualan
    description: "Satu baris per pesanan selesai."
    columns:
      - name: order_id
        tests: [unique, not_null]
      - name: pelanggan_id
        tests:
          - relationships: { to: ref('dim_pelanggan'), field: pelanggan_id }
      - name: nilai_rp
        tests:
          - dbt_utils.accepted_range: { min_value: 0 }
```

`dbt build` menjalankan model dan test sesuai urutan DAG; `dbt docs generate` membuat situs dokumentasi beserta grafik lineage.

## Data quality

Data yang salah lebih berbahaya daripada data yang terlambat, karena keputusan diambil tanpa sadar. Dimensi kualitas data:

```viz
{"type":"compare","columns":["Dimensi","Contoh pemeriksaan"],"rows":[{"label":"Completeness","values":["Kolom wajib tidak kosong; jumlah baris hari ini tidak turun > 50% dari rata-rata"]},{"label":"Uniqueness","values":["order_id unik"]},{"label":"Validity","values":["status ∈ {baru, dibayar, dikirim, selesai, batal}; nilai ≥ 0"]},{"label":"Consistency","values":["Total item = total pesanan; foreign key valid"]},{"label":"Freshness","values":["Data terbaru tidak lebih tua dari 26 jam"]}]}
```

Terapkan pemeriksaan di beberapa titik: saat ingest (skema sesuai kontrak), setelah transformasi (test dbt, Great Expectations, Soda), dan sebelum publikasi. Test yang gagal sebaiknya **menghentikan** model turunan agar data buruk tidak sampai ke dashboard. **Data contract** antara tim aplikasi dan tim data menetapkan skema dan semantik yang dijanjikan, sehingga perubahan kolom tidak diam-diam merusak pipeline.

## Lineage

**Lineage** memetakan asal-usul setiap tabel dan kolom: dari sumber mana, lewat transformasi apa, dipakai oleh dashboard mana.

```viz
{"type":"flow","title":"Contoh lineage","steps":[{"label":"raw.orders","detail":"Ingest dari Postgres aplikasi"},{"label":"stg_orders","detail":"Bersih & bertipe"},{"label":"int_orders_enriched","detail":"Join pelanggan & produk"},{"label":"fct_penjualan","detail":"Mart"},{"label":"Dashboard Omzet","detail":"Looker Studio"}]}
```

Kegunaannya: **analisis dampak** sebelum mengubah kolom (siapa yang akan rusak?), **root cause** saat angka dashboard aneh (telusuri ke hulu), dan **kepatuhan** (data pribadi mengalir ke mana saja?). dbt docs memberi lineage tingkat model; standar **OpenLineage** dan alat seperti DataHub atau OpenMetadata memberi lineage lintas sistem.

:::latihan
Milestone: kerjakan `beginner_de_project` atau bangun sendiri: Airflow (docker-compose) yang setiap hari mengambil data dari API publik ke Parquet, memuat ke DuckDB/Postgres secara idempoten per tanggal, lalu menjalankan proyek dbt berlapis staging → marts dengan minimal 8 test dan dokumentasi. Uji backfill 30 hari dan pastikan rerun tidak menghasilkan duplikat.
:::

## Rangkuman

- DAG: task + dependensi + jadwal + retry; orkestrator mengatur, bukan menghitung.
- Idempoten: proses berbasis tanggal logis, overwrite partisi/MERGE, tanpa NOW(); backfill jadi aman.
- dbt: staging → intermediate → marts, `ref()` untuk DAG, test & docs bawaan, incremental model.
- Kualitas data: completeness, uniqueness, validity, consistency, freshness; gagal = hentikan.
- Lineage untuk analisis dampak, root cause, dan kepatuhan.
