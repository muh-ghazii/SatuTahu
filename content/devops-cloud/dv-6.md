---
title: Observability & SRE
minutes: 55
summary: Sistem yang tidak bisa diamati tidak bisa diandalkan. Modul ini membahas tiga pilar observability (metrics, logs, traces), Prometheus dan Grafana, SLI, SLO, dan error budget, alerting yang bermakna, serta penanganan insiden dan postmortem tanpa menyalahkan.
objectives:
  - Membedakan metrics, logs, dan traces serta kapan memakai masing-masing
  - Mengumpulkan metrik dengan Prometheus dan memvisualisasikannya di Grafana
  - Mendefinisikan SLI dan SLO serta memakai error budget untuk keputusan
  - Merancang alert berbasis gejala yang dapat ditindaklanjuti
  - Menjalankan penanganan insiden dan menulis postmortem blameless
sources:
  - repo: prometheus/prometheus
    note: Sistem monitoring & basis data time series Prometheus
  - repo: dastergon/awesome-sre
    note: Kumpulan sumber Site Reliability Engineering
  - repo: upgundecha/howtheysre
    note: Praktik SRE dari berbagai perusahaan
quiz:
  - q: "Untuk mengetahui di layanan mana sebuah permintaan lambat dalam sistem microservices, alat yang paling tepat adalah…"
    options: ["Metrik CPU", "Distributed tracing", "Log sistem operasi", "Ping"]
    answer: 1
    explain: "Trace menunjukkan durasi setiap span di sepanjang perjalanan permintaan."
  - q: "SLO 99,9% availability per 30 hari memberi error budget sekitar…"
    options: ["4 jam 23 menit", "43 menit", "7 menit", "0 menit"]
    answer: 1
    explain: "0,1% × 30 hari × 24 jam × 60 menit ≈ 43,2 menit."
  - q: "Alert yang baik sebaiknya dipicu oleh…"
    options: ["Setiap CPU > 80%", "Gejala yang dirasakan pengguna (error rate, latensi) atau laju pembakaran error budget", "Setiap baris log ERROR", "Jumlah Pod"]
    answer: 1
    explain: "Alert penyebab yang tidak berdampak pada pengguna menimbulkan alert fatigue."
  - q: "Postmortem blameless berfokus pada…"
    options: ["Mencari siapa yang salah", "Memahami faktor sistemik yang memungkinkan insiden dan tindakan perbaikan", "Menghukum tim", "Menyembunyikan insiden"]
    answer: 1
    explain: "Orang yang takut disalahkan menyembunyikan informasi; sistem tidak membaik."
---

Setelah aplikasi berjalan di produksi, pertanyaannya berubah dari "apakah sudah dideploy?" menjadi "apakah pengguna terlayani dengan baik, dan jika tidak, kenapa?". **Observability** adalah kemampuan menjawab pertanyaan itu dari data yang dihasilkan sistem. **Site Reliability Engineering (SRE)**, pendekatan yang dipopulerkan Google, memperlakukan keandalan sebagai masalah engineering dengan target yang terukur.

## Metrics, logs & traces

```viz
{"type":"compare","columns":["Pilar","Bentuk","Menjawab","Contoh alat"],"rows":[{"label":"Metrics","values":["Angka agregat berlabel per waktu","Seberapa banyak/cepat? Ada yang berubah?","Prometheus, Grafana Mimir, CloudWatch"]},{"label":"Logs","values":["Catatan kejadian (sebaiknya terstruktur/JSON)","Apa tepatnya yang terjadi pada permintaan ini?","Loki, Elasticsearch/OpenSearch"]},{"label":"Traces","values":["Perjalanan satu permintaan lintas layanan (span)","Di mana waktunya habis? Layanan mana yang gagal?","Jaeger, Tempo, Zipkin"]}]}
```

Ketiganya saling melengkapi: **metrik** memberi tahu ada masalah (error rate naik), **trace** menunjukkan di mana (span database lambat), dan **log** menjelaskan detailnya (query mana, parameter apa). Hubungkan ketiganya dengan **trace ID** yang dicatat di log.

**OpenTelemetry** adalah standar terbuka untuk menginstrumentasi aplikasi sekali dan mengirim data ke backend mana pun:

