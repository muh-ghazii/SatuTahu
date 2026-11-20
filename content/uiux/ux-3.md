---
title: Wireframe, prototipe & interaksi
minutes: 40
summary: Setelah masalahnya jelas, saatnya mewujudkan solusi, dimulai dengan coretan kasar sebelum desain final. Modul ini membahas tingkatan fidelity, membuat prototipe interaktif di Figma, merancang microinteraction, memakai pola UI yang sudah dikenal pengguna, dan perbedaan mendasar desain mobile dan web.
objectives:
  - Memilih tingkat fidelity yang tepat untuk setiap tahap
  - Membuat prototipe interaktif yang bisa diuji di Figma
  - Merancang microinteraction dan state komponen secara lengkap
  - Memakai pola UI standar dan menyesuaikan desain untuk mobile dan web
sources:
  - repo: thedaviddias/Front-End-Design-Checklist
    note: Checklist kelengkapan file desain sebelum diserahkan ke developer
  - repo: material-components/material-web
    note: Rujukan pola komponen dan state dari Material Design 3
quiz:
  - q: "Kenapa wireframe sebaiknya hitam-putih dan kasar di tahap awal?"
    options: ["Agar terlihat profesional", "Agar diskusi fokus pada struktur & alur, bukan warna; dan murah dibuang", "Figma tidak mendukung warna", "Klien lebih suka"]
    answer: 1
    explain: "Desain yang terlihat ‘jadi’ membuat orang ragu mengkritik dan memancing debat warna terlalu dini."
  - q: "Microinteraction terdiri dari…"
    options: ["Trigger, rules, feedback, loops & modes", "Warna, font, ikon", "Header, body, footer", "Wireframe dan mockup"]
    answer: 0
    explain: "Kerangka Dan Saffer: pemicu → aturan apa yang terjadi → umpan balik yang terlihat → perilaku berulang/mode."
  - q: "Ukuran target sentuh minimal yang direkomendasikan untuk tombol di HP sekitar…"
    options: ["16×16 px", "24×24 dp", "44–48 dp", "100 dp"]
    answer: 2
    explain: "Apple menyarankan 44×44 pt, Material 48×48 dp. Jari jauh kurang presisi dibanding kursor."
  - q: "Pola navigasi utama yang paling umum untuk aplikasi mobile dengan 3–5 bagian adalah…"
    options: ["Hamburger menu saja", "Bottom navigation bar", "Breadcrumb", "Footer berisi tautan"]
    answer: 1
    explain: "Bottom navigation mudah dijangkau ibu jari dan selalu terlihat, sedangkan hamburger menyembunyikan pilihan."
---

Lompatan langsung dari ide ke desain yang mengilap adalah jebakan klasik. Kamu akan terikat secara emosional pada piksel-piksel indah, padahal alurnya belum tentu benar. Modul ini mengajarkan untuk **naik fidelity secara bertahap**, menguji di setiap tingkat.

## Low → high fidelity

```viz
{"type":"flow","title":"Tingkatan fidelity desain","caption":"Semakin tinggi fidelity, semakin mahal perubahannya. Lakukan eksplorasi dan perubahan besar di tingkat rendah.","steps":[{"label":"Sketsa kertas","detail":"5–10 menit per ide. Gambar banyak variasi (teknik Crazy 8s: 8 ide dalam 8 menit). Tidak ada yang salah."},{"label":"Wireframe low-fi","detail":"Kotak abu-abu, teks placeholder, tanpa warna. Fokus: struktur, prioritas konten, alur antar layar."},{"label":"Wireframe mid-fi","detail":"Tata letak & ukuran mendekati nyata, konten asli, masih hitam-putih. Siap diuji alurnya."},{"label":"Mockup hi-fi","detail":"Warna, tipografi, ikon, gambar dari design system. Terlihat seperti produk jadi."},{"label":"Prototipe","detail":"Layar dihubungkan sehingga bisa diklik: untuk usability test dan presentasi ke stakeholder."}]}
```

Saran praktis: gunakan **konten asli** (nama, harga, judul tugas sungguhan) sedini mungkin. *Lorem ipsum* menyembunyikan masalah nyata seperti judul yang terlalu panjang, nama berbahasa daerah, atau angka Rupiah yang lebar.

## Prototipe interaktif Figma

Mode **Prototype** di Figma menghubungkan frame dengan interaksi sehingga desain bisa dicoba seperti aplikasi.

```viz
{"type":"tree","title":"Unsur prototipe di Figma","root":{"label":"Prototype","detail":"Tab di panel kanan Figma.","children":[{"label":"Flow starting point","detail":"Layar awal setiap alur yang akan diuji, mis. ‘Tambah tugas’."},{"label":"Interaction: trigger","detail":"On tap/click, while hovering, after delay, on drag, key press."},{"label":"Action","detail":"Navigate to (pindah layar), open overlay (modal/bottom sheet), swap overlay, back, scroll to, change to (ganti varian komponen)."},{"label":"Animation","detail":"Instant, dissolve, move in/out, push, slide, atau Smart Animate yang menganimasikan layer bernama sama antar frame."},{"label":"Variables & conditionals","detail":"Prototipe lanjutan: menyimpan nilai (jumlah keranjang) dan menampilkan layar berbeda berdasarkan kondisi."}]}}
```

Tips agar prototipe efektif untuk pengujian: buat **satu alur per tugas uji** (bukan seluruh aplikasi), hubungkan juga jalur ‘salah’ yang mungkin dipilih peserta, dan uji di perangkat sebenarnya lewat aplikasi Figma di HP.

## Microinteraction

