---
title: PyTorch & training yang benar
minutes: 55
summary: Selisih antara model yang biasa saja dan model yang bagus sering bukan arsitektur, tetapi disiplin training. Modul ini membahas tensor dan autograd di PyTorch, Dataset dan DataLoader, training loop yang lengkap, regularisasi dengan dropout dan weight decay, serta learning rate schedule.
objectives:
  - Memanipulasi tensor (bentuk, dtype, device) dan memahami autograd
  - Membangun Dataset dan DataLoader yang efisien
  - Menulis training loop lengkap dengan validasi, checkpoint, dan logging
  - Menerapkan dropout dan weight decay dengan benar
  - Memilih dan menggunakan learning rate schedule
sources:
  - repo: mrdbourke/pytorch-deep-learning
    note: Learn PyTorch for Deep Learning (Zero to Mastery), gratis online
  - repo: d2l-ai/d2l-en
    note: Dive into Deep Learning — buku interaktif dengan kode
quiz:
  - q: "x berukuran (32, 3, 224, 224). Dimensi pertamanya biasanya berarti…"
    options: ["Tinggi gambar", "Batch size", "Jumlah kelas", "Channel warna"]
    answer: 1
    explain: "Konvensi PyTorch untuk gambar: (N, C, H, W)."
  - q: "num_workers > 0 pada DataLoader berguna untuk…"
    options: ["Melatih di beberapa GPU", "Memuat & augmentasi data secara paralel agar GPU tidak menunggu", "Mengurangi ukuran model", "Menambah akurasi"]
    answer: 1
    explain: "Pipeline data yang lambat sering menjadi bottleneck tersembunyi."
  - q: "Kenapa AdamW dianjurkan dibanding Adam + L2 di loss?"
    options: ["Lebih baru", "Weight decay dipisahkan dari update adaptif sehingga regularisasinya bekerja sebagaimana mestinya", "Tidak butuh learning rate", "Lebih sedikit memori"]
    answer: 1
    explain: "Pada Adam, L2 yang dimasukkan ke gradien ikut diskalakan oleh normalisasi adaptif."
  - q: "Warmup pada learning rate schedule berarti…"
    options: ["Memanaskan GPU", "Menaikkan learning rate bertahap dari kecil di awal training", "Melatih tanpa data", "Membekukan lapisan"]
    answer: 1
    explain: "Di awal, bobot acak dan statistik optimizer belum stabil; LR besar bisa merusak."
---

Kebanyakan bug deep learning tidak menimbulkan error; modelnya tetap berjalan, hanya hasilnya lebih buruk dari seharusnya. Modul ini membangun kebiasaan training yang benar dengan **PyTorch**, sehingga ketika hasil buruk, kamu tahu harus mencari di mana. Dasar loop PyTorch diperkenalkan di [Pengenalan deep learning](/belajar/machine-learning/ml-3); di sini kita memperdalamnya.

## Tensor & autograd

**Tensor** adalah array n-dimensi dengan tiga atribut penting: **shape**, **dtype**, dan **device**. Sebagian besar error PyTorch adalah ketidakcocokan salah satunya.

```python
import torch
x = torch.randn(32, 3, 224, 224)                 # (N, C, H, W)
print(x.shape, x.dtype, x.device)                # torch.Size([32, 3, 224, 224]) torch.float32 cpu
x = x.to("cuda" if torch.cuda.is_available() else "cpu")

x.view(32, -1).shape          # (32, 150528) — view butuh memori kontigu
x.permute(0, 2, 3, 1).shape   # (32, 224, 224, 3) — ubah urutan sumbu
x.mean(dim=(2, 3)).shape      # (32, 3) — rata-rata per channel
x.unsqueeze(1).shape          # (32, 1, 3, 224, 224)
```

**Autograd** merekam operasi pada tensor yang `requires_grad=True`, membangun graf komputasi dinamis, dan menghitung gradien saat `.backward()` — persis micrograd di [modul sebelumnya](/belajar/deep-learning/dl-1), tetapi pada tensor.

