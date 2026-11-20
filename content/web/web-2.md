---
title: Frontend dengan React untuk aplikasi fullstack
minutes: 40
summary: Modul ini membangun sisi depan aplikasi Buku Kontak yang nanti terhubung ke backend buatanmu sendiri. Fokusnya pada hal yang penting untuk fullstack, yaitu komponen dan state, routing, form yang mengirim data, berbicara dengan API lewat HTTP, dan styling cepat dengan Tailwind.
objectives:
  - Menyusun aplikasi React dengan komponen, props, dan state yang terangkat ke induk
  - Menambahkan halaman dengan routing
  - Membangun form tambah/ubah yang mengirim data ke API
  - Melakukan operasi CRUD lewat HTTP dan menata UI dengan Tailwind
sources:
  - repo: fullstack-hy2020/fullstack-hy2020.github.io
    note: Alur bagian 1–2 Full Stack Open (komponen, state, form, komunikasi dengan server)
  - repo: microsoft/frontend-bootcamp
    note: Langkah bertahap dari HTML ke React + TypeScript
  - repo: bradtraversy/50projects50days
    note: Inspirasi latihan komponen UI kecil
quiz:
  - q: "Daftar kontak ditampilkan di komponen List, dan form tambah ada di komponen Form. Di mana state daftar kontak sebaiknya disimpan?"
    options: ["Di Form", "Di List", "Di komponen induk yang berisi keduanya", "Di variabel global window"]
    answer: 2
    explain: "‘Lifting state up’: state diletakkan di induk terdekat yang membutuhkan, lalu diteruskan lewat props dan callback."
  - q: "Setelah POST kontak baru berhasil, cara memperbarui UI yang paling tepat?"
    options: ["Reload seluruh halaman", "Tambahkan objek dari respons server ke state (setKontak([...kontak, baru]))", "Ubah array state langsung dengan push", "Tidak perlu apa-apa"]
    answer: 1
    explain: "Pakai data dari respons (yang sudah berisi id dari server) dan buat array baru agar React me-render ulang."
  - q: "Kenapa URL API sebaiknya disimpan di variabel lingkungan (mis. VITE_API_URL)?"
    options: ["Agar lebih cepat", "Supaya alamat dev (localhost) dan produksi bisa berbeda tanpa mengubah kode", "Wajib di React", "Agar tersembunyi dari pengguna"]
    answer: 1
    explain: "Perhatikan: variabel VITE_ tetap terlihat di bundle JS, jadi jangan simpan rahasia di sana."
  - q: "Optimistic update berarti…"
    options: ["Selalu menampilkan pesan sukses", "UI diperbarui sebelum server menjawab, lalu dibatalkan jika request gagal", "Menunda update", "Tidak memakai server"]
    answer: 1
    explain: "Membuat aplikasi terasa instan, tetapi kamu wajib menangani rollback saat gagal."
---

Di jalur [Frontend](/belajar/frontend/fe-3), React dibahas mendalam. Di jalur fullstack, sudut pandangnya sedikit berbeda: frontend adalah **klien** dari API yang akan kamu bangun sendiri di modul berikutnya. Karena itu fokus kita adalah alur data bolak-balik antara UI dan server.

Proyek: **Buku Kontak** dengan fitur lihat, cari, tambah, ubah, dan hapus kontak. Untuk sementara, server diganti dengan `json-server` yang membuat REST API palsu dari file JSON:

```bash
npm create vite@latest buku-kontak -- --template react-ts
cd buku-kontak && npm install
npx json-server --port 3001 db.json     # db.json: { "kontak": [ { "id": "1", "nama": "Ayu", "telp": "0812..." } ] }
```

## Komponen & state

