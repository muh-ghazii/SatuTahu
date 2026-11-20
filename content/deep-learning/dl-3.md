---
title: "Arsitektur: CNN, RNN, Attention"
minutes: 60
summary: Arsitektur neural network memasukkan asumsi tentang struktur data ke dalam model. Modul ini membahas konvolusi dan pooling untuk citra, ResNet dan normalisasi yang memungkinkan jaringan sangat dalam, RNN dan LSTM untuk urutan, attention dan Transformer, serta embedding sebagai representasi yang dipelajari.
objectives:
  - Menghitung ukuran output konvolusi dan menjelaskan kenapa CNN cocok untuk citra
  - Menjelaskan residual connection dan batch/layer normalization
  - Memahami RNN/LSTM dan keterbatasannya pada urutan panjang
  - Menjelaskan self-attention dan blok Transformer
  - Memakai embedding untuk data kategorikal dan teks
sources:
  - repo: fastai/fastbook
    note: Buku fast.ai Deep Learning for Coders (notebook)
  - repo: afshinea/stanford-cs-230-deep-learning
    note: Cheatsheet CS230 (CNN, RNN, tips)
  - repo: rasbt/deeplearning-models
    note: Implementasi berbagai arsitektur dalam PyTorch
quiz:
  - q: "Input 32×32, kernel 3×3, stride 1, padding 1. Ukuran output spasialnya…"
    options: ["30×30", "32×32", "16×16", "34×34"]
    answer: 1
    explain: "(32 + 2·1 − 3)/1 + 1 = 32 — padding ‘same’."
  - q: "Residual connection y = x + F(x) membantu jaringan sangat dalam karena…"
    options: ["Mengurangi jumlah parameter", "Gradien punya jalur langsung ke lapisan awal dan lapisan mudah belajar identitas", "Menghapus aktivasi", "Mempercepat inferensi"]
    answer: 1
    explain: "Itulah kunci ResNet melatih 100+ lapisan."
  - q: "Kelebihan utama Transformer dibanding RNN adalah…"
    options: ["Tidak butuh data", "Memproses semua posisi secara paralel dan menghubungkan posisi jauh secara langsung lewat attention", "Lebih sedikit memori untuk urutan panjang", "Tidak punya parameter"]
    answer: 1
    explain: "RNN harus berurutan; attention menghubungkan token mana pun dalam satu langkah (biaya O(n²))."
  - q: "Dalam attention, skor dibagi √d_k untuk…"
    options: ["Mempercepat", "Menjaga varians skor agar softmax tidak jenuh", "Normalisasi output", "Mengurangi parameter"]
    answer: 1
    explain: "Dot product dimensi besar bervarians besar, membuat softmax terlalu tajam dan gradien kecil."
---

Arsitektur adalah cara kita memberi tahu model tentang **struktur data**: citra punya kedekatan spasial, teks punya urutan, kategori punya kemiripan. Asumsi yang tepat (*inductive bias*) membuat model belajar lebih cepat dengan data lebih sedikit.

## Konvolusi & pooling

Menghubungkan setiap piksel citra 224×224×3 ke 1.000 neuron membutuhkan 150 juta bobot di satu lapisan. **Konvolusi** memakai dua asumsi: pola bersifat **lokal** (tepi hanya bergantung piksel tetangga) dan **dapat muncul di mana saja** (bobot kernel dipakai bersama di seluruh posisi).

Geser kernel di atas citra dan lihat bagaimana setiap output dihitung sebagai jumlah perkalian elemen:

```viz
{"type":"convolution"}
```

Ukuran output: **(W + 2P − K) / S + 1**, dengan W lebar input, K ukuran kernel, P padding, S stride. Lapisan konvolusi punya `C_out` kernel berukuran `C_in × K × K`, menghasilkan `C_out` **feature map**.

**Pooling** (max/average) menurunkan resolusi, memberi toleransi pergeseran kecil, dan memperluas **receptive field**: lapisan dalam ‘melihat’ area citra yang semakin besar. Hierarki fitur yang terbentuk: tepi → tekstur → bagian objek → objek.

