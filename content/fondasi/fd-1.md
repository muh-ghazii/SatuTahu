---
title: Cara kerja komputer & logika pemrograman
minutes: 25
summary: Sebelum menulis kode, pahami dulu ‘mesin’ yang akan menjalankannya, yaitu bagaimana data disimpan sebagai bit, bagaimana CPU dan memori bekerja sama, dan bagaimana memecah masalah menjadi langkah-langkah yang bisa dieksekusi.
objectives:
  - Menjelaskan bagaimana angka, huruf, dan warna disimpan sebagai bit
  - Membedakan peran CPU, RAM, dan penyimpanan
  - Menulis algoritma dalam bentuk pseudocode
  - Memakai variabel, tipe data, percabangan, dan perulangan
sources:
  - repo: ossu/computer-science
    note: Urutan topik pengantar ilmu komputer
  - repo: jwasham/coding-interview-university
    note: Daftar konsep representasi data dan cara kerja komputer
quiz:
  - q: "Berapa nilai desimal dari bilangan biner 00001011?"
    options: ["9", "11", "13", "1011"]
    answer: 1
    explain: "8 + 0 + 2 + 1 = 11. Bit yang bernilai 1 berada di posisi 2³, 2¹, dan 2⁰."
  - q: "Mengapa isi RAM hilang saat komputer dimatikan, sedangkan isi SSD tidak?"
    options: ["RAM lebih kecil dari SSD", "RAM bersifat volatile, butuh listrik untuk mempertahankan data", "SSD memakai bit yang berbeda", "RAM hanya menyimpan angka"]
    answer: 1
    explain: "RAM adalah memori volatile: cepat, tetapi datanya hilang tanpa listrik. SSD/HDD adalah penyimpanan non-volatile."
  - q: "Perulangan mana yang paling tepat bila jumlah pengulangan BELUM diketahui sebelumnya, misalnya meminta input sampai pengguna mengetik ‘selesai’?"
    options: ["for dengan range", "while dengan kondisi", "if-else", "Tidak perlu perulangan"]
    answer: 1
    explain: "while terus berulang selama kondisinya benar. Cocok saat batas pengulangan ditentukan oleh kejadian, bukan hitungan."
  - q: "Apa hasil dari 7 // 2 dan 7 % 2 di Python?"
    options: ["3.5 dan 1", "3 dan 1", "3 dan 0", "4 dan 1"]
    answer: 1
    explain: "// adalah pembagian bulat (3), % adalah sisa bagi (1). Keduanya sering dipakai, mis. untuk cek ganjil/genap."
---

Komputer tidak ‘mengerti’ apa pun. Ia hanya menjalankan instruksi sangat sederhana, seperti menjumlahkan, membandingkan, atau memindahkan angka, tetapi miliaran kali per detik. Kemampuan programmer adalah memecah masalah besar menjadi instruksi-instruksi kecil seperti itu. Modul ini membangun fondasi tersebut.

## Bit, byte & representasi data

Di level paling dasar, semua data di komputer adalah **bit**: nilai 0 atau 1, yang secara fisik berupa ada/tidaknya muatan listrik. Delapan bit membentuk satu **byte**, yang bisa menyatakan 2⁸ = 256 kemungkinan nilai (0–255).

Bagaimana angka disimpan? Dengan sistem bilangan **biner** (basis 2). Setiap posisi bernilai pangkat dua, persis seperti desimal yang setiap posisinya bernilai pangkat sepuluh.

```viz
{"type":"binary"}
```

Huruf disimpan dengan cara yang sama, lewat tabel kesepakatan. Di **ASCII**, huruf ‘A’ = 65 = `01000001`. Standar **Unicode** (dengan encoding UTF-8) memperluasnya sehingga bisa menampung huruf dari seluruh dunia, termasuk emoji. Warna pada layar biasanya disimpan sebagai tiga byte: merah, hijau, biru (RGB). Kuning SatuTahu `#FEC536` berarti R = 254, G = 197, B = 54.

