---
title: Riset pengguna & arsitektur informasi
minutes: 40
summary: Desain yang indah tetapi menyelesaikan masalah yang salah tetap gagal. Modul ini mengajarkan cara memahami pengguna sebelum menggambar layar, yaitu wawancara dan survei yang tidak bias, merangkum temuan menjadi persona dan journey map, menyusun menu lewat card sorting, memetakan user flow, dan merumuskan problem statement.
objectives:
  - Merancang dan menjalankan wawancara pengguna tanpa pertanyaan menggiring
  - Membuat persona dan journey map berbasis data, bukan asumsi
  - Menyusun arsitektur informasi dengan card sorting
  - Memetakan user flow dan menulis problem statement yang tajam
sources:
  - repo: ttt30ga/awesome-product-design
    note: Kurasi metode riset dan artikel product design
  - repo: goabstract/Awesome-Design-Tools
    note: Daftar alat riset, survei, dan card sorting
quiz:
  - q: "Pertanyaan wawancara mana yang paling baik?"
    options: ["Apakah kamu suka fitur pengingat tugas?", "Ceritakan terakhir kali kamu hampir lupa deadline tugas. Apa yang terjadi?", "Kamu akan memakai aplikasi ini kan?", "Berapa harga yang mau kamu bayar?"]
    answer: 1
    explain: "Tanyakan pengalaman nyata di masa lalu, bukan pendapat atau prediksi. Pertanyaan ya/tidak dan menggiring menghasilkan jawaban yang menyenangkan pewawancara, bukan kebenaran."
  - q: "Persona yang baik dibuat dari…"
    options: ["Imajinasi tim desain", "Pola nyata dari hasil riset (wawancara/observasi)", "Data demografi saja", "Foto stok yang menarik"]
    answer: 1
    explain: "Persona tanpa riset hanya memperkuat asumsi tim. Fokus pada tujuan, perilaku, dan hambatan, bukan hobi atau warna favorit."
  - q: "Card sorting terbuka (open) dipakai untuk…"
    options: ["Menguji desain visual", "Menemukan bagaimana pengguna mengelompokkan dan menamai konten secara alami", "Menghitung jumlah klik", "Menguji performa"]
    answer: 1
    explain: "Pada open card sort, peserta membuat kelompok dan namanya sendiri. Closed card sort menguji kategori yang sudah kamu tentukan."
  - q: "Problem statement yang baik…"
    options: ["Sudah menyebut solusinya (mis. ‘butuh aplikasi’)", "Menjelaskan siapa, masalahnya, dan dampaknya tanpa menetapkan solusi", "Sepanjang mungkin", "Berisi semua fitur"]
    answer: 1
    explain: "Rumusan yang menyebut solusi terlalu dini menutup kemungkinan solusi lain yang lebih baik."
---

Kesalahan paling mahal dalam membuat produk adalah membangun sesuatu yang tidak dibutuhkan. Riset pengguna adalah cara murah untuk mengetahui hal itu **sebelum** waktu dan biaya habis untuk desain dan kode. Kabar baiknya, riset tidak harus besar: lima wawancara yang baik sering sudah mengungkap sebagian besar masalah utama.

Studi kasus modul ini: mahasiswa sering terlambat mengumpulkan tugas karena informasi deadline tersebar di grup WhatsApp, LMS, dan papan pengumuman.

## Wawancara & survei

```viz
{"type":"compare","title":"Wawancara vs survei","columns":["Wawancara","Survei"],"rows":[{"label":"Menjawab","values":["KENAPA dan BAGAIMANA (kualitatif)","BERAPA BANYAK (kuantitatif)"]},{"label":"Jumlah peserta","values":["5–8 per segmen","Puluhan–ratusan"]},{"label":"Kapan","values":["Awal: memahami masalah","Setelah punya hipotesis: mengukur seberapa umum"]},{"label":"Risiko","values":["Bias pewawancara, sampel kecil","Pertanyaan yang salah dijawab banyak orang"]}]}
```

Aturan emas wawancara:

