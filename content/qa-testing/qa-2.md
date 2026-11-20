---
title: Teknik desain test case
minutes: 40
summary: Menguji semua kemungkinan input itu mustahil. Bahkan form usia saja punya tak terhingga nilai. Teknik desain test case membantu memilih sedikit test yang paling mungkin menemukan bug. Modul ini membahas equivalence partitioning, boundary value analysis, decision table, state transition testing, dan exploratory testing.
objectives:
  - Membagi input menjadi partisi ekuivalen yang valid dan invalid
  - Menentukan nilai batas yang wajib diuji
  - Menyusun decision table untuk aturan bisnis berlapis
  - Menguji perpindahan state dan menjalankan sesi exploratory testing
sources:
  - repo: TheJambo/awesome-testing
    note: Rujukan teknik desain test dan exploratory testing
quiz:
  - q: "Kolom jumlah tiket menerima 1–10. Dengan BVA dua nilai, nilai yang diuji adalah…"
    options: ["1, 5, 10", "0, 1, 10, 11", "5 saja", "-100, 100"]
    answer: 1
    explain: "Uji tepat di batas dan tepat di luar batas: 0 (invalid), 1 (valid), 10 (valid), 11 (invalid). Varian tiga nilai menambahkan 2 dan 9."
  - q: "Aturan diskon bergantung pada 3 kondisi ya/tidak. Decision table lengkap memiliki berapa kombinasi (kolom aturan)?"
    options: ["3", "6", "8", "9"]
    answer: 2
    explain: "2³ = 8 kombinasi. Beberapa bisa digabung jika hasilnya sama (kondisi ‘tidak peduli’)."
  - q: "State transition testing paling cocok untuk…"
    options: ["Form satu field", "Fitur yang perilakunya bergantung pada riwayat/status, mis. pesanan, akun terkunci setelah 3 kali gagal login", "Menguji warna tombol", "Menghitung performa"]
    answer: 1
    explain: "Bug sering muncul pada transisi yang tidak seharusnya diizinkan, mis. membatalkan pesanan yang sudah dikirim."
  - q: "Exploratory testing yang efektif biasanya…"
    options: ["Tanpa tujuan, klik acak", "Berbasis charter dengan batas waktu (time-box) dan catatan temuan", "Menggantikan semua test case", "Hanya untuk pemula"]
    answer: 1
    explain: "Session-based exploratory testing: misi jelas, waktu terbatas (mis. 60 menit), lalu debrief."
---

Bayangkan form pendaftaran lomba dengan aturan: usia 17–60 tahun, nama 3–50 karakter, dan email valid. Jika setiap kombinasi diuji, kamu tidak akan pernah selesai. Teknik desain test case adalah cara **berpikir sistematis** untuk memilih segelintir data uji dengan peluang menemukan bug yang paling besar.

## Equivalence partitioning

**Equivalence partitioning (EP)** membagi rentang input menjadi kelompok (**partisi**) yang diperlakukan sama oleh sistem. Jika satu nilai dalam partisi lolos, diasumsikan nilai lain di partisi yang sama juga lolos, sehingga cukup **satu wakil per partisi**.

Contoh, field usia 17–60:

| Partisi | Rentang | Wakil | Hasil yang diharapkan |
|---|---|---|---|
| Invalid: terlalu muda | < 17 | 10 | ditolak |
| Valid | 17–60 | 35 | diterima |
| Invalid: terlalu tua | > 60 | 70 | ditolak |
| Invalid: bukan angka | huruf/simbol | `abc` | ditolak |
| Invalid: kosong | — | `""` | ditolak dengan pesan ‘wajib diisi’ |

Jangan lupa partisi yang sering terlewat: **kosong**, **tipe salah**, **desimal** (17,5?), **negatif**, **spasi di depan/belakang**, dan **sangat besar**.

:::tip
Uji satu partisi **invalid** per test case. Jika satu test memasukkan usia invalid **dan** email invalid sekaligus, kamu tidak tahu validasi mana yang benar-benar bekerja.
:::

## Boundary value analysis

Bug paling sering bersembunyi di **batas**: programmer menulis `<` padahal seharusnya `<=`, atau menghitung dari 0 padahal dari 1 (*off-by-one*). **Boundary value analysis (BVA)** menguji tepat di batas dan di sekitarnya.

```viz
{"type":"boundary"}
```

Untuk rentang 17–60, BVA dua nilai menguji **16, 17, 60, 61**; BVA tiga nilai menambahkan **18 dan 59**. Batas juga berlaku untuk panjang teks (nama 2, 3, 50, 51 karakter), jumlah item (keranjang 0 dan maksimum), tanggal (akhir bulan, 29 Februari, pergantian tahun), dan uang (Rp0, nominal maksimum transfer).

## Decision table

Ketika hasil bergantung pada **kombinasi beberapa kondisi**, gunakan **decision table** agar tidak ada kombinasi yang terlewat.

Aturan ongkir toko online: gratis ongkir jika (A) belanja ≥ Rp200.000 **dan** (B) alamat di Kalimantan Selatan, **atau** jika (C) pembeli member gold.

