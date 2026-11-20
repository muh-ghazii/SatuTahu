---
title: Deployment & edge
minutes: 50
summary: Model visi sering harus berjalan dekat dengan kamera, misalnya di HP petani, kamera gudang, atau Raspberry Pi di kebun, dengan daya dan koneksi terbatas. Modul ini membahas ekspor ke ONNX dan TensorRT, kuantisasi, inferensi di CPU dan mobile, serta augmentasi geometris lanjutan untuk ketahanan di lapangan.
objectives:
  - Mengekspor model ke ONNX/TensorRT/TFLite dan memverifikasi keluarannya
  - Mengkuantisasi model dengan kalibrasi dan mengukur dampaknya
  - Mengoptimasi pipeline inferensi di CPU dan perangkat mobile
  - Menerapkan augmentasi geometris lanjutan dengan Kornia di GPU
sources:
  - repo: ultralytics/yolov5
    note: YOLOv5 — skrip ekspor ke banyak format & benchmark
  - repo: kornia/kornia
    note: Computer vision terdiferensiasi & augmentasi di GPU
quiz:
  - q: "Setelah ekspor ke ONNX, langkah wajib berikutnya adalah…"
    options: ["Langsung deploy", "Membandingkan output ONNX dengan PyTorch pada input yang sama dan mengukur metrik pada set validasi", "Menghapus model PyTorch", "Melatih ulang"]
    answer: 1
    explain: "Perbedaan preprocessing atau operator bisa membuat hasil berbeda diam-diam."
  - q: "Latensi model 15 ms tetapi aplikasi hanya 8 FPS. Yang paling mungkin menjadi bottleneck…"
    options: ["Model terlalu kecil", "Preprocessing, decoding video, NMS, atau gambar ulang di luar model", "GPU terlalu cepat", "Ukuran label"]
    answer: 1
    explain: "Ukur seluruh pipeline end-to-end, bukan hanya forward pass."
  - q: "Kuantisasi INT8 static membutuhkan data kalibrasi karena…"
    options: ["Untuk melatih ulang model", "Untuk menentukan rentang (skala & zero-point) aktivasi yang representatif", "Untuk membuat label", "Tidak membutuhkannya"]
    answer: 1
    explain: "Rentang aktivasi bergantung pada data; gunakan ratusan gambar yang mewakili lapangan."
  - q: "Kelebihan augmentasi dengan Kornia dibanding pustaka berbasis CPU adalah…"
    options: ["Hasilnya selalu lebih akurat", "Berjalan di GPU dalam batch dan terdiferensiasi, mengurangi bottleneck data loading", "Tidak butuh PyTorch", "Mengganti model"]
    answer: 1
    explain: "Augmentasi berat di CPU bisa membuat GPU menganggur."
---

Model yang akurat di laptop belum tentu bisa dipakai di lapangan. Kamera di kebun mungkin tanpa internet, HP pengguna mungkin kelas menengah, dan server di cloud punya biaya per jam. **Edge deployment** menjalankan model langsung di perangkat: latensi rendah, tetap berjalan offline, dan data tidak perlu meninggalkan perangkat.

```viz
{"type":"compare","columns":["Target","Format/runtime","Catatan"],"rows":[{"label":"Server GPU NVIDIA","values":["TensorRT (FP16/INT8), Triton","Throughput tertinggi"]},{"label":"Server/PC CPU","values":["ONNX Runtime, OpenVINO (Intel)","Murah, cukup untuk model kecil"]},{"label":"Android","values":["TFLite / LiteRT, ONNX Runtime Mobile, NCNN","Delegate GPU/NNAPI"]},{"label":"iOS","values":["Core ML","Neural Engine Apple"]},{"label":"Jetson / Raspberry Pi","values":["TensorRT (Jetson), NCNN/ONNX/TFLite (Pi)","Perhatikan daya & suhu"]},{"label":"Browser","values":["ONNX Runtime Web, TensorFlow.js","Tanpa instalasi"]}]}
```

