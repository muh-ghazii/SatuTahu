---
title: "Foundations: web, Git & JavaScript untuk fullstack"
minutes: 35
summary: Jalur fullstack menuntut kamu nyaman di banyak lapisan sekaligus. Modul pembuka ini menyatukan fondasinya dalam satu proyek kecil, yaitu halaman yang ditata dengan CSS modern, diberi perilaku dengan JavaScript, disimpan di Git, dijalankan dari terminal, lalu di-debug dengan DevTools seperti profesional.
objectives:
  - Membangun tata letak halaman dengan Flexbox dan Grid
  - Menulis JavaScript dasar untuk interaksi dan data
  - Menyimpan proyek di GitHub dan bekerja dari terminal
  - Men-debug HTML, CSS, JavaScript, dan jaringan dengan DevTools
sources:
  - repo: TheOdinProject/curriculum
    note: Struktur ‘Foundations’ dan pendekatan berbasis proyek
  - repo: freeCodeCamp/freeCodeCamp
    note: Urutan latihan HTML/CSS/JS interaktif
  - repo: Asabeneh/30-Days-Of-JavaScript
    note: Rujukan latihan JavaScript dasar
quiz:
  - q: "Kamu ingin tahu kenapa sebuah tombol tidak berwarna kuning padahal kelasnya benar. Panel DevTools yang paling tepat?"
    options: ["Network", "Elements → Styles (lihat aturan yang dicoret)", "Console", "Application"]
    answer: 1
    explain: "Panel Styles menunjukkan semua aturan CSS yang cocok, dan aturan yang kalah prioritas (specificity) ditampilkan dicoret."
  - q: "Breakpoint di tab Sources digunakan untuk…"
    options: ["Mengatur ukuran layar", "Menghentikan eksekusi JavaScript di baris tertentu untuk memeriksa nilai variabel", "Menghapus kode", "Memperbesar font"]
    answer: 1
    explain: "Breakpoint memungkinkan menjalankan kode langkah demi langkah dan melihat isi variabel. Jauh lebih efektif daripada console.log di mana-mana."
  - q: "Request ke API gagal dengan pesan ‘blocked by CORS policy’ di Console. Artinya…"
    options: ["Internet mati", "Server API belum mengizinkan origin halamanmu memanggilnya dari browser", "JavaScript salah sintaks", "Gambar terlalu besar"]
    answer: 1
    explain: "CORS adalah aturan browser. Perbaikannya di server (header Access-Control-Allow-Origin), bukan di kode frontend."
  - q: "Perintah apa untuk melihat perubahan apa saja yang belum di-commit?"
    options: ["git log", "git status (dan git diff untuk detail)", "git push", "git clone"]
    answer: 1
    explain: "git status menunjukkan file yang berubah/di-stage; git diff menunjukkan baris yang berubah."
---

Fullstack developer bukan orang yang hafal semua hal, tetapi orang yang tahu **di lapisan mana masalah berada** dan bisa berpindah dengan nyaman. Modul ini merangkum fondasi dari jalur [Frontend](/belajar/frontend/fe-1) dan [Fondasi CS](/belajar/fondasi/fd-3) secara ringkas, lalu menambahkan keterampilan yang sering terlewat: **debugging**.

Proyek sepanjang modul: halaman **Daftar Tugas Kuliah** sederhana.

## HTML/CSS layout

Tata letak modern cukup dengan dua alat. **Grid** untuk kerangka halaman (header, sidebar, konten) dan **Flexbox** untuk menyusun item di dalamnya.

```html
<body class="app">
  <header class="atas">📚 Tugas Kuliah</header>
  <aside class="samping">Filter</aside>
  <main class="isi">
    <form class="form-tugas">
      <input name="judul" placeholder="Judul tugas" required />
      <input name="deadline" type="date" required />
      <button>Tambah</button>
    </form>
    <ul id="daftar"></ul>
  </main>
</body>
```

```css
.app {
  display: grid;
  grid-template-columns: 1fr;                /* HP: satu kolom */
  grid-template-areas: "atas" "isi";
  min-height: 100dvh;
}
@media (min-width: 768px) {
  .app {
    grid-template-columns: 220px 1fr;
    grid-template-areas: "atas atas" "samping isi";
  }
  .samping { display: block; }
}
.atas { grid-area: atas; } .isi { grid-area: isi; padding: 1rem; }
.samping { grid-area: samping; display: none; }

.form-tugas { display: flex; flex-wrap: wrap; gap: .5rem; }
.form-tugas input[name="judul"] { flex: 1 1 200px; }   /* tumbuh mengisi ruang */
```

```viz
{"type":"flexbox"}
```

## JavaScript dasar

Tambahkan perilaku: menambah tugas, menandai selesai, dan menyimpan ke `localStorage` agar tidak hilang saat halaman dimuat ulang.

```js
const daftar = document.querySelector("#daftar");
const form = document.querySelector(".form-tugas");
let tugas = JSON.parse(localStorage.getItem("tugas") ?? "[]");

function render() {
  daftar.replaceChildren(
    ...tugas
      .toSorted((a, b) => a.deadline.localeCompare(b.deadline))   // terdekat dulu
      .map((t) => {
        const li = document.createElement("li");
        li.textContent = `${t.judul} — ${t.deadline}`;
        li.dataset.id = t.id;
        if (t.selesai) li.classList.add("selesai");
        return li;
      }),
  );
  localStorage.setItem("tugas", JSON.stringify(tugas));
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(form);
  tugas.push({ id: crypto.randomUUID(), judul: data.get("judul"), deadline: data.get("deadline"), selesai: false });
  form.reset();
  render();
});

daftar.addEventListener("click", (e) => {
  const id = e.target.closest("li")?.dataset.id;
  tugas = tugas.map((t) => (t.id === id ? { ...t, selesai: !t.selesai } : t));
  render();
});

render();
```

