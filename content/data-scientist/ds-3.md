---
title: Machine learning terapan
minutes: 60
summary: Model yang akurat di notebook sering gagal di dunia nyata karena validasi yang keliru atau kebocoran data. Modul ini membahas regresi dan klasifikasi, cross-validation yang benar, feature engineering, tree ensembles, interpretabilitas dengan SHAP, dan cara mencegah data leakage.
objectives:
  - Membangun baseline dan model regresi/klasifikasi dengan metrik yang tepat
  - Memvalidasi model dengan skema cross-validation yang sesuai data
  - Membuat fitur yang bermakna di dalam pipeline
  - Melatih gradient boosting dan menjelaskan prediksinya dengan SHAP
  - Mendeteksi dan mencegah data leakage
sources:
  - repo: microsoft/ML-For-Beginners
    note: Kurikulum ML klasik 12 minggu
  - repo: ageron/handson-ml3
    note: Notebook Hands-On Machine Learning edisi 3
  - repo: donnemartin/data-science-ipython-notebooks
    note: Kumpulan notebook scikit-learn & pandas
quiz:
  - q: "Pada data churn dengan 3% pelanggan churn, akurasi 97% bisa dicapai dengan…"
    options: ["Model yang sangat bagus", "Menebak ‘tidak churn’ untuk semua orang", "Gradient boosting saja", "Menambah fitur"]
    answer: 1
    explain: "Itulah kenapa akurasi menyesatkan pada data tidak seimbang; gunakan precision, recall, PR-AUC."
  - q: "Untuk data deret waktu, skema validasi yang tepat adalah…"
    options: ["KFold acak", "TimeSeriesSplit: latih di masa lalu, uji di masa depan", "Leave-one-out acak", "Tanpa validasi"]
    answer: 1
    explain: "Split acak membiarkan model ‘melihat masa depan’."
  - q: "Melakukan StandardScaler pada seluruh data sebelum train_test_split menyebabkan…"
    options: ["Tidak ada masalah", "Kebocoran informasi statistik data uji ke pelatihan", "Model lebih lambat", "Error"]
    answer: 1
    explain: "Preprocessing harus di-fit hanya pada data latih — pakai Pipeline."
  - q: "Nilai SHAP sebuah fitur untuk satu prediksi menunjukkan…"
    options: ["Korelasi fitur dengan target", "Kontribusi fitur itu mendorong prediksi dari nilai rata-rata model", "Pentingnya fitur di seluruh data saja", "Efek kausal fitur"]
    answer: 1
    explain: "SHAP bersifat lokal dan aditif; penjelasannya tentang model, bukan tentang kausalitas dunia nyata."
---

Membuat model itu mudah; membuat model yang **benar-benar bekerja pada data baru** itu sulit. Hampir semua kegagalan ML terapan berasal dari dua hal: validasi yang tidak mencerminkan kondisi produksi, dan informasi yang bocor dari masa depan atau dari target. Modul ini memakai scikit-learn dan menempatkan disiplin validasi di pusatnya.

## Regresi & klasifikasi

Selalu mulai dari **baseline** sederhana: rata-rata (regresi) atau kelas mayoritas (klasifikasi). Jika model canggihmu tidak jauh lebih baik dari baseline, ada yang salah.

```python
from sklearn.model_selection import train_test_split
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, average_precision_score

X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
base = DummyClassifier(strategy="most_frequent").fit(X_tr, y_tr)
model = LogisticRegression(max_iter=1000, class_weight="balanced").fit(X_tr, y_tr)
proba = model.predict_proba(X_te)[:, 1]
print(classification_report(y_te, proba > 0.5), average_precision_score(y_te, proba))
```

Pilih **metrik dari biaya bisnis**. Untuk churn, melewatkan pelanggan yang akan pergi (false negative) mungkin lebih mahal daripada memberi promo ke yang tidak perlu (false positive). Threshold 0,5 jarang optimal; pilih berdasarkan biaya.

```viz
{"type":"confusion"}
```

Untuk regresi: **MAE** (mudah dijelaskan, tahan outlier), **RMSE** (menghukum error besar), **MAPE** (persentase, tetapi rusak jika nilai aktual mendekati nol).

## Cross-validation

Satu split train/test memberi estimasi yang ‘beruntung’ atau ‘sial’. **K-fold cross-validation** melatih k kali pada bagian berbeda dan merata-ratakan hasilnya, sekaligus memberi gambaran variasinya.

```viz
{"type":"compare","columns":["Skema","Kapan dipakai"],"rows":[{"label":"StratifiedKFold","values":["Klasifikasi, menjaga proporsi kelas per fold"]},{"label":"GroupKFold","values":["Satu pelanggan/pasien punya banyak baris — grup tidak boleh muncul di train dan test sekaligus"]},{"label":"TimeSeriesSplit","values":["Data berurutan waktu — selalu latih di masa lalu, uji di masa depan"]},{"label":"Nested CV","values":["Tuning hyperparameter sekaligus estimasi performa yang jujur"]}]}
```

```python
from sklearn.model_selection import cross_validate, StratifiedKFold
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)
skor = cross_validate(pipe, X, y, cv=cv, scoring=["roc_auc", "average_precision"])
print({k: (v.mean().round(3), v.std().round(3)) for k, v in skor.items() if k.startswith("test")})
```

Tetap sisihkan **test set akhir** yang disentuh hanya sekali, setelah semua keputusan diambil. Setiap kali kamu melihat skor test lalu mengubah model, test set itu perlahan berubah menjadi data validasi.

## Feature engineering

