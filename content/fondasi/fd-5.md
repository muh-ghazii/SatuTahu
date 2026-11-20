---
title: Algoritma & kompleksitas
minutes: 40
summary: Dua program bisa memberi jawaban yang sama, tetapi yang satu selesai dalam sekejap dan yang lain butuh berjam-jam. Modul ini mengajarkan cara mengukur efisiensi dengan notasi Big-O, lalu menerapkannya pada pencarian, pengurutan, rekursi, dan dynamic programming.
objectives:
  - Menentukan kompleksitas waktu sebuah potongan kode
  - Membandingkan pencarian linear dan binary search
  - Menjelaskan cara kerja bubble, merge, dan quick sort
  - Menulis fungsi rekursif dan mengoptimalkannya dengan memoization
sources:
  - repo: keon/algorithms
    note: Rujukan implementasi algoritma minimal di Python
  - repo: donnemartin/interactive-coding-challenges
    note: Pola soal dan analisis kompleksitas
  - repo: jwasham/coding-interview-university
    note: Urutan topik algoritma
quiz:
  - q: "Berapa kompleksitas kode ini? for i in range(n): for j in range(n): print(i, j)"
    options: ["O(n)", "O(2n)", "O(n²)", "O(log n)"]
    answer: 2
    explain: "Loop dalam berjalan n kali untuk setiap iterasi loop luar: n × n = n² operasi."
  - q: "Binary search pada 1.000.000 data terurut membutuhkan paling banyak sekitar berapa perbandingan?"
    options: ["1.000.000", "500.000", "1.000", "20"]
    answer: 3
    explain: "Setiap langkah membuang separuh data: log₂(1.000.000) ≈ 20."
  - q: "Keunggulan utama merge sort dibanding quick sort adalah…"
    options: ["Tidak butuh memori tambahan", "Kinerja terburuknya tetap O(n log n)", "Selalu lebih cepat", "Tidak perlu rekursi"]
    answer: 1
    explain: "Merge sort selalu O(n log n), tetapi butuh memori tambahan O(n). Quick sort biasanya lebih cepat di praktik, tetapi terburuknya O(n²) jika pivot buruk."
  - q: "Apa syarat sebuah masalah cocok diselesaikan dengan dynamic programming?"
    options: ["Datanya harus terurut", "Punya sub-masalah yang tumpang tindih dan substruktur optimal", "Harus memakai graph", "Inputnya kecil"]
    answer: 1
    explain: "DP menyimpan hasil sub-masalah agar tidak dihitung ulang. Ini hanya berguna jika sub-masalah yang sama muncul berkali-kali."
---

Algoritma adalah resep; kompleksitas adalah ukuran **seberapa mahal** resep itu ketika bahannya bertambah banyak. Pertanyaan yang dijawab modul ini bukan ‘berapa detik program ini berjalan’ (itu tergantung komputer), melainkan ‘bagaimana waktunya **tumbuh** ketika input membesar’.

## Notasi Big-O

**Big-O** menggambarkan laju pertumbuhan jumlah operasi terhadap ukuran input *n*, dengan mengabaikan konstanta dan suku kecil. `3n² + 5n + 10` ditulis **O(n²)**, karena ketika n besar, n² yang mendominasi.

```viz
{"type":"big-o"}
```

Cara cepat membaca kompleksitas dari kode:

```python
def contoh(data):            # n = len(data)
    print(data[0])           # O(1): satu langkah
    for x in data:           # O(n): sekali per elemen
        print(x)
    for x in data:           # O(n²): loop bersarang
        for y in data:
            print(x, y)
    i = len(data)
    while i > 1:             # O(log n): ukuran dibagi dua tiap langkah
        i //= 2
# total: O(1) + O(n) + O(n²) + O(log n) = O(n²)
```

| Big-O | Nama | Contoh | n = 1.000.000 |
|---|---|---|---|
| O(1) | konstan | akses `dict` | 1 |
| O(log n) | logaritmik | binary search | ±20 |
| O(n) | linear | mencari di list | 1 juta |
| O(n log n) | linearitmik | merge sort, `sorted()` | ±20 juta |
| O(n²) | kuadratik | bubble sort | 10¹² (berhari-hari) |

Big-O biasanya membahas **kasus terburuk**. Ada juga **kompleksitas ruang**: berapa banyak memori tambahan yang dipakai.

## Pencarian linear & binary

**Pencarian linear** memeriksa elemen satu per satu, O(n). Sederhana dan bekerja pada data apa pun.

**Binary search** hanya bekerja pada data **terurut**, tetapi jauh lebih cepat: bandingkan dengan elemen tengah, lalu buang separuh data yang tidak mungkin berisi target.

```viz
{"type":"binary-search"}
```

```python
def binary_search(arr: list[int], target: int) -> int:
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            lo = mid + 1      # target di kanan
        else:
            hi = mid - 1      # target di kiri
    return -1                 # tidak ditemukan
```

:::warning[Bug klasik]
Banyak implementasi binary search salah di detail batas: `lo < hi` vs `lo <= hi`, atau `mid` vs `mid + 1`. Uji selalu dengan array kosong, satu elemen, target di ujung pertama/terakhir, dan target yang tidak ada.
:::

