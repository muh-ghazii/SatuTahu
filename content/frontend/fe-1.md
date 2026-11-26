---
title: "Fondasi web: HTML, CSS & cara kerja browser"
minutes: 40
summary: Setiap framework frontend pada akhirnya menghasilkan HTML dan CSS yang dibaca browser. Modul ini membangun fondasi yang tidak lekang oleh tren, yaitu markup yang bermakna, tata letak modern dengan Flexbox dan Grid, desain responsif, dan apa yang sebenarnya terjadi saat halaman dimuat.
objectives:
  - Menulis HTML semantik yang ramah pembaca layar dan mesin pencari
  - Menguasai box model, Flexbox, dan Grid untuk tata letak
  - Membuat halaman responsif dengan pendekatan mobile-first
  - Menjelaskan alur request HTTP sampai halaman tergambar di layar
sources:
  - repo: microsoft/Web-Dev-For-Beginners
    note: Urutan pelajaran HTML, CSS, dan aksesibilitas untuk pemula
  - repo: mdn/content
    note: Rujukan definisi elemen HTML, properti CSS, dan HTTP
  - repo: TheOdinProject/curriculum
    note: Pendekatan berbasis proyek di bagian Foundations
  - repo: bellshade/HTML-CSS
    note: Referensi praktik HTML dan CSS berbahasa Indonesia dari komunitas Bellshade
quiz:
  - q: "Mana markup yang paling tepat untuk menu navigasi utama situs?"
    options: ["<div class=\"menu\">", "<nav> berisi <ul> dan <a>", "<section id=\"nav\">", "<span> untuk setiap tautan"]
    answer: 1
    explain: "<nav> memberi tahu browser dan pembaca layar bahwa ini area navigasi, sehingga pengguna tunanetra bisa langsung melompat ke sana."
  - q: "Kamu ingin kartu produk tersusun otomatis 1 kolom di HP dan 3 kolom di desktop, dengan baris dan kolom sejajar. Alat paling tepat?"
    options: ["float", "CSS Grid", "position: absolute", "<table>"]
    answer: 1
    explain: "Grid dirancang untuk tata letak dua dimensi (baris & kolom). Flexbox unggul untuk satu dimensi, seperti deretan tombol."
  - q: "Pendekatan mobile-first berarti…"
    options: ["Membuat aplikasi mobile dulu", "Gaya dasar untuk layar kecil, lalu media query min-width untuk layar lebih besar", "Menyembunyikan konten di desktop", "Memakai satuan px saja"]
    answer: 1
    explain: "Mobile-first menulis CSS dasar untuk layar kecil, lalu menambah aturan untuk layar yang lebih lebar. Hasilnya CSS lebih sederhana dan cepat di HP."
  - q: "Status HTTP 404 berarti…"
    options: ["Server error", "Resource tidak ditemukan", "Berhasil", "Harus login"]
    answer: 1
    explain: "4xx = kesalahan dari sisi permintaan klien; 404 Not Found. 5xx berarti kesalahan di server, 2xx sukses, 401/403 terkait autentikasi/izin."
---

Frontend developer bekerja di persimpangan tiga bahasa: **HTML** untuk struktur dan makna, **CSS** untuk tampilan, dan **JavaScript** untuk perilaku. Modul ini fokus pada dua yang pertama, ditambah pemahaman tentang browser itu sendiri. Banyak bug frontend yang ‘aneh’ ternyata berasal dari salah paham di level ini.

Siapkan VS Code dengan ekstensi **Live Server**, lalu buka DevTools di browser (F12). DevTools akan jadi alat yang paling sering kamu buka.

## HTML semantik & aksesibilitas dasar

HTML bukan sekadar ‘kotak-kotak’. Setiap elemen membawa **makna**. Pembaca layar (*screen reader*), mesin pencari, dan fitur reader mode browser membaca makna itu.

```html
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Toko Seragam Kotabaru</title>
</head>
<body>
  <header>
    <nav aria-label="Utama">
      <ul>
        <li><a href="/">Beranda</a></li>
        <li><a href="/katalog">Katalog</a></li>
      </ul>
    </nav>
  </header>

  <main>
    <h1>Seragam majelis taklim berkualitas</h1>
    <article>
      <h2>Gamis seragam BKMT</h2>
      <img src="gamis.jpg" alt="Gamis hijau toska dengan bordir di bagian dada" />
      <p>Bahan adem, tersedia ukuran S–XXL.</p>
      <button type="button">Tambah ke keranjang</button>
    </article>
  </main>

  <footer><p>© 2026 Toko Seragam</p></footer>
</body>
</html>
```

