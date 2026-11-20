---
title: React & ekosistemnya
minutes: 50
summary: React mengubah cara membangun UI, dari ‘ubah DOM langkah demi langkah’ menjadi ‘jelaskan tampilan untuk setiap state’. Modul ini membahas cara berpikir dalam komponen, hooks yang paling penting, routing, pengambilan data, form, dan pilihan styling.
objectives:
  - Memecah UI menjadi komponen dengan props dan state yang tepat
  - Memakai useState, useEffect, dan useMemo tanpa jebakan umum
  - Mengatur routing dan pengambilan data dengan state loading/error
  - Membangun form tervalidasi dan memilih pendekatan styling
sources:
  - repo: reactjs/react.dev
    note: Konsep inti dari bagian Learn (Thinking in React, state, effects)
  - repo: Asabeneh/30-Days-Of-React
    note: Urutan latihan komponen, hooks, dan form
  - repo: enaqx/awesome-react
    note: Peta pustaka routing, data fetching, dan form
quiz:
  - q: "Kenapa kode ini tidak menampilkan angka baru: let n = 0; const tambah = () => { n++ };"
    options: ["n harus const", "Variabel biasa tidak memicu render ulang; gunakan useState", "Butuh useEffect", "React tidak mendukung angka"]
    answer: 1
    explain: "React hanya me-render ulang saat state (atau props) berubah lewat setter-nya. Variabel lokal juga di-reset setiap render."
  - q: "Kapan useEffect dengan dependency array kosong [] dijalankan?"
    options: ["Setiap render", "Sekali setelah komponen pertama kali tampil (mount)", "Sebelum render", "Tidak pernah"]
    answer: 1
    explain: "[] berarti efek tidak bergantung pada nilai apa pun, sehingga cukup dijalankan setelah mount. (Di mode development React StrictMode menjalankannya dua kali untuk membantu menemukan bug.)"
  - q: "Data yang bisa dihitung dari props/state lain (mis. total harga keranjang) sebaiknya…"
    options: ["Disimpan di state terpisah dan disinkronkan dengan useEffect", "Dihitung langsung saat render (pakai useMemo jika mahal)", "Disimpan di localStorage", "Dikirim ke server"]
    answer: 1
    explain: "State turunan yang disinkronkan dengan effect rawan tidak sinkron. Hitung saat render; useMemo hanya untuk perhitungan yang benar-benar berat."
  - q: "Mengapa setiap item dalam list yang di-render butuh prop key yang stabil?"
    options: ["Untuk styling", "Agar React bisa mengenali item mana yang berubah, ditambah, atau dihapus", "Wajib untuk SEO", "Supaya bisa diklik"]
    answer: 1
    explain: "Key membantu proses rekonsiliasi. Memakai index sebagai key bisa menyebabkan bug state ketika urutan item berubah."
---

Dengan JavaScript biasa, kamu menulis **cara** mengubah halaman: cari elemen ini, tambahkan kelas itu, hapus anak ini. Dengan React, kamu menulis **apa** yang harus tampil untuk sebuah state, lalu React yang mengurus perubahan DOM-nya. Pola pikir ini disebut **deklaratif**, dan inilah yang membuat UI kompleks tetap bisa dirawat.

Buat proyek latihan dengan Vite: `npm create vite@latest belajar-react -- --template react-ts`, lalu `npm install` dan `npm run dev`.

## Komponen, props, state

**Komponen** adalah fungsi yang mengembalikan UI (JSX). Data mengalir **satu arah**: dari induk ke anak lewat **props**. Data yang berubah karena interaksi disimpan sebagai **state**.

```viz
{"type":"tree","title":"Memecah halaman katalog menjadi komponen","caption":"Prinsip: letakkan state di komponen induk terdekat yang membutuhkannya. Di sini kata kunci pencarian dipakai oleh SearchBar (untuk menampilkan) dan ProductGrid (untuk menyaring), jadi state-nya tinggal di Katalog.","root":{"label":"<Katalog>","detail":"State: query pencarian & daftar keranjang. Mengirim data ke bawah lewat props dan menerima perubahan lewat fungsi callback.","children":[{"label":"<SearchBar query onChange>","detail":"Menampilkan input. Saat diketik, memanggil onChange dari induk. Ia tidak menyimpan state sendiri."},{"label":"<ProductGrid produk query>","detail":"Menyaring produk berdasarkan query lalu me-render daftar kartu.","children":[{"label":"<ProductCard produk onAdd>","detail":"Komponen kecil yang bisa dipakai ulang; menerima satu produk lewat props."}]},{"label":"<CartBadge jumlah>","detail":"Hanya menampilkan angka dari props."}]}}
```