```python
# pip install opentelemetry-distro opentelemetry-exporter-otlp
# jalankan: opentelemetry-instrument uvicorn app.main:app
import logging, json
logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("toko")
log.info(json.dumps({"event": "pesanan_dibuat", "order_id": "ORD-1029", "nilai": 450000, "durasi_ms": 182}))
```

Log terstruktur (JSON dengan field konsisten) dapat difilter dan diagregasi, sedangkan log teks bebas sulit dicari. Jangan pernah mencatat password, token, atau data pribadi lengkap.

## Prometheus & Grafana

**Prometheus** mengambil (*scrape*) metrik dari endpoint `/metrics` aplikasi secara berkala dan menyimpannya sebagai time series. **Grafana** memvisualisasikannya.

```python
from prometheus_client import Counter, Histogram, start_http_server
PERMINTAAN = Counter("http_requests_total", "Jumlah permintaan", ["route", "status"])
LATENSI = Histogram("http_request_duration_seconds", "Durasi permintaan", ["route"],
                    buckets=[0.05, 0.1, 0.25, 0.5, 1, 2.5])

def tangani(route):
    with LATENSI.labels(route).time():
        ...
    PERMINTAAN.labels(route, "200").inc()

start_http_server(9100)        # expose /metrics
```

Jenis metrik: **counter** (hanya naik: jumlah permintaan), **gauge** (naik-turun: memori, antrean), **histogram** (distribusi: latensi). Query **PromQL** yang paling sering dipakai:

```text
# laju permintaan per detik (5 menit terakhir)
sum(rate(http_requests_total[5m])) by (route)

# persentase error 5xx
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# latensi p95
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))
```

Dashboard yang berguna mengikuti metode **RED** untuk layanan (**R**ate, **E**rrors, **D**uration) dan **USE** untuk sumber daya (**U**tilization, **S**aturation, **E**rrors). Gunakan **persentil** (p95/p99), bukan rata-rata, karena rata-rata menyembunyikan pengalaman pengguna yang paling lambat. Hindari label dengan kardinalitas sangat tinggi (mis. user_id) di metrik.

## SLI, SLO & error budget

```viz
{"type":"layers","layers":[{"label":"SLA","detail":"Kontrak dengan pelanggan, ada konsekuensi (kompensasi) jika dilanggar","tag":"eksternal"},{"label":"SLO","detail":"Target internal: 99,9% permintaan checkout berhasil dalam 30 hari","tag":"target"},{"label":"SLI","detail":"Ukuran yang dihitung: permintaan sukses ÷ total permintaan","tag":"ukuran"}]}
```

**SLI** yang baik mengukur **pengalaman pengguna**: proporsi permintaan yang berhasil, proporsi yang lebih cepat dari 300 ms, kesegaran data. **SLO** menetapkan target realistis — 100% bukan target yang benar, karena terlalu mahal dan pengguna tidak dapat membedakan 99,99% dari 100% ketika jaringan mereka sendiri tidak sempurna.

**Error budget** = 100% − SLO. Dengan SLO 99,9% per 30 hari, kamu ‘boleh’ gagal sekitar **43 menit** (atau 0,1% permintaan).

```viz
{"type":"flow","title":"Error budget sebagai alat keputusan","steps":[{"label":"Budget masih banyak","detail":"Rilis fitur dengan kecepatan normal; eksperimen boleh."},{"label":"Budget menipis","detail":"Rilis lebih hati-hati; prioritaskan perbaikan keandalan."},{"label":"Budget habis","detail":"Bekukan rilis fitur non-darurat; fokus keandalan sampai pulih."}]}
```

Error budget mengubah perdebatan "cepat vs stabil" antara developer dan operasi menjadi keputusan berbasis data yang disepakati bersama.

## Alerting yang bermakna

Alert yang terlalu banyak membuat orang mengabaikannya (**alert fatigue**), dan alert yang terlewat berarti pengguna yang lebih dulu tahu. Prinsip:

