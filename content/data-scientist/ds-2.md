---
title: Python scientific stack
minutes: 45
summary: Data scientist menghabiskan sebagian besar waktunya menyiapkan dan menjelajah data. Modul ini membahas vektorisasi NumPy yang benar-benar cepat, teknik pandas tingkat lanjut, visualisasi eksploratif yang efisien, dan cara membuat notebook yang hasilnya dapat diulang orang lain.
objectives:
  - Mengganti loop dengan operasi vektor dan broadcasting
  - Memakai pandas lanjutan (tipe data, method chaining, window, reshape)
  - Melakukan EDA visual yang sistematis
  - Membuat analisis yang reproducible dari lingkungan hingga seed
sources:
  - repo: jakevdp/PythonDataScienceHandbook
    note: Bab NumPy, pandas, Matplotlib secara mendalam
  - repo: jakevdp/WhirlwindTourOfPython
    note: Tur Python ringkas untuk data scientist
  - repo: CodeCutTech/Efficient_Python_tricks_and_tools_for_data_scientists
    note: Trik efisiensi pandas & tooling
quiz:
  - q: "Broadcasting pada NumPy memungkinkan…"
    options: ["Mengirim array lewat jaringan", "Operasi antar array berbentuk berbeda tanpa menyalin data secara eksplisit", "Paralelisasi GPU otomatis", "Menyimpan array ke disk"]
    answer: 1
    explain: "Array (n,k) dikurangi array (k,) diperluas secara virtual mengikuti aturan bentuk."
  - q: "Mengubah kolom teks berulang (mis. kota) menjadi dtype 'category' terutama…"
    options: ["Menghemat memori dan mempercepat groupby", "Mengubah nilainya", "Menghapus duplikat", "Membuat kolom baru"]
    answer: 0
    explain: "Category menyimpan kode integer + kamus nilai unik."
  - q: "SettingWithCopyWarning biasanya muncul karena…"
    options: ["File CSV rusak", "Mengubah nilai pada hasil slicing yang mungkin berupa view", "Terlalu banyak kolom", "Versi Python lama"]
    answer: 1
    explain: "Gunakan .loc pada DataFrame asli atau .copy() secara eksplisit; pandas 3 memakai Copy-on-Write."
  - q: "Mana yang PALING membantu reproducibility?"
    options: ["Notebook yang dijalankan tidak berurutan", "Mengunci versi paket, menetapkan seed, dan data mentah tidak diubah", "Menyimpan hasil hanya di variabel", "Memakai path absolut C:/Users/..."]
    answer: 1
    explain: "Lingkungan, data, dan keacakan yang terkunci memastikan orang lain mendapat hasil yang sama."
---

Di kelas, data datang bersih dan kecil. Di dunia nyata, data berantakan, besar, dan analisisnya harus bisa diulang bulan depan oleh orang lain. Modul ini membahas alat dan kebiasaan yang membuat pekerjaan itu cepat dan dapat dipercaya. Dasar pandas ada di [Python & pandas untuk analisis data](/belajar/data-analyst/da-3); di sini kita melangkah lebih jauh.

## NumPy vektorisasi

Aturan praktis: **jika kamu menulis loop Python atas elemen array, kemungkinan ada versi vektor yang 10–100× lebih cepat.**

```python
import numpy as np
rng = np.random.default_rng(0)
X = rng.normal(size=(100_000, 8))

# standardisasi per kolom dengan broadcasting: (n,8) - (8,) / (8,)
Xs = (X - X.mean(axis=0)) / X.std(axis=0)

# jarak setiap titik ke 3 centroid sekaligus: (n,1,8) - (1,3,8) -> (n,3,8)
C = rng.normal(size=(3, 8))
jarak = np.linalg.norm(X[:, None, :] - C[None, :, :], axis=2)   # (n,3)
label = jarak.argmin(axis=1)

# kondisi vektor alih-alih if di dalam loop
kategori = np.select([X[:, 0] < -1, X[:, 0] > 1], ["rendah", "tinggi"], default="sedang")
```

**Aturan broadcasting**: bandingkan bentuk dari kanan; dimensi kompatibel jika sama atau salah satunya 1. Itulah yang dipakai algoritme k-means di bawah ini untuk menghitung jarak ke semua centroid sekaligus:

```viz
{"type":"kmeans"}
```

Perhatikan juga **axis**: `axis=0` beroperasi menyusuri baris (hasil per kolom), `axis=1` menyusuri kolom (hasil per baris).

## pandas lanjutan

**Tipe data yang tepat** menghemat memori dan waktu:

```python
df = pd.read_parquet("transaksi.parquet")          # parquet menyimpan tipe & jauh lebih cepat dari CSV
df = df.astype({"kota": "category", "produk": "category", "qty": "int32"})
df.memory_usage(deep=True).sum() / 1e6              # MB
```

**Method chaining** dengan `assign` dan `pipe`:

```python
def buang_outlier(d, kolom, q=0.99):
    return d[d[kolom] <= d[kolom].quantile(q)]

hasil = (
    df.query("status == 'selesai'")
      .assign(omzet=lambda d: d.qty * d.harga,
              bulan=lambda d: d.tanggal.dt.to_period("M"))
      .pipe(buang_outlier, "omzet")
      .groupby(["bulan", "kota"], observed=True)["omzet"].sum()
      .unstack("kota")                               # reshape long -> wide
)
```

**Operasi window per grup** dan **reshape**:

```python
df = df.sort_values(["pelanggan_id", "tanggal"])
df["order_ke"] = df.groupby("pelanggan_id").cumcount() + 1
df["hari_sejak_order_lalu"] = df.groupby("pelanggan_id")["tanggal"].diff().dt.days
df["omzet_share_kota"] = df["omzet"] / df.groupby("kota", observed=True)["omzet"].transform("sum")

long = wide.melt(id_vars="produk", var_name="bulan", value_name="omzet")    # wide -> long
```

`transform` mengembalikan hasil sepanjang DataFrame asli, sehingga bisa langsung dipakai sebagai kolom. Untuk data yang tidak muat di memori, pertimbangkan **Polars** atau **DuckDB**, yang menjalankan operasi serupa dengan eksekusi lazy dan multi-core.

## Visualisasi eksploratif

EDA visual bertujuan **menemukan**, bukan mempercantik. Lakukan secara sistematis:

```viz
{"type":"flow","title":"Urutan EDA visual","steps":[{"label":"Univariat","detail":"Histogram/box plot tiap kolom numerik; bar frekuensi untuk kategori. Cari kemiringan, outlier, nilai aneh (−1, 9999)."},{"label":"Kosong & kualitas","detail":"Pola missing per kolom/waktu; duplikat."},{"label":"Bivariat dengan target","detail":"Scatter/box target vs tiap fitur."},{"label":"Antar fitur","detail":"Matriks korelasi, pairplot sampel."},{"label":"Waktu & segmen","detail":"Tren per segmen; apakah pola berubah?"}]}
```

```python
import seaborn as sns
num = df.select_dtypes("number").columns
df[num].hist(bins=40, figsize=(12, 8))
sns.heatmap(df[num].corr(method="spearman"), annot=True, fmt=".2f", cmap="vlag", center=0)
sns.pairplot(df.sample(2_000, random_state=0), vars=num[:4], hue="segmen", corner=True)
df.isna().mean().sort_values(ascending=False).head(10)    # proporsi kosong
```

Untuk dataset besar, `ydata-profiling` atau `skrub.TableReport` dapat membuat ringkasan otomatis sebagai titik awal, tetapi jangan berhenti di laporan otomatis: pertanyaan yang tajam tetap harus datang darimu.

Gunakan korelasi **Spearman** jika hubungan monoton tetapi tidak linear atau ada outlier. Ingat **Anscombe's quartet**: empat dataset dengan statistik ringkasan identik tetapi bentuk yang sama sekali berbeda. Selalu plot datanya.

## Notebook yang reproducible

Hasil yang tidak bisa diulang tidak bisa dipercaya. Lapisan reproducibility:

```viz
{"type":"layers","layers":[{"label":"Lingkungan","detail":"Versi Python & paket dikunci: requirements.txt dengan versi, uv/poetry lock, atau environment.yml.","tag":"uv lock"},{"label":"Data","detail":"Data mentah read-only; setiap transformasi lewat kode. Catat sumber & tanggal unduh.","tag":"data/raw"},{"label":"Kode","detail":"Fungsi di modul .py, notebook untuk narasi; Git untuk riwayat.","tag":"src/"},{"label":"Keacakan","detail":"Seed untuk NumPy, sklearn, split data.","tag":"random_state"},{"label":"Eksekusi","detail":"Restart & Run All lulus; idealnya dijalankan ulang di CI atau papermill.","tag":"papermill"}]}
```

Struktur proyek yang umum:

```text
proyek/
├── data/raw/          # tidak pernah diubah
├── data/processed/
├── notebooks/01-eda.ipynb
├── src/fitur.py       # fungsi yang dipakai ulang & dites
├── pyproject.toml     # dependensi terkunci
└── README.md          # cara menjalankan
```

:::tip
Simpan output notebook yang besar ke file, bukan di dalam notebook, agar diff Git tetap terbaca. Alat seperti `nbstripout` membersihkan output sebelum commit.
:::

:::latihan
Milestone: ambil dataset ≥ 1 juta baris (mis. data perjalanan taksi NYC atau data transaksi publik). Ubah ke Parquet dengan dtype yang tepat dan bandingkan ukuran memori; tulis pipeline pandas dengan method chaining; lakukan EDA visual lima tahap; susun proyek dengan struktur di atas sehingga teman bisa menjalankannya dari nol dengan satu perintah.
:::

## Rangkuman

- Vektorisasi dan broadcasting menggantikan loop; perhatikan axis.
- pandas lanjutan: dtype tepat, Parquet, method chaining, `transform`, `melt`/`unstack`.
- EDA visual sistematis: univariat → kualitas → vs target → antar fitur → waktu/segmen.
- Reproducible: lingkungan terkunci, data mentah read-only, kode di modul, seed, Run All.