**Microinteraction** adalah momen interaksi kecil dengan satu tujuan: menekan tombol suka, menarik untuk memuat ulang, toggle mode gelap, validasi saat mengetik. Kerangka Dan Saffer:

1. **Trigger**: apa yang memulai (ketukan, atau sistem seperti notifikasi).
2. **Rules**: apa yang terjadi.
3. **Feedback**: bagaimana pengguna tahu sesuatu terjadi (warna, gerak, suara, getar).
4. **Loops & modes**: perilaku berulang atau berubah seiring waktu.

Bagian tersulit sekaligus terpenting adalah merancang **semua state** sebuah komponen, bukan hanya tampilan normalnya:

```viz
{"type":"fsm","title":"State tombol ‘Kirim’ yang lengkap","caption":"Developer akan membangun apa yang kamu desain. Jika state loading dan error tidak ada di desain, kemungkinan besar tidak ada di aplikasi.","start":"default","states":[{"id":"default","detail":"Tampilan normal, kontras cukup, label kata kerja jelas (‘Kirim tugas’)."},{"id":"hover/pressed","detail":"Umpan balik sentuh/kursor: sedikit lebih gelap atau tertekan."},{"id":"focus","detail":"Cincin fokus terlihat untuk pengguna keyboard."},{"id":"loading","detail":"Spinner + label ‘Mengirim…’, tombol tidak bisa ditekan dua kali."},{"id":"sukses","detail":"Centang + pesan singkat, lalu kembali/pindah layar."},{"id":"error","detail":"Pesan jelas apa yang salah & cara memperbaiki; tombol aktif lagi."},{"id":"disabled","detail":"Saat form belum lengkap, sertakan alasan di dekatnya."}],"transitions":[{"from":"default","to":"hover/pressed","event":"sentuh"},{"from":"hover/pressed","to":"loading","event":"lepas (kirim)"},{"from":"default","to":"focus","event":"Tab"},{"from":"focus","to":"loading","event":"Enter"},{"from":"loading","to":"sukses","event":"berhasil"},{"from":"loading","to":"error","event":"gagal"},{"from":"error","to":"loading","event":"coba lagi"},{"from":"default","to":"disabled","event":"field wajib dikosongkan"},{"from":"disabled","to":"default","event":"form lengkap"}]}
```

## Pola UI umum

Pengguna menghabiskan sebagian besar waktunya di aplikasi **lain**. Hukum Jakob ini berarti mereka berharap aplikasimu bekerja seperti aplikasi yang sudah mereka kenal. Gunakan pola standar kecuali ada alasan kuat:

| Kebutuhan | Pola | Catatan |
|---|---|---|
| Navigasi utama (3–5 bagian) | bottom navigation (mobile), sidebar/top nav (web) | hamburger menyembunyikan pilihan, jadi kurangi pemakaiannya |
| Aksi utama di layar | satu tombol primer jelas / FAB | hindari 3 tombol berwarna sama |
| Pilihan sedikit vs banyak | radio/segmented (≤ 5) vs dropdown/pencarian | |
| Konfirmasi aksi berbahaya | dialog dengan label aksi spesifik (‘Hapus tugas’) | bukan ‘Ya/Tidak’ |
| Umpan balik singkat | snackbar/toast, plus ‘Urungkan’ | lebih ramah daripada dialog konfirmasi |
| Data kosong | empty state dengan ilustrasi + aksi pertama | ‘Belum ada tugas. Tambahkan dari pengumuman kelas.’ |
| Memuat | skeleton (bentuk konten) | lebih terasa cepat daripada spinner besar |

## Desain mobile vs web

```viz
{"type":"compare","title":"Perbedaan konteks desain","columns":["Mobile","Web desktop"],"rows":[{"label":"Input","values":["Jari, kurang presisi; target ≥ 44–48 dp","Mouse & keyboard; ada hover dan shortcut"]},{"label":"Layar","values":["Sempit, vertikal; satu fokus per layar","Lebar; bisa multi-kolom & panel samping"]},{"label":"Zona nyaman","values":["Area bawah layar (jangkauan ibu jari)","Bagian atas & kiri (pola baca F)"]},{"label":"Navigasi","values":["Bottom nav, gesture back","Top nav/sidebar, breadcrumb, tab"]},{"label":"Konteks","values":["Sering terganggu, sinyal tak stabil, sekali tangan","Duduk, fokus lebih lama, koneksi stabil"]},{"label":"Pola khas","values":["Bottom sheet, swipe, pull-to-refresh","Hover card, tabel lebar, drag-and-drop presisi"]}]}
```

Desain **mobile-first** memaksa memprioritaskan konten: jika tidak muat di layar kecil, apakah benar-benar penting? Tetapi ‘responsif’ tidak berarti layar desktop hanya versi HP yang diperbesar. Manfaatkan ruang ekstra untuk pola seperti list–detail berdampingan.

:::latihan
Milestone: dari problem statement modul sebelumnya, buat (1) 8 sketsa kasar dengan Crazy 8s, (2) wireframe mid-fi untuk alur utama (4–6 layar), (3) mockup hi-fi, (4) prototipe interaktif di Figma yang bisa dicoba di HP, lengkap dengan semua state tombol utama dan satu empty state.
:::

## Rangkuman

- Naikkan fidelity bertahap; ubah hal besar saat masih murah; pakai konten asli sejak dini.
- Prototipe Figma: satu alur per tugas uji, termasuk jalur salah; uji di perangkat.
- Microinteraction: trigger, rules, feedback, loops; desain semua state komponen.
- Gunakan pola UI yang sudah dikenal (Jakob’s Law).
- Mobile: jari, layar sempit, zona ibu jari; web: hover, multi-kolom, keyboard.
