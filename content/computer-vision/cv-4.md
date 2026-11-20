---
title: Segmentasi & model fondasi
minutes: 55
summary: Segmentasi memberi label pada setiap piksel, cukup presisi untuk mengukur luas lesi, memisahkan objek bertumpuk, atau membaca citra medis. Modul ini membahas U-Net dan Mask R-CNN, Segment Anything, deteksi open-vocabulary, serta framework Detectron2 dan MMDetection.
objectives:
  - Membedakan semantic, instance, dan panoptic segmentation
  - Menjelaskan arsitektur U-Net dan Mask R-CNN beserta metrik IoU/Dice
  - Memakai Segment Anything dengan prompt titik dan kotak
  - Mendeteksi objek dari deskripsi teks dengan model open-vocabulary
  - Memilih framework riset (Detectron2, MMDetection) untuk eksperimen
sources:
  - repo: facebookresearch/segment-anything
    note: Segment Anything Model (SAM) dari Meta
  - repo: facebookresearch/detectron2
    note: Framework deteksi & segmentasi (Mask R-CNN)
  - repo: open-mmlab/mmdetection
    note: Toolbox deteksi OpenMMLab
  - repo: mrgloom/awesome-semantic-segmentation
    note: Kumpulan paper & kode segmentasi
quiz:
  - q: "Menghitung persentase luas daun yang terkena bercak paling tepat dengan…"
    options: ["Klasifikasi gambar", "Deteksi bounding box", "Segmentasi semantik (piksel daun vs piksel bercak)", "Tracking"]
    answer: 2
    explain: "Bounding box mencakup banyak piksel bukan bercak; luas butuh mask per piksel."
  - q: "Skip connection pada U-Net berfungsi untuk…"
    options: ["Mengurangi parameter", "Membawa detail spasial resolusi tinggi dari encoder ke decoder agar batas mask tajam", "Mengganti loss", "Mempercepat inferensi"]
    answer: 1
    explain: "Encoder kehilangan detail lokasi saat downsampling; skip mengembalikannya."
  - q: "SAM membutuhkan apa untuk menghasilkan mask?"
    options: ["Training ulang pada datasetmu", "Prompt berupa titik, kotak, atau mode otomatis — tanpa training tambahan", "Label kelas", "Teks deskripsi wajib"]
    answer: 1
    explain: "SAM bersifat promptable dan zero-shot; ia tidak memberi nama kelas."
  - q: "Dice coefficient = 2|A∩B| / (|A| + |B|). Untuk mask identik nilainya…"
    options: ["0", "0,5", "1", "2"]
    answer: 2
    explain: "Dice 1 = tumpang tindih sempurna; banyak dipakai di segmentasi medis."
---

Bounding box cukup untuk menghitung objek, tetapi tidak untuk mengukur bentuk dan luasnya. **Segmentasi** memberi label per piksel. Dalam beberapa tahun terakhir, muncul juga **model fondasi** visi yang bisa mensegmentasi atau mendeteksi hampir apa pun tanpa training khusus, dan mengubah cara kita membangun dataset.

```viz
{"type":"compare","columns":["Jenis","Output","Contoh"],"rows":[{"label":"Semantic","values":["Kelas per piksel; objek sekelas tidak dibedakan","Area jalan, langit, vegetasi; piksel bercak vs daun sehat"]},{"label":"Instance","values":["Mask terpisah per objek","Setiap buah/sel/orang punya mask sendiri"]},{"label":"Panoptic","values":["Gabungan: ‘stuff’ semantik + ‘things’ per instance","Pemahaman adegan lengkap untuk kendaraan otonom"]}]}
```

## U-Net & Mask R-CNN

**U-Net** (Ronneberger et al., 2015, awalnya untuk citra biomedis) adalah arsitektur encoder–decoder berbentuk U:

