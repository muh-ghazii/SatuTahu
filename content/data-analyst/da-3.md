---
title: Python & pandas untuk analisis data
minutes: 50
summary: Python dengan pandas mengotomasi pekerjaan yang di spreadsheet dilakukan dengan klik berulang-ulang, dan mampu menangani jutaan baris. Modul ini membahas Python secukupnya untuk analisis, array NumPy, operasi inti pandas, analisis deret waktu, dan cara bekerja yang rapi di Jupyter Notebook.
objectives:
  - Memakai struktur Python dasar untuk mengolah data
  - Melakukan operasi vektor dengan NumPy alih-alih loop
  - Menyaring, mengelompokkan, menggabungkan, dan mem-pivot DataFrame
  - Menganalisis data deret waktu dan menyusun notebook yang dapat diulang
sources:
  - repo: wesm/pydata-book
    note: Notebook buku Python for Data Analysis (oleh pembuat pandas)
  - repo: guipsamora/pandas_exercises
    note: Latihan filtering, grouping, dan merge
  - repo: rougier/numpy-100
    note: Latihan operasi array NumPy
  - repo: Asabeneh/30-Days-Of-Python
    note: Rujukan Python dasar
  - repo: bellshade/Python
    note: Padanan istilah Bahasa Indonesia
quiz:
  - q: "Cara pandas yang benar untuk memilih baris dengan kota Kotabaru DAN qty > 10 adalah…"
    options: ["df[df.kota == 'Kotabaru' and df.qty > 10]", "df[(df.kota == 'Kotabaru') & (df.qty > 10)]", "df.where(kota='Kotabaru', qty>10)", "df.filter('Kotabaru', 10)"]
    answer: 1
    explain: "Untuk Series gunakan & dan |, dan setiap kondisi dibungkus kurung. and/or Python biasa akan error."
  - q: "Kenapa operasi NumPy seperti harga * qty jauh lebih cepat daripada loop Python?"
    options: ["Python tidak bisa loop", "Operasi vektor dijalankan di kode C yang dioptimasi pada array bertipe seragam", "NumPy memakai internet", "Karena hasilnya dibulatkan"]
    answer: 1
    explain: "Vektorisasi menghindari overhead interpretasi per elemen."
  - q: "Untuk menggabungkan tabel penjualan dengan tabel produk berdasarkan produk_id, fungsi pandas yang tepat adalah…"
    options: ["pd.concat", "df.merge(produk, on='produk_id', how='left')", "df.append", "df.join_all"]
    answer: 1
    explain: "merge setara JOIN di SQL; concat menumpuk tabel atas-bawah atau berdampingan."
  - q: "df.resample('MS', on='tanggal')['omzet'].sum() menghasilkan…"
    options: ["Omzet per hari", "Omzet per bulan (label awal bulan)", "Omzet per tahun", "Error"]
    answer: 1
    explain: "resample mengelompokkan berdasarkan frekuensi waktu; 'MS' = month start."
---

Bayangkan setiap minggu kamu mengunduh laporan penjualan, membersihkannya dengan langkah yang sama, membuat pivot yang sama, lalu menyalin grafiknya ke laporan. Dengan Python, semua itu menjadi satu script yang dijalankan dalam detik dan **dapat diulang persis**. Itulah alasan utama analyst belajar Python.

Siapkan lingkungan: pasang Python 3.11+, buat virtual environment, lalu `pip install pandas numpy matplotlib seaborn jupyterlab`. Atau gunakan **Google Colab** (gratis, tanpa instalasi).

## Python dasar

Untuk analisis, kamu tidak perlu menguasai seluruh Python. Fokus pada bagian ini:

```python
# tipe data & struktur bawaan
produk = ["Gamis", "Jilbab", "Seragam"]                 # list
harga = {"Gamis": 150_000, "Jilbab": 45_000}            # dict
kota_unik = {"Banjarmasin", "Kotabaru"}                 # set

# loop & comprehension
total = sum(harga[p] for p in harga)
mahal = [p for p, h in harga.items() if h > 100_000]    # ['Gamis']

# fungsi kecil yang bisa dipakai ulang
def rupiah(n: float) -> str:
    return f"Rp{n:,.0f}".replace(",", ".")

print(rupiah(1250000))                                  # Rp1.250.000

# membaca file
import pandas as pd
df = pd.read_csv("penjualan.csv", parse_dates=["tanggal"])
```

Konsep dasar Python yang lebih lengkap (fungsi, error handling, modul) ada di modul [Python sebagai bahasa pertama](/belajar/fondasi/fd-2).

## NumPy array

**NumPy** menyediakan array bertipe seragam yang operasinya dijalankan sekaligus (**vektorisasi**), bukan elemen demi elemen dengan loop Python.

```python
import numpy as np

qty   = np.array([2, 5, 1, 12, 3])
harga = np.array([150_000, 45_000, 150_000, 40_000, 45_000])

omzet = qty * harga                      # perkalian per elemen, tanpa loop
print(omzet.sum(), omzet.mean())         # 1155000 231000.0
print(omzet[omzet > 200_000])            # boolean indexing: [300000 225000 480000]
print(np.percentile(omzet, [25, 50, 75]))

# broadcasting: diskon 10% ke semua harga sekaligus
harga_diskon = harga * 0.9
```

pandas dibangun di atas NumPy: setiap kolom DataFrame pada dasarnya adalah array. Jika kamu menulis `for` untuk menghitung sesuatu pada setiap baris DataFrame, kemungkinan besar ada cara vektor yang jauh lebih cepat.

## pandas: filter, groupby, merge, pivot

**DataFrame** adalah tabel dengan kolom bernama, seperti sheet di spreadsheet tetapi dapat diprogram.

