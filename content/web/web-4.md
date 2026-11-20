---
title: "Fullstack modern: Next.js, TypeScript & deploy"
minutes: 45
summary: Next.js memungkinkan frontend dan backend hidup dalam satu proyek dan satu bahasa. Modul ini membangun aplikasi booking jadwal dengan App Router, Server Actions, dan Prisma, lalu merilisnya ke internet dengan domain sendiri dan pemantauan error.
objectives:
  - Menyusun aplikasi fullstack dengan App Router dan Server Components
  - Memilih antara Server Actions dan Route Handlers
  - Mendefinisikan skema dan migrasi database dengan Prisma
  - Men-deploy dengan domain, environment variable, dan monitoring error
sources:
  - repo: vercel/next-learn
    note: Struktur kursus dashboard fullstack Next.js (data, mutasi, auth, deploy)
  - repo: prisma/prisma-examples
    note: Contoh integrasi Prisma dengan Next.js
  - repo: realworld-apps/realworld
    note: Spesifikasi aplikasi pembanding untuk menguji kemampuan fullstack
quiz:
  - q: "Form ‘Buat booking’ di aplikasi Next.js milikmu sendiri. Cara paling ringkas memproses submit-nya?"
    options: ["Membuat API terpisah di framework lain", "Server Action yang dipanggil langsung dari form", "Menyimpan di localStorage", "Memakai iframe"]
    answer: 1
    explain: "Server Action berjalan di server, bisa langsung memakai Prisma, dan bekerja progresif bahkan sebelum JavaScript termuat."
  - q: "Aplikasi mobile Flutter juga perlu membaca data booking. Yang perlu kamu sediakan?"
    options: ["Server Action", "Route Handler (endpoint HTTP publik, mis. app/api/booking/route.ts)", "Server Component", "Client Component"]
    answer: 1
    explain: "Server Action dirancang untuk dipanggil dari aplikasi Next.js itu sendiri. Klien lain butuh endpoint HTTP biasa."
  - q: "Perubahan skema database (mis. menambah kolom) sebaiknya dilakukan dengan…"
    options: ["Mengubah tabel produksi langsung lewat GUI", "File migrasi yang di-commit dan dijalankan otomatis saat deploy", "Menghapus database", "Mengubah kode saja"]
    answer: 1
    explain: "Migrasi tercatat membuat skema dev, staging, dan produksi identik dan bisa ditelusuri."
  - q: "Error di produksi hanya muncul di HP pengguna tertentu. Alat yang membantu menemukannya?"
    options: ["console.log di laptop", "Layanan error monitoring (mis. Sentry) yang merekam stack trace, browser, dan langkah sebelum error", "Menebak", "Membaca kode ulang"]
    answer: 1
    explain: "Error monitoring menangkap error nyata dari pengguna lengkap dengan konteks, sehingga bug yang tidak bisa direproduksi di laptop bisa ditelusuri."
---

Di dua modul sebelumnya frontend dan backend adalah dua proyek terpisah yang berkomunikasi lewat HTTP. **Next.js** menawarkan pendekatan lain: satu proyek TypeScript tempat Server Components membaca database langsung dan form memanggil fungsi server tanpa kamu menulis endpoint. Ini mempercepat pengembangan, asalkan kamu memahami batas antara kode server dan klien. Konsep dasarnya ada di modul [TypeScript & Next.js](/belajar/frontend/fe-4).

Proyek: **Booking Jadwal**, misalnya untuk konsultasi dosen, studio foto, atau servis motor.

```bash
npx create-next-app@latest booking --ts --tailwind --app
cd booking && npm install prisma @prisma/client zod
npx prisma init --datasource-provider postgresql
```

## Next.js App Router