```viz
{"type":"compare","title":"Decision table: gratis ongkir","caption":"3 kondisi ya/tidak → 2³ = 8 aturan. Kolom R1–R4 bisa disederhanakan menjadi satu aturan karena jika C = Ya hasilnya selalu gratis (kondisi lain ‘tidak peduli’).","columns":["R1","R2","R3","R4","R5","R6","R7","R8"],"rows":[{"label":"C: member gold","values":["Ya","Ya","Ya","Ya","Tidak","Tidak","Tidak","Tidak"]},{"label":"A: belanja ≥ 200rb","values":["Ya","Ya","Tidak","Tidak","Ya","Ya","Tidak","Tidak"]},{"label":"B: alamat Kalsel","values":["Ya","Tidak","Ya","Tidak","Ya","Tidak","Ya","Tidak"]},{"label":"→ Gratis ongkir?","values":["✓","✓","✓","✓","✓","✗","✗","✗"]}]}
```

Setiap kolom menjadi satu test case. Decision table juga sering mengungkap **requirement yang ambigu**. Misalnya: bagaimana jika belanja tepat Rp200.000? Apakah diskon dihitung sebelum atau sesudah voucher? Pertanyaan seperti ini lebih murah dijawab sebelum kode ditulis.

## State transition testing

Banyak sistem berperilaku berbeda tergantung **status**-nya: pesanan, akun, langganan, dokumen. **State transition testing** menguji transisi yang **valid** dan, sama pentingnya, memastikan transisi **tidak valid** ditolak.

```viz
{"type":"fsm","title":"Status pesanan: transisi valid & tidak valid","caption":"Coba picu event dari setiap state. Test case yang paling sering menemukan bug: aksi yang seharusnya ditolak, seperti membatalkan pesanan yang sudah dikirim, atau membayar dua kali.","start":"Dibuat","states":[{"id":"Dibuat","detail":"Pesanan baru, menunggu pembayaran (batas 24 jam)."},{"id":"Dibayar","detail":"Pembayaran terkonfirmasi; stok dikunci."},{"id":"Dikirim","detail":"Resi terbit. Tidak bisa dibatalkan, hanya retur."},{"id":"Selesai","detail":"Diterima pembeli; dana diteruskan ke penjual."},{"id":"Dibatalkan","detail":"Oleh pembeli (sebelum kirim) atau otomatis (lewat 24 jam belum bayar). Stok dikembalikan."}],"transitions":[{"from":"Dibuat","to":"Dibayar","event":"bayar"},{"from":"Dibuat","to":"Dibatalkan","event":"batal / kedaluwarsa"},{"from":"Dibayar","to":"Dikirim","event":"input resi"},{"from":"Dibayar","to":"Dibatalkan","event":"batal (refund)"},{"from":"Dikirim","to":"Selesai","event":"konfirmasi terima"}]}
```

Daftar test minimal dari diagram ini: setiap transisi valid (5 test), dan transisi tidak valid yang berisiko, misalnya `Dikirim → batal`, `Selesai → bayar`, `Dibatalkan → input resi`, serta `bayar` dua kali berturut-turut. Untuk fitur seperti ‘akun terkunci setelah 3 kali gagal login’, uji juga **urutan**: gagal-gagal-berhasil-gagal, apakah penghitungnya di-reset?

## Exploratory testing

Teknik terstruktur di atas hanya menemukan bug yang **sudah kamu pikirkan**. **Exploratory testing** adalah belajar, merancang, dan mengeksekusi test **secara bersamaan**, dipandu rasa ingin tahu dan pengalaman. Inilah tempat ditemukannya bug yang tak terduga.

Agar tidak menjadi ‘klik acak’, gunakan **session-based testing**:

```viz
{"type":"flow","title":"Satu sesi exploratory testing","steps":[{"label":"Charter","detail":"Misi singkat: ‘Jelajahi fitur unggah foto profil dengan berbagai jenis & ukuran file untuk menemukan masalah validasi dan tampilan.’"},{"label":"Time-box","detail":"45–90 menit tanpa gangguan."},{"label":"Jelajahi","detail":"Gunakan heuristik: ubah urutan langkah, input ekstrem, koneksi lambat, tombol back, dua tab sekaligus, rotasi layar."},{"label":"Catat","detail":"Apa yang dicoba, temuan bug, pertanyaan, dan ide test baru."},{"label":"Debrief","detail":"Bagikan temuan; ubah yang penting menjadi test case/automation."}]}
```

Heuristik yang berguna: **CRUD** (buat, baca, ubah, hapus, termasuk menghapus yang sedang dipakai), **interupsi** (telepon masuk, kehilangan sinyal di tengah pembayaran), **konkurensi** (dua orang mengubah data yang sama), **data aneh** (emoji, nama sangat panjang, huruf non-Latin, `' OR 1=1`), dan **‘bagaimana jika pengguna melakukan kebalikannya?’**.

:::latihan
Milestone: untuk form pendaftaran lomba (nama 3–50 karakter, usia 17–60, email, kategori lomba dengan aturan biaya: mahasiswa Rp50.000, umum Rp100.000, diskon 20% jika daftar sebelum tanggal 10), buat: tabel EP, daftar nilai BVA, decision table biaya, dan satu diagram state status pendaftaran (draft → dikirim → diverifikasi/ditolak → lunas). Lalu jalankan satu sesi exploratory 45 menit di aplikasi nyata dengan charter tertulis.
:::

## Rangkuman

- EP: satu wakil per partisi; jangan lupakan kosong, tipe salah, dan nilai ekstrem.
- BVA: uji tepat di batas dan di luarnya, karena bug off-by-one ada di sana.
- Decision table: semua kombinasi kondisi; sekaligus mengungkap requirement yang ambigu.
- State transition: uji transisi valid dan pastikan transisi tidak valid ditolak.
- Exploratory testing dengan charter, time-box, catatan, dan debrief untuk menemukan yang tak terduga.