```viz
{"type":"tree","title":"Pohon DOM dari HTML di atas","caption":"Browser mengubah HTML menjadi pohon objek bernama DOM. CSS dan JavaScript bekerja pada pohon ini, bukan pada teks HTML-nya.","root":{"label":"html","detail":"Akar dokumen. Atribut lang=\"id\" memberi tahu pembaca layar untuk memakai pelafalan Bahasa Indonesia.","children":[{"label":"head","detail":"Metadata: tidak tampil di halaman, tetapi menentukan judul tab, encoding, dan viewport.","children":[{"label":"title","detail":"Judul di tab browser dan hasil pencarian Google."},{"label":"meta viewport","detail":"Wajib untuk responsif: tanpa ini, HP menampilkan halaman seperti desktop yang diperkecil."}]},{"label":"body","detail":"Semua konten yang terlihat.","children":[{"label":"header > nav","detail":"Landmark navigasi. Pengguna pembaca layar bisa melompat langsung ke sini."},{"label":"main","detail":"Konten utama; hanya boleh satu per halaman.","children":[{"label":"h1","detail":"Judul utama. Gunakan urutan heading h1→h2→h3 tanpa melompat, seperti daftar isi."},{"label":"article","detail":"Konten yang berdiri sendiri, mis. kartu produk atau postingan blog.","children":[{"label":"img alt","detail":"Teks alternatif dibacakan untuk tunanetra dan muncul jika gambar gagal dimuat. Deskripsikan isinya, jangan cuma ‘gambar’."},{"label":"button","detail":"Elemen interaktif asli: otomatis bisa difokus dengan Tab dan diaktifkan dengan Enter/Spasi."}]}]},{"label":"footer","detail":"Informasi penutup halaman."}]}]}}
```

Aturan praktis aksesibilitas yang langsung bisa diterapkan:

- Gunakan elemen asli: `<button>` untuk aksi, `<a>` untuk pindah halaman. `<div onclick>` tidak bisa diakses dengan keyboard.
- Setiap `<img>` informatif butuh `alt`; gambar dekoratif cukup `alt=""`.
- Setiap input form butuh `<label for="...">`.
- Jangan hilangkan garis fokus (`outline: none`) tanpa penggantinya.

## Box model, Flexbox, Grid

Setiap elemen HTML adalah kotak. Memahami cara ukurannya dihitung adalah kunci tata letak CSS.

```viz
{"type":"box-model"}
```

Untuk menyusun kotak-kotak itu, CSS modern punya dua alat utama:

**Flexbox** untuk tata letak **satu dimensi**: sebaris (atau sekolom) item, misalnya navbar, deretan tombol, atau memusatkan sesuatu.

```viz
{"type":"flexbox"}
```

**Grid** untuk tata letak **dua dimensi**: baris dan kolom sekaligus.

```css
.katalog {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
```

Satu baris `repeat(auto-fill, minmax(220px, 1fr))` membuat grid yang otomatis menyesuaikan jumlah kolom dengan lebar layar, sering tanpa media query sama sekali.

:::tip[Memusatkan elemen]
Pertanyaan legendaris ‘bagaimana memusatkan div?’ jawabannya sekarang dua baris: `display: grid; place-items: center;` pada elemen induk.
:::

## Responsive design & media query

Lebih dari separuh trafik web di Indonesia berasal dari HP. Desain responsif berarti satu halaman yang menyesuaikan diri dengan lebar layar apa pun.

```viz
{"type":"responsive"}
```

Pendekatan **mobile-first**: tulis gaya dasar untuk layar kecil, lalu tambahkan aturan untuk layar yang lebih lebar dengan `min-width`.

```css
/* dasar: HP, 1 kolom */
.katalog { display: grid; gap: 1rem; grid-template-columns: 1fr; }

/* ≥ 640px: tablet, 2 kolom */
@media (min-width: 640px) {
  .katalog { grid-template-columns: repeat(2, 1fr); }
}

/* ≥ 1024px: desktop, 3 kolom */
@media (min-width: 1024px) {
  .katalog { grid-template-columns: repeat(3, 1fr); }
}
```

Gunakan juga satuan relatif: `rem` untuk ukuran huruf dan jarak (mengikuti pengaturan font pengguna), `%`/`fr` untuk lebar, `max-width` agar gambar tidak meluber (`img { max-width: 100%; height: auto; }`).

## Cara kerja browser & HTTP

Apa yang terjadi antara mengetik alamat dan halaman tampil?

