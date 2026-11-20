---
title: TypeScript & Next.js
minutes: 45
summary: TypeScript menangkap kesalahan sebelum kode dijalankan, dan Next.js menambahkan routing, rendering di server, dan optimasi produksi di atas React. Kombinasi keduanya adalah standar de facto untuk aplikasi web modern, termasuk situs SatuTahu ini.
objectives:
  - Memakai tipe dasar, union, generics, dan utility types
  - Mengetik props, state, event, dan custom hook React
  - Memahami App Router, Server Components, dan Client Components
  - Memilih strategi rendering dan menyiapkan SEO lewat metadata
sources:
  - repo: basarat/typescript-book
    note: Penjelasan type system, generics, dan type narrowing
  - repo: typescript-cheatsheets/react
    note: Pola mengetik props, event, dan hooks React
  - repo: vercel/next-learn
    note: Struktur kursus Next.js App Router (dashboard app)
quiz:
  - q: "Tipe apa yang paling tepat untuk status pesanan yang hanya boleh ‘baru’, ‘dikirim’, atau ‘selesai’?"
    options: ["string", "any", "\"baru\" | \"dikirim\" | \"selesai\"", "number"]
    answer: 2
    explain: "Union literal type membatasi nilai yang sah. Salah ketik seperti ‘dikrim’ langsung ditandai editor."
  - q: "Partial<User> menghasilkan tipe yang…"
    options: ["Menghapus semua properti", "Membuat semua properti User menjadi opsional", "Hanya berisi properti wajib", "Sama dengan any"]
    answer: 1
    explain: "Partial cocok untuk data update (PATCH) di mana hanya sebagian field yang dikirim."
  - q: "Komponen yang memakai useState atau onClick di Next.js App Router harus…"
    options: ["Diberi direktif 'use client' di bagian atas file", "Ditaruh di folder public", "Ditulis dalam JavaScript murni", "Memakai getServerSideProps"]
    answer: 0
    explain: "Secara default komponen adalah Server Component, yang tidak bisa memakai state atau event browser. 'use client' menandai batas Client Component."
  - q: "Halaman blog yang jarang berubah dan harus cepat serta ramah SEO paling cocok dirender dengan…"
    options: ["Client-side rendering saja", "Static generation (dibangun saat build atau di-cache)", "Selalu SSR per request", "iframe"]
    answer: 1
    explain: "Konten statis dibangun sekali lalu disajikan dari CDN: tercepat dan murah, dan HTML-nya lengkap untuk mesin pencari."
---

JavaScript membiarkanmu mengirim `undefined` ke fungsi yang mengharapkan angka, dan kamu baru tahu saat pengguna melihat layar error. **TypeScript** menambahkan sistem tipe sehingga kesalahan itu tertangkap di editor. **Next.js** lalu menjawab pertanyaan yang tidak dijawab React sendiri: bagaimana routing, di mana data diambil, dan bagaimana halaman dikirim secepat mungkin.

## Tipe dasar, generics, utility types

TypeScript adalah JavaScript + anotasi tipe. Tipe dihapus saat kompilasi, sehingga tidak ada biaya saat runtime.

```ts
// tipe dasar & inferensi
let nama = "Ayu";             // otomatis string
const sks: number = 3;
const aktif: boolean = true;

// object type & union literal
type Status = "baru" | "dikirim" | "selesai";
interface Pesanan {
  id: number;
  pelanggan: string;
  total: number;
  status: Status;
  catatan?: string;           // opsional
}

// type narrowing: TS memahami cabang if
function label(p: Pesanan) {
  if (p.status === "selesai") return "✓ Selesai";
  return p.catatan ?? "Diproses";   // ?? = pakai kanan jika kiri null/undefined
}
```

**Generics** membuat fungsi/tipe yang bekerja untuk banyak tipe sambil tetap aman:

```ts
function pertama<T>(arr: T[]): T | undefined {
  return arr[0];
}
const a = pertama([1, 2, 3]);         // number | undefined
const b = pertama(["x", "y"]);        // string | undefined

type ApiResponse<T> = { data: T; error: null } | { data: null; error: string };
```

