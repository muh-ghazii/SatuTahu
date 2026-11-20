---
title: "MLOps: dari notebook ke produksi"
minutes: 55
summary: Model hanya bernilai ketika dipakai, dan sebagian besar kerja ML produksi justru berada di luar kode model. Modul ini membahas experiment tracking dengan MLflow, packaging dan serving dengan FastAPI, Docker dan CI/CD, orkestrasi pipeline training, serta monitoring dan data drift.
objectives:
  - Mencatat eksperimen (parameter, metrik, artefak) agar dapat dibandingkan dan diulang
  - Menyajikan model sebagai API dengan validasi input
  - Mengemas dengan Docker dan mengotomasi test serta deploy dengan CI/CD
  - Menjadwalkan pipeline training ulang
  - Memantau performa model dan mendeteksi drift
sources:
  - repo: DataTalksClub/mlops-zoomcamp
    note: Kursus MLOps gratis (MLflow, orkestrasi, deployment, monitoring)
  - repo: GokuMohandas/Made-With-ML
    note: ML end-to-end dengan praktik software engineering
  - repo: visenger/awesome-mlops
    note: Peta alat MLOps
quiz:
  - q: "Kenapa model sebaiknya disimpan bersama pipeline preprocessing-nya?"
    options: ["Agar file lebih besar", "Agar transformasi saat inferensi identik dengan saat training (menghindari training-serving skew)", "Karena MLflow mewajibkan", "Agar bisa dilatih ulang otomatis"]
    answer: 1
    explain: "Preprocessing yang ditulis ulang di sisi serving sering berbeda halus dan merusak prediksi."
  - q: "Distribusi fitur ‘umur pelanggan’ di produksi bergeser jauh dari data latih. Ini disebut…"
    options: ["Concept drift", "Data (covariate) drift", "Overfitting", "Leakage"]
    answer: 1
    explain: "Concept drift adalah perubahan hubungan fitur → target; data drift adalah perubahan distribusi input."
  - q: "Fungsi utama model registry adalah…"
    options: ["Melatih model lebih cepat", "Menyimpan versi model beserta metadata dan status (staging/production) untuk promosi & rollback", "Mengganti Git", "Mengumpulkan label"]
    answer: 1
    explain: "Registry menjawab: model versi berapa yang sedang melayani, dari run mana, dan bagaimana kembali ke versi sebelumnya."
  - q: "Shadow deployment berarti…"
    options: ["Model baru menerima trafik nyata tetapi prediksinya tidak dipakai, hanya dibandingkan", "Deploy di malam hari", "Model disembunyikan dari pengguna", "Deploy tanpa test"]
    answer: 0
    explain: "Cara aman menguji model baru pada data produksi tanpa risiko ke pengguna."
---

Paper Google yang terkenal, *Hidden Technical Debt in Machine Learning Systems*, menggambarkan kode model sebagai kotak kecil di tengah sistem raksasa: pengumpulan data, verifikasi, fitur, serving, monitoring. **MLOps** adalah praktik membangun dan mengoperasikan sistem itu secara andal.

```viz
{"type":"flow","title":"Siklus hidup ML di produksi","loop":true,"steps":[{"label":"Data & fitur","detail":"Versi data, validasi, feature pipeline."},{"label":"Training & eksperimen","detail":"Tracking parameter, metrik, artefak."},{"label":"Registry","detail":"Versi model + status."},{"label":"Deploy & serving","detail":"API batch/online dalam container."},{"label":"Monitoring","detail":"Latensi, drift, performa, umpan balik."},{"label":"Retrain","detail":"Terjadwal atau dipicu drift."}]}
```

## Experiment tracking (MLflow)

"Model mana yang menghasilkan F1 0,83 minggu lalu, dengan parameter apa, data versi berapa?" Tanpa tracking, pertanyaan ini sering tidak terjawab. **MLflow** mencatat setiap run:

```python
import mlflow, mlflow.sklearn
mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("churn")

with mlflow.start_run(run_name="hgb-lr0.05"):
    mlflow.log_params({"learning_rate": 0.05, "max_depth": 6, "data_versi": "2026-11-01"})
    pipe.fit(X_tr, y_tr)
    mlflow.log_metrics({"pr_auc": pr_auc(pipe, X_val, y_val), "recall@p70": recall_at(pipe, 0.7)})
    mlflow.log_artifact("reports/confusion.png")
    mlflow.sklearn.log_model(pipe, "model", registered_model_name="churn-model",
                             input_example=X_val.head(3))
```

UI MLflow memungkinkan membandingkan run berdampingan. **Model registry** menyimpan versi model dengan alias seperti `champion` dan `challenger`, sehingga promosi dan rollback tercatat. Alternatif: Weights & Biases, DVC (versi data + eksperimen di Git).

## Packaging & serving (FastAPI)

Dua pola serving: **batch** (prediksi terjadwal untuk semua pelanggan, ditulis ke tabel — lebih sederhana dan cukup untuk banyak kasus) dan **online** (API real-time per permintaan).