```viz
{"type":"compare","columns":["Alert buruk","Alert baik"],"rows":[{"label":"Pemicu","values":["CPU > 80% (penyebab, belum tentu berdampak)","Error rate checkout > ambang / burn rate SLO tinggi (gejala)"]},{"label":"Tindakan","values":["Tidak jelas harus apa","Ada runbook: cek dashboard X, langkah mitigasi Y"]},{"label":"Penerima","values":["Seluruh tim di channel ramai","Pemilik layanan on-call; tingkat urgensi jelas"]},{"label":"Frekuensi","values":["Berbunyi tiap hari, selalu diabaikan","Jarang, selalu ditanggapi"]}]}
```

**Burn rate alert** membandingkan laju konsumsi error budget: misalnya, jika dalam 1 jam terakhir budget terbakar 14× lebih cepat dari normal (akan habis dalam ~2 hari), kirim page segera; laju lebih rendah cukup menjadi tiket.

```yaml
# Prometheus alerting rule (disederhanakan)
groups:
  - name: toko-slo
    rules:
      - alert: CheckoutErrorBudgetBurnCepat
        expr: |
          (sum(rate(http_requests_total{route="/checkout",status=~"5.."}[1h]))
           / sum(rate(http_requests_total{route="/checkout"}[1h]))) > (14.4 * 0.001)
        for: 5m
        labels: { severity: page }
        annotations:
          summary: "Error budget checkout terbakar cepat"
          runbook: "https://wiki.contoh.id/runbook/checkout"
```

Alert penyebab (disk hampir penuh, sertifikat hampir kedaluwarsa) tetap berguna sebagai **tiket** dengan tenggat, bukan page tengah malam.

## Incident & postmortem

Saat insiden terjadi, prioritasnya adalah **memulihkan layanan**, bukan langsung mencari akar masalah.

```viz
{"type":"flow","title":"Siklus penanganan insiden","steps":[{"label":"Deteksi","detail":"Alert, laporan pengguna."},{"label":"Deklarasi & peran","detail":"Incident commander, komunikasi, operator; channel khusus."},{"label":"Mitigasi","detail":"Rollback, matikan feature flag, tambah kapasitas, alihkan trafik."},{"label":"Komunikasi","detail":"Status page & update berkala ke pemangku kepentingan."},{"label":"Pemulihan","detail":"Layanan normal; pantau."},{"label":"Postmortem","detail":"Linimasa, dampak, faktor penyebab, action item."}]}
```

**Postmortem blameless** menganggap orang bertindak wajar dengan informasi yang mereka miliki saat itu; yang dicari adalah **faktor sistemik** (test yang tidak ada, alert yang terlambat, proses deploy yang rawan) dan **action item** yang konkret, punya pemilik, dan tenggat. Struktur umum: ringkasan, dampak (berapa pengguna, berapa lama, berapa error budget terpakai), linimasa, akar masalah dan faktor pendukung, apa yang berjalan baik, apa yang perlu diperbaiki, dan action item. Repo `howtheysre` berisi banyak contoh praktik dan postmortem publik dari perusahaan teknologi.

:::latihan
Milestone akhir jalur: untuk aplikasi dari modul sebelumnya, (1) instrumentasi metrik RED dan log terstruktur, plus tracing dengan OpenTelemetry; (2) jalankan Prometheus, Grafana, Loki, dan Tempo/Jaeger dengan Docker Compose (atau kube-prometheus-stack di Kubernetes); (3) buat dashboard RED dan definisikan dua SLO beserta perhitungan error budget; (4) buat alert burn rate dengan runbook; (5) simulasikan insiden (mis. rilis versi yang menghasilkan 5% error), tangani dengan rollback, lalu tulis postmortem blameless.
:::

## Rangkuman

- Metrics (ada masalah?), traces (di mana?), logs (apa detailnya?) — hubungkan dengan trace ID; OpenTelemetry sebagai standar.
- Prometheus scrape /metrics; counter, gauge, histogram; PromQL rate & histogram_quantile; dashboard RED/USE dengan persentil.
- SLI mengukur pengalaman pengguna, SLO target realistis, error budget = 100% − SLO untuk memutuskan laju rilis.
- Alert berbasis gejala & burn rate, actionable dengan runbook; penyebab menjadi tiket.
- Insiden: pulihkan dulu, peran jelas, komunikasi; postmortem blameless dengan action item konkret.