```python
from torch import nn
blok = nn.Sequential(
    nn.Conv2d(3, 32, kernel_size=3, padding=1), nn.BatchNorm2d(32), nn.ReLU(),
    nn.Conv2d(32, 32, kernel_size=3, padding=1), nn.BatchNorm2d(32), nn.ReLU(),
    nn.MaxPool2d(2),                                   # 224 → 112
)
```

Penerapan CNN untuk visi komputer dibahas mendalam di [jalur Computer Vision](/belajar/computer-vision/cv-2).

## ResNet & normalisasi

Secara teori, jaringan lebih dalam setidaknya sebaik jaringan dangkal. Dalam praktik, sebelum 2015, menambah lapisan justru **menurunkan** akurasi latih karena optimasinya sulit. **ResNet** memecahkannya dengan **residual connection**:

**y = x + F(x)**

```viz
{"type":"flow","title":"Blok residual","steps":[{"label":"x","detail":"Input blok"},{"label":"Conv → BN → ReLU","detail":"Cabang F(x)"},{"label":"Conv → BN","detail":"Cabang F(x) lanjutan"},{"label":"+ x","detail":"Jalan pintas identitas"},{"label":"ReLU","detail":"Output y"}]}
```

Jika identitas sudah optimal, blok cukup belajar F(x) ≈ 0. Gradien juga mengalir langsung lewat jalan pintas ke lapisan awal. Residual connection kini ada di hampir semua arsitektur modern, termasuk Transformer.

**Normalisasi** menstabilkan distribusi aktivasi:

```viz
{"type":"compare","columns":["Jenis","Normalisasi atas","Dipakai di"],"rows":[{"label":"BatchNorm","values":["Batch & spasial, per channel","CNN; perilaku train/eval berbeda; bermasalah di batch kecil"]},{"label":"LayerNorm","values":["Fitur per sampel","Transformer, RNN; tidak bergantung ukuran batch"]},{"label":"GroupNorm","values":["Kelompok channel per sampel","Deteksi/segmentasi dengan batch kecil"]},{"label":"RMSNorm","values":["Seperti LayerNorm tanpa pengurangan rata-rata","LLM modern (lebih murah)"]}]}
```

## RNN/LSTM

Untuk **urutan** (teks, deret waktu, audio), **RNN** memproses satu elemen per langkah dan membawa **hidden state** yang merangkum masa lalu: hₜ = tanh(Wₓxₜ + Wₕhₜ₋₁ + b).

Masalahnya: gradien yang mengalir mundur melewati banyak langkah dikalikan berulang dengan Wₕ, sehingga **menghilang** atau **meledak**. Model sulit mengingat informasi puluhan langkah sebelumnya.

**LSTM** menambahkan **cell state** dengan tiga gerbang (forget, input, output) yang mengatur apa yang dilupakan, ditambahkan, dan dikeluarkan. Jalur cell state yang hampir aditif membuat gradien bertahan lebih lama. **GRU** adalah versi lebih ringkas dengan dua gerbang.

```python
lstm = nn.LSTM(input_size=64, hidden_size=128, num_layers=2, batch_first=True, dropout=0.2)
out, (h, c) = lstm(x)          # x: (batch, panjang_urutan, 64) → out: (batch, panjang, 128)
```

Keterbatasan mendasar RNN tetap: **berurutan** (tidak bisa diparalelkan antar langkah waktu) dan informasi jauh harus ‘diestafetkan’ lewat banyak langkah. Untuk deret waktu pendek dan perangkat kecil, LSTM/GRU masih berguna; untuk bahasa, ia telah digantikan Transformer.

## Attention & Transformer

**Attention** memungkinkan setiap posisi mengambil informasi dari posisi lain mana pun secara langsung, dengan bobot yang dihitung dari kemiripan:

**Attention(Q, K, V) = softmax(QKᵀ / √d_k) V**