```viz
{"type":"tree","title":"Struktur komponen Buku Kontak","caption":"State daftar kontak dan kata kunci pencarian tinggal di App karena dibutuhkan beberapa anak. Komponen anak hanya menerima data dan memanggil callback.","root":{"label":"<App>","detail":"State: kontak[], query, status muat. Memanggil API.","children":[{"label":"<Pencarian query onChange>","detail":"Input terkontrol; mengubah query di App."},{"label":"<FormKontak onSimpan awal?>","detail":"Dipakai untuk tambah dan ubah. Memanggil onSimpan dengan data form."},{"label":"<DaftarKontak kontak onHapus>","detail":"Me-render <ItemKontak> untuk setiap kontak hasil filter.","children":[{"label":"<ItemKontak kontak onHapus>","detail":"Menampilkan satu kontak dan tombol hapus."}]}]}}
```

```tsx
type Kontak = { id: string; nama: string; telp: string };

export default function App() {
  const [kontak, setKontak] = useState<Kontak[]>([]);
  const [query, setQuery] = useState("");

  const tampil = kontak.filter((k) => k.nama.toLowerCase().includes(query.toLowerCase())); // nilai turunan

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">Buku Kontak</h1>
      <Pencarian query={query} onChange={setQuery} />
      <FormKontak onSimpan={tambah} />
      <DaftarKontak kontak={tampil} onHapus={hapus} />
    </main>
  );
}
```

## Routing

Begitu aplikasi punya lebih dari satu ‘layar’, misalnya daftar dan detail kontak, gunakan router agar setiap layar punya URL:

```tsx
import { BrowserRouter, Routes, Route, Link, useParams } from "react-router";

function DetailKontak({ kontak }: { kontak: Kontak[] }) {
  const { id } = useParams();
  const k = kontak.find((x) => x.id === id);
  if (!k) return <p>Kontak tidak ditemukan.</p>;
  return <article><h2>{k.nama}</h2><a href={`tel:${k.telp}`}>{k.telp}</a></article>;
}

// di App:
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Beranda />} />
    <Route path="/kontak/:id" element={<DetailKontak kontak={kontak} />} />
  </Routes>
</BrowserRouter>
```

:::info[Catatan deploy]
SPA dengan router di sisi klien butuh server yang mengembalikan `index.html` untuk semua path (*fallback*). Tanpa itu, membuka langsung `/kontak/3` di produksi menghasilkan 404. Vercel/Netlify punya pengaturan rewrite untuk ini.
:::

## Form

Form yang sama dipakai untuk **tambah** dan **ubah**, dengan validasi sederhana dan status mengirim:

```tsx
function FormKontak({ onSimpan, awal }: { onSimpan: (d: Omit<Kontak, "id">) => Promise<void>; awal?: Kontak }) {
  const [mengirim, setMengirim] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;            // simpan dulu: currentTarget menjadi null setelah await
    const f = new FormData(form);
    const nama = String(f.get("nama")).trim();
    const telp = String(f.get("telp")).replace(/\s/g, "");
    if (nama.length < 2) return setError("Nama minimal 2 huruf");
    if (!/^(\+62|0)8\d{7,12}$/.test(telp)) return setError("Nomor HP tidak valid");
    setError(""); setMengirim(true);
    try { await onSimpan({ nama, telp }); form.reset(); }
    catch { setError("Gagal menyimpan, coba lagi"); }
    finally { setMengirim(false); }
  }

  return (
    <form onSubmit={submit} className="my-4 flex flex-wrap gap-2">
      <input name="nama" defaultValue={awal?.nama} placeholder="Nama" className="flex-1 rounded border px-3 py-2" />
      <input name="telp" defaultValue={awal?.telp} placeholder="08xxxxxxxxxx" className="flex-1 rounded border px-3 py-2" />
      <button disabled={mengirim} className="rounded bg-yellow-400 px-4 font-semibold disabled:opacity-50">
        {mengirim ? "Menyimpan…" : "Simpan"}
      </button>
      {error && <p role="alert" className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
```

Ingat: validasi ini untuk kenyamanan pengguna. Backend di modul berikutnya **wajib** memvalidasi ulang.

