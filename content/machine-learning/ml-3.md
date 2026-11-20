---
title: Pengenalan deep learning
minutes: 55
summary: Deep learning menumpuk banyak lapisan neuron sederhana sehingga mampu mempelajari representasi dari data mentah seperti gambar, suara, dan teks. Modul ini membahas perceptron dan MLP, cara backpropagation menghitung gradien, dasar PyTorch, serta teknik melawan overfitting.
objectives:
  - Menjelaskan neuron, fungsi aktivasi, dan multilayer perceptron
  - Menelusuri forward dan backward pass dengan aturan rantai
  - Menulis training loop PyTorch yang benar
  - Menerapkan regularisasi (dropout, weight decay, early stopping, augmentasi)
sources:
  - repo: DataTalksClub/machine-learning-zoomcamp
    note: Modul deep learning zoomcamp (gratis)
  - repo: mrdbourke/zero-to-mastery-ml
    note: Materi PyTorch & deep learning pemula
quiz:
  - q: "Tanpa fungsi aktivasi non-linear, MLP berlapis banyak setara dengan…"
    options: ["Jaringan yang lebih kuat", "Satu transformasi linear saja", "Decision tree", "Random forest"]
    answer: 1
    explain: "Komposisi fungsi linear tetap linear; non-linearitas yang memberi daya ekspresi."
  - q: "Urutan yang benar dalam satu langkah training PyTorch adalah…"
    options: ["backward → zero_grad → forward → step", "zero_grad → forward → loss → backward → step", "step → forward → backward", "forward → step → backward"]
    answer: 1
    explain: "Gradien diakumulasi, jadi harus di-nol-kan setiap iterasi sebelum backward."
  - q: "Backpropagation pada dasarnya adalah…"
    options: ["Algoritme pencarian acak", "Penerapan aturan rantai secara efisien dari output ke input untuk menghitung gradien", "Metode memilih arsitektur", "Teknik augmentasi"]
    answer: 1
    explain: "Gradien setiap lapisan dihitung dari gradien lapisan sesudahnya."
  - q: "Saat evaluasi, model.eval() penting karena…"
    options: ["Mempercepat GPU", "Mematikan dropout dan memakai statistik batch norm yang tersimpan", "Menyimpan model", "Menghapus gradien"]
    answer: 1
    explain: "Dropout dan batch norm berperilaku berbeda saat training dan inferensi."
---

Model klasik membutuhkan fitur yang dirancang manusia. Untuk gambar, suara, dan teks, merancang fitur secara manual hampir mustahil. **Deep learning** belajar fiturnya sendiri: lapisan awal mendeteksi pola sederhana, lapisan berikutnya menyusunnya menjadi pola yang semakin abstrak.

## Perceptron & MLP

Satu **neuron** menghitung jumlah tertimbang input, menambahkan bias, lalu melewatkannya ke **fungsi aktivasi**: a = f(w·x + b). Coba ubah bobot dan input:

```viz
{"type":"neuron"}
```

**Perceptron** (Rosenblatt, 1958) memakai fungsi tangga dan hanya bisa memisahkan kelas secara linear; ia gagal pada XOR. Solusinya: tumpuk neuron menjadi **lapisan tersembunyi** dengan aktivasi **non-linear**. Inilah **multilayer perceptron (MLP)**.

```viz
{"type":"activation"}
```

- **ReLU** max(0, z): default untuk lapisan tersembunyi; murah dan gradiennya tidak menghilang untuk z > 0.
- **Sigmoid**: output 0–1 untuk klasifikasi biner di lapisan akhir.
- **Softmax**: mengubah skor menjadi distribusi probabilitas untuk multikelas.
- **GELU/SiLU**: varian halus yang populer di transformer.

**Universal approximation theorem** menyatakan MLP dengan satu lapisan tersembunyi yang cukup lebar dapat mendekati fungsi kontinu apa pun. Dalam praktik, jaringan **lebih dalam** belajar lebih efisien karena menyusun fitur secara hierarkis.

## Backpropagation

Training = mencari bobot yang meminimalkan loss dengan gradient descent (lihat [Matematika ML](/belajar/machine-learning/ml-1)). Masalahnya: jaringan punya jutaan bobot. **Backpropagation** menghitung semua gradien dalam satu lintasan mundur menggunakan **aturan rantai**.

```viz
{"type":"flow","title":"Satu iterasi training","loop":true,"steps":[{"label":"Forward","detail":"Input → lapisan demi lapisan → prediksi ŷ. Simpan nilai antara."},{"label":"Loss","detail":"Bandingkan ŷ dengan y (cross-entropy / MSE)."},{"label":"Backward","detail":"∂L/∂ŷ → ∂L/∂(lapisan terakhir) → … → ∂L/∂(lapisan pertama), dengan aturan rantai."},{"label":"Update","detail":"w ← w − η·∂L/∂w untuk semua parameter (SGD/Adam)."}]}
```

