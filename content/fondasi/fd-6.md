---
title: Sistem operasi & basis data dasar
minutes: 40
summary: Sistem operasi adalah ‘manajer’ yang membagi CPU, memori, dan penyimpanan untuk semua program yang berjalan. Basis data adalah cara menyimpan data agar tetap rapi dan mudah dicari. Modul ini menghubungkan keduanya, dari proses dan memori virtual sampai tabel dan query SQL pertamamu.
objectives:
  - Membedakan proses dan thread serta memahami penjadwalan CPU
  - Menjelaskan memori virtual, stack, dan heap
  - Memahami struktur file system dan permission dasar
  - Mendesain tabel relasional dan menulis query CRUD
sources:
  - repo: remzi-arpacidusseau/ostep-projects
    note: Konsep virtualisasi CPU & memori dari buku OSTEP (bukunya gratis dibaca)
  - repo: cfenollosa/os-tutorial
    note: Gambaran apa yang terjadi saat komputer menyala
  - repo: enochtangg/quick-SQL-cheatsheet
    note: Rujukan sintaks query SQL
quiz:
  - q: "Apa perbedaan utama proses dan thread?"
    options: ["Thread selalu lebih lambat", "Thread dalam satu proses berbagi memori yang sama, proses punya ruang memori sendiri", "Proses hanya ada di Linux", "Tidak ada perbedaan"]
    answer: 1
    explain: "Thread berbagi heap dan data proses induknya, sehingga komunikasinya cepat tetapi rawan race condition. Antar proses terisolasi."
  - q: "Variabel lokal di dalam fungsi umumnya disimpan di…"
    options: ["Heap", "Stack", "Hard disk", "Cache CPU saja"]
    answer: 1
    explain: "Stack menyimpan frame pemanggilan fungsi beserta variabel lokalnya dan otomatis dibersihkan saat fungsi selesai."
  - q: "Kenapa data pelanggan tidak ditulis ulang di setiap baris tabel pesanan?"
    options: ["Agar tabel lebih panjang", "Menghindari duplikasi dan inkonsistensi; cukup simpan id pelanggan sebagai foreign key", "SQL tidak mendukung teks", "Agar query lebih lambat"]
    answer: 1
    explain: "Normalisasi: data disimpan sekali di tabel yang tepat lalu direferensikan, sehingga perubahan alamat cukup di satu tempat."
  - q: "Query apa yang BERBAHAYA dijalankan tanpa klausa WHERE?"
    options: ["SELECT", "INSERT", "UPDATE dan DELETE", "CREATE TABLE"]
    answer: 2
    explain: "UPDATE atau DELETE tanpa WHERE akan mengenai SEMUA baris tabel."
---

Ketika kamu membuka browser, Spotify, dan VS Code bersamaan, ketiganya terasa berjalan serentak walau CPU-mu mungkin hanya punya beberapa core. Yang mengatur ilusi itu adalah **sistem operasi** (OS). Lalu ketika aplikasi perlu menyimpan ribuan data mahasiswa dengan aman, ia memakai **basis data**. Modul ini membahas keduanya karena keduanya bertugas mengelola sumber daya dan data.

## Proses & thread

**Program** adalah file di disk. Saat dijalankan, OS membuat **proses**: program yang sedang hidup, lengkap dengan ruang memori sendiri, daftar file yang dibuka, dan status eksekusi. Di Linux, lihat dengan `ps aux` atau `top`; di Windows lewat Task Manager.

Di dalam satu proses bisa ada beberapa **thread**, yaitu jalur eksekusi yang **berbagi memori** proses yang sama. Browser memakai banyak proses (satu per tab, agar tab yang crash tidak menjatuhkan seluruh browser), dan setiap proses memakai banyak thread.

```viz
{"type":"compare","title":"Proses vs thread","columns":["Proses","Thread"],"rows":[{"label":"Memori","values":["Ruang alamat terpisah","Berbagi memori proses induk"]},{"label":"Biaya dibuat","values":["Lebih mahal","Lebih ringan"]},{"label":"Komunikasi","values":["Lewat IPC: pipe, socket, file","Langsung lewat variabel bersama"]},{"label":"Jika crash","values":["Proses lain aman","Bisa menjatuhkan seluruh proses"]},{"label":"Risiko khas","values":["Overhead","Race condition & deadlock"]}]}
```

Karena jumlah proses jauh lebih banyak daripada core CPU, OS bergantian memberi jatah waktu kepada masing-masing. Perpindahan antar proses disebut **context switch**, dan aturan gilirannya disebut **scheduling**.