```tsx
type Produk = { id: number; nama: string; harga: number };

function ProductCard({ produk, onAdd }: { produk: Produk; onAdd: (p: Produk) => void }) {
  return (
    <article className="card">
      <h3>{produk.nama}</h3>
      <p>Rp{produk.harga.toLocaleString("id-ID")}</p>
      <button onClick={() => onAdd(produk)}>Tambah</button>
    </article>
  );
}

export function Katalog({ produk }: { produk: Produk[] }) {
  const [keranjang, setKeranjang] = useState<Produk[]>([]);
  return (
    <>
      <p>{keranjang.length} item di keranjang</p>
      {produk.map((p) => (
        <ProductCard key={p.id} produk={p} onAdd={(x) => setKeranjang([...keranjang, x])} />
      ))}
    </>
  );
}
```

Dua aturan penting: **jangan pernah mengubah state secara langsung** (`keranjang.push(x)` tidak memicu render; buat array baru), dan berikan `key` yang stabil dan unik (biasanya `id`) pada setiap item list.

## Hooks (useState, useEffect, useMemo)

**Hooks** adalah fungsi khusus yang memberi komponen ‘ingatan’ dan kemampuan berinteraksi dengan dunia luar. Aturannya: panggil hooks hanya di level atas komponen, bukan di dalam `if` atau loop.

```viz
{"type":"flow","title":"Siklus render React","caption":"Setiap kali state berubah, komponen dijalankan ulang dari atas. Effect dijalankan setelah perubahan terlihat di layar.","loop":true,"steps":[{"label":"Trigger","detail":"Render pertama (mount) atau setState dipanggil."},{"label":"Render","detail":"React memanggil fungsi komponen dan mendapatkan JSX baru. Harus ‘murni’: tanpa efek samping."},{"label":"Commit","detail":"React membandingkan dengan hasil sebelumnya dan hanya mengubah bagian DOM yang berbeda."},{"label":"Effect","detail":"useEffect berjalan setelah layar diperbarui. Tempat untuk sinkronisasi dengan sistem luar: fetch, timer, subscription."}]}
```

```tsx
function Jam() {
  const [waktu, setWaktu] = useState(() => new Date());   // lazy initial state

  useEffect(() => {
    const id = setInterval(() => setWaktu(new Date()), 1000);
    return () => clearInterval(id);    // cleanup: wajib agar tidak bocor
  }, []);                               // [] = hanya saat mount

  return <time>{waktu.toLocaleTimeString("id-ID")}</time>;
}

function RingkasanKeranjang({ items }: { items: { harga: number; qty: number }[] }) {
  // nilai turunan: HITUNG, jangan simpan di state lain
  const total = useMemo(() => items.reduce((a, i) => a + i.harga * i.qty, 0), [items]);
  return <strong>Total: Rp{total.toLocaleString("id-ID")}</strong>;
}
```

:::warning[Kesalahan useEffect paling umum]
Memakai `useEffect` untuk menghitung data turunan (mis. `useEffect(() => setTotal(...), [items])`). Ini membuat render dua kali dan rawan tidak sinkron. Effect hanya untuk **sinkronisasi dengan sistem di luar React**.
:::

## Routing

Aplikasi satu halaman (SPA) tetap butuh URL berbeda untuk setiap ‘halaman’ agar bisa dibagikan dan tombol back berfungsi. Di proyek Vite, pustaka yang paling umum adalah **React Router**; di Next.js routing berbasis struktur folder (dibahas di modul berikutnya).

```tsx
import { BrowserRouter, Routes, Route, Link, useParams } from "react-router";

function DetailProduk() {
  const { id } = useParams();           // dari URL /produk/42 → "42"
  return <h1>Produk #{id}</h1>;
}

export default function App() {
  return (
    <BrowserRouter>
      <nav><Link to="/">Beranda</Link> · <Link to="/produk/42">Contoh</Link></nav>
      <Routes>
        <Route path="/" element={<Katalog produk={[]} />} />
        <Route path="/produk/:id" element={<DetailProduk />} />
        <Route path="*" element={<p>Halaman tidak ditemukan</p>} />
      </Routes>
    </BrowserRouter>
  );
}
```

Gunakan `<Link>` (bukan `<a>`) untuk navigasi internal agar halaman tidak dimuat ulang penuh.

## Data fetching & caching

Mengambil data selalu melibatkan beberapa keadaan, dan UI harus menangani semuanya:

```viz
{"type":"fsm","title":"State pengambilan data","caption":"Banyak bug UI muncul karena salah satu keadaan ini terlupakan, mis. tidak ada tampilan error, atau data lama tetap tampil saat memuat ulang.","start":"idle","states":[{"id":"idle","detail":"Belum ada permintaan."},{"id":"loading","detail":"Menunggu respons: tampilkan skeleton/spinner, nonaktifkan tombol kirim."},{"id":"success","detail":"Data tersedia. Tangani juga kasus daftar kosong."},{"id":"error","detail":"Tampilkan pesan yang manusiawi dan tombol coba lagi."}],"transitions":[{"from":"idle","to":"loading","event":"fetch"},{"from":"loading","to":"success","event":"respons OK"},{"from":"loading","to":"error","event":"gagal"},{"from":"error","to":"loading","event":"coba lagi"},{"from":"success","to":"loading","event":"refresh"}]}
```