```viz
{"type":"sequence","title":"Memuat sebuah halaman web","actors":["Browser","DNS","Server"],"messages":[{"from":0,"to":1,"label":"toko.id → IP?","note":"Browser menanyakan alamat IP dari nama domain ke server DNS (atau memakai cache)."},{"from":1,"to":0,"label":"203.0.113.10","note":"DNS menjawab dengan alamat IP server."},{"from":0,"to":2,"label":"TCP + TLS handshake","note":"Browser membuka koneksi dan menyepakati enkripsi HTTPS."},{"from":0,"to":2,"label":"GET / HTTP/2","note":"Request berisi method, path, dan header (mis. bahasa, cookie)."},{"from":2,"to":0,"label":"200 OK + HTML","note":"Server membalas status code, header, dan isi HTML."},{"from":0,"to":2,"label":"GET style.css, app.js, gambar","note":"Saat mem-parsing HTML, browser menemukan resource lain dan memintanya juga."},{"from":0,"to":0,"label":"render","note":"DOM + CSSOM → layout → paint → halaman tampil."}]}
```

Bagian penting dari HTTP:

| Komponen | Contoh | Fungsi |
|---|---|---|
| Method | `GET`, `POST`, `PUT`, `DELETE` | jenis aksi |
| Status code | `200`, `301`, `404`, `500` | hasil: 2xx sukses, 3xx pindah, 4xx salah klien, 5xx salah server |
| Header | `Content-Type: text/html`, `Cache-Control` | metadata request/response |
| Body | HTML, JSON, gambar | isi |

Buka tab **Network** di DevTools, lalu muat ulang halaman mana pun: kamu akan melihat semua request ini beserta waktunya. Ini cara pertama untuk men-debug halaman yang lambat.

:::info[CSS dan JS bisa memblokir render]
Browser menunda menggambar halaman sampai CSS selesai dimuat, dan `<script>` biasa menghentikan parsing HTML. Karena itu script diletakkan dengan atribut `defer` atau di akhir `<body>`.
:::

## Git & GitHub dasar

Kode frontend-mu sebaiknya tersimpan di Git sejak hari pertama. Alur minimal:

```bash
git init
git add index.html style.css
git commit -m "Halaman awal toko seragam"
git branch -M main
git remote add origin https://github.com/username/toko-seragam.git
git push -u origin main
```

Bonus untuk frontend: **GitHub Pages** bisa menayangkan situs statis gratis. Buka *Settings → Pages* di repo, pilih branch `main`, dan situsmu tayang di `username.github.io/toko-seragam`. Pembahasan Git yang lebih dalam (branch, merge, konflik, PR) ada di modul Terminal, Git & GitHub pada jalur Fondasi CS.

:::jebakan[Lupa `box-sizing: border-box` dan `meta viewport`]
Dua sumber utama layout "berantakan di HP":
1. Tanpa `* { box-sizing: border-box; }`, elemen `width: 100%` yang diberi `padding: 16px` akan meluber selebar `100% + 32px` dan memunculkan scrollbar horizontal.
2. Tanpa `<meta name="viewport" content="width=device-width, initial-scale=1">`, browser HP mengira halamanmu desktop 980px lalu mengecilkannya hingga teks tak terbaca.
:::

:::kasus[Mendesain katalog UMKM yang enak dibuka di HP murah]
Di Indonesia, mayoritas pembeli membuka tautan toko dari WhatsApp di layar 360px–390px dengan koneksi 4G tidak stabil. Mulai desain dari 1 kolom penuh, pakai `loading="lazy"` pada gambar katalog di bawah lipatan layar, dan pastikan tombol "Pesan via WA" tingginya minimal `44px` agar mudah ditekan jempol.
:::

:::latihan
Kerjakan milestone tahap ini: landing page usaha lokal dengan `header`, `nav`, `main`, `footer`; satu bagian katalog memakai Grid; responsif 1→2→3 kolom; semua gambar punya `alt`. Jalankan **Lighthouse** di DevTools dan perbaiki sampai skor Accessibility dan Performance ≥ 90.
:::

:::solusi[Lihat kerangka CSS responsif & checklist Lighthouse]
Gunakan pola starter CSS ini (bisa langsung dicoba di [Coding Playground](/playground)!):

```css
*, *::before, *::after { box-sizing: border-box; }
img { max-width: 100%; height: auto; display: block; }

.katalog {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}
```
Checklist cepat Lighthouse ≥ 90: (1) kontras teks vs latar ≥ 4.5:1, (2) semua `<img>` punya `alt` & ukuran `width`/`height` eksplisit agar tidak terjadi *layout shift* (CLS), (3) hanya ada satu `<h1>` dan urutan heading tidak melompat.
:::

## Rangkuman

- HTML semantik memberi makna; elemen asli (`button`, `a`, `label`) memberi aksesibilitas gratis.
- Box model menentukan ukuran; Flexbox untuk satu dimensi, Grid untuk dua dimensi.
- Mobile-first + `min-width` media query + satuan relatif = halaman responsif.
- Browser: DNS → koneksi → HTTP request/response → DOM + CSSOM → layout → paint.
- Simpan kode di Git sejak awal; GitHub Pages untuk menayangkan situs statis.
