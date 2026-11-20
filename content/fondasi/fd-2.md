---
title: Python sebagai bahasa pertama
minutes: 35
summary: Python dipilih sebagai bahasa pertama karena sintaksnya bersih dan dipakai di hampir semua bidang, dari web dan otomasi sampai data science dan AI. Modul ini membahas fungsi, struktur data bawaan, teks dan file, penanganan error, serta cara mengelola paket.
objectives:
  - Menulis fungsi dengan parameter default dan nilai kembalian
  - Memilih antara list, tuple, dict, dan set sesuai kebutuhan
  - Membaca dan menulis file teks/CSV dengan aman
  - Menangani error dengan try/except dan membuat virtual environment
sources:
  - repo: trekhleb/learn-python
    note: Pembagian topik dan gaya contoh kode yang disertai assertion
  - repo: Asabeneh/30-Days-Of-Python
    note: Rujukan latihan per tipe data dan fungsi
  - repo: bellshade/Python
    note: Padanan istilah dalam Bahasa Indonesia
quiz:
  - q: "Kamu perlu menyimpan daftar NIM unik mahasiswa yang hadir dan sering mengecek ‘apakah NIM X hadir?’. Struktur data paling tepat?"
    options: ["list", "tuple", "set", "string"]
    answer: 2
    explain: "set otomatis membuang duplikat dan pengecekan keanggotaan (x in s) rata-rata O(1), jauh lebih cepat daripada list yang O(n)."
  - q: "Apa yang dicetak kode ini? def f(x, daftar=[]): daftar.append(x); return daftar — lalu print(f(1)); print(f(2))"
    options: ["[1] lalu [2]", "[1] lalu [1, 2]", "Error", "[] lalu []"]
    answer: 1
    explain: "Nilai default yang mutable (list) dibuat sekali saat fungsi didefinisikan dan dipakai bersama antar panggilan. Gunakan daftar=None lalu buat list baru di dalam fungsi."
  - q: "Kenapa membuka file sebaiknya memakai with open(...) as f?"
    options: ["Lebih cepat dibaca", "File otomatis ditutup walaupun terjadi error", "Wajib untuk file CSV", "Agar bisa membaca file biner"]
    answer: 1
    explain: "with adalah context manager: file dijamin ditutup ketika blok selesai, termasuk ketika terjadi exception."
  - q: "Untuk apa virtual environment (venv)?"
    options: ["Menjalankan Python di cloud", "Memisahkan paket dan versinya per proyek", "Mempercepat eksekusi kode", "Mengenkripsi kode"]
    answer: 1
    explain: "Setiap proyek bisa butuh versi paket berbeda. venv membuat folder paket terisolasi sehingga proyek tidak saling merusak."
---

Python membaca hampir seperti bahasa Inggris, sehingga kamu bisa fokus pada cara berpikir, bukan pada tanda baca. Tetapi ‘mudah dimulai’ bukan berarti dangkal. Bagian yang dibahas di sini adalah alat yang sama yang dipakai engineer profesional setiap hari.

Untuk mengikuti modul ini, pasang Python 3.11+ dari python.org (centang **Add Python to PATH** di Windows) dan editor VS Code dengan ekstensi Python.

## Fungsi & parameter

**Fungsi** membungkus serangkaian langkah agar bisa dipakai ulang dan diberi nama yang bermakna. Prinsipnya: satu fungsi, satu tugas.

```python
def hitung_ipk(nilai: list[float], sks: list[int]) -> float:
    """Menghitung IPK dari daftar nilai mutu (0-4) dan SKS."""
    total_bobot = sum(n * s for n, s in zip(nilai, sks))
    return round(total_bobot / sum(sks), 2)

print(hitung_ipk([4, 3.5, 3], [3, 2, 3]))  # 3.5
```

Beberapa fitur parameter yang perlu dikuasai:

```python
def sapa(nama, salam="Halo", *, tanda="!"):
    return f"{salam}, {nama}{tanda}"

sapa("Ayu")                      # 'Halo, Ayu!'      ← default dipakai
sapa("Bima", "Selamat pagi")     # positional
sapa("Citra", tanda="?")         # keyword argument
```

