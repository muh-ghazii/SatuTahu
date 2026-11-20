---
title: Portofolio & persiapan kerja
minutes: 35
summary: Kemampuan teknis perlu dibuktikan dan dikomunikasikan. Modul ini membahas algoritma yang sering muncul di tes coding frontend, pertanyaan wawancara klasik beserta cara menjawabnya, kerangka system design frontend, dan cara menulis README yang membuat perekrut berhenti scroll.
objectives:
  - Menyelesaikan pola soal algoritma umum dengan JavaScript
  - Menjawab pertanyaan konsep frontend dengan struktur yang jelas
  - Merancang arsitektur frontend dengan kerangka RADIO
  - Menulis README proyek yang meyakinkan
sources:
  - repo: yangshun/front-end-interview-handbook
    note: Kategori pertanyaan dan kerangka system design frontend
  - repo: trekhleb/javascript-algorithms
    note: Implementasi algoritma dan struktur data di JavaScript
  - repo: sudheerj/reactjs-interview-questions
    note: Bank pertanyaan React yang sering muncul
quiz:
  - q: "Cara paling efisien mengecek apakah array berisi angka duplikat?"
    options: ["Dua loop bersarang, O(n²)", "Masukkan ke Set lalu bandingkan ukurannya, O(n)", "Urutkan lalu cek semua pasangan acak", "Pakai JSON.stringify"]
    answer: 1
    explain: "new Set(arr).size !== arr.length berjalan O(n) karena operasi Set rata-rata O(1)."
  - q: "Dalam wawancara, ditanya ‘Apa itu debounce?’. Struktur jawaban terbaik?"
    options: ["Langsung tulis kode", "Definisi singkat → contoh kasus nyata → trade-off/alternatif (throttle)", "Bilang tidak tahu", "Menjelaskan sejarah JavaScript"]
    answer: 1
    explain: "Pewawancara menilai pemahaman dan komunikasi. Definisi + contoh nyata (kotak pencarian) + pembanding (throttle) menunjukkan kedalaman."
  - q: "Dalam system design frontend, bagian ‘Interface’ membahas…"
    options: ["Warna dan font", "Kontrak API antara klien–server dan antar komponen", "Gaji tim", "Jumlah server"]
    answer: 1
    explain: "Interface = bentuk data yang dikirim/diterima (endpoint, parameter, pagination) dan API antar komponen."
  - q: "Hal pertama yang sebaiknya ada di README proyek portofolio?"
    options: ["Lisensi", "Satu kalimat apa proyek ini + demo/screenshot", "Daftar semua dependency", "Riwayat commit"]
    answer: 1
    explain: "Perekrut memutuskan dalam hitungan detik. Jelaskan nilainya dan tunjukkan hasilnya dulu, detail teknis menyusul."
---

Banyak lulusan bootcamp maupun kampus punya kemampuan yang cukup, tetapi gagal di tahap seleksi karena tidak terbiasa dengan format tes atau tidak bisa menunjukkan hasil kerjanya. Modul ini fokus pada ‘lapisan terakhir’ tersebut.

Satu hal yang perlu jujur disampaikan: tidak ada daftar soal yang menjamin lolos. Yang bisa dilatih adalah **pola berpikir** dan **cara berkomunikasi**.

## Struktur data & algoritma di JS

Tes coding frontend biasanya tidak seberat posisi backend atau algoritma murni, tetapi pola dasarnya tetap muncul. Sebagian besar soal bisa diselesaikan dengan beberapa pola berikut:

| Pola | Kapan dipakai | Contoh soal |
|---|---|---|
| Hash map / Set | mencari pasangan, menghitung frekuensi, cek duplikat | Two Sum, anagram |
| Dua pointer | array/string terurut, palindrom | gabung dua array terurut |
| Sliding window | sub-array berurutan dengan syarat | substring terpanjang tanpa huruf berulang |
| Stack | pasangan kurung, undo, ‘elemen berikutnya yang lebih besar’ | validasi kurung |
| Rekursi / BFS-DFS | struktur pohon (DOM!), menjelajah kemungkinan | ratakan objek bersarang |

```js
// Two Sum dengan hash map: O(n), bukan O(n²)
function twoSum(nums, target) {
  const dilihat = new Map();              // nilai → indeks
  for (let i = 0; i < nums.length; i++) {
    const butuh = target - nums[i];
    if (dilihat.has(butuh)) return [dilihat.get(butuh), i];
    dilihat.set(nums[i], i);
  }
  return null;
}
twoSum([2, 7, 11, 15], 9);   // [0, 1]
```

Soal yang **khas frontend** sering berupa implementasi utilitas JavaScript: `debounce`, `throttle`, `deepClone`, `Promise.all`, `flatten`, atau event emitter. Contoh debounce, yang dipakai di kotak pencarian agar API tidak dipanggil setiap ketikan:

```js
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);   // closure mengingat timer
  };
}
const cari = debounce((q) => console.log("cari:", q), 300);
```

```viz
{"type":"big-o","title":"Mengapa hash map mengalahkan loop bersarang"}
```

## Pertanyaan wawancara frontend

Pertanyaan konsep biasanya terbagi menjadi: JavaScript (closure, event loop, `this`, prototype), browser (rendering, event bubbling, storage, CORS), CSS (specificity, box model, layout), React (re-render, hooks, key, state management), serta performa dan aksesibilitas. Semua topik itu sudah dibahas di modul 1–5 jalur ini.

Kerangka menjawab yang terbukti efektif:

```viz
{"type":"flow","title":"Struktur menjawab pertanyaan konsep","caption":"Jawaban 60–90 detik dengan struktur ini terdengar jauh lebih meyakinkan daripada jawaban panjang yang melompat-lompat.","steps":[{"label":"Definisi","detail":"Satu-dua kalimat inti. Contoh: ‘Closure adalah fungsi yang tetap bisa mengakses variabel dari scope tempat ia dibuat.’"},{"label":"Contoh nyata","detail":"Hubungkan ke pengalamanmu: ‘Saya memakainya untuk debounce di kotak pencarian proyek X.’"},{"label":"Trade-off","detail":"Kapan tidak dipakai atau risikonya: ‘Closure yang memegang objek besar bisa membuat memori tidak dilepas.’"},{"label":"Cek pemahaman","detail":"Tawarkan menulis contoh kode atau tanya apakah pewawancara ingin bagian tertentu didalami."}]}
```

Untuk **soal live coding**, kebiasaan yang paling dinilai positif adalah **berpikir keras**: ulangi soal dengan kata-katamu, tanyakan batasan (input kosong? ukuran data?), jelaskan pendekatan sebelum mengetik, mulai dari solusi sederhana yang benar, lalu optimalkan. Diam selama 15 menit lalu menyerahkan kode sempurna justru sulit dinilai.

Jangan lupakan **pertanyaan perilaku** (*behavioral*): ‘ceritakan konflik dalam tim’, ‘proyek tersulit’. Siapkan 3–4 cerita dengan format **STAR**: *Situation*, *Task*, *Action*, *Result*. Proyek kuliah, lomba, dan organisasi kampus adalah bahan yang sah.

## System design frontend

Untuk posisi menengah ke atas, kamu bisa diminta merancang, misalnya, ‘news feed’, ‘autocomplete’, atau ‘aplikasi chat’. Kerangka **RADIO** membantu menjaga jawaban tetap terstruktur:

```viz
{"type":"layers","title":"Kerangka RADIO untuk system design frontend","caption":"Alokasikan waktu: sebagian besar diskusi biasanya ada di Data model, Interface, dan Optimizations.","layers":[{"label":"Requirements","tag":"R","detail":"Klarifikasi fitur inti & non-fungsional: siapa penggunanya, perangkat apa, harus offline? real-time? Contoh autocomplete: berapa cepat saran muncul, berapa banyak saran."},{"label":"Architecture","tag":"A","detail":"Gambar komponen utama dan alur datanya: Input → Controller → Cache → API → Daftar hasil."},{"label":"Data model","tag":"D","detail":"Bentuk state di klien: hasil per kata kunci (cache), item terpilih, status loading. Mana yang di server, mana yang lokal."},{"label":"Interface","tag":"I","detail":"API klien–server: GET /suggest?q=ban&limit=5, format respons, pagination, error. Juga props antar komponen."},{"label":"Optimizations","tag":"O","detail":"Debounce, cache hasil query, batalkan request lama (AbortController), navigasi keyboard, aksesibilitas (role=listbox), performa di HP lambat."}]}
```

Tidak ada satu jawaban benar. Pewawancara menilai apakah kamu **menyadari trade-off**: cache memperbaiki kecepatan tetapi bisa menyajikan data basi; real-time dengan WebSocket lebih segar tetapi lebih rumit dibanding polling.

## Menulis README yang baik

README adalah halaman depan proyekmu. Perekrut sering hanya membaca bagian atasnya. Struktur yang efektif:

```text
# Kasir UMKM

Aplikasi kasir web untuk toko kecil: catat penjualan, cek stok, dan kirim struk lewat WhatsApp.

🔗 Demo: https://kasir-umkm.vercel.app   ·   📸 (GIF 10 detik alur checkout)

## Fitur utama
- Mode offline: transaksi tetap tercatat saat internet putus, sinkron saat online
- Laporan harian & produk terlaris
- Skor Lighthouse: Performance 96, Accessibility 100

## Teknologi & keputusan
Next.js + TypeScript, IndexedDB untuk offline, TanStack Query.
Kenapa IndexedDB, bukan localStorage? Data transaksi bisa ribuan baris dan butuh query.

## Menjalankan secara lokal
npm install && npm run dev

## Yang saya pelajari / rencana berikutnya
```

Prinsipnya: **nilai dulu, teknologi kemudian**. Sertakan demo yang bisa diklik, ceritakan keputusan teknis dan alasannya (ini yang membedakan dari proyek tutorial), dan tuliskan hasil terukur bila ada.

:::tip[Portofolio yang menonjol]
Tiga proyek orisinal yang dipakai orang sungguhan (toko keluarga, organisasi kampus, komunitas) lebih kuat daripada sepuluh clone tutorial. Satu kontribusi open source yang di-merge juga sinyal yang sangat baik.
:::

:::latihan
(1) Selesaikan 10 soal pola di tabel atas, masing-masing dengan analisis Big-O di komentar. (2) Implementasikan `debounce`, `throttle`, dan `deepClone` beserta test-nya. (3) Tulis ulang README proyek terbaikmu memakai struktur di atas dan minta satu teman membacanya selama 30 detik: apakah ia bisa menjelaskan proyekmu?
:::

## Rangkuman

- Kuasai lima pola: hash map, dua pointer, sliding window, stack, rekursi/BFS-DFS, ditambah utilitas khas frontend (debounce, throttle, deepClone).
- Jawab konsep dengan definisi → contoh nyata → trade-off; berpikir keras saat live coding; siapkan cerita STAR.
- System design frontend: Requirements, Architecture, Data model, Interface, Optimizations.
- README: kalimat nilai + demo di atas, keputusan teknis di tengah, cara menjalankan di bawah.
