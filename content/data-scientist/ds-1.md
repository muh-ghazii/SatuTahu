---
title: Matematika & statistik untuk data
minutes: 60
summary: Data science adalah statistik yang dijalankan dengan komputer. Modul ini membangun intuisi probabilitas dan distribusi, estimasi dengan confidence interval, uji hipotesis dan arti sebenarnya p-value, regresi linear, aljabar linear yang dipakai model, serta cara berpikir Bayesian.
objectives:
  - Menjelaskan distribusi umum dan kapan masing-masing muncul
  - Menghitung dan menafsirkan confidence interval dengan benar
  - Melakukan uji hipotesis dan menghindari salah tafsir p-value
  - Membaca koefisien regresi dan memahami operasi vektor-matriks yang mendasarinya
  - Memperbarui keyakinan dengan teorema Bayes
sources:
  - repo: ossu/data-science
    note: Kurikulum matematika & statistik terbuka
  - repo: CamDavidsonPilon/Probabilistic-Programming-and-Bayesian-Methods-for-Hackers
    note: Pendekatan Bayesian berbasis kode
  - repo: datasciencemasters/go
    note: Daftar bacaan statistik
quiz:
  - q: "p-value = 0,03 artinya…"
    options: ["Peluang H0 benar adalah 3%", "Jika H0 benar, peluang mendapat data seekstrem ini (atau lebih) adalah 3%", "Efeknya besar", "Peluang hasil bisa direplikasi 97%"]
    answer: 1
    explain: "p-value adalah peluang data diberikan H0, bukan peluang H0 diberikan data."
  - q: "CI 95% untuk rata-rata = [48, 56]. Tafsiran yang tepat…"
    options: ["95% data berada di 48–56", "Prosedur ini, jika diulang, menghasilkan interval yang memuat rata-rata sebenarnya 95% dari waktu", "Rata-rata sampel pasti 52", "Ada 95% individu bernilai 52"]
    answer: 1
    explain: "Keyakinan 95% melekat pada prosedurnya, bukan pada satu interval tertentu (tafsiran frequentist)."
  - q: "Tes penyakit langka (prevalensi 1%) dengan sensitivitas 99% dan false positive 5%. Seseorang positif. Peluang dia benar sakit kira-kira…"
    options: ["99%", "95%", "Sekitar 17%", "1%"]
    answer: 2
    explain: "0,99×0,01 / (0,99×0,01 + 0,05×0,99) ≈ 0,167. Base rate yang rendah mendominasi."
  - q: "Dalam regresi omzet = 2,1 + 0,8×iklan, koefisien 0,8 berarti…"
    options: ["Iklan pasti menyebabkan omzet naik 0,8", "Setiap kenaikan 1 unit iklan berasosiasi dengan kenaikan 0,8 unit omzet, variabel lain tetap", "Korelasi 0,8", "R² = 0,8"]
    answer: 1
    explain: "Koefisien adalah asosiasi; klaim kausal butuh desain yang mendukung."
---

Kamu bisa menjalankan `model.fit()` tanpa memahami statistik, tetapi kamu tidak akan bisa menjawab pertanyaan yang paling sering muncul di dunia nyata: *apakah perbedaan ini nyata atau kebetulan?*, *seberapa yakin kita?*, dan *kenapa modelnya bilang begitu?* Modul ini membangun fondasi itu dengan intuisi dan kode.

## Probabilitas & distribusi

**Probabilitas** mengukur ketidakpastian. Aturan dasar yang paling sering dipakai:

- P(A atau B) = P(A) + P(B) − P(A dan B)
- P(A dan B) = P(A) × P(B | A)  — **probabilitas bersyarat**
- A dan B **independen** jika P(B | A) = P(B)

**Distribusi** menggambarkan bagaimana nilai-nilai variabel acak tersebar. Yang paling sering muncul:

```viz
{"type":"compare","columns":["Distribusi","Contoh di dunia nyata","Parameter"],"rows":[{"label":"Bernoulli / Binomial","values":["Klik/tidak; jumlah konversi dari n pengunjung","p (dan n)"]},{"label":"Poisson","values":["Jumlah pesanan per jam","λ (rata-rata kejadian)"]},{"label":"Normal","values":["Tinggi badan; error pengukuran; rata-rata sampel","μ, σ"]},{"label":"Log-normal","values":["Pendapatan, nilai transaksi (miring ke kanan)","μ, σ dari log"]},{"label":"Eksponensial","values":["Waktu antar kedatangan pelanggan","λ"]}]}
```

Mengapa distribusi Normal begitu sering muncul? Karena **Teorema Limit Pusat**: rata-rata dari banyak sampel acak cenderung berdistribusi normal, apa pun distribusi aslinya. Coba geser parameter di bawah:

```viz
{"type":"distribution"}
```

```python
import numpy as np
rng = np.random.default_rng(42)
transaksi = rng.lognormal(mean=11, sigma=0.8, size=100_000)    # miring kanan
rata_sampel = [rng.choice(transaksi, 50).mean() for _ in range(5_000)]
# histogram rata_sampel akan tampak normal — inilah CLT
```

## Estimasi & confidence interval

Kita hampir tidak pernah mengamati seluruh populasi; kita mengestimasi dari **sampel**. Rata-rata sampel bervariasi dari sampel ke sampel, dan variasinya diukur dengan **standard error**: SE = s / √n. Perhatikan √n: untuk memperkecil ketidakpastian setengahnya, kamu butuh **empat kali** data.

**Confidence interval 95%** ≈ rata-rata ± 1,96 × SE.

```python
from scipy import stats
x = df["nilai_transaksi"]
se = x.std(ddof=1) / np.sqrt(len(x))
ci = stats.t.interval(0.95, df=len(x) - 1, loc=x.mean(), scale=se)

# bootstrap: tanpa asumsi distribusi, cukup simulasi ulang
boot = [x.sample(len(x), replace=True).median() for _ in range(5_000)]
ci_median = np.percentile(boot, [2.5, 97.5])
```

**Bootstrap** sangat berguna untuk statistik yang rumusnya rumit (median, rasio, persentil): ambil sampel ulang dengan pengembalian ribuan kali dan lihat sebaran hasilnya.

## Uji hipotesis & p-value

Kerangka uji hipotesis:

```viz
{"type":"flow","title":"Alur uji hipotesis","steps":[{"label":"H0 & H1","detail":"H0: tidak ada perbedaan. H1: ada perbedaan. Tetapkan sebelum melihat data."},{"label":"Pilih uji & α","detail":"t-test, uji proporsi, chi-square, Mann-Whitney… α biasanya 0,05."},{"label":"Hitung statistik","detail":"Seberapa jauh data dari yang diharapkan jika H0 benar."},{"label":"p-value","detail":"Peluang mendapat hasil seekstrem ini bila H0 benar."},{"label":"Keputusan + efek","detail":"Laporkan besar efek dan CI, bukan hanya ‘signifikan’."}]}
```

**Kesalahan tafsir yang sangat umum:**

- p-value **bukan** peluang H0 benar.
- p > 0,05 **bukan** bukti tidak ada efek; mungkin sampel terlalu kecil (**power** rendah).
- Signifikan secara statistik ≠ **penting secara praktis**. Dengan sejuta data, selisih 0,01% pun bisa signifikan.
- Menguji banyak hal lalu melaporkan yang signifikan saja (**p-hacking**) menghasilkan temuan palsu. Koreksi Bonferroni atau kontrol FDR membantu.

```python
from scipy import stats
a = df.loc[df.grup == "A", "durasi"]; b = df.loc[df.grup == "B", "durasi"]
t, p = stats.ttest_ind(a, b, equal_var=False)       # Welch t-test
d = (b.mean() - a.mean()) / np.sqrt((a.var() + b.var()) / 2)   # Cohen's d (besar efek)
```

## Regresi linear

