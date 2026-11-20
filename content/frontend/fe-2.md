---
title: JavaScript modern sampai paham
minutes: 50
summary: JavaScript adalah satu-satunya bahasa yang berjalan langsung di semua browser. Modul ini tidak berhenti di sintaks, tetapi membahas mekanisme yang sering menjebak, yaitu scope, closure, this, dan event loop, lalu memakainya untuk memanipulasi halaman dan mengambil data dari API.
objectives:
  - Menjelaskan perbedaan var, let, const serta konsep hoisting
  - Memanfaatkan closure dan memahami nilai this
  - Menulis kode asinkron dengan Promise dan async/await
  - Memanipulasi DOM, menangani event, dan memanggil API dengan fetch
sources:
  - repo: javascript-tutorial/en.javascript.info
    note: Urutan materi bahasa inti dan browser
  - repo: leonardomso/33-js-concepts
    note: Daftar konsep wajib sebagai kerangka sub-bab
  - repo: getify/You-Dont-Know-JS
    note: Pendalaman scope, closure, dan this
  - repo: bellshade/Javascript
    note: Padanan istilah Bahasa Indonesia
  - repo: wesbos/JavaScript30
    note: Inspirasi latihan DOM tanpa library
quiz:
  - q: "Apa output kode ini? console.log(x); let x = 5;"
    options: ["undefined", "5", "ReferenceError", "null"]
    answer: 2
    explain: "let dan const ikut di-hoist tetapi berada di ‘temporal dead zone’ sampai baris deklarasinya, sehingga mengaksesnya lebih awal melempar ReferenceError. Dengan var hasilnya undefined."
  - q: "Urutan output: console.log('A'); setTimeout(()=>console.log('B'),0); Promise.resolve().then(()=>console.log('C')); console.log('D');"
    options: ["A B C D", "A D B C", "A D C B", "A C D B"]
    answer: 2
    explain: "Kode sinkron dulu (A, D), lalu microtask Promise (C), baru macrotask setTimeout (B)."
  - q: "Kenapa fetch() yang mendapat respons 404 tidak masuk ke blok catch?"
    options: ["fetch tidak pernah gagal", "fetch hanya reject saat gagal jaringan; status HTTP error harus dicek lewat response.ok", "404 bukan error", "Harus memakai axios"]
    answer: 1
    explain: "Bagi fetch, respons 404/500 tetap respons yang sah. Cek if (!res.ok) throw new Error(...)."
  - q: "Keuntungan event delegation (satu listener di elemen induk) adalah…"
    options: ["Event tidak bisa di-bubble", "Elemen anak yang ditambahkan belakangan otomatis tertangani dan listener lebih sedikit", "Lebih aman dari XSS", "Wajib di React"]
    answer: 1
    explain: "Event bubbling naik ke induk; dengan memeriksa event.target, satu listener bisa melayani banyak anak, termasuk yang dibuat dinamis."
---

Banyak orang ‘bisa JavaScript’ sampai bertemu bug yang tidak masuk akal: variabel bernilai `undefined` padahal sudah diisi, `this` tiba-tiba bukan objek yang diharapkan, atau urutan log tidak sesuai urutan kode. Semua bug itu punya penjelasan, dan modul ini membahas penjelasannya.

Jalankan contoh di **Console** DevTools atau buat `index.html` dengan `<script type="module" src="app.js"></script>`.

## Tipe data, scope, hoisting

JavaScript punya tujuh tipe **primitif** (`string`, `number`, `bigint`, `boolean`, `undefined`, `null`, `symbol`) dan satu tipe **objek** (termasuk array dan function). Primitif disalin **berdasarkan nilai**; objek disalin **berdasarkan referensi**:

```js
let a = 5; let b = a; b++;           // a tetap 5
const o1 = { n: 5 }; const o2 = o1;
o2.n++;                               // o1.n juga 6, karena objeknya sama!
const salinan = { ...o1 };            // shallow copy
```