```viz
{"type":"scheduler"}
```

:::warning[Race condition]
Dua thread yang menambah variabel bersama `saldo += 1` secara bersamaan bisa ‘kehilangan’ penambahan, karena operasi itu sebenarnya tiga langkah: baca → tambah → tulis. Solusinya adalah *lock*/mutex atau menghindari data bersama yang bisa diubah.
:::

## Manajemen memori

Setiap proses melihat **memori virtual**: seolah-olah ia memiliki ruang alamat besar miliknya sendiri. OS dan perangkat keras (MMU) menerjemahkan alamat virtual ke alamat fisik RAM per **halaman** (*page*, umumnya 4 KB). Manfaatnya: proses terisolasi satu sama lain, dan halaman yang jarang dipakai bisa dipindahkan sementara ke disk (*swap*).

```viz
{"type":"layers","title":"Tata letak memori sebuah proses","caption":"Stack tumbuh ke bawah, heap tumbuh ke atas. Stack overflow terjadi jika rekursi terlalu dalam; memory leak terjadi jika heap terus terisi objek yang tidak dilepas.","layers":[{"label":"Stack","tag":"otomatis","detail":"Frame setiap pemanggilan fungsi: parameter, variabel lokal, alamat kembali. Cepat dan otomatis dibersihkan ketika fungsi selesai, tetapi ukurannya terbatas."},{"label":"↓ ruang kosong ↑","detail":"Area antara stack dan heap yang bisa dipakai keduanya untuk tumbuh."},{"label":"Heap","tag":"dinamis","detail":"Objek yang dibuat saat runtime dan ukurannya tidak diketahui di awal: list, dict, objek. Di C dikelola manual (malloc/free); di Python, Java, JS dibersihkan garbage collector."},{"label":"Data","tag":"global","detail":"Variabel global dan statis."},{"label":"Text / code","tag":"read-only","detail":"Instruksi mesin program itu sendiri."}]}
```

Python mengelola memori otomatis dengan **reference counting** ditambah *garbage collector* untuk referensi melingkar. Kamu tidak perlu `free()` seperti di C, tetapi tetap bisa boros memori, misalnya memuat file CSV 5 GB sekaligus ke list. Solusinya adalah memproses data secara bertahap (*streaming*), misalnya membaca file baris demi baris.

## File system

**File system** mengatur bagaimana file disimpan dan ditemukan di disk: nama, folder, ukuran, waktu modifikasi, dan izin akses. Contohnya NTFS (Windows), ext4 (Linux), APFS (macOS).

```viz
{"type":"tree","title":"Struktur direktori Linux","caption":"Di Linux semuanya berawal dari root ‘/’. Di Windows setiap drive punya akar sendiri (C:\\, G:\\).","root":{"label":"/","detail":"Root: akar dari seluruh file system.","children":[{"label":"home/","detail":"Folder pribadi setiap pengguna, mis. /home/ghazi.","children":[{"label":"ghazi/","detail":"Home milik pengguna ghazi, juga bisa ditulis ~","children":[{"label":"proyek/","detail":"Folder kerja kamu."},{"label":".bashrc","detail":"File tersembunyi (diawali titik): konfigurasi shell."}]}]},{"label":"etc/","detail":"File konfigurasi sistem, mis. /etc/hosts, /etc/ssh/sshd_config."},{"label":"var/","detail":"Data yang sering berubah, terutama log di /var/log."},{"label":"bin/ & usr/","detail":"Program dan library yang terpasang."},{"label":"tmp/","detail":"File sementara, bisa dihapus saat reboot."}]}}
```

Konsep yang perlu dipahami:

- **Path absolut** dimulai dari root (`/home/ghazi/data.csv`); **path relatif** dihitung dari folder saat ini (`./data.csv`, `../arsip`).
- **Permission** di Linux: setiap file punya izin *read*, *write*, *execute* untuk *owner*, *group*, dan *others*. `-rwxr-x---` berarti owner boleh semua, group boleh baca & jalankan, lainnya tidak boleh apa-apa.
- Di level rendah, file disimpan sebagai blok-blok di disk dan dicatat oleh struktur metadata (di ext4 disebut **inode**). Menghapus file biasanya hanya menghapus catatannya, sehingga data bisa dipulihkan sampai bloknya ditimpa.

## Model data relasional

