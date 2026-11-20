---
title: Visualisasi & dashboard
minutes: 45
summary: Grafik yang baik membuat pembaca paham dalam lima detik; grafik yang buruk membuat angka benar terlihat salah. Modul ini membahas cara memilih jenis grafik, membuatnya dengan Matplotlib dan Seaborn, prinsip data-ink, alat BI seperti Power BI dan Looker Studio, serta merancang dashboard KPI.
objectives:
  - Memilih jenis grafik berdasarkan pertanyaan yang ingin dijawab
  - Membuat grafik rapi dengan Matplotlib dan Seaborn
  - Menerapkan prinsip data-ink dan hierarki visual
  - Merancang dashboard KPI yang dipakai, bukan sekadar dipajang
sources:
  - repo: matplotlib/cheatsheets
    note: Lembar ringkas Matplotlib
  - repo: hal9ai/awesome-dataviz
    note: Kumpulan alat & rujukan visualisasi
  - repo: microsoft/powerbi-desktop-samples
    note: Contoh file Power BI dan model data
  - repo: rfordatascience/tidytuesday
    note: Dataset mingguan untuk latihan visualisasi
quiz:
  - q: "Untuk membandingkan omzet 12 produk, grafik yang paling mudah dibaca adalah…"
    options: ["Pie chart 12 irisan", "Bar chart horizontal yang diurutkan", "Grafik 3D", "Radar chart"]
    answer: 1
    explain: "Mata manusia membandingkan panjang jauh lebih akurat daripada sudut atau luas."
  - q: "Sumbu Y bar chart sebaiknya…"
    options: ["Dimulai dari nol", "Dimulai dari nilai terkecil agar perbedaan terlihat", "Logaritmik selalu", "Disembunyikan"]
    answer: 0
    explain: "Panjang batang mewakili nilai; memotong sumbu membuat perbedaan kecil tampak dramatis."
  - q: "Prinsip data-ink (Tufte) menyarankan…"
    options: ["Menambah ornamen agar menarik", "Menghapus tinta yang tidak membawa informasi data", "Selalu memakai warna sebanyak mungkin", "Memakai efek 3D"]
    answer: 1
    explain: "Gridline tebal, bayangan, dan efek 3D mengurangi rasio tinta yang benar-benar menyampaikan data."
  - q: "KPI yang baik pada dashboard biasanya ditampilkan bersama…"
    options: ["Pembanding (target atau periode lalu)", "Animasi", "Seluruh data mentah", "Logo besar"]
    answer: 0
    explain: "Angka tanpa konteks tidak bisa dinilai: 120 juta itu bagus atau buruk?"
---

Kebanyakan grafik yang buruk tidak salah secara angka; ia salah secara **pilihan**: jenis grafik yang tidak cocok, warna yang berlebihan, atau tidak jelas apa pesannya. Visualisasi adalah alat berpikir dan alat komunikasi, dan kedua fungsi itu menuntut kebiasaan yang berbeda.

## Memilih jenis grafik

Mulai dari **pertanyaan**, bukan dari jenis grafik yang tersedia:

```viz
{"type":"compare","columns":["Pertanyaan","Grafik utama","Hindari"],"rows":[{"label":"Perbandingan antarkategori","values":["Mana produk terlaris?","Bar (horizontal, diurutkan)","Pie dengan banyak irisan"]},{"label":"Tren waktu","values":["Bagaimana omzet per bulan?","Line chart","Bar 3D"]},{"label":"Distribusi","values":["Seberapa sebar nilai transaksi?","Histogram, box plot","Rata-rata saja"]},{"label":"Hubungan","values":["Apakah diskon terkait qty?","Scatter plot","Dual axis yang menyesatkan"]},{"label":"Komposisi","values":["Porsi omzet per kota?","Stacked bar, treemap; pie ≤ 3 irisan","Donut 10 irisan"]}]}
```

Alasannya ilmiah: manusia paling akurat membandingkan **posisi pada skala sama**, lalu panjang, lalu sudut dan luas, dan paling buruk pada volume dan warna. Itulah sebabnya bar chart hampir selalu mengalahkan pie chart.

## Matplotlib & Seaborn

**Matplotlib** memberi kontrol penuh; **Seaborn** menyediakan grafik statistik dengan sedikit kode. Gunakan antarmuka berorientasi objek (`fig, ax`) agar mudah dirapikan:

```python
import matplotlib.pyplot as plt
import seaborn as sns

top = df.groupby("produk")["omzet"].sum().sort_values()

fig, ax = plt.subplots(figsize=(8, 4.5))
warna = ["#c9c9c9"] * (len(top) - 1) + ["#e0a800"]        # sorot satu batang yang penting
ax.barh(top.index, top.values / 1e6, color=warna)
ax.set_title("Gamis menyumbang omzet terbesar kuartal ini", loc="left", fontweight="bold")
ax.set_xlabel("Omzet (juta Rp)")
ax.spines[["top", "right"]].set_visible(False)
for i, v in enumerate(top.values / 1e6):
    ax.text(v + 0.5, i, f"{v:.1f}", va="center")           # label langsung, tanpa perlu gridline
fig.tight_layout()
fig.savefig("top_produk.png", dpi=200)
```

