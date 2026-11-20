---
title: Struktur data
minutes: 40
summary: Struktur data adalah cara menyusun data di memori. Pilihan yang tepat bisa membuat program ribuan kali lebih cepat. Modul ini membedah enam struktur paling penting, lengkap dengan visualisasi cara kerja dan biaya setiap operasinya.
objectives:
  - Menjelaskan perbedaan array dan linked list di memori
  - Memakai stack dan queue untuk masalah yang tepat
  - Memahami hashing dan penyebab collision
  - Menyisipkan dan mencari di binary search tree serta merepresentasikan graph
sources:
  - repo: TheAlgorithms/Python
    note: Rujukan implementasi struktur data di Python
  - repo: trekhleb/javascript-algorithms
    note: Ringkasan kompleksitas setiap operasi struktur data
  - repo: williamfiset/Algorithms
    note: Variasi implementasi graph dan tree
quiz:
  - q: "Operasi mana yang O(1) pada array/list Python tetapi O(n) pada linked list?"
    options: ["Menambah di depan", "Mengakses elemen ke-k", "Menghapus di depan", "Menghitung jumlah elemen yang sudah dicatat"]
    answer: 1
    explain: "Array menyimpan elemen bersebelahan sehingga alamat elemen ke-k bisa dihitung langsung. Linked list harus berjalan dari head satu per satu."
  - q: "Fitur ‘Undo’ di editor teks paling cocok diimplementasikan dengan…"
    options: ["Queue", "Stack", "Hash table", "Graph"]
    answer: 1
    explain: "Undo membatalkan aksi terakhir lebih dulu: Last In, First Out, yaitu sifat stack."
  - q: "Apa yang terjadi pada performa hash table jika sangat banyak kunci jatuh ke bucket yang sama?"
    options: ["Tetap O(1)", "Menurun mendekati O(n)", "Menjadi O(log n)", "Tabel otomatis menolak kunci"]
    answer: 1
    explain: "Collision membuat rantai di satu bucket memanjang. Implementasi nyata menjaga load factor rendah dengan memperbesar tabel (rehashing)."
  - q: "Kamu memasukkan 1, 2, 3, 4, 5 secara berurutan ke BST biasa. Bentuk pohonnya?"
    options: ["Seimbang sempurna", "Miring ke kanan seperti linked list", "Miring ke kiri", "Error karena data terurut"]
    answer: 1
    explain: "Setiap angka lebih besar dari sebelumnya sehingga selalu ke kanan. Pencarian menjadi O(n). Karena itu ada pohon self-balancing seperti AVL dan Red-Black tree."
---

Bayangkan mencari nomor telepon di buku yang tidak terurut: kamu harus membaca halaman demi halaman. Buku telepon yang terurut alfabetis membuatnya instan. Datanya sama; yang berbeda adalah **cara menyusunnya**. Itulah inti struktur data.

Setiap struktur adalah *trade-off*: cepat untuk operasi tertentu, lambat untuk yang lain. Kita akan memakai notasi Big-O secara ringan di sini (dibahas mendalam di modul berikutnya): O(1) berarti waktu tetap, O(n) berarti sebanding dengan jumlah data.

## Array & list dinamis

**Array** menyimpan elemen secara **bersebelahan** di memori. Karena setiap elemen berukuran sama, alamat elemen ke-k bisa dihitung langsung: `alamat_awal + k × ukuran`. Inilah sebabnya akses `a[k]` selalu O(1).

`list` di Python adalah **array dinamis**: saat penuh, Python mengalokasikan blok baru yang lebih besar (sekitar 1,125× pada CPython) lalu menyalin isinya. Penyalinan itu mahal tetapi jarang terjadi, sehingga rata-rata `append` tetap O(1) (*amortized*).

| Operasi pada list | Kompleksitas | Alasan |
|---|---|---|
| `a[k]` akses | O(1) | alamat dihitung langsung |
| `a.append(x)` | O(1) amortized | sesekali perlu memperbesar |
| `a.insert(0, x)` | O(n) | semua elemen digeser |
| `x in a` | O(n) | dicek satu per satu |
| `a.pop()` dari akhir | O(1) | tidak ada yang digeser |

:::tip
Jika kamu sering menambah/menghapus di **depan** list, gunakan `collections.deque`, yang O(1) di kedua ujung.
:::

## Linked list

**Linked list** menyimpan setiap elemen dalam **node** yang berisi nilai dan penunjuk (*pointer*) ke node berikutnya. Node bisa tersebar di mana saja di memori.

```viz
{"type":"linked-list"}
```

```python
class Node:
    def __init__(self, nilai, next=None):
        self.nilai = nilai
        self.next = next

# A → B → C
head = Node("A", Node("B", Node("C")))

# sisipkan X setelah A: cukup ubah dua pointer, O(1)
head.next = Node("X", head.next)

# menelusuri: harus dari head, O(n)
n = head
while n:
    print(n.nilai, end=" → ")
    n = n.next
```

Linked list unggul saat sering menyisipkan/menghapus di posisi yang sudah ditunjuk, tetapi kalah dalam akses acak dan *cache locality* (data tersebar membuat CPU cache kurang efektif). Dalam praktik Python sehari-hari kamu jarang membuatnya sendiri, tetapi konsep node + pointer adalah dasar tree dan graph.

## Stack & queue

Keduanya adalah **struktur dengan aturan akses**:

- **Stack** (tumpukan) bersifat LIFO, *Last In First Out*. Operasi: `push` (taruh di atas), `pop` (ambil dari atas).
- **Queue** (antrean) bersifat FIFO, *First In First Out*. Operasi: `enqueue` (masuk belakang), `dequeue` (keluar depan).