```viz
{"type":"flow","title":"U-Net","steps":[{"label":"Encoder","detail":"Konvolusi + downsampling: resolusi turun, makna naik (‘apa’)."},{"label":"Bottleneck","detail":"Representasi paling abstrak."},{"label":"Decoder","detail":"Upsampling kembali ke resolusi asli (‘di mana’)."},{"label":"Skip connection","detail":"Feature map encoder disambungkan ke decoder di level yang sama → batas tajam."},{"label":"Output","detail":"Peta kelas per piksel (1×1 conv + softmax/sigmoid)."}]}
```

```python
import segmentation_models_pytorch as smp
model = smp.Unet(encoder_name="resnet34", encoder_weights="imagenet", in_channels=3, classes=3)
loss = smp.losses.DiceLoss(mode="multiclass") 
```

**Mask R-CNN** (He et al., 2017) memperluas detektor Faster R-CNN dengan cabang ketiga yang memprediksi mask kecil untuk setiap kotak: **deteksi + segmentasi instance** sekaligus. YOLO juga memiliki varian segmentasi (`yolo11n-seg.pt`) yang jauh lebih cepat.

Metrik segmentasi: **IoU/Jaccard** per kelas dan **mIoU**, serta **Dice** (= F1 piksel) yang populer di bidang medis. Untuk kelas kecil (bercak hanya 3% piksel), gunakan **Dice loss** atau **focal loss** karena cross-entropy biasa didominasi piksel latar.

```viz
{"type":"iou"}
```

## Segment Anything

**Segment Anything Model (SAM)** dari Meta dilatih pada lebih dari satu miliar mask. Ia **promptable**: beri titik, kotak, atau mask kasar, dan SAM mengembalikan mask objek yang dimaksud, tanpa training pada datasetmu.

```python
from segment_anything import sam_model_registry, SamPredictor
import numpy as np, cv2

sam = sam_model_registry["vit_b"](checkpoint="sam_vit_b_01ec64.pth")
pred = SamPredictor(sam)
pred.set_image(cv2.cvtColor(cv2.imread("daun.jpg"), cv2.COLOR_BGR2RGB))   # encoder dijalankan sekali

masks, scores, _ = pred.predict(
    point_coords=np.array([[420, 310]]), point_labels=np.array([1]),        # 1 = titik positif
    multimask_output=True)                                                    # 3 kandidat mask
mask = masks[scores.argmax()]

masks_kotak, _, _ = pred.predict(box=np.array([300, 200, 560, 450]), multimask_output=False)
```

```viz
{"type":"layers","layers":[{"label":"Mask decoder","detail":"Ringan; menggabungkan embedding citra + prompt → mask dalam milidetik","tag":"interaktif"},{"label":"Prompt encoder","detail":"Titik, kotak, mask kasar","tag":""},{"label":"Image encoder (ViT)","detail":"Berat; dijalankan sekali per gambar","tag":"embedding"}]}
```

Kegunaan utama di proyek nyata: **mempercepat anotasi** (klik sekali → mask; Label Studio dan CVAT sudah mendukung), membuat mask dari kotak deteksi (detektor + SAM = instance segmentation tanpa melabeli mask), dan analisis ilmiah. Batasan: SAM **tidak memberi nama kelas**, dan pada domain yang sangat berbeda (beberapa citra medis, mikroskop) kualitasnya bisa turun. Generasi penerusnya (SAM 2 dan seterusnya) menambahkan dukungan video dan peningkatan lain.

## Open-vocabulary detection

Detektor klasik hanya mengenali kelas yang ada di data latihnya. **Open-vocabulary detection** menerima **deskripsi teks** sebagai kelas, berkat model yang menyelaraskan citra dan teks (seperti CLIP).

```python
from transformers import pipeline
det = pipeline("zero-shot-object-detection", model="IDEA-Research/grounding-dino-tiny")
hasil = det("kebun.jpg", candidate_labels=["buah jeruk", "daun menguning", "keranjang"], threshold=0.3)
```