1. **Tanyakan masa lalu, bukan masa depan.** ‘Ceritakan terakhir kali…’ jauh lebih jujur daripada ‘Apakah kamu akan memakai…?’. Orang buruk dalam memprediksi perilakunya sendiri.
2. **Jangan menggiring.** Hindari ‘Bukankah menyebalkan kalau…?’. Gunakan pertanyaan terbuka: ‘Bagaimana biasanya kamu…?’.
3. **Gali dengan ‘kenapa’** (bisa 3–5 kali) sampai menemukan motivasi sebenarnya.
4. **Diam itu emas.** Beri jeda; orang sering menambahkan hal penting setelah hening sejenak.
5. **Jangan presentasikan idemu**, karena peserta akan cenderung bersikap sopan dan memuji.

Contoh panduan singkat (30 menit): perkenalan & izin merekam → konteks (‘ceritakan minggu kuliahmu’) → kejadian spesifik (‘terakhir kali hampir lupa deadline’) → cara saat ini (‘bagaimana kamu mencatat deadline?’) → hambatan (‘bagian mana yang paling menyusahkan?’) → penutup.

## Persona & journey map

Setelah wawancara, kumpulkan temuan di papan (*affinity mapping*): tulis setiap observasi di satu sticky note, lalu kelompokkan berdasarkan kemiripan. Pola yang muncul menjadi dasar **persona** dan **journey map**.

**Persona** adalah representasi fiktif berbasis data dari satu segmen pengguna. Yang penting bukan foto atau hobi, melainkan **tujuan, perilaku, dan hambatan**:

> **Rani, 20, mahasiswa semester 3 yang aktif organisasi.** Tujuan: tidak pernah telat tugas sambil tetap aktif di himpunan. Perilaku: mengandalkan grup WhatsApp, mencatat di kepala, mengecek LMS hanya saat ingat. Hambatan: pengumuman tenggelam di ratusan chat; deadline berubah tanpa pemberitahuan jelas.

**Journey map** memetakan pengalaman pengguna dari waktu ke waktu, termasuk emosinya:

```viz
{"type":"flow","title":"Journey map: dari tugas diumumkan sampai dikumpulkan","caption":"Titik terendah emosi (tahap 3–4) adalah peluang desain terbesar. Bukan di tahap yang sudah berjalan baik.","steps":[{"label":"1. Tugas diumumkan","detail":"Dosen mengumumkan di kelas/WA. Rani: ‘Oke, masih 2 minggu.’ 😐 Belum dicatat di mana pun."},{"label":"2. Tenggelam","detail":"300+ chat baru di grup. Informasi detail (format, cara kumpul) tertimbun. 😶"},{"label":"3. Ingat mendadak","detail":"Teman bertanya H-1. Panik mencari pengumuman lama. 😰 Peluang: pengingat otomatis."},{"label":"4. Bingung detail","detail":"Format file & cara kumpul tidak jelas; bertanya ulang di grup. 😤 Peluang: satu sumber info per tugas."},{"label":"5. Kumpul","detail":"Mengumpulkan menjelang tengah malam. Lega tetapi lelah. 😮‍💨"}]}
```

## Card sorting

**Arsitektur informasi** (IA) adalah cara konten diorganisasi dan diberi label sehingga mudah ditemukan. Masalah umum: menu disusun mengikuti struktur organisasi atau istilah internal tim, bukan cara berpikir pengguna.

**Card sorting**: tulis setiap konten/fitur di kartu, lalu minta peserta mengelompokkannya.

- **Open**: peserta membuat kelompok dan nama kelompoknya sendiri, untuk menemukan model mental mereka.
- **Closed**: peserta memasukkan kartu ke kategori yang sudah ditentukan, untuk menguji struktur yang ada.

```viz
{"type":"tree","title":"Hasil card sorting: struktur menu aplikasi tugas","caption":"Perhatikan label hasil riset (‘Tugasku’, ‘Jadwal’) yang memakai bahasa pengguna, bukan istilah sistem seperti ‘Modul Akademik’ atau ‘Manajemen Asesmen’.","root":{"label":"Aplikasi Tugas Kuliah","detail":"Navigasi utama hanya 4 item: cukup untuk bottom navigation di HP.","children":[{"label":"Tugasku","detail":"Daftar tugas berdasarkan deadline terdekat.","children":[{"label":"Hari ini & minggu ini","detail":"Kelompok yang paling sering dibuka peserta."},{"label":"Detail tugas","detail":"Format, cara kumpul, lampiran, dan perubahan deadline dalam satu tempat."}]},{"label":"Jadwal","detail":"Kalender kuliah + deadline."},{"label":"Kelas","detail":"Mata kuliah, dosen, dan pengumuman per kelas."},{"label":"Profil","detail":"Pengaturan notifikasi, akun."}]}}
```