Setiap token membuat **query** (apa yang saya cari), **key** (apa yang saya tawarkan), dan **value** (informasi yang saya bawa). Skor query–key menentukan seberapa banyak value setiap token diambil. Klik token di bawah untuk melihat ke mana ia ‘memperhatikan’:

```viz
{"type":"attention"}
```

Blok **Transformer** (Vaswani et al., 2017, *Attention Is All You Need*):

```viz
{"type":"layers","layers":[{"label":"Output","detail":"Representasi kontekstual tiap token","tag":""},{"label":"Add & Norm","detail":"Residual + LayerNorm","tag":""},{"label":"Feed-forward (MLP)","detail":"Diterapkan per posisi; ‘berpikir’ atas informasi yang dikumpulkan","tag":"4× lebar"},{"label":"Add & Norm","detail":"Residual + LayerNorm","tag":""},{"label":"Multi-head self-attention","detail":"Beberapa ‘kepala’ menangkap relasi berbeda (sintaks, rujukan)","tag":"h kepala"},{"label":"Embedding + positional encoding","detail":"Attention tidak tahu urutan, jadi posisi ditambahkan","tag":"input"}]}
```

```python
import torch, math
def self_attention(x, Wq, Wk, Wv, causal=True):
    Q, K, V = x @ Wq, x @ Wk, x @ Wv                       # (T, d)
    skor = Q @ K.T / math.sqrt(K.shape[-1])                 # (T, T)
    if causal:                                              # decoder: tak boleh melihat masa depan
        skor = skor.masked_fill(torch.triu(torch.ones_like(skor), 1).bool(), float("-inf"))
    return torch.softmax(skor, dim=-1) @ V
```

Varian: **encoder-only** (BERT — pemahaman teks), **decoder-only** (GPT, Claude, Llama — generasi), **encoder-decoder** (T5 — terjemahan). **Vision Transformer (ViT)** memotong citra menjadi patch dan memperlakukannya sebagai token. Biaya attention tumbuh **kuadratik** terhadap panjang urutan; karena itu muncul FlashAttention, sliding window, dan arsitektur state-space.

## Embedding

**Embedding** memetakan entitas diskret (kata, token, produk, pengguna) ke **vektor padat** yang dipelajari. Entitas yang berperan mirip berakhir berdekatan di ruang vektor, dan arah tertentu bisa bermakna.

```viz
{"type":"embedding"}
```

```python
emb_produk = nn.Embedding(num_embeddings=5_000, embedding_dim=32)   # tabel lookup 5000×32
v = emb_produk(torch.tensor([12, 873]))                              # (2, 32)
```

Embedding adalah lapisan pertama setiap model bahasa, dasar **pencarian semantik** dan **RAG** (lihat [jalur AI Engineer](/belajar/ai-engineer/ai-3)), dan cara ampuh menangani **fitur kategorikal berkardinalitas tinggi** di data tabular (entity embeddings), sebagai pengganti one-hot ribuan kolom.

:::latihan
Milestone: implementasikan dan latih pada dataset yang sama (mis. CIFAR-10) sebuah CNN polos dan ResNet kecil; bandingkan kurva loss untuk 8 vs 20 lapisan. Lalu latih model karakter dengan LSTM dan dengan Transformer decoder kecil (2 blok, 4 kepala) pada teks pilihanmu dan bandingkan loss validasi. Visualisasikan bobot attention untuk satu kalimat.
:::

## Rangkuman

- CNN: lokalitas + berbagi bobot; output = (W + 2P − K)/S + 1; pooling memperluas receptive field.
- ResNet: y = x + F(x) memungkinkan jaringan sangat dalam; BatchNorm/LayerNorm/RMSNorm menstabilkan training.
- RNN/LSTM: hidden state berurutan; LSTM mengurangi vanishing gradient, tetapi tidak paralel.
- Transformer: softmax(QKᵀ/√d)V + MLP + residual + norm; paralel, biaya kuadratik.
- Embedding: vektor yang dipelajari untuk entitas diskret; dasar NLP, rekomendasi, dan RAG.