```python
df.head()            # 5 baris pertama
df.info()            # tipe kolom & nilai kosong
df.describe()        # statistik deskriptif kolom numerik
df["kota"].value_counts()

# membuat kolom baru (vektor)
df["omzet"] = df["qty"] * df["harga_satuan"]

# filter
besar = df[(df["kota"] == "Kotabaru") & (df["omzet"] >= 1_000_000)]
dua_kota = df[df["kota"].isin(["Kotabaru", "Banjarmasin"])]
q = df.query("qty > 10 and produk == 'Gamis'")        # alternatif yang lebih terbaca
```

**groupby** adalah pivot table versi kode, dengan pola split–apply–combine:

```viz
{"type":"groupby"}
```

```python
ringkas = (
    df.groupby("produk")
      .agg(transaksi=("omzet", "size"),
           omzet=("omzet", "sum"),
           rata_qty=("qty", "mean"),
           pelanggan_unik=("pelanggan_id", "nunique"))
      .sort_values("omzet", ascending=False)
)
ringkas["kontribusi_%"] = (ringkas["omzet"] / ringkas["omzet"].sum() * 100).round(1)
```

**merge** = JOIN; **pivot_table** = pivot spreadsheet:

```python
produk = pd.read_csv("produk.csv")                    # produk_id, kategori, harga_modal
df = df.merge(produk, on="produk_id", how="left", validate="many_to_one")   # validate menangkap duplikat kunci

tabel = df.pivot_table(index="kota", columns="kategori", values="omzet", aggfunc="sum", fill_value=0, margins=True)
```

:::tip[Method chaining]
Menulis langkah sebagai rantai `.query(...).assign(...).groupby(...)` membuat alur analisis terbaca dari atas ke bawah dan menghindari puluhan variabel sementara `df2`, `df3`, `df_final_baru`.
:::

## Time series dasar

Data bisnis hampir selalu punya dimensi waktu. pandas punya alat khusus untuk itu:

```python
df["tanggal"] = pd.to_datetime(df["tanggal"])
df["bulan"] = df["tanggal"].dt.to_period("M")
df["hari"] = df["tanggal"].dt.day_name()

# agregasi per bulan (MS = awal bulan)
bulanan = df.resample("MS", on="tanggal")["omzet"].sum()

# pertumbuhan dan rata-rata bergerak
tren = pd.DataFrame({
    "omzet": bulanan,
    "growth_%": bulanan.pct_change().mul(100).round(1),
    "rata_3bln": bulanan.rolling(3).mean(),
})

# pola musiman: rata-rata omzet per hari dalam seminggu
per_hari = df.groupby(df["tanggal"].dt.dayofweek)["omzet"].mean()
```

Hal yang perlu diwaspadai: **periode yang belum lengkap** (bulan berjalan tampak ‘anjlok’ karena baru 10 hari), **musiman** (bandingkan Ramadan tahun ini dengan Ramadan tahun lalu, bukan dengan bulan sebelumnya), dan **zona waktu** bila data berasal dari sistem berbeda.

```viz
{"type":"distribution"}
```

## Jupyter Notebook

**Jupyter Notebook** menggabungkan kode, hasil, grafik, dan narasi dalam satu dokumen, ideal untuk eksplorasi dan berbagi analisis. Tetapi notebook juga mudah menjadi berantakan. Kebiasaan yang membuat notebook dapat dipercaya:

```viz
{"type":"flow","title":"Struktur notebook analisis yang rapi","caption":"Uji terakhir sebelum berbagi: Restart Kernel & Run All. Jika gagal atau hasilnya berbeda, notebook belum bisa dipercaya.","steps":[{"label":"Judul & pertanyaan","detail":"Markdown di sel pertama: pertanyaan bisnis, sumber data, tanggal."},{"label":"Setup","detail":"Semua import & konfigurasi di sel awal; path file relatif."},{"label":"Muat & periksa","detail":"read_csv, info(), cek kosong & duplikat."},{"label":"Bersihkan","detail":"Langkah cleaning dengan komentar alasannya."},{"label":"Analisis","detail":"Setiap bagian diawali markdown pertanyaan kecil, diakhiri kesimpulan singkat."},{"label":"Ringkasan","detail":"Temuan utama & rekomendasi di akhir (atau di awal untuk pembaca sibuk)."}]}
```

- Jalankan sel **berurutan**; hindari sel yang bergantung pada sel di bawahnya.
- Jangan menyimpan hasil antara di variabel dengan nama samar; beri nama yang bermakna.
- Pindahkan fungsi yang dipakai berulang ke file `.py` dan import.
- Simpan notebook di Git; untuk laporan, ekspor ke HTML/PDF.

:::latihan
Milestone: notebook EDA (Exploratory Data Analysis) lengkap pada satu dataset publik (mis. dari Kaggle/BPS/awesome-public-datasets): muat & periksa, bersihkan dengan alasan, 3 analisis groupby, 1 merge, 1 pivot, analisis tren bulanan dengan growth dan rolling mean, serta ringkasan 5 temuan. Pastikan ‘Restart & Run All’ berjalan tanpa error. Latih kelancaran dengan `pandas_exercises` (minimal 3 bab).
:::

## Rangkuman

- Python secukupnya: list/dict, comprehension, fungsi kecil, membaca file.
- NumPy: operasi vektor dan boolean indexing, jauh lebih cepat dari loop.
- pandas: filter dengan `&`/`|` dan kurung, `groupby().agg()`, `merge(validate=...)`, `pivot_table`.
- Time series: `to_datetime`, `resample`, `pct_change`, `rolling`; waspadai periode tidak lengkap dan musiman.
- Notebook rapi: berurutan, bernarasi, dan lolos ‘Restart & Run All’.
