---
title: Matematika ML & Python
minutes: 55
summary: Machine learning pada dasarnya adalah optimasi fungsi dengan aljabar linear dan probabilitas. Modul ini membangun intuisi vektor, matriks, dan dot product, turunan dan gradient descent, probabilitas dan likelihood, lalu menerapkan semuanya dengan NumPy.
objectives:
  - Memandang data dan model sebagai operasi vektor dan matriks
  - Menjelaskan turunan, gradien, dan cara gradient descent meminimalkan loss
  - Menghubungkan loss function dengan maximum likelihood
  - Mengimplementasikan regresi linear dan logistik dari nol dengan NumPy
sources:
  - repo: afshinea/stanford-cs-229-machine-learning
    note: Cheatsheet CS229 Stanford (aljabar linear, probabilitas, ML)
  - repo: rougier/numpy-100
    note: 100 latihan NumPy
  - repo: trekhleb/homemade-machine-learning
    note: Implementasi algoritme ML dari nol dengan penjelasan
quiz:
  - q: "Jika X berukuran (1000, 5) dan w berukuran (5,), maka X @ w berukuran…"
    options: ["(5,)", "(1000,)", "(1000, 5)", "Error"]
    answer: 1
    explain: "Setiap baris (5 fitur) di-dot dengan w menghasilkan satu prediksi per sampel."
  - q: "Learning rate terlalu besar pada gradient descent biasanya menyebabkan…"
    options: ["Konvergensi sangat lambat", "Loss berosilasi atau meledak (divergen)", "Model underfit selalu", "Tidak berpengaruh"]
    answer: 1
    explain: "Langkah terlalu jauh melompati minimum; coba langsung di visualisasi."
  - q: "Meminimalkan Mean Squared Error setara dengan maximum likelihood jika noise diasumsikan…"
    options: ["Seragam", "Normal (Gaussian)", "Poisson", "Tidak ada noise"]
    answer: 1
    explain: "Log-likelihood Gaussian sebanding dengan negatif jumlah kuadrat error."
  - q: "Gradien sebuah fungsi di suatu titik menunjuk ke arah…"
    options: ["Penurunan tercuram", "Kenaikan tercuram", "Nol", "Sumbu x"]
    answer: 1
    explain: "Karena itu gradient descent bergerak ke arah negatif gradien."
---

Kamu bisa memakai scikit-learn tanpa matematika, tetapi kamu akan kesulitan saat model tidak konvergen, saat harus memilih loss function, atau saat membaca paper. Kabar baiknya, matematika inti ML hanya tiga: **aljabar linear** (bagaimana data dan model direpresentasikan), **kalkulus** (bagaimana model belajar), dan **probabilitas** (mengapa loss tertentu masuk akal).

## Vektor, matriks, dot product

Satu sampel dengan k fitur adalah **vektor** x ∈ ℝᵏ. Dataset n sampel adalah **matriks** X berukuran n × k. Model linear punya bobot w ∈ ℝᵏ dan bias b.

- **Dot product** w·x = Σ wᵢxᵢ: jumlah tertimbang fitur. Inilah inti regresi linear, regresi logistik, dan setiap neuron.
- **Perkalian matriks** X @ w menghitung dot product untuk semua sampel sekaligus: hasil (n,).
- **Norm** ‖w‖₂ = √Σwᵢ²: ‘ukuran’ vektor, dipakai di regularisasi L2.
- **Transpose**, **inverse**, dan **rank** muncul di solusi tertutup regresi linear: w = (XᵀX)⁻¹Xᵀy.

```python
import numpy as np
X = np.array([[1.0, 2.0], [3.0, 1.0], [0.5, 4.0]])   # 3 sampel, 2 fitur
w = np.array([0.4, -0.2]); b = 0.1
y_hat = X @ w + b                                     # [0.1, 1.1, -0.5]
cos = (X[0] @ X[1]) / (np.linalg.norm(X[0]) * np.linalg.norm(X[1]))   # kemiripan arah
```

Secara geometris, dot product besar berarti dua vektor searah; nol berarti tegak lurus. Intuisi ini dipakai lagi pada embedding dan attention di jalur [AI Engineer](/belajar/ai-engineer/ai-1).

## Turunan & gradient descent

Model **belajar** dengan meminimalkan **loss**: ukuran seberapa salah prediksinya. Untuk regresi, Mean Squared Error: L(w) = (1/n) Σ (ŷᵢ − yᵢ)².

**Turunan** dL/dw memberi tahu bagaimana loss berubah jika w sedikit diubah. Untuk banyak parameter, kumpulan turunan parsialnya adalah **gradien** ∇L, yang menunjuk ke arah kenaikan tercuram. Jadi kita melangkah ke arah sebaliknya:

**w ← w − η ∇L(w)**, dengan η = **learning rate**.

Coba ubah learning rate dan titik awal di bawah ini; perhatikan apa yang terjadi bila η terlalu kecil atau terlalu besar:

```viz
{"type":"gradient-descent"}
```

Untuk MSE regresi linear, gradiennya: ∇w = (2/n) Xᵀ(Xw + b − y), ∇b = (2/n) Σ(ŷ − y). **Aturan rantai** (chain rule) memungkinkan menghitung gradien fungsi berlapis, dan itulah dasar **backpropagation** di [modul deep learning](/belajar/machine-learning/ml-3).

Varian yang dipakai dalam praktik: **stochastic/mini-batch GD** (gradien dari sebagian data — lebih cepat dan sedikit ‘berisik’ yang justru membantu), **momentum**, dan **Adam** (learning rate adaptif per parameter).

## Probabilitas & likelihood

Kenapa MSE untuk regresi dan cross-entropy untuk klasifikasi? Karena keduanya muncul dari **maximum likelihood estimation (MLE)**: pilih parameter yang membuat data yang teramati paling mungkin.

- Jika y = wx + b + noise dengan noise **normal**, memaksimalkan likelihood ⇔ meminimalkan **MSE**.
- Untuk klasifikasi biner, model memprediksi p = σ(w·x + b) dengan **sigmoid** σ(z) = 1/(1+e⁻ᶻ). Likelihood Bernoulli menghasilkan **binary cross-entropy**: L = −[y log p + (1−y) log(1−p)].

```viz
{"type":"activation"}
```

Cross-entropy menghukum prediksi yang **yakin tetapi salah** dengan sangat berat (log(0,01) ≈ −4,6), sehingga model belajar untuk dikalibrasi. Konsep probabilitas lain yang sering muncul: **probabilitas bersyarat**, **teorema Bayes** (dasar Naive Bayes), **ekspektasi & varians**, dan **regularisasi sebagai prior** (L2 ⇔ prior Gaussian pada bobot).

## NumPy vektorisasi

Gabungkan semuanya: regresi logistik dari nol, tanpa satu pun loop atas sampel.

```python
import numpy as np
rng = np.random.default_rng(0)
n, k = 2_000, 3
X = rng.normal(size=(n, k))
w_true = np.array([1.5, -2.0, 0.7])
y = (rng.random(n) < 1 / (1 + np.exp(-(X @ w_true - 0.3)))).astype(float)

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

w = np.zeros(k); b = 0.0; lr = 0.1
for epoch in range(500):
    p = sigmoid(X @ w + b)                     # (n,)
    grad_w = X.T @ (p - y) / n                 # (k,)  — gradien cross-entropy
    grad_b = (p - y).mean()
    w -= lr * grad_w; b -= lr * grad_b
    if epoch % 100 == 0:
        loss = -np.mean(y * np.log(p + 1e-12) + (1 - y) * np.log(1 - p + 1e-12))
        print(epoch, round(loss, 4))

print(w.round(2), round(b, 2))                 # mendekati [1.5, -2.0, 0.7], -0.3
```

Perhatikan pola gradien `X.T @ (p - y) / n`: bentuknya sama untuk regresi linear (dengan p = ŷ). Latih kelancaran operasi array dengan `numpy-100`, dan bandingkan implementasimu dengan `homemade-machine-learning` serta `sklearn.linear_model.LogisticRegression`.

:::analogi[Gradient descent di kabut]
Bayangkan turun gunung dalam kabut tebal. Kamu tidak melihat lembah, hanya kemiringan tanah di bawah kaki. Strategi terbaik: langkah ke arah paling menurun, ulangi. Ukuran langkah adalah learning rate: terlalu kecil membuatmu kemalaman, terlalu besar membuatmu melompat ke lereng seberang.
:::

:::latihan
Milestone: implementasikan dari nol dengan NumPy (1) regresi linear dengan solusi tertutup dan dengan gradient descent, (2) regresi logistik dengan cross-entropy, lalu bandingkan hasil dan kecepatannya dengan scikit-learn. Plot kurva loss per epoch untuk tiga learning rate berbeda dan jelaskan perbedaannya. Kerjakan minimal 30 soal `numpy-100`.
:::

## Rangkuman

- Data = matriks, model linear = dot product; X @ w memprediksi semua sampel sekaligus.
- Gradien menunjuk kenaikan tercuram; gradient descent melangkah berlawanan dengan learning rate η.
- MSE dan cross-entropy lahir dari maximum likelihood dengan asumsi noise berbeda.
- Vektorisasi NumPy membuat implementasi ML ringkas dan cepat.