Gunakan `===` (tanpa konversi tipe), bukan `==`: `0 == ""` bernilai `true`, sedangkan `0 === ""` bernilai `false`.

**Scope** menentukan di mana variabel bisa diakses. `let` dan `const` ber-**block scope** (hidup di dalam `{ }`), sedangkan `var` ber-*function scope* dan sering menimbulkan kejutan. Aturan modern: pakai `const` secara default, `let` jika nilainya perlu diganti, dan hindari `var`.

**Hoisting**: sebelum eksekusi, JavaScript ‘mengangkat’ deklarasi ke atas scope-nya. Deklarasi `function` terangkat lengkap (bisa dipanggil sebelum ditulis); `var` terangkat sebagai `undefined`; `let`/`const` terangkat tetapi tidak boleh diakses sebelum barisnya (*temporal dead zone*).

## Closure & this

**Closure** adalah fungsi yang ‘mengingat’ variabel dari scope tempat ia dibuat, bahkan setelah scope itu selesai dieksekusi.

```js
function buatPenghitung() {
  let hitungan = 0;                 // variabel ‘privat’
  return () => ++hitungan;          // fungsi ini menutup (close over) hitungan
}

const klikLike = buatPenghitung();
klikLike(); klikLike();
console.log(klikLike());            // 3
// hitungan tidak bisa diakses dari luar, hanya lewat fungsi tadi
```

Closure dipakai di mana-mana: event handler, React hooks, fungsi *debounce* untuk kotak pencarian, dan modul dengan data privat.

**`this`** ditentukan oleh **cara fungsi dipanggil**, bukan di mana ia ditulis:

| Cara memanggil | Nilai `this` |
|---|---|
| `obj.metode()` | `obj` |
| `fungsi()` biasa (strict mode/module) | `undefined` |
| `new Kelas()` | objek baru |
| `fn.call(x)` / `fn.bind(x)` | `x` |
| **Arrow function** | mewarisi `this` dari scope luarnya |

```js
const toko = {
  nama: "Seragam Kotabaru",
  sapa() { return `Halo dari ${this.nama}`; },
  sapaNanti() { setTimeout(() => console.log(this.nama), 100); }, // arrow: aman
};
const lepas = toko.sapa;
lepas();     // TypeError: this tidak lagi menunjuk toko
```

## Promise, async/await, event loop

JavaScript di browser berjalan pada **satu thread**. Agar halaman tidak membeku saat menunggu jaringan atau timer, pekerjaan lambat diserahkan ke browser, dan hasilnya diantrikan untuk diproses nanti oleh **event loop**.

```viz
{"type":"event-loop"}
```

**Promise** mewakili nilai yang akan tersedia di masa depan: *pending* → *fulfilled* (berhasil) atau *rejected* (gagal). `async/await` adalah cara menulisnya agar terbaca seperti kode biasa:

```js
const tunggu = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function prosesPesanan() {
  try {
    console.log("Memeriksa stok…");
    await tunggu(500);
    console.log("Stok ada, membuat invoice…");
    await tunggu(300);
    return "selesai";
  } catch (err) {
    console.error("Gagal:", err);
  }
}
```

Untuk beberapa pekerjaan yang **tidak saling bergantung**, jalankan paralel dengan `Promise.all` alih-alih `await` satu per satu:

```js
const [produk, ulasan] = await Promise.all([
  fetch("/api/produk/1").then((r) => r.json()),
  fetch("/api/produk/1/ulasan").then((r) => r.json()),
]);
```

## ES Modules

Kode besar dipecah menjadi **modul**. Setiap file adalah modul dengan scope sendiri; hanya yang di-`export` yang bisa dipakai file lain.

```js
// rupiah.js
export function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
export default formatRupiah;

// app.js
import formatRupiah from "./rupiah.js";       // default import
import { formatRupiah as rp } from "./rupiah.js"; // named import + alias
console.log(rp(125000));                       // Rp125.000 (spasi tergantung locale)
```