Alat daring seperti Optimal Workshop atau Maze membantu menganalisis hasil card sorting; untuk skala kecil, kartu kertas atau FigJam sudah cukup.

## User flow

**User flow** memetakan langkah yang dilalui pengguna untuk menyelesaikan satu tujuan, termasuk titik keputusan dan jalur gagal.

```viz
{"type":"fsm","title":"User flow: menambahkan tugas dari pengumuman","caption":"Memetakan jalur gagal (tidak login, data tidak lengkap) sejak awal mencegah layar-layar ‘yatim’ yang terlupa didesain.","start":"Lihat pengumuman","states":[{"id":"Lihat pengumuman","detail":"Pengguna membaca pengumuman di tab Kelas."},{"id":"Login","detail":"Diminta login jika sesi berakhir; setelah login kembali ke pengumuman yang sama."},{"id":"Form tugas","detail":"Judul, mata kuliah, dan teks pengumuman terisi otomatis; pengguna cukup memastikan deadline."},{"id":"Validasi gagal","detail":"Deadline kosong/lewat: tampilkan pesan di field terkait, data lain tidak hilang."},{"id":"Tersimpan","detail":"Konfirmasi + tawarkan pengingat H-1."}],"transitions":[{"from":"Lihat pengumuman","to":"Form tugas","event":"Tambah ke Tugasku (sudah login)"},{"from":"Lihat pengumuman","to":"Login","event":"Tambah (sesi habis)"},{"from":"Login","to":"Form tugas","event":"login berhasil"},{"from":"Form tugas","to":"Validasi gagal","event":"simpan (deadline kosong)"},{"from":"Validasi gagal","to":"Form tugas","event":"perbaiki"},{"from":"Form tugas","to":"Tersimpan","event":"simpan (valid)"}]}
```

## Problem statement

Riset diakhiri dengan rumusan masalah yang tajam, menjadi kompas untuk tahap desain. Format **Point of View**:

> **[Pengguna]** butuh cara untuk **[kebutuhan]** karena **[insight dari riset]**.

> *Mahasiswa yang aktif berorganisasi butuh cara untuk mengetahui semua deadline dan detail tugas dari satu tempat, karena pengumuman tersebar di banyak kanal dan mudah tenggelam di chat grup.*

Turunkan menjadi pertanyaan **How Might We (HMW)** untuk memancing ide: *‘Bagaimana kita bisa membuat informasi tugas tidak pernah tenggelam?’*, *‘Bagaimana kita bisa memberi tahu perubahan deadline tanpa membanjiri notifikasi?’*.

:::warning[Jangan memasukkan solusi]
‘Mahasiswa butuh aplikasi pengingat’ adalah solusi, bukan masalah. Mungkin solusi terbaik justru integrasi kalender, bot WhatsApp, atau perbaikan cara dosen mengumumkan. Rumusan yang netral membuka lebih banyak kemungkinan.
:::

:::latihan
Milestone: lakukan 5 wawancara (masing-masing 20–30 menit) tentang satu masalah di sekitarmu. Hasilkan: affinity map, 1 persona, 1 journey map dengan titik emosi, hasil card sorting dari 5 peserta, 1 user flow, dan problem statement + 3 HMW. Rangkum dalam laporan riset 2 halaman.
:::

## Rangkuman

- Wawancara untuk ‘kenapa’, survei untuk ‘berapa banyak’; tanyakan pengalaman nyata, bukan prediksi.
- Persona dan journey map dibangun dari pola riset; titik terendah emosi adalah peluang desain.
- Card sorting mengungkap cara pengguna mengelompokkan dan menamai konten.
- User flow mencakup jalur sukses dan gagal.
- Problem statement: siapa + kebutuhan + insight, tanpa solusi; lanjutkan dengan HMW.