- **Parameter default** (`salam="Halo"`) membuat argumen opsional.
- **Keyword argument** (`tanda="?"`) membuat pemanggilan lebih jelas. Tanda `*` memaksa argumen setelahnya ditulis dengan nama.
- **Type hint** (`list[float]`, `-> float`) tidak memengaruhi eksekusi, tetapi membantu editor menemukan kesalahan.

:::warning[Jebakan nilai default yang mutable]
Jangan pernah menulis `def f(data=[])`. List default itu dibuat sekali dan dipakai bersama oleh semua pemanggilan. Pola yang benar: `def f(data=None): data = data or []`.
:::

Fungsi juga bisa menjadi nilai: dikirim ke fungsi lain. Contohnya `sorted(mahasiswa, key=lambda m: m["ipk"], reverse=True)` mengurutkan berdasarkan IPK. `lambda` adalah fungsi kecil tanpa nama.

## List, tuple, dict & set

Empat struktur data bawaan ini menyelesaikan sebagian besar kebutuhan sehari-hari. Kuncinya adalah memilih yang sesuai sifat datanya.

```viz
{"type":"compare","title":"Memilih struktur data bawaan","columns":["list","tuple","dict","set"],"rows":[{"label":"Contoh","values":["[3, 1, 3]","(-3.3, 114.6)","{'nim': '2201', 'ipk': 3.5}","{'py', 'sql'}"]},{"label":"Berurutan?","values":["Ya","Ya","Ya (urutan sisip)","Tidak"]},{"label":"Bisa diubah?","values":["Ya","Tidak (immutable)","Ya","Ya"]},{"label":"Duplikat?","values":["Boleh","Boleh","Kunci unik","Tidak"]},{"label":"Cek isi (x in …)","values":["O(n), lambat","O(n)","O(1) per kunci","O(1)"]},{"label":"Cocok untuk","values":["Koleksi berurutan","Data tetap: koordinat, RGB","Pasangan kunci→nilai","Keunikan & himpunan"]}]}
```

```python
# list: berurutan, bisa diubah
belanja = ["gula", "kopi"]
belanja.append("susu")
belanja[0] = "teh"
print(belanja[-1], len(belanja))     # susu 3

# dict: cari nilai berdasarkan kunci
stok = {"gamis": 12, "jilbab": 30}
stok["seragam"] = 22
print(stok.get("kaos", 0))           # 0, tidak error walau kunci tidak ada

for produk, jumlah in stok.items():
    print(f"{produk:<8} {jumlah:>3}")

# set: keunikan & operasi himpunan
kelas_a = {"Ayu", "Bima", "Citra"}
kelas_b = {"Bima", "Dodi"}
print(kelas_a & kelas_b)             # {'Bima'} irisan
print(kelas_a | kelas_b)             # gabungan
```

**List comprehension** adalah cara ringkas membuat list baru dari list lain:

```python
nilai = [55, 78, 91, 64, 88]
lulus = [n for n in nilai if n >= 70]          # [78, 91, 88]
kuadrat = {n: n**2 for n in range(1, 4)}      # dict comprehension {1:1, 2:4, 3:9}
```

## String & file I/O

String di Python adalah urutan karakter yang **immutable**: setiap ‘perubahan’ menghasilkan string baru. Metode yang paling sering dipakai:

```python
s = "  Universitas Lambung Mangkurat  "
s.strip()                 # 'Universitas Lambung Mangkurat'
s.lower().split()         # ['universitas', 'lambung', 'mangkurat']
"-".join(["2026", "11", "20"])   # '2026-11-20'
"ULM" in s                # False (case-sensitive)
f"{3.14159:.2f}"          # '3.14' ← f-string dengan format
```

Membaca dan menulis file selalu gunakan `with`, agar file tertutup otomatis. Tentukan juga `encoding="utf-8"`, karena tanpa itu teks berhuruf khusus bisa rusak di Windows.

```python
import csv

# menulis CSV
with open("pengeluaran.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["tanggal", "kategori", "jumlah"])
    w.writerow(["2026-11-20", "makan", 25000])

# membaca CSV sebagai dict per baris
with open("pengeluaran.csv", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        print(row["kategori"], int(row["jumlah"]))
```