```viz
{"type":"tree","title":"Struktur aplikasi Booking","caption":"Server Components (default) membaca data; hanya bagian interaktif yang menjadi Client Component.","root":{"label":"app/","detail":"Routing berbasis folder.","children":[{"label":"layout.tsx","detail":"Navbar & footer bersama."},{"label":"page.tsx","detail":"Beranda: daftar layanan (Server Component, query Prisma langsung)."},{"label":"booking/","detail":"Fitur booking.","children":[{"label":"page.tsx","detail":"Daftar booking milik pengguna."},{"label":"baru/page.tsx","detail":"Form booking baru; memakai Server Action."},{"label":"actions.ts","detail":"'use server': fungsi buatBooking, batalkanBooking."},{"label":"PilihSlot.tsx","detail":"'use client': kalender interaktif."}]},{"label":"api/booking/route.ts","detail":"Route Handler: endpoint HTTP untuk aplikasi mobile/pihak ketiga."}]}}
```

```tsx
// app/page.tsx: Server Component
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Beranda() {
  const layanan = await prisma.layanan.findMany({ orderBy: { nama: "asc" } });
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {layanan.map((l) => (
        <li key={l.id} className="rounded-xl border p-4">
          <h2 className="font-bold">{l.nama}</h2>
          <p>{l.durasiMenit} menit · Rp{l.harga.toLocaleString("id-ID")}</p>
          <Link href={`/booking/baru?layanan=${l.id}`}>Booking</Link>
        </li>
      ))}
    </ul>
  );
}
```

Perhatikan: tidak ada `useEffect`, tidak ada state loading, tidak ada endpoint. Query berjalan di server dan HTML yang sudah berisi data dikirim ke browser.

## Server Actions & Route Handlers

**Server Action** adalah fungsi bertanda `"use server"` yang bisa dipanggil dari form atau komponen; Next.js mengurus request HTTP-nya.

```ts
// app/booking/actions.ts
"use server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

const Input = z.object({ layananId: z.coerce.number(), mulai: z.coerce.date() });

export async function buatBooking(_prev: unknown, formData: FormData) {
  const user = await getUser();
  if (!user) return { error: "Silakan login dulu" };              // Server Action = endpoint publik: SELALU cek auth

  const parsed = Input.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Data tidak valid" };

  const bentrok = await prisma.booking.findFirst({ where: { layananId: parsed.data.layananId, mulai: parsed.data.mulai } });
  if (bentrok) return { error: "Slot sudah terisi, pilih jam lain" };

  await prisma.booking.create({ data: { ...parsed.data, userId: user.id } });
  revalidatePath("/booking");
  redirect("/booking");
}
```

```viz
{"type":"compare","title":"Server Action vs Route Handler","columns":["Server Action","Route Handler"],"rows":[{"label":"Dipanggil dari","values":["Form/komponen di aplikasi Next.js sendiri","Siapa saja lewat HTTP (mobile, webhook, pihak ketiga)"]},{"label":"Bentuk","values":["Fungsi async biasa","GET/POST/... di route.ts"]},{"label":"Cocok untuk","values":["Mutasi dari UI: simpan, hapus, ubah","API publik, webhook pembayaran, file download"]},{"label":"Keamanan","values":["Tetap endpoint publik: validasi & cek auth!","Sama: validasi & cek auth"]}]}
```

:::warning
Server Action terasa seperti fungsi lokal, tetapi sebenarnya dapat dipanggil siapa saja yang tahu ID-nya. Perlakukan persis seperti endpoint API: **validasi input dan periksa otorisasi** di setiap action.
:::

## ORM (Prisma)

Prisma mendefinisikan model di satu file skema, lalu menghasilkan **klien TypeScript yang type-safe** dan **file migrasi SQL**.

```prisma
// prisma/schema.prisma
model User {
  id      Int       @id @default(autoincrement())
  email   String    @unique
  nama    String
  booking Booking[]
}

model Layanan {
  id          Int       @id @default(autoincrement())
  nama        String
  durasiMenit Int
  harga       Int
  booking     Booking[]
}

model Booking {
  id        Int      @id @default(autoincrement())
  mulai     DateTime
  status    String   @default("terjadwal")
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  layanan   Layanan  @relation(fields: [layananId], references: [id])
  layananId Int

  @@unique([layananId, mulai])     // database menolak dua booking di slot yang sama
  @@index([userId])
}
```

