---
title: Citra digital & OpenCV
minutes: 50
summary: Sebelum deep learning, kita perlu memahami apa itu citra bagi komputer. Modul ini membahas piksel, channel, dan ruang warna, filtering dan konvolusi, deteksi tepi dan kontur, transformasi geometri, serta memproses video dan webcam dengan OpenCV.
objectives:
  - Memahami citra sebagai array angka beserta channel dan ruang warnanya
  - Menerapkan filter blur, sharpen, dan threshold
  - Mendeteksi tepi dan kontur untuk menghitung atau mengukur objek
  - Melakukan transformasi geometri (resize, rotasi, perspektif)
  - Memproses video frame demi frame
sources:
  - repo: spmallick/learnopencv
    note: Ratusan tutorial OpenCV & CV dengan kode (LearnOpenCV)
  - repo: opencv/opencv
    note: Pustaka OpenCV & dokumentasi resmi
  - repo: jbhuang0604/awesome-computer-vision
    note: Peta sumber belajar computer vision
quiz:
  - q: "cv2.imread mengembalikan citra berwarna dalam urutan channel…"
    options: ["RGB", "BGR", "HSV", "CMYK"]
    answer: 1
    explain: "OpenCV memakai BGR; konversi ke RGB sebelum menampilkan dengan Matplotlib atau memberi ke model."
  - q: "Untuk memisahkan objek berwarna kuning terlepas dari terang-gelap cahaya, ruang warna yang lebih cocok adalah…"
    options: ["BGR", "HSV", "Grayscale", "Biner"]
    answer: 1
    explain: "HSV memisahkan hue (warna) dari value (kecerahan)."
  - q: "Gaussian blur sebelum deteksi tepi Canny bertujuan…"
    options: ["Mempertajam tepi", "Mengurangi noise agar tidak terdeteksi sebagai tepi palsu", "Mengubah warna", "Memperbesar citra"]
    answer: 1
    explain: "Turunan sangat sensitif terhadap noise."
  - q: "Untuk ‘meluruskan’ foto dokumen yang diambil miring, gunakan…"
    options: ["Rotasi 90°", "Transformasi perspektif (homografi) dari 4 titik sudut", "Blur", "Threshold"]
    answer: 1
    explain: "getPerspectiveTransform + warpPerspective memetakan segiempat miring ke persegi panjang."
---

Bagi komputer, citra hanyalah **tabel angka**. Seluruh computer vision, dari filter Instagram hingga mobil otonom, dimulai dari memahami dan memanipulasi angka-angka itu. **OpenCV** adalah pustaka CV klasik paling luas dipakai; meski deep learning mendominasi, OpenCV tetap menjadi alat sehari-hari untuk prapemrosesan, pascapemrosesan, dan sistem yang perlu ringan.

```bash
pip install opencv-python numpy matplotlib
```

## Piksel, channel, ruang warna

Citra grayscale adalah matriks H × W dengan nilai 0 (hitam) sampai 255 (putih) bertipe `uint8`. Citra berwarna adalah array **H × W × 3**.

```python
import cv2, numpy as np
img = cv2.imread("daun.jpg")                     # BGR, bukan RGB!
print(img.shape, img.dtype)                      # (720, 1280, 3) uint8
print(img[100, 200])                             # [B G R] piksel baris 100, kolom 200

rgb  = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)      # untuk Matplotlib & model deep learning
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
hsv  = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

crop = img[100:400, 300:700]                     # cropping = slicing NumPy
```

```viz
{"type":"compare","columns":["Ruang warna","Komponen","Cocok untuk"],"rows":[{"label":"RGB / BGR","values":["Merah, hijau, biru","Penyimpanan & tampilan; input model"]},{"label":"Grayscale","values":["Kecerahan saja","Tepi, bentuk, teks; komputasi lebih ringan"]},{"label":"HSV","values":["Hue, saturation, value","Segmentasi berdasarkan warna (daun menguning, buah matang)"]},{"label":"LAB","values":["Lightness, a (hijau–merah), b (biru–kuning)","Perbedaan warna yang sesuai persepsi manusia"]}]}
```

Contoh segmentasi warna sederhana: memisahkan area daun yang menguning dengan rentang HSV.

```python
bawah = np.array([20, 80, 80]); atas = np.array([35, 255, 255])   # rentang hue kuning (skala OpenCV 0–179)
mask = cv2.inRange(hsv, bawah, atas)
persen_kuning = mask.mean() / 255 * 100
```

## Filtering & konvolusi

**Filter** mengganti setiap piksel dengan kombinasi tertimbang piksel tetangganya, menggunakan **kernel** kecil yang digeser di seluruh citra. Operasi ini adalah **konvolusi**, persis operasi yang dipelajari otomatis oleh CNN.

```viz
{"type":"convolution"}
```

```python
blur    = cv2.GaussianBlur(img, (5, 5), 0)          # haluskan noise
median  = cv2.medianBlur(img, 5)                    # bagus untuk noise ‘salt & pepper’
sharpen = cv2.filter2D(img, -1, np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]))

# threshold: ubah ke biner
_, biner = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)   # Otsu memilih ambang otomatis
adapt = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 5)
```

**Operasi morfologi** pada citra biner: **erosi** mengikis tepi objek (menghapus titik kecil), **dilasi** menebalkan (menutup celah), **opening** = erosi lalu dilasi, **closing** = dilasi lalu erosi.