## Fetching data

Inilah inti modul ini: frontend berbicara dengan server lewat HTTP. Kumpulkan semua pemanggilan API di satu modul agar mudah diganti saat backend sungguhan siap.

```ts
// src/services/kontak.ts
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...init });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.status === 204 ? (undefined as T) : r.json();
}

export const api = {
  semua: () => req<Kontak[]>("/kontak"),
  buat: (d: Omit<Kontak, "id">) => req<Kontak>("/kontak", { method: "POST", body: JSON.stringify(d) }),
  ubah: (k: Kontak) => req<Kontak>(`/kontak/${k.id}`, { method: "PUT", body: JSON.stringify(k) }),
  hapus: (id: string) => req<void>(`/kontak/${id}`, { method: "DELETE" }),
};
```

```viz
{"type":"sequence","title":"Siklus CRUD dari sudut pandang UI","actors":["Pengguna","React","API"],"messages":[{"from":1,"to":2,"label":"GET /kontak","note":"Saat App pertama tampil (useEffect / TanStack Query)."},{"from":2,"to":1,"label":"200 [ ...kontak ]","note":"State diisi, daftar tampil."},{"from":0,"to":1,"label":"isi form & simpan","note":"Tombol dinonaktifkan selama mengirim agar tidak tersubmit dua kali."},{"from":1,"to":2,"label":"POST /kontak","note":"Body berisi nama & telp, tanpa id."},{"from":2,"to":1,"label":"201 {id:'7', …}","note":"Server memberi id. UI menambahkan objek dari respons ke state."},{"from":0,"to":1,"label":"klik hapus","note":"Optimistic: hapus dari state dulu agar terasa instan."},{"from":1,"to":2,"label":"DELETE /kontak/7","note":"Jika gagal, kembalikan item ke state dan tampilkan pesan."}]}
```

```tsx
// di App
useEffect(() => { api.semua().then(setKontak).catch(() => setStatus("error")); }, []);

async function tambah(d: Omit<Kontak, "id">) {
  const baru = await api.buat(d);
  setKontak((k) => [...k, baru]);
}

async function hapus(id: string) {
  const sebelum = kontak;
  setKontak((k) => k.filter((x) => x.id !== id));        // optimistic
  try { await api.hapus(id); } catch { setKontak(sebelum); alert("Gagal menghapus"); }
}
```

## Styling dengan Tailwind

Tailwind mempercepat pembuatan UI yang konsisten tanpa berpindah ke file CSS. Pasang di proyek Vite:

```bash
npm install tailwindcss @tailwindcss/vite
```

```ts
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [react(), tailwindcss()] });
```

```css
/* src/index.css */
@import "tailwindcss";
```

Beberapa kebiasaan agar kelas Tailwind tetap terbaca: ekstrak pola yang berulang menjadi **komponen** (`<Button>`), bukan kelas CSS baru; gunakan varian responsif (`sm:`, `md:`) dan state (`hover:`, `disabled:`, `focus-visible:`); dan tetapkan warna brand di `@theme` agar konsisten.

```viz
{"type":"responsive"}
```

:::latihan
Milestone: Buku Kontak lengkap dengan json-server, mencakup cari, tambah, ubah (form yang sama), hapus dengan optimistic update + rollback, halaman detail `/kontak/:id`, empat state data (memuat, error, kosong, ada isi), dan tampilan responsif dengan Tailwind. Simpan di GitHub dengan commit per fitur.
:::

## Rangkuman

- State diangkat ke induk terdekat; nilai turunan (hasil filter) dihitung, bukan disimpan.
- Router memberi URL untuk setiap layar; ingat fallback `index.html` saat deploy.
- Form: validasi ringan di klien, status mengirim, pesan error yang jelas.
- Kumpulkan pemanggilan API di satu modul; perbarui state dari respons server; optimistic update butuh rollback.
- Tailwind + komponen kecil = UI konsisten dengan cepat.