```python
# app/main.py
from fastapi import FastAPI
from pydantic import BaseModel, Field
import joblib, pandas as pd

app = FastAPI(title="Churn API")
model = joblib.load("model.joblib")        # Pipeline lengkap: preprocessing + model
VERSI = "churn-model:7"

class Pelanggan(BaseModel):
    umur: int = Field(ge=17, le=100)
    kota: str
    transaksi_30_hari: int = Field(ge=0)
    hari_sejak_login: int = Field(ge=0)

@app.get("/health")
def health():
    return {"status": "ok", "model": VERSI}

@app.post("/predict")
def predict(p: Pelanggan):
    proba = float(model.predict_proba(pd.DataFrame([p.model_dump()]))[0, 1])
    return {"churn_proba": round(proba, 4), "model": VERSI}
```

Pydantic memvalidasi input sebelum sampai ke model, sehingga request dengan umur −5 ditolak dengan pesan jelas. Kembalikan **versi model** di setiap respons dan **log** input serta prediksi untuk monitoring. Dasar membangun API ada di [Membangun REST API yang benar](/belajar/backend/be-3).

## Docker & CI/CD

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ app/
COPY model.joblib .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

CI/CD untuk ML menguji lebih dari kode:

```viz
{"type":"layers","layers":[{"label":"Test kode","detail":"Unit test fungsi fitur, test API (status 200, validasi 422).","tag":"pytest"},{"label":"Test data","detail":"Skema & rentang nilai data latih sesuai harapan.","tag":"Great Expectations"},{"label":"Test model","detail":"Metrik ≥ ambang & ≥ model produksi; invariance test (ganti nama → prediksi tak berubah).","tag":"quality gate"},{"label":"Build & deploy","detail":"Build image, push registry, deploy bertahap.","tag":"GitHub Actions"}]}
```

```yaml
# .github/workflows/ml.yml (ringkas)
on: [push]
jobs:
  test-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt && pytest -q
      - run: docker build -t ghcr.io/${{ github.repository }}/churn-api:${{ github.sha }} .
```

Strategi rilis aman: **shadow** (model baru menerima trafik tetapi hasilnya hanya dicatat), **canary** (sebagian kecil trafik ke model baru), dan **A/B test** untuk mengukur dampak bisnis.

## Orkestrasi pipeline

Training ulang sebaiknya berupa pipeline otomatis, bukan notebook yang dijalankan manual:

```viz
{"type":"flow","title":"Pipeline training terjadwal","steps":[{"label":"Ekstrak data","detail":"Snapshot data periode terbaru."},{"label":"Validasi data","detail":"Gagal → hentikan & alert."},{"label":"Fitur","detail":"Kode fitur yang sama dengan serving."},{"label":"Latih & evaluasi","detail":"Bandingkan dengan champion pada holdout yang sama."},{"label":"Registrasi","detail":"Jika lolos gate → challenger."},{"label":"Deploy","detail":"Otomatis atau dengan persetujuan manusia."}]}
```

Alat orkestrasi: **Prefect**, **Airflow** (lihat [Orkestrasi & transformasi](/belajar/data-engineering/de-3)), **Kubeflow Pipelines**, **ZenML**, atau **Mage**. Kunci keandalan sama dengan pipeline data: task idempoten, input berversi, dan logging.

## Monitoring & data drift

Model tidak rusak seperti software biasa; ia **membusuk perlahan** ketika dunia berubah. Pantau beberapa lapisan:

```viz
{"type":"compare","columns":["Yang dipantau","Contoh","Kapan tersedia"],"rows":[{"label":"Operasional","values":["Latensi p95, error rate, throughput","Real-time"]},{"label":"Data drift","values":["Distribusi fitur berubah (PSI, uji KS, jarak Wasserstein)","Real-time"]},{"label":"Prediction drift","values":["Proporsi prediksi churn tiba-tiba naik","Real-time"]},{"label":"Concept drift / performa","values":["Precision/recall turun karena hubungan fitur→target berubah","Setelah label tersedia (bisa minggu)"]}]}
```

Karena label sering terlambat (apakah pelanggan benar churn baru diketahui sebulan kemudian), **data drift dan prediction drift** menjadi sinyal peringatan dini. Alat seperti **Evidently** membuat laporan drift; **Prometheus + Grafana** untuk metrik operasional. Drift tidak selalu berarti harus retrain; selidiki dulu apakah ada bug pipeline atau perubahan bisnis yang nyata.

:::latihan
Milestone: ambil model dari modul sebelumnya, lalu (1) catat 5+ eksperimen di MLflow dan daftarkan yang terbaik ke registry, (2) sajikan dengan FastAPI + Pydantic, (3) kemas dengan Docker dan buat workflow GitHub Actions yang menjalankan test lalu build image, (4) jadwalkan pipeline training ulang dengan Prefect, dan (5) buat laporan drift Evidently dengan membandingkan data latih vs data ‘produksi’ simulasi yang sengaja digeser.
:::

## Rangkuman

- MLOps = membangun sistem di sekitar model: data, training, registry, serving, monitoring, retrain.
- MLflow: parameter, metrik, artefak, registry untuk promosi & rollback.
- Serving batch atau online; simpan pipeline lengkap; validasi input dengan Pydantic.
- CI/CD menguji kode, data, dan model; rilis bertahap (shadow, canary).
- Monitoring operasional + drift data/prediksi sebagai peringatan dini sebelum label tersedia.