Menulis semua itu manual dengan `useEffect` berulang di setiap komponen melelahkan dan rawan *race condition*. Di proyek nyata, gunakan pustaka seperti **TanStack Query** yang menangani loading/error, **cache**, deduplikasi request, dan refetch otomatis:

```tsx
import { useQuery } from "@tanstack/react-query";

function DaftarProduk() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["produk"],
    queryFn: async () => {
      const r = await fetch("https://dummyjson.com/products?limit=12");
      if (!r.ok) throw new Error("Gagal memuat");
      return (await r.json()).products as { id: number; title: string }[];
    },
    staleTime: 60_000,   // data dianggap segar selama 1 menit (tidak di-fetch ulang)
  });

  if (isPending) return <p>Memuat…</p>;
  if (isError) return <button onClick={() => refetch()}>Gagal. Coba lagi</button>;
  if (data.length === 0) return <p>Belum ada produk.</p>;
  return <ul>{data.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

## Form & validasi

Ada dua gaya form di React: **controlled** (nilai input disimpan di state, sehingga setiap ketikan memicu render) dan **uncontrolled** (browser yang menyimpan nilai, lalu dibaca saat submit). Untuk form sederhana, uncontrolled + `FormData` sudah cukup:

```tsx
function FormDaftar() {
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (!String(data.email).includes("@")) return setError("Email tidak valid");
    setError(null);
    console.log("kirim", data);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required aria-invalid={!!error} aria-describedby="err" />
      {error && <p id="err" role="alert">{error}</p>}
      <button>Daftar</button>
    </form>
  );
}
```

Untuk form besar, kombinasi **React Hook Form** + skema validasi **Zod** adalah pilihan populer: aturan validasi ditulis sekali sebagai skema, dan tipe TypeScript-nya ikut terbentuk.

:::info[Validasi di klien bukan keamanan]
Validasi di browser hanya untuk kenyamanan pengguna. Server **wajib** memvalidasi ulang, karena siapa pun bisa mengirim request tanpa melewati form-mu.
:::

## Styling: Tailwind / CSS Modules

```viz
{"type":"compare","title":"Pilihan styling di proyek React","columns":["CSS Modules","Tailwind CSS","CSS-in-JS"],"rows":[{"label":"Cara kerja","values":["File .module.css, nama kelas otomatis unik","Kelas utilitas kecil langsung di JSX","Style ditulis di JavaScript"]},{"label":"Contoh","values":["className={s.kartu}","className=\"rounded-xl p-4 shadow\"","styled.div`padding: 1rem`"]},{"label":"Kelebihan","values":["CSS biasa, tanpa bentrok nama","Cepat, konsisten lewat design token, CSS kecil","Style dinamis berbasis props"]},{"label":"Kekurangan","values":["Pindah-pindah file","JSX ramai kelas","Biaya runtime, kurang cocok dengan Server Components"]},{"label":"Cocok untuk","values":["Tim yang kuat di CSS","Kebanyakan proyek baru","Proyek lama yang sudah memakainya"]}]}
```

```tsx
// Tailwind: semua gaya dekat dengan markup
<button className="rounded-xl border-2 border-slate-900 bg-yellow-400 px-4 py-2 font-bold hover:bg-yellow-300">
  Tambah
</button>
```

Apa pun pilihannya, konsistensi lebih penting daripada alatnya. Tetapkan skala warna, jarak, dan tipografi sekali (*design token*), lalu pakai di seluruh aplikasi.

:::latihan
Milestone: dashboard film/buku. Ambil data dari API publik (mis. Open Library), tampilkan grid kartu (komponen `Card`), kotak pencarian yang menyaring hasil, halaman detail di `/buku/:id`, dan tangani keempat state data. Bonus: simpan daftar favorit di `localStorage` lewat custom hook `useLocalStorage`.
:::

## Rangkuman

- UI = fungsi dari state. Props mengalir ke bawah, event naik lewat callback; state diletakkan di induk terdekat yang membutuhkannya.
- `useState` untuk ingatan, `useEffect` hanya untuk sinkronisasi dengan dunia luar (dengan cleanup), `useMemo` untuk perhitungan mahal.
- Routing memberi setiap tampilan URL sendiri.
- Data fetching punya empat keadaan; pustaka seperti TanStack Query menangani cache dan refetch.
- Validasi klien demi UX, validasi server demi keamanan; pilih satu pendekatan styling dan konsisten.