Regresi linear memodelkan y sebagai kombinasi linear fitur: ŷ = β₀ + β₁x₁ + … + βₖxₖ, dengan β dipilih untuk meminimalkan jumlah kuadrat residu (OLS). Geser titik dan amati garisnya:

```viz
{"type":"regression"}
```

```python
import statsmodels.formula.api as smf
m = smf.ols("omzet ~ iklan + diskon + C(kota)", data=df).fit()
print(m.summary())      # koefisien, SE, p-value, CI, R²
```

Hal yang harus diperiksa: **residu** (pola melengkung = hubungan tidak linear), **heteroskedastisitas**, **multikolinearitas** (fitur saling berkorelasi tinggi membuat koefisien tidak stabil), dan **outlier berpengaruh**. Ingat, koefisien adalah **asosiasi kondisional**, bukan efek kausal.

## Aljabar linear dasar

Hampir semua model ML adalah operasi pada **vektor** dan **matriks**. Dataset dengan n baris dan k fitur adalah matriks X (n × k); prediksi regresi linear seluruh data adalah satu perkalian: ŷ = Xβ.

- **Dot product** a·b = Σ aᵢbᵢ: mengukur ‘keselarasan’ dua vektor. Cosine similarity = a·b / (‖a‖‖b‖) dipakai di sistem rekomendasi dan embedding.
- **Perkalian matriks**: komposisi transformasi; (n×k)(k×1) = (n×1).
- **Solusi OLS**: β = (XᵀX)⁻¹Xᵀy.
- **Eigenvector/eigenvalue**: arah yang hanya diregangkan oleh transformasi. Dasar **PCA** untuk reduksi dimensi.

```python
X = np.column_stack([np.ones(len(df)), df[["iklan", "diskon"]]])
y = df["omzet"].to_numpy()
beta = np.linalg.lstsq(X, y, rcond=None)[0]     # lebih stabil daripada inv(X.T @ X)
```

## Pendekatan Bayesian

Statistik **Bayesian** memperlakukan parameter sebagai sesuatu yang kita punya keyakinan tentangnya, lalu memperbarui keyakinan itu dengan data:

**posterior ∝ likelihood × prior**, dari teorema Bayes P(H | D) = P(D | H) P(H) / P(D).

Contoh klasik base rate: tes penyakit dengan sensitivitas 99% dan false positive 5% pada prevalensi 1%. Dari 10.000 orang, 100 sakit (99 positif) dan 9.900 sehat (495 positif). Dari 594 orang positif, hanya 99 yang sakit: **±17%**. Intuisi sering meleset karena mengabaikan prior.

Untuk konversi, model Beta-Binomial memberi jawaban yang langsung mudah dipahami pemangku kepentingan:

```python
a_post = rng.beta(1 + 412, 1 + 10_000 - 412, 100_000)
b_post = rng.beta(1 + 468, 1 + 10_000 - 468, 100_000)
print("P(B > A) =", (b_post > a_post).mean())     # mis. 0,97
```

:::latihan
Milestone: pilih satu dataset publik dan tulis notebook yang (1) menyimulasikan CLT, (2) menghitung CI rata-rata dengan rumus dan bootstrap, (3) menjalankan satu uji hipotesis lengkap dengan besar efek, (4) model regresi dengan diagnostik residu, dan (5) analisis Bayesian Beta-Binomial untuk satu proporsi. Tulis tafsiran setiap hasil dalam satu kalimat yang dapat dipahami orang non-statistik.
:::

## Rangkuman

- Kenali distribusi umum; CLT menjelaskan kenapa rata-rata sampel normal.
- SE = s/√n; CI menyatakan ketidakpastian estimasi; bootstrap untuk statistik rumit.
- p-value ≠ peluang H0 benar; laporkan besar efek dan hindari p-hacking.
- Regresi: periksa residu dan multikolinearitas; koefisien = asosiasi.
- Aljabar linear (dot product, matriks, eigen) adalah bahasa model ML.
- Bayes: posterior ∝ likelihood × prior; jangan abaikan base rate.