Di browser, aktifkan dengan `<script type="module">`. Modul otomatis berjalan dalam *strict mode* dan bersifat `defer`. Di proyek nyata, bundler seperti **Vite** menggabungkan modul-modul ini dan mengelola paket dari npm.

## DOM & event handling

**DOM** adalah representasi halaman sebagai pohon objek yang bisa dibaca dan diubah JavaScript.

```js
const daftar = document.querySelector("#keranjang");
const total = document.querySelector("[data-total]");

function tambahItem(nama, harga) {
  const li = document.createElement("li");
  li.textContent = `${nama}: ${harga}`;   // textContent, BUKAN innerHTML (aman dari XSS)
  li.dataset.harga = harga;
  daftar.append(li);
}
```

Event bergerak dari elemen target **naik** ke induknya (*bubbling*). Ini memungkinkan **event delegation**, yaitu satu listener di induk untuk banyak anak:

```js
daftar.addEventListener("click", (e) => {
  const item = e.target.closest("li");
  if (!item) return;
  item.remove();                          // klik item → hapus
});

document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();                     // cegah reload halaman
  const data = new FormData(e.currentTarget);
  tambahItem(data.get("nama"), Number(data.get("harga")));
});
```

:::warning
Hindari `innerHTML` dengan data dari pengguna atau API. Teks yang berisi `<img onerror=...>` akan dijalankan sebagai kode. Gunakan `textContent` atau buat elemen dengan `createElement`.
:::

## Fetch API

`fetch` mengambil data dari server dan mengembalikan Promise berisi `Response`.

```viz
{"type":"sequence","title":"fetch() dari sudut pandang kode","actors":["Kode JS","Browser","API server"],"messages":[{"from":0,"to":1,"label":"fetch(url)","note":"Kode langsung lanjut; fetch mengembalikan Promise berstatus pending."},{"from":1,"to":2,"label":"GET /api/produk","note":"Browser mengirim request HTTP di latar belakang."},{"from":2,"to":1,"label":"200 + JSON","note":"Server membalas. Status 404/500 juga dianggap ‘respons’, bukan kegagalan fetch."},{"from":1,"to":0,"label":"resolve(Response)","note":"Promise fulfilled. Cek response.ok sebelum memakai datanya."},{"from":0,"to":0,"label":"await res.json()","note":"Membaca body juga asinkron dan menghasilkan objek JavaScript."}]}
```

```js
async function ambilProduk() {
  const status = document.querySelector("#status");
  status.textContent = "Memuat…";
  try {
    const res = await fetch("https://dummyjson.com/products?limit=5");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { products } = await res.json();
    status.textContent = "";
    products.forEach((p) => tambahItem(p.title, p.price));
  } catch (err) {
    status.textContent = "Gagal memuat produk. Coba lagi.";
    console.error(err);
  }
}
```

Tangani tiga keadaan UI: **memuat**, **gagal**, dan **berhasil** (termasuk berhasil tapi datanya kosong). Aplikasi yang terasa ‘profesional’ biasanya hanya berbeda di sini.

:::latihan
Milestone: aplikasi pencatat keuangan vanilla JS. Form tambah transaksi (event `submit`), daftar transaksi dengan hapus (event delegation), total dalam format Rupiah (modul `rupiah.js`), data tersimpan di `localStorage` (`JSON.stringify`/`JSON.parse`), dan kurs USD dari API publik dengan state memuat/gagal.
:::

## Rangkuman

- Primitif disalin per nilai, objek per referensi; gunakan `const`/`let` dan `===`.
- Closure mengingat scope pembuatnya; `this` ditentukan cara pemanggilan, sedangkan arrow function mewarisinya.
- Satu thread + event loop: sinkron dulu, lalu microtask (Promise), lalu macrotask (timer).
- ES Modules memecah kode; DOM dimanipulasi dengan aman lewat `textContent`; delegation menghemat listener.
- `fetch` hanya gagal saat jaringan gagal, jadi selalu cek `res.ok`.