Mode yang umum: `"r"` baca, `"w"` tulis ulang (isi lama hilang!), `"a"` tambah di akhir.

## Error handling

Error di Python muncul sebagai **exception**. Tanpa penanganan, program berhenti dan menampilkan *traceback*. Baca traceback dari **bawah**: baris terakhir menyebut jenis error dan pesannya.

```python
def baca_angka(teks: str) -> int | None:
    try:
        return int(teks)
    except ValueError:
        print(f"'{teks}' bukan angka")
        return None
    finally:
        pass  # selalu dijalankan, cocok untuk membersihkan resource

baca_angka("42")    # 42
baca_angka("4x2")   # '4x2' bukan angka → None
```

Prinsip penting:

- **Tangkap exception yang spesifik** (`ValueError`, `FileNotFoundError`), bukan `except:` kosong yang menelan semua error termasuk bug-mu sendiri.
- **Gagal dengan jelas.** Kalau input tidak valid dan fungsi tidak bisa melanjutkan, lempar error yang informatif: `raise ValueError("SKS harus positif")`.
- Error yang sering ditemui pemula: `NameError` (variabel belum dibuat/typo), `TypeError` (tipe tidak cocok, mis. `"2" + 3`), `IndexError` (indeks di luar list), `KeyError` (kunci dict tidak ada).

```viz
{"type":"flow","title":"Alur try / except / else / finally","caption":"else hanya dijalankan jika tidak ada exception; finally selalu dijalankan.","steps":[{"label":"try","detail":"Jalankan kode yang mungkin gagal, mis. membuka file atau mengubah teks ke angka."},{"label":"except","detail":"Jika terjadi exception yang cocok, blok ini dijalankan dan program tidak berhenti."},{"label":"else","detail":"Jika try berhasil tanpa exception, lanjutkan pekerjaan di sini."},{"label":"finally","detail":"Selalu dijalankan, berhasil maupun gagal. Tempat menutup koneksi atau file."}]}
```

## Modul & virtual environment

Kode Python dipecah menjadi **modul** (file `.py`) yang bisa di-`import`. Python sudah membawa *standard library* yang kaya: `csv`, `json`, `datetime`, `random`, `pathlib`, dan lain-lain. Paket pihak ketiga (seperti `requests` atau `pandas`) dipasang dengan `pip`.

Masalahnya: proyek A butuh `pandas 1.5`, proyek B butuh `pandas 2.2`. Solusinya **virtual environment**, yaitu folder berisi Python dan paket yang terisolasi per proyek.

```bash
# di folder proyek
python -m venv .venv

# aktifkan (Windows)
.venv\Scripts\activate
# aktifkan (macOS/Linux)
source .venv/bin/activate

pip install requests
pip freeze > requirements.txt     # catat versi paket
# orang lain cukup: pip install -r requirements.txt
```

Struktur proyek kecil yang rapi:

```text
pencatat-keuangan/
├── .venv/               ← jangan di-commit ke Git
├── requirements.txt
├── main.py              ← titik masuk program
└── keuangan/
    ├── __init__.py
    ├── data.py          ← baca/tulis CSV
    └── laporan.py       ← fungsi ringkasan
```

Di dalam `main.py`, tambahkan penjaga ini agar kode hanya berjalan saat file dieksekusi langsung, bukan saat di-import:

```python
if __name__ == "__main__":
    main()
```

:::latihan
Bangun milestone tahap ini sedikit demi sedikit. (1) Fungsi `tambah(tanggal, kategori, jumlah)` yang menulis ke CSV. (2) Fungsi `ringkasan()` yang mengembalikan dict total per kategori. (3) Tangani input jumlah yang bukan angka. (4) Pisahkan ke dua modul seperti struktur di atas.
:::

## Rangkuman

- Fungsi kecil dengan satu tugas, parameter default yang immutable, dan type hint membuat kode mudah dibaca.
- list untuk urutan, tuple untuk data tetap, dict untuk pencarian berdasarkan kunci, set untuk keunikan.
- Selalu gunakan `with` dan `encoding="utf-8"` saat bekerja dengan file.
- Tangkap exception yang spesifik; baca traceback dari bawah.
- Satu proyek, satu virtual environment, catat paket di `requirements.txt`.