Perhatikan judulnya: bukan "Omzet per Produk" tetapi **kalimat temuan**. Seaborn untuk eksplorasi cepat:

```python
sns.histplot(df, x="omzet", hue="kota", element="step")
sns.boxplot(df, x="kategori", y="omzet")
sns.scatterplot(df, x="diskon", y="qty", alpha=0.5)
sns.heatmap(df.pivot_table(index="hari", columns="jam", values="omzet", aggfunc="sum"), cmap="YlOrBr")
```

## Prinsip data-ink

Edward Tufte memperkenalkan **rasio data-ink**: proporsi tinta yang benar-benar menampilkan data. Hapus yang tidak membantu:

- Gridline tebal, bingkai, latar berwarna, bayangan, efek 3D.
- Legenda jika bisa diganti **label langsung** di ujung garis.
- Warna yang tidak berarti. Gunakan abu-abu untuk konteks dan **satu warna aksen** untuk hal yang ingin disorot.

Aksesibilitas juga bagian dari prinsip ini: sekitar 1 dari 12 pria buta warna merah–hijau, jadi jangan bergantung hanya pada merah vs hijau, dan pastikan kontras teks memadai.

```viz
{"type":"contrast"}
```

:::warning[Grafik yang menyesatkan]
Sumbu Y bar chart yang tidak dimulai dari nol, dua sumbu Y dengan skala yang dipilih seenaknya, dan memilih rentang waktu yang ‘menguntungkan’ adalah cara klasik berbohong dengan grafik, sering tanpa sengaja. Line chart boleh tidak mulai dari nol karena yang dibaca adalah perubahan, tetapi tuliskan skalanya dengan jelas.
:::

## Power BI / Looker Studio

Untuk dashboard yang diperbarui otomatis dan dipakai banyak orang, analyst biasanya memakai **alat BI**:

```viz
{"type":"compare","columns":["Power BI Desktop","Looker Studio"],"rows":[{"label":"Biaya","values":["Desktop gratis; berbagi online perlu lisensi Pro","Gratis dengan akun Google"]},{"label":"Kekuatan","values":["Model data (relasi tabel), DAX, Power Query","Integrasi Google Sheets, BigQuery, GA4"]},{"label":"Platform","values":["Windows","Browser"]},{"label":"Cocok untuk","values":["Perusahaan berbasis Microsoft","Tim kecil, data di ekosistem Google"]}]}
```

Konsep yang sama di keduanya: **sumber data** → **model** (relasi antara tabel fakta dan dimensi) → **measure** (ukuran terhitung) → **visual** → **filter/slicer**. Contoh measure DAX sederhana:

```text
Omzet = SUM(Penjualan[omzet])
Omzet Bulan Lalu = CALCULATE([Omzet], DATEADD('Kalender'[Tanggal], -1, MONTH))
Growth % = DIVIDE([Omzet] - [Omzet Bulan Lalu], [Omzet Bulan Lalu])
```

Kunci performa dan kebenaran ada di **model data**: tabel kalender terpisah, relasi satu-ke-banyak yang jelas, dan measure alih-alih kolom terhitung untuk agregasi.

## KPI & dashboard design

Dashboard yang baik menjawab pertanyaan **satu audiens** untuk **satu keputusan rutin**. Struktur yang terbukti bekerja:

```viz
{"type":"layers","layers":[{"label":"Baris KPI","detail":"3–5 angka utama + pembanding (target / periode lalu) + arah perubahan.","tag":"atas"},{"label":"Tren","detail":"Line chart KPI utama per minggu/bulan untuk konteks.","tag":"tengah"},{"label":"Rincian","detail":"Breakdown per kota/produk/kanal untuk mencari penyebab.","tag":"tengah"},{"label":"Detail & filter","detail":"Tabel rinci dan slicer untuk yang ingin menggali.","tag":"bawah"}]}
```

- **Sedikit KPI yang dipilih sungguh-sungguh** lebih baik daripada 20 angka yang sama pentingnya.
- Setiap KPI punya **definisi tertulis** (rumus, sumber, frekuensi pembaruan).
- Pola baca F/Z: yang terpenting di kiri atas.
- Uji dengan pengguna: minta mereka menjawab pertanyaan nyata memakai dashboard, lalu amati di mana mereka bingung.

:::latihan
Milestone: dashboard satu halaman (Looker Studio atau Power BI) untuk dataset penjualan, dengan 4 KPI berpembanding, satu tren, dua breakdown, dan filter periode. Lampirkan dokumen definisi KPI. Untuk latihan grafik, ikuti satu dataset `tidytuesday` dan buat ulang grafiknya dengan judul berupa kalimat temuan.
:::

## Rangkuman

- Pilih grafik dari pertanyaannya; panjang/posisi lebih akurat dibaca daripada sudut/luas.
- Matplotlib untuk kontrol, Seaborn untuk eksplorasi; judul berupa temuan, label langsung.
- Data-ink: buang dekorasi, abu-abu untuk konteks, satu warna aksen, perhatikan buta warna.
- Alat BI: model data → measure → visual; tabel kalender dan relasi yang benar.
- Dashboard: sedikit KPI dengan pembanding, struktur atas-ke-bawah, diuji ke pengguna.