| Satuan | Ukuran | Contoh |
|---|---|---|
| 1 byte | 8 bit | satu huruf ASCII |
| 1 KB | ±1.000 byte | satu halaman teks polos |
| 1 MB | ±1.000 KB | satu foto ponsel terkompresi |
| 1 GB | ±1.000 MB | film berdurasi pendek |

:::info[Kenapa programmer sering memakai heksadesimal?]
Satu digit heksadesimal (0–9, A–F) mewakili tepat 4 bit, sehingga 1 byte cukup ditulis dua karakter (`FF` = 255). Jauh lebih ringkas dibanding menulis 8 digit biner.
:::

## CPU, memori & penyimpanan

Komputer modern mengikuti arsitektur **von Neumann**: program dan data sama-sama disimpan di memori, lalu CPU mengambil dan menjalankannya satu per satu.

```viz
{"type":"flow","title":"Siklus fetch-decode-execute","caption":"CPU mengulang siklus ini miliaran kali per detik. Kecepatan clock 3 GHz berarti sekitar 3 miliar siklus per detik.","loop":true,"steps":[{"label":"Fetch","detail":"CPU mengambil instruksi berikutnya dari RAM, di alamat yang ditunjuk oleh program counter."},{"label":"Decode","detail":"Unit kontrol menerjemahkan instruksi: operasi apa (mis. ADD) dan data mana yang dipakai."},{"label":"Execute","detail":"ALU (Arithmetic Logic Unit) melakukan perhitungan atau perbandingan."},{"label":"Store","detail":"Hasil disimpan ke register atau kembali ke RAM, lalu program counter maju ke instruksi berikutnya."}]}
```

Data ‘tinggal’ di beberapa lapisan memori, dengan trade-off kecepatan vs kapasitas:

```viz
{"type":"layers","title":"Hierarki memori","caption":"Semakin ke atas semakin cepat, mahal, dan kecil. Program cepat adalah program yang memanfaatkan lapisan atas dengan baik.","layers":[{"label":"Register CPU","tag":"< 1 ns","detail":"Beberapa ratus byte di dalam CPU itu sendiri. Tempat CPU benar-benar bekerja."},{"label":"Cache (L1/L2/L3)","tag":"1–10 ns","detail":"Beberapa MB memori super cepat yang menyimpan salinan data yang sering dipakai dari RAM."},{"label":"RAM","tag":"~100 ns","detail":"Memori kerja berukuran beberapa GB. Volatile: isinya hilang saat listrik mati. Program yang sedang berjalan ada di sini."},{"label":"SSD","tag":"~100 µs","detail":"Penyimpanan permanen (non-volatile). File dan aplikasi yang belum dibuka disimpan di sini."},{"label":"HDD / jaringan","tag":"ms","detail":"Paling lambat, tetapi murah dan besar. Mengambil data dari server lain bahkan lebih lambat lagi."}]}
```

:::analogi
CPU adalah koki, register adalah talenan, RAM adalah meja dapur, dan SSD adalah gudang. Koki bekerja paling cepat dengan bahan yang sudah ada di talenan; mengambil dari gudang butuh waktu lama.
:::

## Algoritma & pseudocode

**Algoritma** adalah urutan langkah yang jelas, terbatas, dan pasti berhenti untuk menyelesaikan masalah. Resep masakan adalah algoritma, begitu juga cara menghitung kembalian di kasir.

Sebelum menulis kode, programmer sering menulis **pseudocode**: langkah-langkah dalam bahasa manusia yang terstruktur, tanpa peduli aturan sintaks bahasa tertentu.

```text
ALGORITMA HitungKembalian
  INPUT total_belanja, uang_dibayar
  JIKA uang_dibayar < total_belanja MAKA
      TAMPILKAN "Uang kurang"
  SELAIN ITU
      kembalian ← uang_dibayar − total_belanja
      TAMPILKAN kembalian
  AKHIR JIKA
```

