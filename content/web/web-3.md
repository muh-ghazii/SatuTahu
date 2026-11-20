---
title: Backend dengan Node.js & database
minutes: 45
summary: Saatnya mengganti server palsu dengan backend sungguhan. Modul ini membangun API Buku Kontak dengan Node.js, mulai dari memilih Express atau NestJS, menyusun route dan middleware, menyimpan data di PostgreSQL atau MongoDB, menambahkan login, sampai menulis test.
objectives:
  - Membuat REST API dengan Express dan memahami posisi NestJS
  - Memakai middleware untuk parsing, CORS, logging, dan error handling
  - Menghubungkan API ke PostgreSQL (atau MongoDB) dengan aman
  - Menambahkan autentikasi dan menulis test integrasi
sources:
  - repo: fullstack-hy2020/fullstack-hy2020.github.io
    note: Alur bagian 3–5 Full Stack Open (Node.js, database, testing, autentikasi)
  - repo: nestjs/nest
    note: Konsep module, controller, dan provider di NestJS
  - repo: goldbergyoni/nodebestpractices
    note: Struktur proyek, error handling, dan keamanan Node.js
quiz:
  - q: "Urutan middleware di Express penting karena…"
    options: ["Express mengurutkannya otomatis", "Middleware dijalankan berurutan sesuai pendaftaran; error handler harus didaftarkan terakhir", "Hanya middleware pertama yang dijalankan", "Tidak penting"]
    answer: 1
    explain: "Request mengalir melewati middleware sesuai urutan app.use. Error handler (4 parameter) diletakkan setelah semua route."
  - q: "Frontend di localhost:5173 memanggil API di localhost:3000 dan diblokir browser. Yang perlu ditambahkan di API?"
    options: ["Middleware CORS yang mengizinkan origin frontend", "Mengubah port frontend", "Menghapus JSON", "Memakai MongoDB"]
    answer: 0
    explain: "Beda port = beda origin. API harus mengirim header Access-Control-Allow-Origin untuk origin tersebut."
  - q: "Kapan MongoDB lebih cocok daripada PostgreSQL?"
    options: ["Selalu, karena lebih modern", "Saat data berbentuk dokumen dengan struktur bervariasi dan jarang perlu join/transaksi lintas koleksi", "Untuk data keuangan", "Saat butuh banyak relasi"]
    answer: 1
    explain: "Untuk data relasional seperti pengguna–pesanan–produk, PostgreSQL biasanya pilihan yang lebih aman."
  - q: "Dalam test integrasi API, database sebaiknya…"
    options: ["Database produksi", "Database khusus test yang dikosongkan sebelum tiap test/suite", "Tidak dipakai sama sekali", "File Excel"]
    answer: 1
    explain: "Test harus terisolasi dan dapat diulang. Jangan pernah menyentuh data produksi."
---

Di modul sebelumnya frontend berbicara dengan `json-server`. Sekarang kita membangun pengganti sungguhan dengan aturan bisnis, validasi, database, dan login, **tanpa mengubah kontrak API**, sehingga frontend cukup diganti alamat API-nya. Konsep-konsep di sini dibahas lebih dalam di jalur [Backend](/belajar/backend/be-3); fokus modul ini adalah menyatukannya dalam satu proyek.

## Express / NestJS

**Express** adalah framework Node.js yang minimalis: kamu menentukan sendiri struktur proyeknya. **NestJS** adalah framework yang beropini (mirip Angular/Spring): menyediakan struktur module–controller–service, dependency injection, dan validasi bawaan.

```viz
{"type":"compare","title":"Express vs NestJS","columns":["Express","NestJS"],"rows":[{"label":"Filosofi","values":["Minimal, bebas menyusun","Terstruktur, banyak konvensi"]},{"label":"Kurva belajar","values":["Landai, cocok untuk memahami dasar","Lebih curam (decorator, DI, module)"]},{"label":"Struktur proyek","values":["Kamu yang menentukan","Ditentukan framework, konsisten antar tim"]},{"label":"Cocok untuk","values":["Belajar, API kecil–menengah","Tim besar, aplikasi enterprise"]}]}
```

Kita mulai dengan Express agar setiap bagian terlihat jelas:

```bash
mkdir api-kontak && cd api-kontak
npm init -y
npm install express cors pg zod
npm install -D typescript tsx @types/express @types/cors @types/pg vitest supertest @types/supertest
```