```bash
npx prisma migrate dev --name awal     # buat & jalankan migrasi di lokal
npx prisma studio                       # GUI untuk melihat data
```

Perhatikan `@@unique([layananId, mulai])`. Pengecekan `bentrok` di Server Action saja tidak cukup, karena dua request bersamaan bisa lolos keduanya. **Constraint di database** adalah garis pertahanan terakhir terhadap race condition (lihat modul [Database & SQL](/belajar/backend/be-2)).

## Deploy & domain

```viz
{"type":"flow","title":"Dari repo ke domain sendiri","steps":[{"label":"Database terkelola","detail":"Buat PostgreSQL di layanan terkelola (mis. Neon, Supabase, atau VPS sendiri). Salin connection string."},{"label":"Import ke Vercel","detail":"Hubungkan repo GitHub. Setiap push ke main = deploy produksi, setiap PR = preview URL."},{"label":"Environment variable","detail":"Set DATABASE_URL, AUTH_SECRET, dll. di dashboard, terpisah untuk Production dan Preview."},{"label":"Migrasi saat build","detail":"Jalankan prisma migrate deploy sebagai bagian dari proses build/rilis."},{"label":"Domain","detail":"Tambahkan domain (mis. booking-studio.my.id), arahkan DNS (A/CNAME) sesuai instruksi; HTTPS otomatis."},{"label":"Cek","detail":"Uji alur utama di produksi, cek preview link di WhatsApp (metadata OG)."}]}
```

Alternatifnya adalah self-host: `next build` lalu jalankan `next start` di VPS dalam container Docker di belakang Nginx/Caddy (lihat modul [Container & deployment](/belajar/backend/be-5)). Pilihannya soal trade-off: platform terkelola cepat dan minim perawatan, sedangkan VPS lebih murah di skala tertentu dan memberi kontrol penuh.

## Monitoring error

Setelah rilis, error terjadi di perangkat dan kondisi yang tidak pernah kamu uji. Tanpa monitoring, kamu baru tahu ketika pengguna mengeluh, atau lebih buruk, ketika mereka diam-diam berhenti memakai aplikasimu.

Lapisan pemantauan minimal untuk aplikasi fullstack:

- **Error tracking** (mis. Sentry, ada paket gratis): menangkap exception di server dan browser beserta stack trace, versi rilis, browser/OS, dan jejak langkah sebelum error.
- **File `error.tsx`** di App Router: menampilkan UI ramah saat komponen gagal, alih-alih layar putih.
- **Uptime monitor** yang memeriksa halaman utama dan `/api/health`.
- **Log** server yang terstruktur (dashboard platform atau layanan log).

```tsx
// app/booking/error.tsx
"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="rounded-xl border p-6">
      <p className="font-bold">Terjadi kesalahan saat memuat booking.</p>
      <p className="text-sm text-gray-600">Kode: {error.digest}</p>   {/* cocokkan dengan log server */}
      <button onClick={reset} className="mt-3 underline">Coba lagi</button>
    </div>
  );
}
```

:::latihan
Milestone: rilis Booking Jadwal ke produksi dengan domain sendiri. Fitur minimum: login, daftar layanan, booking dengan pencegahan slot bentrok (cek di action + constraint unik), daftar & pembatalan booking milik sendiri, Route Handler `GET /api/booking` untuk klien lain, `error.tsx`, dan error tracking. Minta 3 teman mencoba dan catat error yang tertangkap monitoring.
:::

## Rangkuman

- App Router: Server Components membaca data langsung; Client Components hanya untuk interaksi.
- Server Actions untuk mutasi dari UI sendiri, Route Handlers untuk HTTP publik; keduanya wajib validasi + otorisasi.
- Prisma: skema → klien type-safe + migrasi; constraint database sebagai pertahanan terakhir.
- Deploy: database terkelola, env per lingkungan, migrasi saat rilis, domain + HTTPS.
- Monitoring error, `error.tsx`, dan uptime check sejak hari pertama rilis.