Contoh kecil: ŷ = σ(w₂·relu(w₁x)). Maka ∂L/∂w₁ = ∂L/∂ŷ · σ′(·) · w₂ · relu′(w₁x) · x. Setiap lapisan hanya perlu tahu **gradien yang datang dari atas** dan **turunan lokalnya sendiri**. Framework seperti PyTorch melakukan ini otomatis (**autograd**) dengan merekam graf komputasi saat forward.

Masalah klasik: **vanishing gradient** (gradien mengecil eksponensial di jaringan dalam dengan sigmoid/tanh) dan **exploding gradient**. Solusi: ReLU, inisialisasi yang tepat (He/Xavier), **batch/layer normalization**, **residual connection**, dan gradient clipping.

## PyTorch dasar

**PyTorch** adalah framework deep learning paling populer di riset dan semakin di industri. Tiga konsep inti: **tensor** (array dengan dukungan GPU dan autograd), **nn.Module** (model), dan **training loop** yang kamu tulis sendiri.

```python
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

device = "cuda" if torch.cuda.is_available() else "cpu"
X_tr_t = torch.tensor(X_tr, dtype=torch.float32); y_tr_t = torch.tensor(y_tr, dtype=torch.long)
loader = DataLoader(TensorDataset(X_tr_t, y_tr_t), batch_size=64, shuffle=True)

class MLP(nn.Module):
    def __init__(self, d_in, d_hidden, n_kelas):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(d_in, d_hidden), nn.ReLU(), nn.Dropout(0.2),
            nn.Linear(d_hidden, d_hidden), nn.ReLU(),
            nn.Linear(d_hidden, n_kelas),          # logits; softmax ada di dalam CrossEntropyLoss
        )
    def forward(self, x):
        return self.net(x)

model = MLP(X_tr.shape[1], 128, 3).to(device)
loss_fn = nn.CrossEntropyLoss()
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)

for epoch in range(30):
    model.train()
    for xb, yb in loader:
        xb, yb = xb.to(device), yb.to(device)
        opt.zero_grad()                 # 1. nolkan gradien lama
        loss = loss_fn(model(xb), yb)   # 2. forward + loss
        loss.backward()                 # 3. backprop
        opt.step()                      # 4. update bobot
    model.eval()
    with torch.no_grad():               # tanpa graf autograd saat evaluasi
        acc = (model(X_val_t.to(device)).argmax(1).cpu() == y_val_t).float().mean()
    print(epoch, loss.item(), acc.item())
```

Kesalahan umum pemula: lupa `zero_grad()`, lupa `model.eval()` saat evaluasi, menerapkan softmax sebelum `CrossEntropyLoss` (dua kali), dan tensor di device berbeda (CPU vs GPU).

## Overfitting & regularisasi

Jaringan neural punya kapasitas sangat besar sehingga mudah menghafal data latih. Pantau loss latih dan validasi setiap epoch:

```viz
{"type":"overfit"}
```

```viz
{"type":"compare","columns":["Teknik","Cara kerja"],"rows":[{"label":"Data lebih banyak / augmentasi","values":["Variasi buatan (flip, crop, noise) memaksa model belajar pola umum"]},{"label":"Dropout","values":["Mematikan neuron acak saat training sehingga tidak bergantung pada satu jalur"]},{"label":"Weight decay (L2)","values":["Menghukum bobot besar; AdamW menerapkannya dengan benar"]},{"label":"Early stopping","values":["Hentikan saat loss validasi tidak membaik N epoch; simpan bobot terbaik"]},{"label":"Batch normalization","values":["Menstabilkan training; efek regularisasi ringan"]},{"label":"Model lebih kecil / transfer learning","values":["Kurangi kapasitas, atau mulai dari model pralatih"]}]}
```

Resep praktis (dari Andrej Karpathy): **pertama buat model overfit pada satu batch kecil** (memastikan pipeline dan model benar), **lalu** tambahkan regularisasi sampai performa validasi optimal.

:::latihan
Milestone: latih MLP PyTorch pada dataset Fashion-MNIST (60.000 gambar 28×28, 10 kelas). Mulai dengan overfit satu batch, lalu latih penuh dengan plot loss latih/validasi; bandingkan tanpa regularisasi vs dengan dropout + weight decay + early stopping. Laporkan akurasi test dan tampilkan 10 contoh salah klasifikasi beserta analisisnya.
:::

## Rangkuman

- Neuron: f(w·x + b); non-linearitas membuat jaringan berlapis bermakna.
- Backpropagation = aturan rantai dari output ke input; autograd melakukannya otomatis.
- PyTorch loop: zero_grad → forward → loss → backward → step; eval() + no_grad() saat evaluasi.
- Lawan overfitting: augmentasi, dropout, weight decay, early stopping, transfer learning.
