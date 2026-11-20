---
title: Neural network dari nol
minutes: 60
summary: Cara terbaik memahami deep learning adalah membangunnya sendiri dari operasi paling dasar. Modul ini membangun neuron dan aktivasi, graf komputasi, backpropagation dengan aturan rantai, loss function, hingga language model karakter sederhana, mengikuti semangat seri Neural Networks Zero to Hero.
objectives:
  - Menjelaskan neuron dan peran fungsi aktivasi
  - Membangun graf komputasi kecil dan menghitung gradiennya secara manual
  - Mengimplementasikan autograd skalar mini (ala micrograd)
  - Memilih loss function yang tepat dan memahami hubungannya dengan probabilitas
  - Melatih language model karakter bigram dan MLP
sources:
  - repo: karpathy/nn-zero-to-hero
    note: Seri video & notebook micrograd hingga makemore (Andrej Karpathy)
  - repo: udlbook/udlbook
    note: Buku Understanding Deep Learning (Simon Prince) beserta notebook
quiz:
  - q: "Pada graf c = a × b, jika dL/dc = 2, a = 3, b = −4, maka dL/da adalah…"
    options: ["2", "−8", "6", "−4"]
    answer: 1
    explain: "dL/da = dL/dc × dc/da = 2 × b = 2 × (−4) = −8."
  - q: "Jika sebuah nilai dipakai di dua cabang graf, gradiennya…"
    options: ["Diambil dari cabang pertama saja", "Dijumlahkan dari semua cabang", "Dikalikan", "Dirata-rata"]
    answer: 1
    explain: "Aturan rantai multivariat: kontribusi setiap jalur dijumlahkan (karena itu micrograd memakai +=)."
  - q: "Loss awal language model karakter 27 kelas yang belum belajar seharusnya sekitar…"
    options: ["0", "−ln(1/27) ≈ 3,30", "27", "1"]
    answer: 1
    explain: "Prediksi seragam memberi peluang 1/27 untuk setiap karakter; loss jauh di atas ini menandakan inisialisasi buruk."
  - q: "Kenapa negative log-likelihood dipakai alih-alih likelihood langsung?"
    options: ["Lebih mudah diucapkan", "Perkalian banyak peluang kecil menjadi penjumlahan log yang stabil secara numerik, dan diminimalkan", "Karena hasilnya selalu positif dan bulat", "Tidak ada alasan"]
    answer: 1
    explain: "Log mengubah perkalian menjadi penjumlahan dan mencegah underflow."
---

Framework seperti PyTorch menyembunyikan detail yang justru penting untuk dipahami. Di modul ini kita membangun semuanya dari nol: dari satu neuron hingga model yang bisa ‘mengarang’ nama baru. Setelah ini, `loss.backward()` tidak lagi terasa seperti sihir.

## Neuron & aktivasi

Neuron buatan meniru gagasan sederhana: menerima beberapa input, memberi bobot, menjumlahkan, lalu ‘menyala’ sesuai fungsi aktivasi.

**out = f(w₁x₁ + w₂x₂ + … + b)**

```viz
{"type":"neuron"}
```

Tanpa fungsi aktivasi non-linear, menumpuk lapisan tidak menambah kemampuan karena komposisi fungsi linear tetap linear. Aktivasi menekuk ruang sehingga jaringan dapat membentuk batas keputusan yang rumit.

```viz
{"type":"activation"}
```

`tanh` dan sigmoid **jenuh** di nilai ekstrem: turunannya mendekati nol sehingga gradien ‘mati’. Karena itu inisialisasi bobot yang terlalu besar membuat neuron tanh jenuh sejak awal, dan **ReLU** menjadi pilihan default untuk jaringan dalam.

## Computational graph

Setiap perhitungan dapat ditulis sebagai **graf komputasi**: node berisi nilai, sisi menunjukkan operasi. Contoh:

```viz
{"type":"tree","root":{"label":"L = d × f","detail":"L = −8 × −2 = 16","children":[{"label":"d = e + c","detail":"−6 + (−2) = −8","children":[{"label":"e = a × b","detail":"2 × −3 = −6","children":[{"label":"a = 2"},{"label":"b = −3"}]},{"label":"c = −2"}]},{"label":"f = −2"}]}}
```

Forward pass menghitung dari daun ke akar. Pertanyaan training: **bagaimana L berubah jika setiap daun diubah sedikit?** Itulah gradien dL/da, dL/db, dan seterusnya.

Kita bisa memeriksa gradien secara **numerik**: ubah a sebesar h kecil dan lihat perubahan L. Cara ini lambat untuk jutaan parameter, tetapi sangat berguna untuk **memverifikasi** gradien analitik (*gradient checking*).

```python
def L_fn(a, b, c, f):
    return (a * b + c) * f
h = 1e-6
print((L_fn(2 + h, -3, -2, -2) - L_fn(2, -3, -2, -2)) / h)   # ≈ 6.0
```

## Backprop & chain rule

**Aturan rantai**: jika L bergantung pada d, dan d bergantung pada e, maka dL/de = dL/dd × dd/de. Backpropagation menerapkan aturan ini dari akar ke daun, setiap node hanya memakai **turunan lokalnya** dikalikan **gradien dari atas**:

- Penjumlahan (d = e + c): gradien **diteruskan apa adanya** ke kedua input.
- Perkalian (e = a × b): gradien ke a = gradien atas × b, dan sebaliknya.
- tanh: gradien × (1 − tanh²).

Pada contoh di atas: dL/dd = f = −2, dL/de = −2, dL/da = −2 × b = 6, dL/db = −2 × a = −4. Cocok dengan cek numerik.

Implementasi autograd skalar mini (inti dari **micrograd**):

```python
import math

class Value:
    def __init__(self, data, _children=(), _op=""):
        self.data, self.grad = data, 0.0
        self._backward = lambda: None
        self._prev = set(_children)

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), "+")
        def _backward():
            self.grad += out.grad          # += karena nilai bisa dipakai di banyak tempat
            other.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), "*")
        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _backward
        return out

    def tanh(self):
        t = math.tanh(self.data)
        out = Value(t, (self,), "tanh")
        def _backward():
            self.grad += (1 - t * t) * out.grad
        out._backward = _backward
        return out

    def backward(self):
        urut, dikunjungi = [], set()
        def topo(v):                          # urutan topologis: anak sebelum induk
            if v not in dikunjungi:
                dikunjungi.add(v)
                for c in v._prev: topo(c)
                urut.append(v)
        topo(self)
        self.grad = 1.0
        for v in reversed(urut):
            v._backward()
```

Dengan sekitar 100 baris (plus kelas Neuron, Layer, MLP), kamu sudah bisa melatih jaringan kecil. PyTorch melakukan hal yang sama, tetapi pada **tensor** dan dengan kernel yang dioptimasi.

## Loss function

**Loss** mengubah ‘seberapa salah’ menjadi satu angka yang bisa diminimalkan.

```viz
{"type":"compare","columns":["Tugas","Output akhir","Loss"],"rows":[{"label":"Regresi","values":["Linear (tanpa aktivasi)","MSE / MAE / Huber"]},{"label":"Klasifikasi biner","values":["Sigmoid → p","Binary cross-entropy"]},{"label":"Multikelas","values":["Softmax → distribusi","Cross-entropy (negative log-likelihood)"]},{"label":"Kemiripan / embedding","values":["Vektor","Contrastive / triplet loss"]}]}
```

Untuk klasifikasi, model menghasilkan **logits**, softmax mengubahnya menjadi peluang, dan loss = −log(peluang kelas yang benar). Peluang 0,9 → loss 0,105; peluang 0,01 → loss 4,6. Loss rata-rata pada dataset disebut **negative log-likelihood** rata-rata. Untuk stabilitas numerik, framework menggabungkan softmax dan log (`log_softmax`, `cross_entropy` menerima logits).

## Language model karakter sederhana