**Utility types** membentuk tipe baru dari tipe yang ada:

| Utility | Hasil | Contoh penggunaan |
|---|---|---|
| `Partial<T>` | semua properti opsional | payload update |
| `Pick<T, "a" \| "b">` | hanya properti tertentu | data untuk kartu ringkas |
| `Omit<T, "id">` | tanpa properti tertentu | form tambah (id dari server) |
| `Record<K, V>` | objek kunci K bernilai V | `Record<Status, string>` |
| `ReturnType<typeof f>` | tipe hasil fungsi | tanpa menulis ulang tipe |

:::warning
`any` mematikan pemeriksaan tipe dan menyebar ke kode lain. Jika tipe belum diketahui (mis. data dari API), gunakan `unknown` lalu persempit dengan pengecekan atau validasi skema (Zod).
:::

## Typing props & hooks

Pola yang paling sering dipakai saat menggabungkan TypeScript dengan React:

```tsx
import { useState, type ReactNode, type ChangeEvent } from "react";

type ButtonProps = {
  variant?: "primary" | "ghost";
  children: ReactNode;                 // apa pun yang bisa di-render
  onClick?: () => void;
} & React.ComponentProps<"button">;    // warisi semua atribut <button> asli

export function Button({ variant = "primary", children, ...rest }: ButtonProps) {
  return <button className={`btn btn-${variant}`} {...rest}>{children}</button>;
}

function Cari() {
  const [q, setQ] = useState("");                     // inferensi: string
  const [hasil, setHasil] = useState<Pesanan[]>([]);  // perlu eksplisit: array kosong
  const onChange = (e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value);
  return <input value={q} onChange={onChange} />;
}

// custom hook dengan generic
function useLocalStorage<T>(key: string, awal: T) {
  const [nilai, setNilai] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : awal;
  });
  const simpan = (v: T) => { setNilai(v); localStorage.setItem(key, JSON.stringify(v)); };
  return [nilai, simpan] as const;    // as const: tuple, bukan array campuran
}
```

## App Router, Server Components

Di Next.js **App Router**, struktur folder di `app/` adalah peta URL:

```viz
{"type":"tree","title":"Struktur folder = struktur URL","caption":"File khusus seperti layout, loading, dan error berlaku untuk semua halaman di bawah foldernya.","root":{"label":"app/","detail":"Akar routing.","children":[{"label":"layout.tsx","detail":"Kerangka bersama semua halaman: <html>, navbar, footer. Tidak di-render ulang saat pindah halaman."},{"label":"page.tsx","detail":"Halaman untuk URL /"},{"label":"katalog/","detail":"Segmen URL /katalog","children":[{"label":"page.tsx","detail":"URL /katalog"},{"label":"loading.tsx","detail":"UI sementara (skeleton) yang otomatis tampil saat halaman memuat data."},{"label":"[id]/page.tsx","detail":"Dynamic route: /katalog/42, /katalog/abc. Nilai id diterima lewat params."}]},{"label":"api/pesanan/route.ts","detail":"Route Handler: endpoint API (GET/POST) di URL /api/pesanan."}]}}
```

Perubahan konsep terbesar: komponen di App Router secara default adalah **Server Component**. Ia dijalankan di server, boleh langsung membaca database atau file, dan **kodenya tidak dikirim ke browser**. Komponen yang butuh interaktivitas (state, event, API browser) ditandai `"use client"`.

```tsx
// app/katalog/page.tsx: Server Component (default)
import { TombolTambah } from "./TombolTambah";

export default async function Katalog() {
  const produk = await db.produk.findMany();     // langsung query, aman di server
  return (
    <ul>
      {produk.map((p) => (
        <li key={p.id}>{p.nama} <TombolTambah id={p.id} /></li>
      ))}
    </ul>
  );
}

// app/katalog/TombolTambah.tsx: Client Component
"use client";
import { useState } from "react";
export function TombolTambah({ id }: { id: number }) {
  const [ok, setOk] = useState(false);
  return <button onClick={() => setOk(true)}>{ok ? "✓" : "Tambah"}</button>;
}
```

