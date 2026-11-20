---
title: CNN & klasifikasi citra
minutes: 55
summary: Klasifikasi citra adalah fondasi computer vision modern, dan hampir selalu dimulai dari model pralatih. Modul ini membahas konvolusi di dalam CNN, transfer learning, augmentasi data, evaluasi dengan confusion matrix, dan memilih backbone modern melalui pustaka timm.
objectives:
  - Menjelaskan bagaimana CNN membangun fitur secara hierarkis
  - Melakukan transfer learning (feature extraction dan fine-tuning)
  - Merancang augmentasi yang sesuai domain
  - Mengevaluasi classifier per kelas dengan confusion matrix
  - Memilih dan memakai backbone dari timm
sources:
  - repo: cs231n/cs231n.github.io
    note: Catatan kuliah Stanford CS231n (CNN untuk pengenalan visual)
  - repo: huggingface/pytorch-image-models
    note: timm — ratusan backbone pralatih
  - repo: microsoft/computervision-recipes
    note: Praktik terbaik & contoh CV dari Microsoft
quiz:
  - q: "Dataset hanya 800 gambar daun dalam 4 kelas. Pendekatan awal terbaik…"
    options: ["Melatih CNN dari nol", "Transfer learning dari backbone pralatih ImageNet", "Memakai kNN pada piksel", "Mengumpulkan 1 juta gambar dulu"]
    answer: 1
    explain: "Fitur umum (tepi, tekstur, bentuk) dari pralatih bisa dipakai ulang; data kecil cukup untuk menyesuaikan."
  - q: "Saat fine-tuning seluruh backbone, learning rate untuk lapisan pralatih sebaiknya…"
    options: ["Lebih besar dari head baru", "Lebih kecil dari head baru (discriminative LR)", "Nol selalu", "Acak"]
    answer: 1
    explain: "Bobot pralatih sudah bagus; langkah besar bisa merusaknya."
  - q: "Augmentasi flip vertikal TIDAK cocok untuk…"
    options: ["Foto daun dari atas", "Citra mikroskop", "Pengenalan angka/huruf (6 vs 9) atau pemandangan jalan", "Citra satelit"]
    answer: 2
    explain: "Augmentasi harus mempertahankan label; flip vertikal mengubah makna angka dan tidak realistis untuk foto jalan."
  - q: "Confusion matrix menunjukkan kelas ‘blast’ sering diprediksi sebagai ‘brown spot’. Langkah analisis yang tepat…"
    options: ["Menghapus kelas blast", "Melihat contoh salah klasifikasi, memeriksa label & kemiripan visual, lalu menambah data/augmentasi yang membedakan", "Menaikkan epoch saja", "Mengganti metrik ke akurasi"]
    answer: 1
    explain: "Analisis error kualitatif sering menemukan label salah atau fitur pembeda yang kurang terwakili."
---

**Klasifikasi citra** menjawab pertanyaan "gambar ini berisi apa?" — penyakit daun apa, jenis kendaraan apa, apakah produk cacat. Hampir semua sistem visi modern berdiri di atas **backbone CNN atau Vision Transformer** yang awalnya dilatih untuk klasifikasi.

## Konvolusi pada CNN

Di [modul sebelumnya](/belajar/computer-vision/cv-1), kita merancang kernel secara manual (blur, Sobel). **CNN** mempelajari kernel-kernel itu sendiri dari data.

```viz
{"type":"convolution"}
```

```viz
{"type":"layers","layers":[{"label":"Head klasifikasi","detail":"Global average pooling → Linear → softmax (jumlah kelas)","tag":"diganti saat transfer"},{"label":"Lapisan dalam","detail":"Bagian objek: daun berlubang, bercak berbentuk belah ketupat","tag":"semantik"},{"label":"Lapisan tengah","detail":"Tekstur & pola: bintik, garis urat daun","tag":""},{"label":"Lapisan awal","detail":"Tepi, warna, gradien — mirip filter Sobel/Gabor","tag":"umum"},{"label":"Input","detail":"3 × 224 × 224","tag":"RGB"}]}
```

Setiap lapisan konvolusi menghasilkan banyak **feature map**; resolusi spasial turun (stride/pooling) sementara jumlah channel naik. Arsitektur penting dalam sejarah: **LeNet** (1998), **AlexNet** (2012, GPU + ReLU), **VGG** (3×3 bertumpuk), **ResNet** (residual), **EfficientNet** (penskalaan seimbang), **ConvNeXt** (CNN dengan resep modern), dan **ViT** (Transformer pada patch). Penjelasan matematis konvolusi dan residual ada di [Arsitektur: CNN, RNN, Attention](/belajar/deep-learning/dl-3).

## Transfer learning

Model yang dilatih pada jutaan gambar (ImageNet) sudah mempelajari fitur visual umum. **Transfer learning** memakai ulang fitur itu untuk tugasmu.

```viz
{"type":"compare","columns":["Strategi","Cara","Kapan"],"rows":[{"label":"Feature extraction","values":["Bekukan backbone, latih head baru saja","Data sangat sedikit; domain mirip ImageNet"]},{"label":"Fine-tuning bertahap","values":["Latih head dulu, lalu buka (unfreeze) backbone dengan LR kecil","Pilihan default yang andal"]},{"label":"Fine-tuning penuh","values":["Semua lapisan dilatih dari awal dengan LR diskriminatif","Data cukup banyak atau domain berbeda (medis, satelit)"]}]}
```

