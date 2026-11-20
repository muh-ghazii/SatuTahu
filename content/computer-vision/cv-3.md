---
title: Deteksi objek dengan YOLO
minutes: 60
summary: Deteksi objek menjawab dua pertanyaan sekaligus, yaitu apa dan di mana. Modul ini membahas anotasi bounding box, format dataset YOLO dan COCO, training dan fine-tuning dengan Ultralytics, metrik IoU, precision-recall, dan mAP, serta tracking objek antar frame dengan ByteTrack.
objectives:
  - Menyusun panduan anotasi dan dataset deteksi yang konsisten
  - Mengonversi dan memahami format YOLO dan COCO
  - Melatih dan menyetel detektor YOLO pada dataset kustom
  - Menafsirkan IoU, precision-recall, mAP@0.5 dan mAP@0.5:0.95
  - Menambahkan tracking untuk menghitung objek di video
sources:
  - repo: ultralytics/ultralytics
    note: Pustaka YOLO Ultralytics (training, validasi, ekspor)
  - repo: roboflow/notebooks
    note: Notebook tutorial deteksi & segmentasi
  - repo: roboflow/supervision
    note: Utilitas anotasi visual, tracking, dan penghitungan
quiz:
  - q: "Baris label format YOLO ‘2 0.50 0.40 0.20 0.10’ berarti…"
    options: ["Kelas 2, kotak dari (0,50; 0,40) ke (0,20; 0,10) dalam piksel", "Kelas 2, pusat (0,50; 0,40), lebar 0,20, tinggi 0,10 — dinormalisasi terhadap ukuran gambar", "Dua objek", "Kelas 2 dengan confidence 0,5"]
    answer: 1
    explain: "Format YOLO: class x_center y_center width height, semua relatif 0–1."
  - q: "Dua kotak masing-masing 100 px², beririsan 50 px². IoU-nya…"
    options: ["0,50", "0,33", "0,25", "1,0"]
    answer: 1
    explain: "IoU = 50 / (100 + 100 − 50) = 50/150 ≈ 0,33."
  - q: "mAP@0.5:0.95 lebih ketat daripada mAP@0.5 karena…"
    options: ["Memakai lebih banyak kelas", "Merata-ratakan AP pada ambang IoU 0,50 sampai 0,95 sehingga menuntut lokalisasi yang presisi", "Hanya menghitung objek besar", "Mengabaikan false positive"]
    answer: 1
    explain: "Pada ambang IoU tinggi, kotak yang ‘kira-kira benar’ tidak lagi dihitung benar."
  - q: "Fungsi Non-Maximum Suppression (NMS) adalah…"
    options: ["Menambah kotak", "Membuang kotak duplikat yang sangat tumpang tindih dan menyisakan yang paling yakin", "Melacak objek", "Augmentasi"]
    answer: 1
    explain: "Detektor sering memprediksi beberapa kotak untuk satu objek."
---

Klasifikasi memberi satu label per gambar. **Deteksi objek** menemukan **setiap** objek, memberi label, dan menggambar **bounding box**: menghitung buah di pohon, mendeteksi helm proyek, menemukan bercak penyakit di daun. Keluarga **YOLO** (*You Only Look Once*) populer karena cepat, akurat, dan mudah dilatih.

## Anotasi bounding box

Model deteksi hanya sebaik anotasinya. Sebelum melabeli ribuan gambar, tulis **panduan anotasi**:

```viz
{"type":"tree","root":{"label":"Panduan anotasi","children":[{"label":"Definisi kelas","detail":"Contoh positif & negatif tiap kelas; kelas yang mirip dibedakan dengan ciri apa"},{"label":"Aturan kotak","detail":"Rapat ke tepi objek yang terlihat; objek terpotong tepi gambar tetap dilabeli"},{"label":"Kasus sulit","detail":"Objek tertutup sebagian, sangat kecil, buram — label atau abaikan? Konsisten!"},{"label":"Kualitas","detail":"Sampel 10% diperiksa orang kedua; ukur kesepakatan antar-anotator"}]}}
```

Alat anotasi: **CVAT**, **Label Studio** (open source), dan **Roboflow** (web, ekspor ke banyak format). Kumpulkan data yang **mencerminkan kondisi penggunaan nyata**: variasi cahaya, sudut, jarak, latar, dan perangkat kamera. Sertakan juga **gambar tanpa objek** (background) agar model belajar tidak memberi false positive.

## Format dataset (YOLO/COCO)

```viz
{"type":"compare","columns":["YOLO (TXT)","COCO (JSON)"],"rows":[{"label":"Struktur","values":["Satu .txt per gambar","Satu file JSON untuk seluruh split"]},{"label":"Kotak","values":["class xc yc w h (dinormalisasi 0–1)","[x_min, y_min, width, height] dalam piksel"]},{"label":"Kelas","values":["Indeks 0..n−1, nama di data.yaml","categories dengan id & name"]},{"label":"Dipakai oleh","values":["Ultralytics YOLO","Detectron2, MMDetection, benchmark COCO"]}]}
```

```text
dataset/
├── images/{train,val,test}/*.jpg
├── labels/{train,val,test}/*.txt      # nama file sama dengan gambarnya
└── data.yaml
```

```yaml
# data.yaml
path: dataset
train: images/train
val: images/val
test: images/test
names:
  0: blast
  1: brown_spot
  2: bacterial_blight
```

Konversi dari COCO ke YOLO: x_center = (x_min + w/2) / lebar_gambar, dan seterusnya. Pustaka `supervision` dan Roboflow dapat mengonversi otomatis. Selalu **visualisasikan** beberapa label setelah konversi; kotak yang bergeser adalah bug yang sangat umum.