Model hanya sebaik informasi yang diberikan. Fitur yang baik sering berasal dari **pemahaman domain**:

- **Agregasi perilaku**: jumlah transaksi 30 hari terakhir, rata-rata nilai pesanan, hari sejak transaksi terakhir (**RFM**: recency, frequency, monetary).
- **Waktu**: hari dalam minggu, akhir bulan (gajian), hari raya.
- **Rasio & interaksi**: nilai diskon / harga, qty × harga.
- **Kategori**: one-hot untuk sedikit kategori; target encoding (dengan CV di dalamnya!) untuk kategori banyak.
- **Teks**: TF-IDF atau embedding.

Bungkus semua preprocessing dalam **Pipeline** agar di-fit hanya pada data latih di setiap fold:

```python
from sklearn.pipeline import make_pipeline
from sklearn.compose import make_column_transformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

pre = make_column_transformer(
    (make_pipeline(SimpleImputer(strategy="median"), StandardScaler()), num_cols),
    (OneHotEncoder(handle_unknown="ignore", min_frequency=20), cat_cols),
)
pipe = make_pipeline(pre, LogisticRegression(max_iter=1000))
```

## Tree ensembles

Untuk data tabular, **gradient boosting** (XGBoost, LightGBM, CatBoost, atau `HistGradientBoostingClassifier` bawaan sklearn) hampir selalu menjadi model terkuat, sering mengalahkan deep learning.

```viz
{"type":"compare","columns":["Random Forest","Gradient Boosting"],"rows":[{"label":"Cara kerja","values":["Banyak pohon dalam dilatih paralel pada sampel bootstrap, hasil dirata-rata","Pohon dangkal dilatih berurutan, tiap pohon memperbaiki error sebelumnya"]},{"label":"Mengurangi","values":["Variance","Bias (dan variance dengan regularisasi)"]},{"label":"Tuning","values":["Sedikit, cukup tangguh","Lebih sensitif: learning rate, jumlah pohon, kedalaman"]},{"label":"Performa tabular","values":["Baik","Umumnya terbaik"]}]}
```

```python
from sklearn.ensemble import HistGradientBoostingClassifier
gb = HistGradientBoostingClassifier(learning_rate=0.05, max_iter=500, early_stopping=True,
                                    categorical_features="from_dtype", random_state=0)
```

Waspadai **overfitting**: performa latih terus naik, validasi berhenti atau turun. Early stopping, learning rate kecil, dan membatasi kedalaman membantu.

```viz
{"type":"overfit"}
```

## Interpretabilitas (SHAP)

Pemangku kepentingan bertanya *kenapa* model memprediksi pelanggan ini akan churn. **SHAP** (SHapley Additive exPlanations) membagi prediksi menjadi kontribusi setiap fitur, berdasarkan teori permainan: prediksi = nilai dasar + Σ kontribusi fitur.

```python
import shap
explainer = shap.TreeExplainer(model_lgbm)
sv = explainer(X_te)
shap.plots.beeswarm(sv)        # global: fitur mana paling berpengaruh dan ke arah mana
shap.plots.waterfall(sv[0])    # lokal: kenapa pelanggan ini diprediksi churn
```

Batasan penting: SHAP menjelaskan **model**, bukan dunia. Jika fitur saling berkorelasi, kontribusinya bisa terbagi tidak intuitif; dan pentingnya fitur ≠ efek kausal. Alternatif yang lebih sederhana: **permutation importance** dan **partial dependence plot**.

## Data leakage

**Leakage** terjadi ketika model memakai informasi yang tidak akan tersedia saat prediksi sungguhan. Hasilnya: skor validasi luar biasa, performa produksi hancur.

```viz
{"type":"tree","root":{"label":"Sumber leakage","children":[{"label":"Target leakage","detail":"Fitur yang merupakan akibat dari target","children":[{"label":"‘tanggal_refund’ untuk memprediksi pembatalan"},{"label":"‘dosis_obat’ untuk memprediksi diagnosis"}]},{"label":"Train–test contamination","detail":"Informasi test masuk ke pelatihan","children":[{"label":"Scaling/imputasi sebelum split"},{"label":"Baris duplikat di train & test"},{"label":"Pelanggan sama di kedua sisi"}]},{"label":"Temporal leakage","detail":"Memakai masa depan","children":[{"label":"Split acak pada data waktu"},{"label":"Agregat dihitung dari seluruh periode"}]}]}}
```

Pertanyaan pengujian untuk setiap fitur: **"Pada saat prediksi dibuat, apakah nilai ini sudah diketahui?"** Jika skor terlalu bagus untuk dipercaya, biasanya memang tidak bisa dipercaya: lihat fitur teratas di SHAP, sering pelakunya ada di sana.

:::latihan
Milestone: proyek prediksi churn atau default kredit (dataset publik). Bangun baseline, pipeline logistic regression, dan gradient boosting; validasi dengan skema CV yang sesuai; pilih threshold berdasarkan matriks biaya yang kamu definisikan; jelaskan model dengan SHAP; dan tulis audit leakage untuk setiap fitur.
:::

## Rangkuman

- Mulai dari baseline; pilih metrik dan threshold dari biaya bisnis.
- Skema CV harus meniru produksi: stratified, group, atau time series; test set disentuh sekali.
- Fitur dari domain; semua preprocessing di dalam Pipeline.
- Gradient boosting raja data tabular; waspadai overfitting.
- SHAP menjelaskan model, bukan kausalitas.
- Leakage: tanyakan ‘apakah nilai ini tersedia saat prediksi?’