```python
w = torch.randn(3, requires_grad=True)
loss = ((torch.tensor([1., 2., 3.]) * w).sum() - 4) ** 2
loss.backward()
print(w.grad)                 # gradien dL/dw
with torch.no_grad():         # tanpa perekaman: untuk evaluasi & update manual
    w -= 0.1 * w.grad
w.grad.zero_()                # gradien diakumulasi — harus di-nol-kan
```

## Dataset & DataLoader

`Dataset` mendefinisikan **cara mengambil satu sampel**; `DataLoader` menangani **batching, shuffle, dan paralelisme**.

```python
from pathlib import Path
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms as T

class DaunPadi(Dataset):
    def __init__(self, root, transform=None):
        self.files = sorted(Path(root).glob("*/*.jpg"))
        self.kelas = sorted({f.parent.name for f in self.files})
        self.idx = {k: i for i, k in enumerate(self.kelas)}
        self.transform = transform
    def __len__(self):
        return len(self.files)
    def __getitem__(self, i):
        f = self.files[i]
        img = Image.open(f).convert("RGB")
        return (self.transform(img) if self.transform else img), self.idx[f.parent.name]

train_tf = T.Compose([T.RandomResizedCrop(224), T.RandomHorizontalFlip(), T.ToTensor(),
                      T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])
dl_train = DataLoader(DaunPadi("data/train", train_tf), batch_size=64, shuffle=True,
                      num_workers=4, pin_memory=True, drop_last=True)
```

Aturan penting: **augmentasi hanya untuk data latih**; validasi memakai transformasi deterministik (resize + center crop + normalisasi). Selalu **lihat** satu batch (gambar dan labelnya) sebelum training untuk memastikan pipeline benar.

## Training loop

Loop lengkap yang layak dipakai:

```python
def train_satu_epoch(model, dl, opt, sched, loss_fn, device, scaler=None):
    model.train(); total = 0.0
    for xb, yb in dl:
        xb, yb = xb.to(device, non_blocking=True), yb.to(device, non_blocking=True)
        opt.zero_grad(set_to_none=True)
        loss = loss_fn(model(xb), yb)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)   # cegah gradien meledak
        opt.step(); sched.step()                                           # schedule per langkah
        total += loss.item() * len(xb)
    return total / len(dl.dataset)

@torch.no_grad()
def evaluasi(model, dl, loss_fn, device):
    model.eval(); total, benar = 0.0, 0
    for xb, yb in dl:
        xb, yb = xb.to(device), yb.to(device)
        out = model(xb)
        total += loss_fn(out, yb).item() * len(xb)
        benar += (out.argmax(1) == yb).sum().item()
    return total / len(dl.dataset), benar / len(dl.dataset)

terbaik = float("inf")
for epoch in range(epochs):
    tr = train_satu_epoch(model, dl_train, opt, sched, loss_fn, device)
    vl, acc = evaluasi(model, dl_val, loss_fn, device)
    print(f"{epoch:02d} train {tr:.3f}  val {vl:.3f}  acc {acc:.3f}")
    if vl < terbaik:
        terbaik = vl
        torch.save({"model": model.state_dict(), "epoch": epoch}, "best.pt")   # checkpoint
```

```viz
{"type":"flow","title":"Resep debugging training (urutan pemeriksaan)","steps":[{"label":"Periksa data","detail":"Visualisasikan batch & label; cek distribusi kelas."},{"label":"Loss awal","detail":"Sesuai teori? (ln(jumlah kelas) untuk klasifikasi)."},{"label":"Overfit 1 batch","detail":"Loss harus mendekati nol. Jika tidak, ada bug."},{"label":"Baseline sederhana","detail":"Model kecil tanpa trik; catat skornya."},{"label":"Tambah kompleksitas","detail":"Satu perubahan per eksperimen; catat hasilnya."}]}
```