Python menyediakan modul `bisect` untuk binary search yang sudah teruji.

## Sorting: bubble, merge, quick

Pengurutan adalah masalah klasik yang memperlihatkan perbedaan strategi algoritma dengan sangat jelas.

```viz
{"type":"sorting"}
```

**Bubble sort** berulang kali membandingkan pasangan bersebelahan dan menukarnya bila salah urutan. Elemen terbesar ‘menggelembung’ ke akhir. Mudah dipahami, tetapi O(n²).

**Merge sort** memakai strategi **divide and conquer**: belah array menjadi dua, urutkan masing-masing secara rekursif, lalu **gabungkan** dua bagian terurut. Selalu O(n log n), butuh memori tambahan O(n).

```python
def merge_sort(a):
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    kiri, kanan = merge_sort(a[:mid]), merge_sort(a[mid:])
    hasil, i, j = [], 0, 0
    while i < len(kiri) and j < len(kanan):
        if kiri[i] <= kanan[j]:
            hasil.append(kiri[i]); i += 1
        else:
            hasil.append(kanan[j]); j += 1
    return hasil + kiri[i:] + kanan[j:]
```

**Quick sort** memilih **pivot**, memindahkan elemen lebih kecil ke kiri dan lebih besar ke kanan (*partition*), lalu mengurutkan kedua sisi secara rekursif. Rata-rata O(n log n) dan cepat di praktik, tetapi pivot yang buruk (mis. data sudah terurut + pivot elemen terakhir) membuatnya O(n²).

:::info[Di dunia nyata]
Jangan menulis sorting sendiri untuk produksi. `sorted()` dan `list.sort()` di Python memakai **Timsort** (gabungan merge sort dan insertion sort), O(n log n), dan sangat cepat pada data yang sebagian sudah terurut. Pelajari algoritma ini untuk melatih cara berpikir.
:::

## Rekursi

**Rekursi** adalah fungsi yang memanggil dirinya sendiri untuk menyelesaikan versi masalah yang lebih kecil. Setiap fungsi rekursif butuh dua bagian:

1. **Base case**: kondisi berhenti yang langsung dijawab.
2. **Recursive case**: memecah masalah dan memanggil diri sendiri dengan input yang lebih kecil.

```python
def faktorial(n: int) -> int:
    if n <= 1:              # base case
        return 1
    return n * faktorial(n - 1)   # recursive case

# faktorial(4) → 4 * faktorial(3) → 4 * 3 * faktorial(2) → ... → 24
```

Setiap panggilan disimpan di **call stack** sampai base case tercapai. Tanpa base case (atau jika input tidak mengecil), stack terus menumpuk sampai Python berhenti dengan `RecursionError` (batas bawaan sekitar 1000 tingkat).

Rekursi sangat alami untuk struktur yang memang rekursif: tree, folder di dalam folder, atau merge sort tadi. Namun rekursi naif bisa sangat boros, seperti yang akan kita lihat.

## Dynamic programming dasar

Lihat definisi Fibonacci: `fib(n) = fib(n-1) + fib(n-2)`. Implementasi rekursif langsung menghitung sub-masalah yang sama **berulang-ulang**: `fib(5)` menghitung `fib(3)` dua kali, `fib(2)` tiga kali, dan seterusnya. Pertumbuhannya eksponensial.

```viz
{"type":"recursion"}
```

**Dynamic programming (DP)** menghindari kerja ganda dengan **menyimpan hasil sub-masalah**. Dua gaya:

```python
from functools import cache

# 1) Top-down: rekursi + memoization
@cache
def fib(n: int) -> int:
    return n if n < 2 else fib(n - 1) + fib(n - 2)

# 2) Bottom-up: isi tabel dari kasus terkecil
def fib_tabel(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print(fib(90), fib_tabel(90))   # instan, O(n)
```

DP cocok bila masalah memiliki **sub-masalah yang tumpang tindih** dan **substruktur optimal** (solusi optimal tersusun dari solusi optimal sub-masalah). Contoh klasik: jumlah cara naik tangga 1 atau 2 langkah, kembalian koin dengan jumlah koin minimum, knapsack, dan *edit distance* (dasar fitur ‘did you mean…?’).

:::latihan
**Masalah tangga:** kamu bisa naik 1 atau 2 anak tangga sekali langkah. Ada berapa cara mencapai anak tangga ke-n? Tulis versi rekursif biasa, ukur waktunya untuk n = 35, lalu tambahkan `@cache` dan bandingkan. (Petunjuk: polanya sama dengan Fibonacci.)
:::

## Rangkuman

- Big-O mengukur laju pertumbuhan; fokus pada suku dominan dan kasus terburuk.
- Binary search O(log n) memerlukan data terurut; linear search O(n) bekerja di mana saja.
- Bubble O(n²); merge selalu O(n log n) dengan memori tambahan; quick rata-rata O(n log n), terburuk O(n²).
- Rekursi = base case + recursive case; waspadai kerja berulang.
- DP menyimpan hasil sub-masalah: eksponensial → polinomial.