```python
import timm, torch
model = timm.create_model("convnext_tiny.fb_in22k_ft_in1k", pretrained=True, num_classes=4)

# Tahap 1: bekukan backbone
for n, p in model.named_parameters():
    p.requires_grad = n.startswith("head")
opt = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3)
# ... latih 3–5 epoch ...

# Tahap 2: buka semua, LR lebih kecil untuk backbone
for p in model.parameters():
    p.requires_grad = True
opt = torch.optim.AdamW([
    {"params": [p for n, p in model.named_parameters() if not n.startswith("head")], "lr": 1e-5},
    {"params": model.get_classifier().parameters(), "lr": 1e-4},
], weight_decay=0.05)
```

Gunakan **normalisasi dan ukuran input yang sama** dengan saat pralatih (timm menyediakannya lewat `timm.data.resolve_data_config`).

## Augmentasi

**Augmentasi** membuat variasi realistis dari data latih sehingga model belajar hal yang penting, bukan kebetulan foto (latar, pencahayaan, posisi).

```python
import albumentations as A
from albumentations.pytorch import ToTensorV2
train_tf = A.Compose([
    A.RandomResizedCrop(size=(224, 224), scale=(0.6, 1.0)),
    A.HorizontalFlip(p=0.5),
    A.VerticalFlip(p=0.5),                         # aman untuk foto daun dari atas
    A.Rotate(limit=30, p=0.5),
    A.ColorJitter(0.2, 0.2, 0.2, 0.02, p=0.5),     # variasi cahaya lapangan
    A.GaussianBlur(p=0.2),
    A.Normalize(), ToTensorV2(),
])
```

Prinsipnya: **augmentasi tidak boleh mengubah label**. Mengubah hue secara ekstrem bisa menghapus gejala penyakit yang ditandai warna; flip vertikal tidak cocok untuk angka atau pemandangan jalan. Teknik lanjutan: **RandAugment/TrivialAugment** (kebijakan otomatis), **MixUp** dan **CutMix** (mencampur dua gambar beserta labelnya), dan **test-time augmentation** (rata-rata prediksi beberapa versi gambar uji).

## Confusion matrix

Akurasi total menyembunyikan kelas mana yang bermasalah. **Confusion matrix** menunjukkan kelas sebenarnya vs prediksi:

```viz
{"type":"confusion"}
```

```python
from sklearn.metrics import classification_report, ConfusionMatrixDisplay
ConfusionMatrixDisplay.from_predictions(y_true, y_pred, display_labels=kelas, normalize="true", cmap="YlOrBr")
print(classification_report(y_true, y_pred, target_names=kelas, digits=3))
```

Langkah setelahnya adalah **analisis error kualitatif**: tampilkan gambar yang salah diklasifikasi dengan keyakinan tertinggi. Kamu sering menemukan **label yang salah**, gambar ambigu, atau bias data (semua foto kelas A diambil di pagi hari). Perbaikan data seperti ini sering lebih berdampak daripada mengganti model. Untuk visualisasi bagian gambar yang dipakai model, gunakan **Grad-CAM**.

Pastikan juga **split data tidak bocor**: foto-foto dari tanaman atau sesi pemotretan yang sama harus berada di split yang sama, kalau tidak, akurasi validasi akan terlalu optimistis.

## Backbone modern (timm)

**timm** (PyTorch Image Models) menyediakan ratusan backbone pralatih dengan API seragam.

```python
import timm
timm.list_models("efficientnet*", pretrained=True)[:5]
m = timm.create_model("efficientnet_b0.ra_in1k", pretrained=True, num_classes=0)   # num_classes=0 → ekstraktor fitur
fitur = m(torch.randn(2, 3, 224, 224))                                            # (2, 1280)
```

```viz
{"type":"compare","columns":["Keluarga","Kekuatan","Pertimbangan"],"rows":[{"label":"ResNet","values":["Baseline andal, dipahami luas","Bukan yang paling akurat per FLOP"]},{"label":"EfficientNet / MobileNet","values":["Akurasi baik dengan komputasi kecil","Pilihan untuk mobile/edge"]},{"label":"ConvNeXt","values":["CNN modern, akurat, mudah di-fine-tune","Lebih besar dari MobileNet"]},{"label":"ViT / Swin / DINOv2","values":["Sangat kuat dengan pralatih besar; fitur umum bagus","Butuh data/pralatih besar; lebih berat"]}]}
```

Pilih berdasarkan **batasan deployment** (latensi, memori, perangkat) dan ukur langsung; tabel akurasi ImageNet tidak selalu mencerminkan performa di datamu. Mulai dari model kecil untuk iterasi cepat, lalu naikkan ukuran jika perlu.

:::latihan
Milestone: bangun classifier penyakit daun (mis. dataset publik daun padi atau PlantVillage). Bandingkan feature extraction vs fine-tuning bertahap pada dua backbone timm (satu ringan, satu lebih besar); gunakan augmentasi yang dijustifikasi untuk domainnya; laporkan confusion matrix ternormalisasi, classification report, 12 contoh error dengan Grad-CAM, dan analisis apakah ada kebocoran split.
:::

## Rangkuman

- CNN belajar kernel sendiri; fitur hierarkis dari tepi hingga bagian objek.
- Transfer learning: feature extraction → fine-tuning bertahap dengan LR kecil untuk backbone.
- Augmentasi realistis yang tidak mengubah label; MixUp/CutMix/RandAugment untuk lanjutan.
- Confusion matrix + analisis error kualitatif + Grad-CAM; waspadai split yang bocor.
- timm: backbone pralatih seragam; pilih berdasarkan batasan deployment dan ukur sendiri.