Tujuan: diberi daftar nama, model belajar menghasilkan nama baru yang ‘terdengar mirip’. Ini versi mini dari cara kerja LLM: **memprediksi token berikutnya**.

**Langkah 1 — bigram dengan menghitung.** Hitung berapa kali setiap karakter diikuti karakter lain, normalisasi menjadi peluang, lalu sampel.

```python
import torch
nama = open("names.txt").read().splitlines()
chars = sorted(set("".join(nama))); stoi = {c: i + 1 for i, c in enumerate(chars)}; stoi["."] = 0
itos = {i: c for c, i in stoi.items()}
N = torch.zeros((27, 27))
for w in nama:
    cs = ["."] + list(w) + ["."]
    for c1, c2 in zip(cs, cs[1:]):
        N[stoi[c1], stoi[c2]] += 1
P = (N + 1) / (N + 1).sum(1, keepdim=True)      # +1 = smoothing agar tak ada peluang nol
```

**Langkah 2 — bigram sebagai jaringan.** Input one-hot karakter (27) → matriks bobot W (27×27) → softmax → cross-entropy. Dengan gradient descent, W belajar hingga loss-nya sama dengan model hitungan. Inilah poin pentingnya: **pendekatan neural menyamai statistik hitungan, tetapi dapat diperluas**.

**Langkah 3 — MLP dengan konteks lebih panjang** (Bengio et al., 2003): ambil 3 karakter sebelumnya, ubah setiap karakter menjadi **embedding** vektor kecil, sambungkan, lewatkan lapisan tersembunyi tanh, lalu softmax 27 kelas.

```python
g = torch.Generator().manual_seed(42)
C  = torch.randn((27, 10), generator=g)               # embedding 10 dimensi
W1 = torch.randn((30, 200), generator=g) * 0.2; b1 = torch.zeros(200)
W2 = torch.randn((200, 27), generator=g) * 0.01; b2 = torch.zeros(27)   # kecil → loss awal ≈ 3,3
params = [C, W1, b1, W2, b2]
for p in params: p.requires_grad = True

for i in range(50_000):
    ix = torch.randint(0, Xtr.shape[0], (64,))
    emb = C[Xtr[ix]].view(-1, 30)                     # (64, 3*10)
    h = torch.tanh(emb @ W1 + b1)
    logits = h @ W2 + b2
    loss = torch.nn.functional.cross_entropy(logits, Ytr[ix])
    for p in params: p.grad = None
    loss.backward()
    lr = 0.1 if i < 30_000 else 0.01
    for p in params: p.data -= lr * p.grad
```

Perhatikan inisialisasi W2 yang kecil: loss awal yang wajar untuk 27 kelas adalah −ln(1/27) ≈ 3,30. Jika loss awal jauh lebih tinggi, model ‘yakin tapi salah’ sejak awal dan membuang iterasi pertama. Lanjutan seri ini membangun batch normalization, WaveNet, hingga GPT kecil di [modul paper & Transformer](/belajar/deep-learning/dl-4).

:::latihan
Milestone: ikuti video 1–3 `nn-zero-to-hero`. Bangun micrograd sendiri (tanpa melihat kode) lalu latih MLP kecil untuk klasifikasi dua bulan sabit; verifikasi gradiennya dengan gradient checking. Latih language model karakter MLP pada daftar nama Indonesia (kumpulkan sendiri ±2.000 nama), laporkan loss train/dev, dan tampilkan 20 nama hasil sampling.
:::

## Rangkuman

- Neuron = f(w·x + b); aktivasi non-linear, waspadai saturasi tanh/sigmoid.
- Graf komputasi: forward dari daun, backward dari akar; cek gradien secara numerik.
- Backprop = aturan rantai dengan turunan lokal; gradien dijumlahkan bila nilai bercabang.
- Loss dipilih sesuai tugas; cross-entropy = negative log-likelihood atas logits.
- Language model karakter: bigram → jaringan → MLP dengan embedding; perhatikan loss awal.