```python
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
bersih = cv2.morphologyEx(biner, cv2.MORPH_OPEN, k)
```

## Deteksi tepi & kontur

**Tepi** adalah tempat intensitas berubah tajam. Filter **Sobel** menghitung turunan horizontal dan vertikal; **Canny** menyempurnakannya dengan penipisan tepi dan dua ambang (histeresis).

```python
edges = cv2.Canny(cv2.GaussianBlur(gray, (5, 5), 0), threshold1=50, threshold2=150)
```

**Kontur** adalah kurva yang menghubungkan titik-titik batas objek. Dengannya kita bisa menghitung, mengukur, dan memfilter objek tanpa deep learning:

```python
kontur, _ = cv2.findContours(bersih, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
hasil = img.copy()
for c in kontur:
    luas = cv2.contourArea(c)
    if luas < 500:                                   # abaikan noise kecil
        continue
    x, y, w, h = cv2.boundingRect(c)
    cv2.rectangle(hasil, (x, y), (x + w, y + h), (0, 200, 255), 2)
    cv2.putText(hasil, f"{luas:.0f}px", (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 255), 1)
print("jumlah objek:", sum(cv2.contourArea(c) >= 500 for c in kontur))
```

```viz
{"type":"flow","title":"Pipeline CV klasik: menghitung benih/butir","steps":[{"label":"Grayscale","detail":"Kurangi ke satu channel."},{"label":"Blur","detail":"Redam noise."},{"label":"Threshold (Otsu)","detail":"Pisahkan objek dari latar."},{"label":"Morfologi","detail":"Bersihkan titik & tutup celah."},{"label":"Kontur","detail":"Hitung, ukur luas, bounding box."}]}
```

Pipeline klasik seperti ini cepat dan mudah dijelaskan, tetapi rapuh terhadap perubahan cahaya, latar, dan sudut pandang. Ketika kondisi bervariasi, deep learning (modul berikutnya) jauh lebih tangguh.

## Transformasi geometri

```python
h, w = img.shape[:2]
kecil = cv2.resize(img, (w // 2, h // 2), interpolation=cv2.INTER_AREA)       # perkecil: INTER_AREA
M = cv2.getRotationMatrix2D((w / 2, h / 2), angle=15, scale=1.0)
rotasi = cv2.warpAffine(img, M, (w, h))
flip = cv2.flip(img, 1)                                                       # cermin horizontal

# Perspektif: luruskan dokumen dari 4 titik sudut
src = np.float32([[120, 80], [980, 140], [1010, 690], [90, 640]])
dst = np.float32([[0, 0], [800, 0], [800, 600], [0, 600]])
H = cv2.getPerspectiveTransform(src, dst)
lurus = cv2.warpPerspective(img, H, (800, 600))
```

- **Affine** (translasi, rotasi, skala, shear) menjaga garis sejajar tetap sejajar — matriks 2×3.
- **Perspektif/homografi** memetakan segiempat sembarang ke segiempat lain — matriks 3×3. Dipakai di pemindai dokumen dan *bird's-eye view* kamera parkir.

Transformasi yang sama dipakai sebagai **augmentasi data** saat melatih model.

## Video & webcam

Video adalah urutan citra (frame). Pola dasarnya: baca frame → proses → tampilkan/tulis.

```python
cap = cv2.VideoCapture(0)                     # 0 = webcam; atau "video.mp4"
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out = cv2.VideoWriter("hasil.mp4", fourcc, 30, (640, 480))
bg = cv2.createBackgroundSubtractorMOG2()     # deteksi gerak sederhana

while True:
    ok, frame = cap.read()
    if not ok:
        break
    frame = cv2.resize(frame, (640, 480))
    gerak = bg.apply(frame)                   # piksel yang berubah dari latar
    if cv2.countNonZero(gerak) > 5_000:
        cv2.putText(frame, "GERAKAN", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    out.write(frame)
    cv2.imshow("kamera", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break
cap.release(); out.release(); cv2.destroyAllWindows()
```

Untuk aplikasi real-time, ukur **FPS** dan latensi; proses setiap frame ke-n atau turunkan resolusi jika perlu. Di Google Colab, `cv2.imshow` tidak tersedia; gunakan `from google.colab.patches import cv2_imshow` atau Matplotlib.

:::latihan
Milestone: buat tiga mini-proyek OpenCV: (1) penghitung objek (koin, butir beras, atau benih) dari foto dengan pipeline klasik dan laporkan akurasinya terhadap hitungan manual pada 10 foto; (2) pemindai dokumen yang mendeteksi kontur kertas terbesar dan meluruskannya dengan transformasi perspektif; (3) detektor gerak dari webcam yang menyimpan potongan video saat ada gerakan.
:::

## Rangkuman

- Citra = array uint8 H×W×C; OpenCV memakai BGR; HSV/LAB untuk analisis warna.
- Filter = konvolusi kernel; threshold (Otsu/adaptif) dan morfologi untuk citra biner.
- Canny untuk tepi; kontur untuk menghitung, mengukur, dan membuat bounding box.
- Affine (2×3) dan perspektif (3×3) untuk transformasi geometri dan augmentasi.
- Video: loop baca–proses–tulis; perhatikan FPS dan latensi.