Prinsipnya: biarkan sebanyak mungkin komponen di server, dan dorong `"use client"` ke ‘daun’ pohon komponen sekecil mungkin. Hasilnya JavaScript yang dikirim ke browser jauh lebih sedikit.

## Rendering: SSR, SSG, streaming

Kapan dan di mana HTML dibuat sangat memengaruhi kecepatan, biaya, dan SEO.

```viz
{"type":"compare","title":"Strategi rendering","columns":["CSR","SSR","SSG / cache","Streaming"],"rows":[{"label":"HTML dibuat","values":["Di browser oleh JS","Di server, setiap request","Saat build / sekali lalu di-cache","Di server, dikirim bertahap"]},{"label":"Tampilan pertama","values":["Lambat (tunggu JS)","Cepat","Paling cepat (dari CDN)","Kerangka cepat, data menyusul"]},{"label":"Data selalu terbaru","values":["Ya","Ya","Tidak, perlu revalidasi","Ya"]},{"label":"SEO","values":["Lemah","Baik","Sangat baik","Baik"]},{"label":"Cocok untuk","values":["Dashboard di balik login","Halaman personal/real-time","Blog, dokumentasi, katalog","Halaman dengan bagian lambat"]}]}
```

Di Next.js modern, halaman statis secara default bila memungkinkan. Data yang sering berubah bisa di-cache dengan waktu revalidasi, dan bagian yang lambat dibungkus `<Suspense>` agar sisa halaman tidak perlu menunggu:

```tsx
import { Suspense } from "react";

export default function Produk() {
  return (
    <>
      <InfoProduk />                         {/* cepat */}
      <Suspense fallback={<p>Memuat ulasan…</p>}>
        <Ulasan />                           {/* lambat: di-stream belakangan */}
      </Suspense>
    </>
  );
}
```

:::info[Versi Next.js berubah cepat]
API caching Next.js berubah beberapa kali antar versi besar. Selalu cocokkan dengan dokumentasi versi yang kamu pakai (lihat `package.json`), terutama untuk konfigurasi cache dan revalidasi.
:::

## SEO & metadata

Next.js menyediakan **Metadata API** untuk judul, deskripsi, dan Open Graph (pratinjau saat link dibagikan di WhatsApp/sosial media):

```tsx
// app/katalog/[id]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduk(id);
  return {
    title: `${p.nama} | Toko Seragam`,
    description: p.deskripsi.slice(0, 150),
    openGraph: { images: [p.foto] },
  };
}
```

Checklist SEO teknis yang sering terlupa:

- Satu `<h1>` yang jelas per halaman dan heading berurutan.
- URL yang bermakna (`/katalog/gamis-bkmt-hijau`, bukan `/p?id=8213`).
- `sitemap.xml` dan `robots.txt` (Next.js bisa membuatnya lewat file `app/sitemap.ts`).
- Gambar dengan `alt` dan komponen `next/image` (ukuran otomatis dioptimasi).
- Halaman cepat: Core Web Vitals juga menjadi sinyal peringkat.

:::latihan
Milestone: migrasikan dashboard dari modul React ke Next.js + TypeScript. Halaman daftar sebagai Server Component yang mengambil data di server, halaman detail `/buku/[id]` dengan `generateMetadata`, tombol favorit sebagai Client Component kecil, `loading.tsx` berisi skeleton. Deploy ke Vercel dan uji pratinjau link-nya di WhatsApp.
:::

## Rangkuman

- TypeScript: union literal, interface, generics, dan utility types; hindari `any`, gunakan `unknown` + narrowing.
- Ketik props dengan `ReactNode`/`ComponentProps`, state kosong dengan generic eksplisit.
- App Router: folder = URL; Server Component default; `"use client"` hanya untuk bagian interaktif.
- Pilih rendering sesuai kebutuhan data: statis/cached bila bisa, streaming untuk bagian lambat.
- Metadata API + struktur semantik + performa = SEO yang sehat.
