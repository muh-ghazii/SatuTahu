---
title: ML klasik dengan scikit-learn
minutes: 60
summary: Sebagian besar masalah ML di industri diselesaikan dengan algoritme klasik pada data tabular. Modul ini membahas regresi, klasifikasi, dan clustering, trade-off bias dan variance, cross-validation dan metrik, keluarga model pohon (decision tree, random forest, gradient boosting), serta Pipeline untuk preprocessing yang benar.
objectives:
  - Memilih algoritme yang sesuai untuk regresi, klasifikasi, dan clustering
  - Mendiagnosis underfitting dan overfitting dengan learning curve
  - Mengevaluasi model dengan CV dan metrik yang tepat
  - Memahami cara kerja tree, random forest, dan gradient boosting
  - Membangun Pipeline end-to-end dan menyetel hyperparameter
sources:
  - repo: microsoft/ML-For-Beginners
    note: Kurikulum ML klasik dengan scikit-learn
  - repo: ageron/handson-ml3
    note: Bab 2–7 Hands-On ML (end-to-end project, model, ensembles)
  - repo: rasbt/machine-learning-book
    note: Kode buku Machine Learning with PyTorch and Scikit-Learn
  - repo: Avik-Jain/100-Days-Of-ML-Code
    note: Rencana latihan harian dengan infografis
quiz:
  - q: "Akurasi latih 99%, akurasi validasi 71%. Diagnosis yang paling mungkin…"
    options: ["Underfitting (bias tinggi)", "Overfitting (variance tinggi)", "Data terlalu banyak", "Model sempurna"]
    answer: 1
    explain: "Celah besar train–validasi menandakan model menghafal data latih."
  - q: "K-means membutuhkan feature scaling karena…"
    options: ["Agar lebih cepat saja", "Memakai jarak Euclid — fitur berskala besar akan mendominasi", "Hanya menerima nilai 0–1", "Tidak membutuhkan"]
    answer: 1
    explain: "Pendapatan (jutaan) akan menenggelamkan usia (puluhan) tanpa scaling."
  - q: "Random forest mengurangi overfitting decision tree tunggal dengan…"
    options: ["Memangkas semua pohon menjadi satu level", "Merata-ratakan banyak pohon yang dilatih pada sampel bootstrap dan subset fitur acak", "Memakai gradient descent", "Menghapus outlier"]
    answer: 1
    explain: "Pohon-pohon yang kurang berkorelasi saling meniadakan error-nya (mengurangi variance)."
  - q: "GridSearchCV dengan Pipeline mencegah leakage karena…"
    options: ["Mencoba semua parameter", "Scaler/encoder di-fit ulang hanya pada fold latih di setiap iterasi CV", "Lebih cepat", "Memakai GPU"]
    answer: 1
    explain: "Preprocessing yang di-fit di luar CV membocorkan statistik fold validasi."
---

Deep learning mendominasi berita, tetapi untuk data tabular (penjualan, kredit, churn, sensor) model klasik masih sering menang: lebih cepat dilatih, lebih mudah dijelaskan, dan butuh data lebih sedikit. **scikit-learn** menyediakan API seragam untuk semuanya: `fit`, `predict`, `transform`.

## Regresi, klasifikasi, clustering

```viz
{"type":"tree","root":{"label":"Jenis masalah ML","children":[{"label":"Supervised: ada label","children":[{"label":"Regresi (angka)","detail":"Harga rumah, omzet minggu depan — Linear/Ridge/Lasso, tree, boosting"},{"label":"Klasifikasi (kelas)","detail":"Churn ya/tidak, jenis penyakit — Logistic, SVM, kNN, tree, boosting"}]},{"label":"Unsupervised: tanpa label","children":[{"label":"Clustering","detail":"Segmentasi pelanggan — K-means, DBSCAN, hierarchical"},{"label":"Reduksi dimensi","detail":"PCA, UMAP untuk visualisasi & kompresi"}]}]}}
```

```python
from sklearn.linear_model import Ridge, LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.cluster import KMeans

Ridge(alpha=1.0).fit(X_tr, y_tr)                          # regresi linear + L2
LogisticRegression(C=1.0).fit(X_tr, y_tr)                 # klasifikasi linear
KNeighborsClassifier(n_neighbors=15).fit(X_tr, y_tr)      # berbasis kemiripan
km = KMeans(n_clusters=4, n_init="auto", random_state=0).fit(X_scaled)
```

K-means bekerja dengan dua langkah berulang: tetapkan setiap titik ke centroid terdekat, lalu pindahkan centroid ke rata-rata anggotanya. Jalankan langkah demi langkah:

```viz
{"type":"kmeans"}
```

Memilih k: **elbow method** (inertia vs k), **silhouette score**, dan yang terpenting, apakah segmen yang dihasilkan **bermakna dan dapat ditindaklanjuti** oleh bisnis.

## Bias-variance trade-off

Error prediksi pada data baru dapat diuraikan menjadi **bias²** (asumsi model terlalu sederhana), **variance** (model terlalu sensitif pada data latih tertentu), dan **noise** yang tak terhindarkan.

```viz
{"type":"overfit"}
```

```viz
{"type":"compare","columns":["Underfitting (bias tinggi)","Overfitting (variance tinggi)"],"rows":[{"label":"Gejala","values":["Error latih & validasi sama-sama tinggi","Error latih rendah, validasi jauh lebih tinggi"]},{"label":"Solusi","values":["Model lebih kompleks, fitur lebih baik, kurangi regularisasi","Data lebih banyak, regularisasi, model lebih sederhana, early stopping, ensembling"]}]}
```