Tetapkan **seed** (`torch.manual_seed`) untuk reproducibility, dan catat setiap eksperimen (lihat [Skala & deployment](/belajar/deep-learning/dl-5)).

## Regularisasi: dropout, weight decay

```viz
{"type":"overfit"}
```

**Dropout** mematikan neuron secara acak dengan peluang p saat training (dan menskalakan sisanya 1/(1−p)), sehingga jaringan tidak bergantung pada satu jalur; saat `model.eval()` dropout dimatikan. Nilai umum: 0,1–0,5, lebih sering di lapisan fully connected daripada konvolusi.

**Weight decay** menyusutkan bobot setiap langkah: w ← w − η·λ·w. Gunakan **AdamW**, yang memisahkan decay dari pembaruan adaptif. Kebiasaan umum: jangan menerapkan weight decay pada bias dan parameter normalisasi.

```python
decay, no_decay = [], []
for n, p in model.named_parameters():
    (no_decay if p.ndim == 1 else decay).append(p)        # bias & norm berdimensi 1
opt = torch.optim.AdamW([{"params": decay, "weight_decay": 0.05},
                         {"params": no_decay, "weight_decay": 0.0}], lr=3e-4)
```

Teknik lain: **augmentasi data** (sering paling efektif), **label smoothing** (`CrossEntropyLoss(label_smoothing=0.1)`), **early stopping**, dan **stochastic depth** untuk jaringan sangat dalam.

## Learning rate schedule

Learning rate adalah hiperparameter paling penting. LR tetap jarang optimal: di awal butuh langkah hati-hati, di tengah langkah besar, di akhir langkah kecil untuk ‘mengendap’ di minimum.

```viz
{"type":"gradient-descent"}
```

```viz
{"type":"compare","columns":["Schedule","Bentuk","Catatan"],"rows":[{"label":"Step decay","values":["Turun ×0,1 di epoch tertentu","Klasik (ResNet)"]},{"label":"Cosine annealing","values":["Turun mulus mengikuti kurva cosinus","Default modern yang andal"]},{"label":"Warmup + cosine","values":["Naik linear beberapa ratus langkah, lalu cosine","Standar untuk Transformer & batch besar"]},{"label":"OneCycle","values":["Naik ke LR maks lalu turun tajam","Konvergensi cepat (fast.ai)"]},{"label":"ReduceLROnPlateau","values":["Turun saat metrik validasi mandek","Reaktif, mudah dipakai"]}]}
```

```python
from torch.optim.lr_scheduler import OneCycleLR
sched = OneCycleLR(opt, max_lr=1e-3, total_steps=epochs * len(dl_train), pct_start=0.1)
```

Mencari LR awal: **LR range test** — naikkan LR secara eksponensial selama satu epoch pendek dan plot loss; pilih LR sedikit di bawah titik loss turun paling curam (sebelum meledak).

:::latihan
Milestone: kerjakan bab 0–4 `pytorch-deep-learning`. Lalu latih CNN kecil pada dataset gambar pilihanmu (mis. citra daun dengan beberapa kelas) memakai Dataset kustom, augmentasi, training loop dengan checkpoint, dan bandingkan tiga konfigurasi: tanpa regularisasi, dengan dropout + AdamW weight decay, dan dengan OneCycleLR. Sajikan kurva loss dan tabel hasil.
:::

## Rangkuman

- Tensor: perhatikan shape, dtype, device; autograd merekam graf dan mengakumulasi gradien.
- Dataset = satu sampel; DataLoader = batch, shuffle, worker; augmentasi hanya data latih.
- Loop lengkap: zero_grad → forward → backward → clip → step → schedule; eval dengan no_grad; checkpoint terbaik.
- Debug: cek data, loss awal, overfit satu batch, baseline, satu perubahan per eksperimen.
- Regularisasi: dropout, AdamW weight decay (bukan untuk bias/norm), augmentasi, label smoothing.
- LR schedule: warmup + cosine atau OneCycle; temukan LR dengan range test.