## Training & fine-tuning

```python
from ultralytics import YOLO

model = YOLO("yolo11n.pt")             # pralatih COCO; n/s/m/l/x = ukuran
hasil = model.train(
    data="dataset/data.yaml",
    epochs=100, imgsz=640, batch=16,
    patience=20,                        # early stopping
    seed=0, project="padi", name="y11n-640",
)
metrik = model.val(split="test")        # evaluasi akhir sekali pada test
pred = model.predict("uji/daun_01.jpg", conf=0.25, iou=0.5, save=True)
```

Ultralytics merilis generasi model baru secara berkala (YOLOv8, YOLO11, dan penerusnya); API `train/val/predict/export` umumnya sama, sehingga kamu dapat membandingkan versi dengan mengganti nama bobot. Arsitektur modern sudah **anchor-free**, dan beberapa varian terbaru bahkan dirancang tanpa NMS (*end-to-end*).

Tips fine-tuning:

- Mulai dari model **kecil** (n/s) untuk iterasi cepat; naikkan ukuran jika metrik masih kurang.
- **Objek kecil**: naikkan `imgsz` (mis. 960/1280) atau gunakan *tiling* (SAHI).
- **Kelas tidak seimbang**: tambah data kelas minoritas lebih efektif daripada trik loss.
- Augmentasi bawaan (mosaic, HSV, flip, scale) biasanya baik; matikan yang tidak realistis untuk domainmu.

## mAP, IoU, precision-recall

**IoU (Intersection over Union)** mengukur seberapa tepat kotak prediksi dengan kotak sebenarnya. Geser kotak untuk melihat perubahan IoU:

```viz
{"type":"iou"}
```

Prediksi dihitung **benar (TP)** jika kelasnya benar dan IoU ≥ ambang (mis. 0,5). Kemudian:

```viz
{"type":"flow","title":"Dari prediksi ke mAP","steps":[{"label":"Urutkan prediksi","detail":"Berdasarkan confidence, untuk satu kelas."},{"label":"Cocokkan","detail":"Setiap prediksi → TP atau FP berdasarkan IoU; ground truth yang tak tertangkap = FN."},{"label":"Kurva P–R","detail":"Hitung precision & recall kumulatif saat ambang confidence diturunkan."},{"label":"AP","detail":"Luas di bawah kurva precision–recall (diinterpolasi)."},{"label":"mAP","detail":"Rata-rata AP semua kelas; @0.5:0.95 juga dirata-rata atas 10 ambang IoU."}]}
```

Membaca hasil: **mAP@0.5** tinggi tetapi **mAP@0.5:0.95** rendah berarti model menemukan objek tetapi kotaknya kurang presisi. **Recall** rendah berarti banyak objek terlewat (cek objek kecil/tertutup). **Precision** rendah berarti banyak deteksi palsu (tambah gambar background, periksa label). Pilih **ambang confidence** operasional berdasarkan biaya FP vs FN di aplikasimu, bukan default 0,25.

## Tracking (ByteTrack)

Di video, detektor bekerja per frame tanpa ‘ingatan’. **Multi-object tracking** memberi **ID** yang konsisten untuk objek yang sama antar frame, sehingga kita bisa menghitung objek yang melintas atau mengukur lama tinggal.

**ByteTrack** mencocokkan deteksi dengan track yang ada memakai prediksi gerak (Kalman filter) dan IoU, dengan trik penting: deteksi berkeyakinan **rendah** tidak langsung dibuang, tetapi dipakai pada tahap pencocokan kedua untuk mempertahankan track objek yang sedang tertutup sebagian.

```python
import supervision as sv
from ultralytics import YOLO

model = YOLO("runs/detect/train/weights/best.pt")
tracker = sv.ByteTrack()
garis = sv.LineZone(start=sv.Point(0, 400), end=sv.Point(1280, 400))

for frame in sv.get_video_frames_generator("jalan.mp4"):
    det = sv.Detections.from_ultralytics(model(frame, verbose=False)[0])
    det = tracker.update_with_detections(det)          # det.tracker_id terisi
    garis.trigger(det)                                  # hitung yang melintas garis
print("masuk:", garis.in_count, "keluar:", garis.out_count)
```

Alternatif bawaan: `model.track(source="video.mp4", tracker="bytetrack.yaml")`. Masalah umum tracking: **ID switch** saat objek bersilangan dan **fragmentasi** saat objek lama tertutup; metrik evaluasinya antara lain MOTA, IDF1, dan HOTA.

:::latihan
Milestone: buat detektor kustom end-to-end. Kumpulkan dan anotasi ≥ 300 gambar (2–3 kelas) dengan panduan anotasi tertulis; latih dua ukuran model YOLO; laporkan mAP@0.5, mAP@0.5:0.95, precision, recall per kelas, dan kurva P–R; analisis 20 kesalahan; pilih ambang confidence beralasan. Bonus: tambahkan ByteTrack untuk menghitung objek di sebuah video.
:::

## Rangkuman

- Anotasi: panduan tertulis, kotak rapat, kasus sulit konsisten, sertakan gambar background.
- YOLO: class xc yc w h ternormalisasi; COCO: JSON dengan kotak piksel; selalu visualisasikan.
- Ultralytics: train/val/predict dengan API sama lintas versi; mulai dari model kecil.
- IoU → TP/FP → kurva P–R → AP → mAP; bedakan @0.5 dan @0.5:0.95; pilih ambang sesuai biaya.
- Tracking (ByteTrack) memberi ID antar frame untuk penghitungan dan analisis gerak.