## Export ONNX/TensorRT

```python
from ultralytics import YOLO
model = YOLO("best.pt")
model.export(format="onnx", imgsz=640, dynamic=False, simplify=True)   # best.onnx
model.export(format="engine", imgsz=640, half=True)                     # TensorRT FP16 (butuh GPU NVIDIA)
model.export(format="tflite", imgsz=640, int8=True, data="data.yaml")   # Android, dengan kalibrasi
```

Untuk model PyTorch umum gunakan `torch.onnx.export` (lihat [Skala & deployment](/belajar/deep-learning/dl-5)). Setelah ekspor, **verifikasi**:

```python
import numpy as np, onnxruntime as ort, torch
x = np.random.rand(1, 3, 640, 640).astype(np.float32)
out_onnx = ort.InferenceSession("best.onnx").run(None, {"images": x})[0]
out_pt = torch_model(torch.from_numpy(x)).detach().numpy()
print(np.abs(out_onnx - out_pt).max())        # harus sangat kecil (mis. < 1e-3)
```

Lalu ukur **metrik pada set validasi** dengan model hasil ekspor, karena perbedaan kecil di preprocessing (BGR vs RGB, resize, letterbox, normalisasi) adalah sumber bug yang paling umum. **TensorRT** membangun *engine* yang spesifik untuk GPU dan versi TensorRT tertentu; bangun ulang di perangkat target.

## Kuantisasi

```viz
{"type":"flow","title":"Kuantisasi INT8 dengan kalibrasi","steps":[{"label":"Model FP32","detail":"Baseline akurasi & latensi."},{"label":"Data kalibrasi","detail":"200–1.000 gambar representatif kondisi lapangan."},{"label":"Kalibrasi","detail":"Runtime mengamati rentang aktivasi → skala & zero-point."},{"label":"Model INT8","detail":"±4× lebih kecil, lebih cepat di CPU/NPU."},{"label":"Validasi","detail":"Bandingkan mAP/akurasi per kelas; jika turun banyak → QAT atau sisakan lapisan sensitif di FP16."}]}
```

```python
from onnxruntime.quantization import quantize_static, CalibrationDataReader, QuantType

class Kalibrasi(CalibrationDataReader):
    def __init__(self, gambar):
        self.it = iter([{"images": praproses(g)} for g in gambar])
    def get_next(self):
        return next(self.it, None)

quantize_static("best.onnx", "best_int8.onnx", Kalibrasi(sampel_lapangan),
                activation_type=QuantType.QUInt8, weight_type=QuantType.QInt8)
```

Lapisan yang sensitif (sering kepala deteksi atau lapisan pertama) bisa dibiarkan dalam presisi lebih tinggi. Perhatikan **kelas minoritas**: penurunan mAP rata-rata yang kecil bisa menyembunyikan penurunan besar pada satu kelas penting.

## Inference di CPU/mobile

Kecepatan aplikasi ditentukan **seluruh pipeline**, bukan hanya model:

```viz
{"type":"layers","layers":[{"label":"Tampilan","detail":"Menggambar kotak/mask, UI","tag":"ms"},{"label":"Pascaproses","detail":"Decode output, NMS, skala ke koordinat asli","tag":"ms"},{"label":"Inferensi model","detail":"Forward pass","tag":"ms"},{"label":"Praproses","detail":"Resize/letterbox, normalisasi, BGR→RGB, HWC→CHW","tag":"ms"},{"label":"Akuisisi","detail":"Decode frame kamera/video","tag":"ms"}]}
```

Strategi optimasi:

- **Pilih model sesuai perangkat**: varian nano/small, resolusi input lebih kecil (mis. 416 alih-alih 640) jika objek tidak terlalu kecil.
- **Pipelining**: ambil frame berikutnya sambil frame sekarang diinferensi (thread terpisah).
- **Lewati frame**: deteksi setiap n frame, gunakan tracker ringan di antaranya.
- **Atur thread**: `sess_options.intra_op_num_threads` sesuai jumlah core fisik.
- **Akselerator perangkat**: GPU delegate/NNAPI di Android, Neural Engine di iOS, NPU di board tertentu.
- Ukur **p50 dan p95 latensi**, FPS, penggunaan memori, dan **suhu/daya** pada perangkat sebenarnya, bukan di laptop.