```ts
// src/app.ts: aplikasi dipisah dari server.listen agar mudah dites
import express from "express";
import cors from "cors";
import { kontakRouter } from "./routes/kontak";
import { errorHandler } from "./middleware/error";

export const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/kontak", kontakRouter);
app.use(errorHandler);                         // terakhir!

// src/server.ts
import { app } from "./app";
app.listen(3001, () => console.log("API di http://localhost:3001"));
```

## REST & middleware

**Middleware** adalah fungsi `(req, res, next)` yang dijalankan berurutan untuk setiap request. Setiap middleware bisa membaca/mengubah request, menghentikan dengan respons, atau meneruskan ke berikutnya.

```viz
{"type":"flow","title":"Request melewati pipeline middleware","caption":"Jika satu middleware merespons (mis. 401), middleware sesudahnya tidak dijalankan. Error yang dilempar diteruskan langsung ke error handler.","steps":[{"label":"cors()","detail":"Menambahkan header CORS; menjawab preflight OPTIONS."},{"label":"express.json()","detail":"Mengubah body JSON menjadi req.body."},{"label":"logger","detail":"Mencatat method, path, status, dan durasi."},{"label":"auth","detail":"Memeriksa token/session; mengisi req.user atau mengembalikan 401."},{"label":"route handler","detail":"Validasi input → service → respons."},{"label":"errorHandler","detail":"Menangkap semua error: 4xx untuk error yang dikenal, 500 + log untuk sisanya."}]}
```

```ts
// src/routes/kontak.ts
import { Router } from "express";
import { z } from "zod";
import * as repo from "../repositories/kontak";

const KontakInput = z.object({
  nama: z.string().trim().min(2),
  telp: z.string().regex(/^(\+62|0)8\d{7,12}$/, "Nomor HP tidak valid"),
});

export const kontakRouter = Router();

kontakRouter.get("/", async (_req, res) => res.json(await repo.semua()));

kontakRouter.post("/", async (req, res) => {
  const data = KontakInput.parse(req.body);          // ZodError → ditangkap errorHandler
  res.status(201).json(await repo.buat(data));
});

kontakRouter.delete("/:id", async (req, res) => {
  const ok = await repo.hapus(Number(req.params.id));
  res.sendStatus(ok ? 204 : 404);
});
```

```ts
// src/middleware/error.ts
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) return res.status(422).json({ title: "Data tidak valid", errors: err.flatten().fieldErrors });
  console.error(err);
  res.status(500).json({ title: "Terjadi kesalahan di server" });
};
```

:::info
Sejak Express 5, error dari handler `async` otomatis diteruskan ke error handler. Di Express 4 kamu perlu membungkusnya (`try/catch` + `next(err)`) atau memakai pustaka seperti `express-async-errors`.
:::

## PostgreSQL / MongoDB

Untuk data kontak (dan kelak pengguna pemilik kontak), model relasional cocok. Repository adalah satu-satunya tempat query ditulis:

```ts
// src/repositories/kontak.ts
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function semua() {
  const { rows } = await pool.query("SELECT id, nama, telp FROM kontak ORDER BY nama");
  return rows;
}

export async function buat(d: { nama: string; telp: string }) {
  const { rows } = await pool.query(
    "INSERT INTO kontak (nama, telp) VALUES ($1, $2) RETURNING id, nama, telp",   // parameterized!
    [d.nama, d.telp],
  );
  return rows[0];
}

export async function hapus(id: number) {
  const r = await pool.query("DELETE FROM kontak WHERE id = $1", [id]);
  return r.rowCount === 1;
}
```

```viz
{"type":"compare","title":"PostgreSQL vs MongoDB untuk aplikasi web","columns":["PostgreSQL","MongoDB"],"rows":[{"label":"Model","values":["Tabel + relasi + skema tegas","Koleksi dokumen JSON, skema fleksibel"]},{"label":"Relasi & JOIN","values":["Kuat","Terbatas ($lookup); biasanya data di-embed"]},{"label":"Transaksi","values":["ACID penuh","Ada (multi-dokumen), tetapi bukan pola utamanya"]},{"label":"Data semi-terstruktur","values":["Kolom JSONB","Alami"]},{"label":"Rekomendasi","values":["Default untuk data bisnis","Konten dengan struktur bervariasi, prototipe cepat"]}]}
```