Algoritma yang baik punya ciri: **input** jelas, **output** jelas, setiap langkah **tidak ambigu**, dan **pasti berhenti**. Banyak bug terjadi karena salah satu ciri ini dilanggar, misalnya lupa menangani kasus ‘uang kurang’.

:::tip[Pecah masalahnya]
Jika masalah terasa terlalu besar, tanyakan: ‘langkah pertama yang paling kecil apa?’ Teknik ini disebut *decomposition*, dan merupakan keterampilan terpenting seorang programmer, jauh sebelum hafal sintaks.
:::

## Variabel, tipe data & operator

**Variabel** adalah nama untuk sebuah nilai yang disimpan di memori. Di Python, kamu cukup memberi nama dan nilai:

```python
nama = "Ghazi"          # str  (teks)
semester = 5            # int  (bilangan bulat)
ipk = 3.72              # float (bilangan desimal)
aktif = True            # bool (benar/salah)

print(type(semester))   # <class 'int'>
```

Setiap nilai punya **tipe data**, yang menentukan operasi apa yang masuk akal. Menjumlahkan dua `int` menghasilkan angka, sedangkan menjumlahkan dua `str` menyambungkan teks:

```python
print(2 + 3)        # 5
print("2" + "3")    # 23  ← teks disambung, bukan dijumlah!
print(int("2") + 3) # 5   ← ubah tipe dulu (casting)
```

Operator yang paling sering dipakai:

| Jenis | Operator | Contoh | Hasil |
|---|---|---|---|
| Aritmatika | `+ - * /` | `7 / 2` | `3.5` |
| Pembagian bulat & sisa | `// %` | `7 // 2`, `7 % 2` | `3`, `1` |
| Perbandingan | `== != < > <= >=` | `5 >= 3` | `True` |
| Logika | `and or not` | `True and False` | `False` |

:::warning
Jangan tertukar `=` (memberi nilai) dengan `==` (membandingkan). `x = 5` menyimpan 5 ke x; `x == 5` bertanya ‘apakah x sama dengan 5?’.
:::

## Percabangan & perulangan

Program menjadi ‘cerdas’ karena bisa **memilih** (percabangan) dan **mengulang** (perulangan).

```python
nilai = 78

if nilai >= 85:
    huruf = "A"
elif nilai >= 70:
    huruf = "B"
elif nilai >= 55:
    huruf = "C"
else:
    huruf = "D"

print(f"Nilai {nilai} → {huruf}")  # Nilai 78 → B
```

Urutan kondisi penting: Python memeriksa dari atas dan berhenti di kondisi pertama yang benar.

Untuk perulangan, gunakan `for` jika jumlahnya diketahui, dan `while` jika berulang sampai suatu kondisi terpenuhi:

```python
# for: jumlah pengulangan diketahui
total = 0
for i in range(1, 11):     # 1, 2, ..., 10
    total += i
print(total)               # 55

# while: berulang sampai kondisi berubah
saldo = 100_000
bulan = 0
while saldo < 150_000:
    saldo *= 1.05          # bunga 5% per bulan
    bulan += 1
print(bulan)               # 9
```

:::latihan
Tulis program yang mencetak angka 1–30, tetapi ganti kelipatan 3 dengan `Fizz`, kelipatan 5 dengan `Buzz`, dan kelipatan keduanya dengan `FizzBuzz`. Petunjuk: gunakan `%` untuk mengecek kelipatan, dan pikirkan urutan `if` yang benar.
:::

## Rangkuman

- Semua data adalah bit; 8 bit = 1 byte = 256 kemungkinan nilai. Huruf dan warna hanyalah angka dengan kesepakatan tafsir.
- CPU menjalankan siklus fetch-decode-execute; data berpindah antara register, cache, RAM, dan penyimpanan dengan kecepatan yang sangat berbeda.
- Algoritma = langkah jelas, terbatas, pasti berhenti. Tulis pseudocode sebelum kode.
- Variabel menyimpan nilai bertipe; percabangan memilih jalur, perulangan mengulang langkah.
