---
title: Membaca & mengimplementasikan paper
minutes: 60
summary: Deep learning bergerak lewat paper, dan kemampuan mengubah paper menjadi kode adalah pembeda antara pengguna dan praktisi. Modul ini membahas cara membaca paper, mereproduksi eksperimen dengan benar, membangun Transformer kecil dari nol ala nanoGPT, dan memahami model generatif VAE serta diffusion.
objectives:
  - Membaca paper secara bertahap dan mengekstrak detail implementasi
  - Mereproduksi eksperimen dengan kontrol variabel dan beberapa seed
  - Mengimplementasikan GPT kecil dari nol dan melatihnya
  - Menjelaskan prinsip VAE dan diffusion model
sources:
  - repo: labmlai/annotated_deep_learning_paper_implementations
    note: Implementasi paper beranotasi baris demi baris
  - repo: karpathy/nanoGPT
    note: GPT ringkas untuk training dan fine-tuning
  - repo: dair-ai/ML-Papers-Explained
    note: Penjelasan ringkas paper-paper penting
quiz:
  - q: "Hasil reproduksimu 1,2 poin di bawah paper. Langkah yang paling bijak…"
    options: ["Menyimpulkan paper curang", "Memeriksa detail yang sering terlewat (augmentasi, schedule, inisialisasi, eval protocol) dan variasi antar seed", "Langsung menambah lapisan", "Mengubah dataset"]
    answer: 1
    explain: "Selisih kecil sering berasal dari detail implementasi atau variasi acak."
  - q: "Dalam GPT, ‘causal mask’ memastikan…"
    options: ["Model lebih cepat", "Token hanya bisa memperhatikan token sebelumnya, sesuai tugas memprediksi token berikutnya", "Model tidak overfit", "Embedding dinormalisasi"]
    answer: 1
    explain: "Tanpa mask, model ‘menyontek’ token yang harus ia prediksi."
  - q: "Diffusion model belajar untuk…"
    options: ["Mengklasifikasi gambar", "Memprediksi (dan menghapus) noise yang ditambahkan pada data, sehingga bisa membangkitkan data dari noise murni", "Mengompresi gambar ke satu angka", "Menyusun teks"]
    answer: 1
    explain: "Proses maju menambah noise bertahap; model belajar proses kebalikannya."
  - q: "Reparameterization trick pada VAE diperlukan agar…"
    options: ["Model lebih kecil", "Gradien dapat mengalir melalui proses sampling z = μ + σ·ε", "Tidak perlu decoder", "Loss selalu positif"]
    answer: 1
    explain: "Keacakan dipindah ke ε yang tidak bergantung parameter."
---

Konsep baru hampir selalu muncul pertama kali di paper, berbulan-bulan sebelum ada di tutorial. Modul ini melatih siklus lengkap: **baca → pahami → implementasikan → verifikasi**. Kerangka umum membaca paper (tiga lintasan) diperkenalkan di [ML di industri](/belajar/machine-learning/ml-5); di sini fokus pada paper deep learning dan implementasinya.

## Cara membaca paper

Paper deep learning punya struktur yang dapat diprediksi. Saat tujuanmu **mengimplementasikan**, cari jawaban atas pertanyaan berikut:

```viz
{"type":"tree","root":{"label":"Yang harus diekstrak dari paper","children":[{"label":"Arsitektur","detail":"Diagram + tabel dimensi; urutan norm/aktivasi; inisialisasi","children":[{"label":"Sering di lampiran!"}]},{"label":"Objective","detail":"Loss persis, bobot tiap komponen"},{"label":"Data","detail":"Preprocessing, augmentasi, split"},{"label":"Training","detail":"Optimizer, LR, schedule, batch size, jumlah langkah"},{"label":"Evaluasi","detail":"Metrik & protokol (single crop? ensemble?)"}]}}
```

Tips praktis:

- Gambar ulang diagram arsitektur dengan **bentuk tensor** di setiap panah.
- Notasi matematika: buat daftar simbol dan artinya; padankan setiap persamaan dengan satu baris kode.
- Lihat **kode resmi** jika ada, tetapi tulis versimu sendiri dulu; kode resmi sering memuat detail yang tidak ditulis di paper.
- Sumber bantu: `annotated_deep_learning_paper_implementations` (kode dengan anotasi berdampingan) dan `ML-Papers-Explained`.

## Reproduksi eksperimen

Reproduksi yang baik adalah eksperimen ilmiah, bukan sekadar menjalankan kode:

```viz
{"type":"flow","title":"Protokol reproduksi","steps":[{"label":"Skala kecil dulu","detail":"Dataset/model kecil yang cepat; pastikan loss turun dan bisa overfit."},{"label":"Cocokkan detail","detail":"Checklist dari bagian sebelumnya; tulis setiap asumsi yang kamu ambil."},{"label":"Baseline","detail":"Reproduksi baseline paper terlebih dulu — jika baseline meleset, perbandingan tidak bermakna."},{"label":"Beberapa seed","detail":"Minimal 3; laporkan rata-rata ± simpangan."},{"label":"Ablation","detail":"Hapus satu komponen per kali untuk melihat kontribusinya."}]}
```

Hal yang sering membuat hasil berbeda: augmentasi data, jadwal learning rate dan warmup, inisialisasi, ukuran batch efektif, presisi numerik, dan **protokol evaluasi** (mis. memilih checkpoint terbaik di test set adalah kebocoran). Jika peningkatan yang diklaim lebih kecil dari variasi antar seed, klaim itu lemah.

## Transformer dari nol

Proyek klasik: bangun **GPT** kecil (decoder-only Transformer) dan latih pada teks untuk memprediksi karakter/token berikutnya. Struktur intinya hanya beberapa puluh baris:

```python
import torch, torch.nn as nn, torch.nn.functional as F

class Head(nn.Module):
    def __init__(self, n_embd, head_size, block_size):
        super().__init__()
        self.k = nn.Linear(n_embd, head_size, bias=False)
        self.q = nn.Linear(n_embd, head_size, bias=False)
        self.v = nn.Linear(n_embd, head_size, bias=False)
        self.register_buffer("mask", torch.tril(torch.ones(block_size, block_size)))
    def forward(self, x):
        B, T, C = x.shape
        k, q, v = self.k(x), self.q(x), self.v(x)
        w = q @ k.transpose(-2, -1) * k.shape[-1] ** -0.5          # (B, T, T)
        w = w.masked_fill(self.mask[:T, :T] == 0, float("-inf"))   # causal mask
        return F.softmax(w, dim=-1) @ v

class Block(nn.Module):
    def __init__(self, n_embd, n_head, block_size):
        super().__init__()
        hs = n_embd // n_head
        self.heads = nn.ModuleList([Head(n_embd, hs, block_size) for _ in range(n_head)])
        self.proj = nn.Linear(n_embd, n_embd)
        self.ff = nn.Sequential(nn.Linear(n_embd, 4 * n_embd), nn.GELU(), nn.Linear(4 * n_embd, n_embd))
        self.ln1, self.ln2 = nn.LayerNorm(n_embd), nn.LayerNorm(n_embd)
    def forward(self, x):
        x = x + self.proj(torch.cat([h(self.ln1(x)) for h in self.heads], dim=-1))   # pre-norm + residual
        return x + self.ff(self.ln2(x))

class GPT(nn.Module):
    def __init__(self, vocab, n_embd=128, n_head=4, n_layer=4, block_size=128):
        super().__init__()
        self.tok = nn.Embedding(vocab, n_embd); self.pos = nn.Embedding(block_size, n_embd)
        self.blocks = nn.Sequential(*[Block(n_embd, n_head, block_size) for _ in range(n_layer)])
        self.ln, self.head = nn.LayerNorm(n_embd), nn.Linear(n_embd, vocab)
    def forward(self, idx, targets=None):
        T = idx.shape[1]
        x = self.tok(idx) + self.pos(torch.arange(T, device=idx.device))
        logits = self.head(self.ln(self.blocks(x)))
        loss = None if targets is None else F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))
        return logits, loss
```