```viz
{"type":"flow","title":"Auto-labeling dengan model fondasi","steps":[{"label":"Prompt teks","detail":"‘helmet’, ‘ripe mango’ — Grounding DINO / OWL-ViT / YOLO-World."},{"label":"Kotak","detail":"Deteksi zero-shot."},{"label":"SAM","detail":"Kotak → mask."},{"label":"Review manusia","detail":"Koreksi cepat, bukan melabeli dari nol."},{"label":"Latih model kecil","detail":"YOLO/U-Net cepat untuk produksi."}]}
```

Pola ini disebut **distilasi** dari model fondasi besar (akurat tetapi lambat) ke model kecil khusus (cepat dan murah). Model open-vocabulary bekerja paling baik untuk konsep umum; istilah sangat spesifik (nama penyakit tanaman tertentu) sering perlu fine-tuning atau label manual.

## Detectron2 & MMDetection

Saat kebutuhanmu melampaui satu pustaka siap pakai — membandingkan banyak arsitektur, memodifikasi komponen, atau mereproduksi paper — gunakan framework riset:

```viz
{"type":"compare","columns":["Detectron2 (Meta)","MMDetection (OpenMMLab)"],"rows":[{"label":"Fokus","values":["Faster/Mask R-CNN, panoptic, implementasi riset Meta","Koleksi model sangat luas (DETR, DINO, RTMDet, Cascade…)"]},{"label":"Konfigurasi","values":["Python/YAML config + registry","Config Python bertingkat (inheritance)"]},{"label":"Ekosistem","values":["Proyek turunan (DensePose, dll.)","MMSegmentation, MMPose, MMRotate, MMYOLO"]},{"label":"Kapan","values":["Instance segmentation & riset berbasis R-CNN","Membandingkan banyak detektor dengan protokol seragam"]}]}
```

```python
from detectron2.config import get_cfg
from detectron2 import model_zoo
from detectron2.data.datasets import register_coco_instances
from detectron2.engine import DefaultTrainer

register_coco_instances("daun_train", {}, "ann/train.json", "img/train")
cfg = get_cfg()
cfg.merge_from_file(model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"))
cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url("COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml")
cfg.DATASETS.TRAIN = ("daun_train",); cfg.DATASETS.TEST = ()
cfg.MODEL.ROI_HEADS.NUM_CLASSES = 3
cfg.SOLVER.IMS_PER_BATCH, cfg.SOLVER.BASE_LR, cfg.SOLVER.MAX_ITER = 4, 2.5e-4, 3000
DefaultTrainer(cfg).train()
```

Untuk aplikasi produksi yang butuh kecepatan, Ultralytics atau model yang diekspor (lihat [modul berikutnya](/belajar/computer-vision/cv-5)) biasanya lebih praktis; framework riset unggul untuk eksperimen terkontrol dan perbandingan metode dalam tugas akhir atau penelitian.

:::latihan
Milestone: (1) latih U-Net untuk segmentasi semantik (mis. lesi daun atau dataset segmentasi publik) dengan Dice loss dan laporkan mIoU/Dice per kelas; (2) gunakan SAM untuk membuat mask dari 50 kotak anotasi dan ukur waktu yang dihemat dibanding anotasi poligon manual; (3) jalankan Grounding DINO + SAM untuk auto-label 100 gambar, koreksi manual, lalu latih model YOLO-seg kecil dan bandingkan dengan hasil zero-shot.
:::

## Rangkuman

- Semantic vs instance vs panoptic; pilih sesuai pertanyaan (luas, jumlah, adegan lengkap).
- U-Net: encoder–decoder + skip connection; Mask R-CNN: deteksi + mask per instance; metrik IoU/mIoU/Dice.
- SAM: segmentasi promptable zero-shot — mempercepat anotasi, tidak memberi nama kelas.
- Open-vocabulary detection: kelas dari teks; pola auto-label → review → distilasi ke model kecil.
- Detectron2/MMDetection untuk riset dan perbandingan metode yang terkontrol.