Pola di atas, yaitu **state di satu variabel → fungsi `render()` menggambar ulang dari state**, adalah ide yang sama dengan React. Ketika kamu nanti belajar React, kamu akan mengenalinya. Pendalaman closure, event loop, dan modul ada di [JavaScript modern sampai paham](/belajar/frontend/fe-2).

## Git & GitHub

Jadikan proyek ini repository sejak awal dan biasakan alurnya:

```bash
git init
echo "node_modules/" > .gitignore
git add .
git commit -m "Halaman daftar tugas: layout dan tambah tugas"
git switch -c fitur/filter-deadline     # fitur baru di branch sendiri
# ... kerjakan, commit ...
git switch main && git merge fitur/filter-deadline
git remote add origin https://github.com/username/tugas-kuliah.git
git push -u origin main
```

```viz
{"type":"git-graph"}
```

## Command line

Fullstack developer menjalankan banyak hal dari terminal: server pengembangan, package manager, database lokal, dan Git. Perintah yang akan langsung kamu pakai di jalur ini:

```bash
node -v && npm -v              # cek versi
npm create vite@latest web-app # buat proyek frontend
npm install                    # pasang dependency dari package.json
npm run dev                    # jalankan server pengembangan
npx serve .                    # sajikan folder statis sementara
lsof -i :3000                  # (macOS/Linux) proses apa yang memakai port 3000?
# Windows PowerShell: Get-NetTCPConnection -LocalPort 3000
```

:::tip
Error ‘port already in use’ adalah salah satu masalah paling sering. Artinya ada server lain (mungkin yang lupa dimatikan) yang masih memakai port tersebut. Matikan prosesnya atau jalankan di port lain (`PORT=3001 npm run dev`).
:::

## Debugging di DevTools

Debugging adalah keterampilan yang paling membedakan junior dan senior. Prinsipnya: **jangan menebak, amati**. DevTools (F12) menyediakan alat untuk setiap lapisan:

```viz
{"type":"layers","title":"Panel DevTools dan kapan memakainya","caption":"Mulailah dari gejala: tampilan salah → Elements; error/perilaku salah → Console & Sources; data tidak muncul → Network; data tersimpan aneh → Application.","layers":[{"label":"Elements","tag":"HTML & CSS","detail":"Lihat DOM yang sebenarnya (bisa berbeda dengan file HTML karena diubah JS). Panel Styles menunjukkan aturan CSS yang menang/kalah; panel Computed menunjukkan box model akhir."},{"label":"Console","tag":"JS","detail":"Pesan error beserta baris asalnya. Bisa menjalankan JS langsung. Gunakan console.table(data) untuk array objek."},{"label":"Sources","tag":"JS","detail":"Pasang breakpoint, jalankan kode baris demi baris (step over/into), dan lihat isi variabel serta call stack."},{"label":"Network","tag":"HTTP","detail":"Semua request: URL, status, header, payload, respons, dan waktu. Tempat pertama saat ‘data tidak muncul’."},{"label":"Application","tag":"storage","detail":"Isi localStorage, cookie, IndexedDB, service worker. Bisa diedit atau dihapus langsung."},{"label":"Lighthouse & Performance","tag":"kualitas","detail":"Audit performa, aksesibilitas, SEO; rekam aktivitas untuk menemukan bagian yang lambat."}]}
```

Alur debugging yang sistematis:

1. **Reproduksi** dengan langkah yang pasti. Bug yang tidak bisa diulang tidak bisa dipastikan sudah diperbaiki.
2. **Baca pesan error** lengkap, termasuk nama file dan baris. Sebagian besar jawaban ada di sana.
3. **Persempit** lapisannya: apakah request terkirim (Network)? apakah respons benar? apakah state benar (breakpoint)? apakah tampilannya saja yang salah (Elements)?
4. **Ubah satu hal**, lalu uji ulang. Mengubah lima hal sekaligus membuatmu tidak tahu mana yang memperbaiki.
5. Setelah ketemu, **tulis test** (bila memungkinkan) agar bug yang sama tidak kembali.

:::latihan
Selesaikan proyek Daftar Tugas, lalu **sengaja buat 3 bug** (mis. salah nama kelas CSS, salah key localStorage, lupa `preventDefault`). Minta teman menemukannya hanya dengan DevTools, atau tukar proyek dan lakukan sebaliknya. Deploy versi akhirnya ke GitHub Pages.
:::

## Rangkuman

- Grid untuk kerangka halaman, Flexbox untuk isi; mobile-first.
- Pola ‘state → render’ di JavaScript biasa adalah dasar React.
- Git sejak commit pertama; branch untuk setiap fitur.
- Terminal untuk menjalankan server, paket, dan memeriksa port.
- Debugging: reproduksi → baca error → persempit lapisan dengan DevTools → ubah satu hal → kunci dengan test.