Menyimpan data di file CSV cepat menjadi kacau: duplikasi, sulit dicari, rawan rusak bila dua program menulis bersamaan. **Database relasional** (PostgreSQL, MySQL, SQLite) menyimpan data dalam **tabel** berisi baris dan kolom, dengan aturan yang dijaga oleh sistemnya.

Konsep inti:

- **Primary key (PK)**: kolom yang unik untuk setiap baris, mis. `id` atau `nim`.
- **Foreign key (FK)**: kolom yang merujuk PK tabel lain, sehingga tercipta relasi.
- **Normalisasi**: setiap fakta disimpan sekali saja. Alamat pelanggan disimpan di tabel `pelanggan`, bukan diulang di setiap pesanan.

```viz
{"type":"tree","title":"Contoh skema: sistem perpustakaan","caption":"Tabel peminjaman menghubungkan anggota dan buku (relasi many-to-many). Satu anggota bisa meminjam banyak buku, satu buku bisa dipinjam banyak anggota secara bergantian.","root":{"label":"perpustakaan","detail":"Satu database berisi beberapa tabel yang saling berelasi.","children":[{"label":"anggota (id PK, nama, prodi)","detail":"Setiap anggota disimpan sekali."},{"label":"buku (id PK, judul, penulis, tahun)","detail":"Setiap judul buku disimpan sekali."},{"label":"peminjaman (id PK, anggota_id FK, buku_id FK, tgl_pinjam, tgl_kembali)","detail":"Setiap transaksi pinjam. anggota_id merujuk anggota.id, buku_id merujuk buku.id."}]}}
```

Database relasional juga menjamin **transaksi ACID**: sekumpulan perubahan terjadi seluruhnya atau tidak sama sekali. Transfer uang tidak boleh berhenti di tengah setelah saldo A berkurang tetapi saldo B belum bertambah.

## SQL dasar: CRUD

**SQL** adalah bahasa untuk berbicara dengan database relasional. Empat operasi dasarnya disingkat **CRUD**: Create, Read, Update, Delete. Kamu bisa mencobanya langsung dengan SQLite (sudah terpasang di Python lewat modul `sqlite3`).

```sql
-- Create: membuat tabel lalu menambah data
CREATE TABLE buku (
  id      INTEGER PRIMARY KEY,
  judul   TEXT NOT NULL,
  penulis TEXT,
  tahun   INTEGER CHECK (tahun > 1400)
);

INSERT INTO buku (judul, penulis, tahun) VALUES
  ('Laskar Pelangi', 'Andrea Hirata', 2005),
  ('Bumi Manusia', 'Pramoedya Ananta Toer', 1980);

-- Read: mengambil data
SELECT judul, tahun
FROM buku
WHERE tahun >= 2000
ORDER BY tahun DESC;

-- Update: mengubah data (WAJIB pakai WHERE!)
UPDATE buku SET tahun = 1980 WHERE id = 2;

-- Delete: menghapus data (WAJIB pakai WHERE!)
DELETE FROM buku WHERE id = 1;
```

Dari Python:

```python
import sqlite3

con = sqlite3.connect("perpus.db")
cur = con.cursor()
cur.execute("SELECT judul FROM buku WHERE penulis = ?", ("Andrea Hirata",))
print(cur.fetchall())
con.close()
```

Perhatikan tanda `?`: nilai dikirim terpisah dari query (*parameterized query*). Jangan pernah menyusun query dengan menggabungkan string input pengguna, karena itu membuka celah **SQL injection** (dibahas di jalur Cyber Security).

:::latihan
Buat database SQLite untuk perpustakaan dengan tiga tabel seperti skema di atas. Isi 5 anggota, 8 buku, 10 peminjaman. Tulis query untuk: (1) buku yang belum dikembalikan (`tgl_kembali IS NULL`), (2) jumlah peminjaman per anggota (`GROUP BY`), (3) judul buku yang dipinjam anggota bernama ‘Ayu’ (`JOIN`).
:::

## Rangkuman

- Proses terisolasi dengan memori sendiri; thread berbagi memori dalam satu proses. OS menjadwalkan semuanya bergiliran.
- Memori virtual mengisolasi proses; stack untuk frame fungsi, heap untuk objek dinamis.
- File system mengatur path, metadata, dan permission.
- Model relasional: tabel, primary key, foreign key, normalisasi, transaksi ACID.
- CRUD = INSERT, SELECT, UPDATE, DELETE. Selalu pakai WHERE untuk UPDATE/DELETE dan parameterized query dari kode.