Gunakan **learning curve** (skor vs ukuran data latih) untuk memutuskan: jika kurva latih dan validasi masih terpisah jauh dan validasi terus naik, menambah data kemungkinan membantu; jika keduanya datar dan rendah, data tambahan tidak akan menolong.

## Cross-validation & metrik

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold
skor = cross_val_score(model, X, y, cv=StratifiedKFold(5, shuffle=True, random_state=0), scoring="f1")
print(skor.mean(), skor.std())
```

```viz
{"type":"confusion"}
```

```viz
{"type":"compare","columns":["Metrik","Rumus/arti","Kapan"],"rows":[{"label":"Precision","values":["TP / (TP+FP) — dari yang diprediksi positif, berapa yang benar","FP mahal: spam filter"]},{"label":"Recall","values":["TP / (TP+FN) — dari yang benar positif, berapa yang tertangkap","FN mahal: deteksi penyakit, fraud"]},{"label":"F1","values":["Rata-rata harmonik precision & recall","Butuh keseimbangan"]},{"label":"ROC-AUC / PR-AUC","values":["Kualitas ranking di semua threshold","PR-AUC untuk data sangat tidak seimbang"]},{"label":"MAE / RMSE / R²","values":["Error rata-rata / menghukum error besar / proporsi varians","Regresi"]}]}
```

Detail skema CV untuk data berkelompok dan deret waktu dibahas di [Machine learning terapan](/belajar/data-scientist/ds-3).

## Tree, Random Forest, Gradient Boosting

**Decision tree** membagi data dengan pertanyaan ya/tidak (`umur < 30?`) yang dipilih untuk memaksimalkan kemurnian (Gini/entropy) atau mengurangi varians. Mudah dijelaskan, tidak butuh scaling, menangkap interaksi, tetapi pohon dalam sangat mudah overfit.

```viz
{"type":"tree","root":{"label":"transaksi_30_hari < 2?","children":[{"label":"Ya → hari_sejak_login > 14?","children":[{"label":"Ya → CHURN (0,81)"},{"label":"Tidak → bertahan (0,64)"}]},{"label":"Tidak → keluhan > 0?","children":[{"label":"Ya → CHURN (0,55)"},{"label":"Tidak → bertahan (0,92)"}]}]}}
```

- **Random Forest** (*bagging*): ratusan pohon dalam, masing-masing dilatih pada sampel bootstrap dan subset fitur acak; prediksi dirata-rata. Mengurangi variance, tangguh dengan sedikit tuning.
- **Gradient Boosting** (*boosting*): pohon dangkal dilatih **berurutan**; setiap pohon mempelajari residu (gradien loss) dari gabungan pohon sebelumnya. Hiperparameter utama: `learning_rate`, `n_estimators`, `max_depth`. Implementasi populer: **XGBoost**, **LightGBM**, **CatBoost**, dan `HistGradientBoosting` sklearn.

```python
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
rf = RandomForestClassifier(n_estimators=400, min_samples_leaf=5, n_jobs=-1, random_state=0)
gb = HistGradientBoostingClassifier(learning_rate=0.05, max_iter=600, early_stopping=True, random_state=0)
```

## Pipeline & preprocessing

Preprocessing harus dipelajari **hanya dari data latih**. `Pipeline` dan `ColumnTransformer` memastikan hal itu, sekaligus membuat model siap dipakai di produksi sebagai satu objek.

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.model_selection import RandomizedSearchCV
import joblib

pre = ColumnTransformer([
    ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]), num_cols),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
])
pipe = Pipeline([("pre", pre), ("model", HistGradientBoostingClassifier(random_state=0))])

cari = RandomizedSearchCV(pipe, {
    "model__learning_rate": [0.02, 0.05, 0.1],
    "model__max_depth": [None, 4, 8],
    "model__l2_regularization": [0, 0.1, 1.0],
}, n_iter=15, cv=5, scoring="average_precision", n_jobs=-1, random_state=0)
cari.fit(X_tr, y_tr)
print(cari.best_params_, cari.score(X_te, y_te))
joblib.dump(cari.best_estimator_, "model.joblib")        # satu artefak: preprocessing + model
```

**Scaling** penting untuk model berbasis jarak/gradien (kNN, SVM, logistic, K-means), tidak untuk model pohon. **One-hot** untuk kategori nominal; `handle_unknown="ignore"` mencegah error saat kategori baru muncul di produksi.

:::latihan
Milestone: kerjakan proyek end-to-end Bab 2 `handson-ml3` (harga rumah), lalu terapkan pola yang sama pada dataset tabular pilihanmu: EDA, Pipeline, bandingkan 4 model (linear, kNN, random forest, gradient boosting) dengan CV, tuning dengan RandomizedSearchCV, learning curve, dan evaluasi akhir sekali pada test set. Tambahkan satu analisis clustering untuk segmentasi dan tafsirkan setiap segmen.
:::

## Rangkuman

- Supervised (regresi, klasifikasi) vs unsupervised (clustering, reduksi dimensi).
- Bias vs variance: diagnosis dengan celah train–validasi dan learning curve.
- CV untuk estimasi jujur; metrik dipilih dari biaya kesalahan.
- Tree mudah dijelaskan; random forest mengurangi variance; boosting umumnya terkuat di tabular.
- Pipeline + ColumnTransformer: preprocessing tanpa leakage dan satu artefak untuk produksi.