Contoh pemakaian di Android dengan Flutter atau Kotlin biasanya memuat file `.tflite` lewat interpreter LiteRT. Dasar membangun aplikasinya ada di [jalur Mobile](/belajar/mobile/mo-1).

## Augmentasi geometris lanjutan

Model yang di-deploy di lapangan menghadapi sudut kamera, jarak, dan distorsi lensa yang berbeda dari data latih. Augmentasi geometris lanjutan meningkatkan ketahanan terhadap variasi itu:

```viz
{"type":"compare","columns":["Augmentasi","Mensimulasikan"],"rows":[{"label":"Perspective / homography","values":["Kamera miring, foto dari samping"]},{"label":"Affine (shear, scale besar)","values":["Jarak dan orientasi berbeda"]},{"label":"Elastic / thin-plate spline","values":["Daun melengkung, objek lunak, jaringan biologis"]},{"label":"Distorsi lensa","values":["Kamera wide-angle/fisheye murah"]},{"label":"Motion blur","values":["Kamera atau objek bergerak"]}]}
```

**Kornia** menjalankan augmentasi di **GPU dalam batch** dan bersifat terdiferensiasi, sehingga augmentasi berat tidak membuat GPU menunggu CPU. Untuk deteksi, kotak ikut ditransformasikan:

```python
import kornia.augmentation as K
import torch

aug = K.AugmentationSequential(
    K.RandomPerspective(distortion_scale=0.4, p=0.5),
    K.RandomAffine(degrees=20, translate=0.1, scale=(0.7, 1.3), shear=10, p=0.7),
    K.RandomThinPlateSpline(scale=0.1, p=0.2),
    K.RandomMotionBlur(kernel_size=7, angle=35.0, direction=0.5, p=0.2),
    data_keys=["input", "bbox_xyxy"],
)
gambar = torch.rand(16, 3, 640, 640, device="cuda")
kotak = torch.tensor([[[100., 120., 260., 300.]]], device="cuda").repeat(16, 1, 1)
gambar_aug, kotak_aug = aug(gambar, kotak)
```

Selalu **visualisasikan** hasil augmentasi beserta labelnya dan pastikan masih realistis; augmentasi yang terlalu agresif bisa menurunkan akurasi. Strategi yang baik: evaluasi model pada **set uji lapangan** terpisah (foto dari perangkat target), bukan hanya pada split acak dari data yang sama.

:::latihan
Milestone akhir jalur: ambil detektor dari modul deteksi; ekspor ke ONNX dan satu format target (TFLite untuk Android atau TensorRT/OpenVINO); verifikasi output; kuantisasi INT8 dengan data kalibrasi lapangan; ukur ukuran, latensi p50/p95 end-to-end, dan mAP per kelas untuk FP32/FP16/INT8 di perangkat sungguhan (HP atau Raspberry Pi). Tambahkan augmentasi geometris Kornia, latih ulang, dan bandingkan performa pada set uji lapangan. Sajikan tabel trade-off dan rekomendasi konfigurasi.
:::

## Rangkuman

- Pilih format sesuai target: TensorRT (GPU NVIDIA), ONNX Runtime/OpenVINO (CPU), TFLite/Core ML (mobile).
- Setelah ekspor: bandingkan output dan ukur metrik — preprocessing adalah sumber bug utama.
- Kuantisasi INT8 dengan kalibrasi representatif; cek penurunan per kelas.
- Optimasi seluruh pipeline: praproses, inferensi, pascaproses, threading, lewati frame; ukur di perangkat nyata.
- Augmentasi geometris lanjutan (Kornia, GPU) + set uji lapangan untuk ketahanan.