```viz
{"type":"stack-queue"}
```

```python
from collections import deque

stack = []
stack.append("buka file"); stack.append("ketik"); stack.append("hapus")
print(stack.pop())         # 'hapus' ← undo aksi terakhir

queue = deque()
queue.append("cetak tugas A"); queue.append("cetak tugas B")
print(queue.popleft())     # 'cetak tugas A' ← dilayani lebih dulu
```

Contoh penggunaan nyata: **call stack** saat fungsi memanggil fungsi lain, tombol back di browser, pengecekan pasangan kurung `({[]})` (stack); antrean print, antrean pesan antar layanan, dan BFS pada graph (queue).

## Hash table

**Hash table** (di Python: `dict` dan `set`) memungkinkan pencarian berdasarkan kunci dalam rata-rata O(1). Caranya: **fungsi hash** mengubah kunci menjadi angka, lalu angka itu dimodulo ukuran tabel untuk menentukan **bucket**.

```viz
{"type":"hash-table"}
```

Ketika dua kunci menghasilkan bucket yang sama, terjadilah **collision**. Ada dua strategi umum: *chaining* (bucket menyimpan daftar, seperti visualisasi di atas) dan *open addressing* (cari bucket kosong berikutnya; ini yang dipakai CPython). Agar tetap cepat, tabel diperbesar ketika *load factor* (jumlah item ÷ jumlah bucket) melewati ambang tertentu.

Konsekuensi penting: kunci `dict` harus **hashable**, yaitu nilainya tidak boleh berubah. Itulah sebabnya `str`, `int`, dan `tuple` boleh menjadi kunci, sedangkan `list` tidak.

```python
nilai = {("2201", "Basis Data"): "A"}   # tuple sebagai kunci: boleh
nilai[["2201"]] = "B"                   # TypeError: unhashable type: 'list'
```

## Tree & binary search tree

**Tree** adalah struktur hierarkis: satu **root**, setiap node punya anak, dan tidak ada siklus. Kamu bertemu tree setiap hari: folder di komputer, DOM halaman web, struktur organisasi.

**Binary search tree (BST)** adalah tree dengan aturan: setiap node punya maksimal dua anak, semua nilai di **kiri lebih kecil**, semua di **kanan lebih besar**. Aturan ini membuat pencarian cukup mengikuti satu jalur.

```viz
{"type":"bst"}
```

```python
class BST:
    def __init__(self, v): self.v, self.kiri, self.kanan = v, None, None

    def sisip(self, v):
        if v < self.v:
            if self.kiri: self.kiri.sisip(v)
            else: self.kiri = BST(v)
        elif v > self.v:
            if self.kanan: self.kanan.sisip(v)
            else: self.kanan = BST(v)

    def cari(self, v):
        if v == self.v: return True
        anak = self.kiri if v < self.v else self.kanan
        return anak.cari(v) if anak else False
```

Pada pohon yang **seimbang**, tinggi pohon ≈ log₂ n, sehingga cari/sisip O(log n): 1 juta data hanya butuh ±20 perbandingan. Pada pohon miring (coba tombol ‘Data berurutan’ di visualisasi), kinerjanya jatuh ke O(n). Database memakai varian seimbang bernama **B-tree** untuk index.

## Graph

**Graph** terdiri dari **simpul** (*vertex*) dan **sisi** (*edge*) yang menghubungkannya, tanpa aturan hierarki. Graph bisa berarah (follow di Instagram) atau tidak berarah (pertemanan di Facebook), dan sisinya bisa berbobot (jarak antar kota).

Dua cara merepresentasikan graph:

```python
# adjacency list: hemat memori, paling umum
peta = {
    "Banjarmasin": ["Martapura", "Marabahan"],
    "Martapura":   ["Banjarmasin", "Banjarbaru"],
    "Banjarbaru":  ["Martapura"],
    "Marabahan":   ["Banjarmasin"],
}
# adjacency matrix: matriks n×n berisi 0/1, cepat cek ‘apakah A terhubung B’,
# tetapi boros memori untuk graph yang jarang sisinya
```

Dua algoritma penelusuran dasar:

```viz
{"type":"graph-search"}
```

- **BFS** (*breadth-first search*) memakai **queue**: jelajahi semua tetangga terdekat dulu. Menjamin jalur terpendek pada graph tak berbobot.
- **DFS** (*depth-first search*) memakai **stack** (atau rekursi): menyelam sedalam mungkin, lalu mundur. Cocok untuk mendeteksi siklus atau menjelajah semua kemungkinan.

Graph ada di mana-mana: rute Google Maps, rekomendasi teman, dependensi paket, bahkan jaringan komputer.

:::latihan
Implementasikan fungsi `cek_kurung(teks)` yang mengembalikan `True` jika semua kurung `()[]{}` berpasangan dengan benar, mis. `"{[()]}"` → True, `"([)]"` → False. Petunjuk: push kurung buka ke stack; saat bertemu kurung tutup, pop dan cocokkan.
:::

## Rangkuman

| Struktur | Unggul untuk | Lemah di |
|---|---|---|
| Array/list | akses indeks O(1), iterasi | sisip di depan/tengah O(n) |
| Linked list | sisip/hapus di posisi diketahui | akses acak O(n) |
| Stack/queue | urutan pemrosesan LIFO/FIFO | akses elemen tengah |
| Hash table | cari berdasarkan kunci O(1) | tidak terurut, butuh memori lebih |
| BST seimbang | data terurut + cari O(log n) | bisa miring tanpa balancing |
| Graph | relasi bebas antar entitas | algoritma lebih kompleks |