```viz
{"type":"attention"}
```

Data latih: potongan teks sepanjang `block_size`, target = input digeser satu posisi. Generasi dilakukan token demi token: ambil logits posisi terakhir, terapkan temperature, sampel, tambahkan ke input, ulangi. Setelah versi ini berjalan, pelajari `nanoGPT` untuk versi efisien (attention gabungan, `F.scaled_dot_product_attention`, weight tying, mixed precision) yang mampu mereproduksi GPT-2 kecil.

## Generative model (VAE, diffusion)

Model generatif mempelajari distribusi data sehingga dapat **membangkitkan** sampel baru.

**Variational Autoencoder (VAE)**: encoder memetakan input ke distribusi laten (μ, σ), sampel z = μ + σ·ε (*reparameterization trick* agar gradien bisa mengalir), decoder merekonstruksi. Loss = **rekonstruksi** + **KL divergence** yang menjaga ruang laten tetap rapi (mendekati normal standar), sehingga titik acak di ruang laten menghasilkan sampel yang masuk akal. Hasilnya cenderung buram, tetapi ruang latennya halus dan berguna.

**Diffusion model** (DDPM, Ho et al., 2020) — dasar Stable Diffusion dan banyak generator gambar/video:

```viz
{"type":"flow","title":"Diffusion: maju & mundur","steps":[{"label":"Proses maju (tetap)","detail":"Tambahkan noise Gaussian sedikit demi sedikit selama T langkah hingga gambar menjadi noise murni."},{"label":"Training","detail":"Ambil gambar, pilih langkah t acak, tambahkan noise ε; latih U-Net/Transformer memprediksi ε dari gambar ber-noise dan t (loss MSE)."},{"label":"Sampling (mundur)","detail":"Mulai dari noise murni; berulang kali kurangi noise yang diprediksi model."},{"label":"Conditioning","detail":"Teks (embedding CLIP/T5) mengarahkan proses — classifier-free guidance."}]}
```

```python
# inti training DDPM
t = torch.randint(0, T, (B,), device=x0.device)
eps = torch.randn_like(x0)
xt = alpha_bar[t].sqrt().view(-1, 1, 1, 1) * x0 + (1 - alpha_bar[t]).sqrt().view(-1, 1, 1, 1) * eps
loss = F.mse_loss(model(xt, t), eps)
```

**Latent diffusion** menjalankan proses ini di ruang laten sebuah autoencoder (lebih murah), dan **flow matching** adalah formulasi terkait yang banyak dipakai model generatif terbaru. Bandingkan juga dengan **GAN** (generator vs diskriminator; tajam tetapi training tidak stabil) dan **autoregresif** (seperti GPT, untuk teks).

:::latihan
Milestone: (1) pilih satu paper dari `annotated_deep_learning_paper_implementations` (mis. ResNet atau LayerNorm), baca dengan checklist, implementasikan sendiri, dan reproduksi hasil skala kecil dengan 3 seed; (2) implementasikan GPT kecil di atas, latih pada kumpulan teks berbahasa Indonesia (mis. cerita rakyat domain publik), dan tampilkan contoh generasi dengan dua temperature; (3) latih DDPM kecil pada MNIST dan tampilkan proses denoising langkah demi langkah.
:::

## Rangkuman

- Baca paper untuk implementasi: arsitektur, objective, data, training, evaluasi — termasuk lampiran.
- Reproduksi: kecil dulu, cocokkan detail, baseline, beberapa seed, ablation.
- GPT = embedding token + posisi → blok (causal multi-head attention + MLP, pre-norm, residual) → logits.
- VAE: encoder–decoder probabilistik dengan KL; diffusion: belajar menghapus noise bertahap.