Untuk pemahaman SQL, index, dan transaksi yang lebih dalam, lihat modul [Database & SQL untuk backend](/belajar/backend/be-2).

## Auth (JWT/session)

Sekarang kontak harus milik pengguna tertentu. Alur minimal: **register** (hash password dengan Argon2/bcrypt), **login** (verifikasi lalu terbitkan token atau session), dan **middleware auth** yang melindungi route.

```viz
{"type":"sequence","title":"Login dengan session cookie","caption":"Untuk aplikasi web yang frontend dan API-nya satu domain, session + cookie HttpOnly adalah pilihan yang sederhana dan aman.","actors":["Browser","API","Database"],"messages":[{"from":0,"to":1,"label":"POST /login {email, password}","note":"Selalu lewat HTTPS."},{"from":1,"to":2,"label":"ambil user + hash","note":"Bandingkan dengan argon2.verify; balas pesan umum ‘email atau password salah’."},{"from":1,"to":2,"label":"simpan session","note":"Session ID acak disimpan di tabel/Redis beserta user_id dan waktu kedaluwarsa."},{"from":1,"to":0,"label":"Set-Cookie: sid=…; HttpOnly; Secure; SameSite=Lax","note":"JavaScript tidak bisa membaca cookie ini, sehingga aman dari pencurian lewat XSS."},{"from":0,"to":1,"label":"GET /kontak (cookie otomatis terkirim)","note":"Middleware auth mencari session, lalu mengisi req.user."},{"from":1,"to":0,"label":"200 kontak milik user","note":"Query selalu WHERE pemilik_id = req.user.id."}]}
```

```ts
export const auth: RequestHandler = async (req, res, next) => {
  const sid = req.cookies?.sid;
  const sesi = sid && (await repoSesi.cari(sid));
  if (!sesi || sesi.kedaluwarsa < new Date()) return res.sendStatus(401);
  req.user = { id: sesi.userId };
  next();
};

kontakRouter.use(auth);   // semua route kontak kini wajib login
```

Jika frontend dan API berbeda domain (mis. aplikasi mobile), JWT bearer token lebih praktis. Perbandingan lengkap ada di modul [REST API](/belajar/backend/be-3).

## Testing backend

Karena `app` dipisah dari `listen`, kita bisa mengujinya langsung dengan **Supertest**:

```ts
// tests/kontak.test.ts
import request from "supertest";
import { beforeEach, describe, it, expect } from "vitest";
import { app } from "../src/app";
import { resetDb, loginSebagai } from "./helpers";

describe("API kontak", () => {
  beforeEach(resetDb);                                   // database test bersih tiap test

  it("401 tanpa login", async () => {
    await request(app).get("/kontak").expect(401);
  });

  it("menolak nomor tidak valid dengan 422", async () => {
    const cookie = await loginSebagai("ayu@contoh.id");
    const r = await request(app).post("/kontak").set("Cookie", cookie).send({ nama: "Bima", telp: "123" }).expect(422);
    expect(r.body.errors.telp).toBeDefined();
  });

  it("tidak bisa menghapus kontak milik orang lain", async () => {
    const kontakBima = await buatKontakUntuk("bima@contoh.id");
    const cookieAyu = await loginSebagai("ayu@contoh.id");
    await request(app).delete(`/kontak/${kontakBima.id}`).set("Cookie", cookieAyu).expect(404);
  });
});
```

Test terakhir itulah yang paling sering terlupa, dan paling sering menjadi celah keamanan di dunia nyata (IDOR).

:::latihan
Milestone: blog fullstack. Gunakan pola modul ini untuk API artikel: register/login, CRUD artikel milik sendiri, komentar oleh pengguna login, test integrasi (termasuk 401, 403/404 untuk milik orang lain, 422). Sambungkan frontend React dari modul sebelumnya dengan mengganti `VITE_API_URL`.
:::

## Rangkuman

- Express untuk memahami dasar, NestJS untuk struktur tim besar; pisahkan `app` dari `listen`.
- Middleware berurutan: CORS → parser → logger → auth → handler → error handler.
- Repository berisi query parameterized; PostgreSQL sebagai default data bisnis.
- Session cookie HttpOnly untuk web satu domain, JWT untuk klien lintas domain; selalu batasi query ke pemilik data.
- Test integrasi dengan database terisolasi, termasuk skenario akses data orang lain.
