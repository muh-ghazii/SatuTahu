---
title: Membangun REST API yang benar
minutes: 50
summary: API adalah produk untuk developer lain. API yang baik bisa ditebak, konsisten, aman, terdokumentasi, dan mudah di-debug. Modul ini membahas desain resource, autentikasi, validasi dan format error, testing, OpenAPI, serta logging terstruktur.
objectives:
  - Mendesain URL resource, pagination, dan strategi versioning
  - Membedakan session, JWT, dan OAuth2 serta memakainya dengan aman
  - Memvalidasi input dan mengembalikan error yang konsisten
  - Menulis test API, dokumentasi OpenAPI, dan log terstruktur
sources:
  - repo: microsoft/api-guidelines
    note: Konvensi penamaan resource, error, dan versioning
  - repo: zalando/restful-api-guidelines
    note: Pagination, kompatibilitas, dan format Problem JSON
  - repo: goldbergyoni/nodebestpractices
    note: Struktur proyek, error handling, dan logging di Node.js
  - repo: realworld-apps/realworld
    note: Spesifikasi API Conduit sebagai studi kasus
quiz:
  - q: "URL mana yang paling sesuai prinsip REST untuk mengambil komentar dari artikel 12?"
    options: ["GET /getCommentsByArticle?id=12", "GET /articles/12/comments", "POST /articles/12/getComments", "GET /comment_list_12"]
    answer: 1
    explain: "Gunakan kata benda jamak dan hierarki resource; aksinya diwakili method HTTP, bukan nama di URL."
  - q: "Kelemahan utama JWT stateless dibanding session di server?"
    options: ["Tidak bisa dipakai di mobile", "Sulit dicabut sebelum kedaluwarsa", "Selalu tidak aman", "Tidak bisa berisi user id"]
    answer: 1
    explain: "Server tidak menyimpan JWT, jadi token yang dicuri tetap valid sampai exp. Solusi: masa berlaku pendek + refresh token yang bisa dicabut."
  - q: "Saat terjadi error database tak terduga, response API ke klien sebaiknya…"
    options: ["Mengirim stack trace lengkap agar mudah debug", "500 dengan pesan umum + request id; detail dicatat di log server", "200 dengan body kosong", "Menutup koneksi tanpa respons"]
    answer: 1
    explain: "Stack trace membocorkan detail internal ke penyerang. Kirim pesan umum dan ID yang bisa dicocokkan dengan log."
  - q: "Kenapa log sebaiknya berformat JSON terstruktur, bukan teks bebas?"
    options: ["Lebih indah dibaca", "Bisa dicari dan difilter berdasarkan field (mis. userId, status) oleh sistem log", "Wajib di HTTP", "Lebih kecil ukurannya"]
    answer: 1
    explain: "Sistem seperti Loki/ELK bisa mengkueri log JSON: tampilkan semua error untuk userId 42 dalam 1 jam terakhir."
---

API yang buruk tetap ‘berfungsi’, tetapi setiap developer frontend atau mobile yang memakainya harus menebak-nebak: kenapa error kadang berupa string dan kadang objek? kenapa daftar tidak bisa di-pagination? kenapa tidak ada dokumentasi? Modul ini membahas cara membuat API yang tidak perlu ditebak.

Studi kasus kita: **RealWorld (Conduit)**, clone Medium dengan spesifikasi API terbuka sehingga hasil kerjamu bisa langsung diuji dengan frontend yang sudah ada.

## Desain resource & versioning

REST memodelkan sistem sebagai **resource** (kata benda) yang dimanipulasi dengan method HTTP (kata kerja).

```text
GET    /api/articles?tag=go&limit=20&offset=0   daftar artikel (filter + pagination)
POST   /api/articles                            buat artikel
GET    /api/articles/{slug}                     detail
PUT    /api/articles/{slug}                     ubah
DELETE /api/articles/{slug}                     hapus
GET    /api/articles/{slug}/comments            komentar milik artikel
POST   /api/articles/{slug}/favorite            aksi khusus (sub-resource)
```

Prinsip yang membuat API mudah ditebak:

- **Kata benda jamak**, huruf kecil, `kebab-case` atau tanpa pemisah; tanpa kata kerja di URL.
- **Konsisten** dalam penamaan field (`createdAt` di semua tempat, bukan kadang `created_at`).
- **Pagination** sejak awal. *Offset* (`?limit=20&offset=40`) sederhana; *cursor* (`?after=eyJpZCI6...`) lebih stabil untuk feed yang terus bertambah.
- **Filter & sort** lewat query string: `?status=dibayar&sort=-createdAt`.

**Versioning** dibutuhkan ketika perubahan akan merusak klien lama (*breaking change*: menghapus field, mengubah tipe). Cara paling umum: versi di path (`/api/v1/...`). Perubahan **aditif** (menambah field baru opsional) tidak perlu versi baru, asalkan klien diajari mengabaikan field yang tidak dikenalnya.

## Autentikasi: session, JWT, OAuth2

**Autentikasi** = siapa kamu. **Otorisasi** = boleh melakukan apa. Tiga mekanisme yang paling sering ditemui:

```viz
{"type":"compare","title":"Session vs JWT vs OAuth2","columns":["Session + cookie","JWT (bearer token)","OAuth2 / OIDC"],"rows":[{"label":"Apa itu","values":["Server menyimpan data login; klien memegang session ID di cookie","Token bertanda tangan berisi klaim; server tidak menyimpan apa pun","Protokol delegasi: ‘login dengan Google’, akses API pihak ketiga"]},{"label":"Cabut akses","values":["Mudah: hapus session","Sulit sebelum kedaluwarsa","Lewat penyedia identitas"]},{"label":"Skalabilitas","values":["Butuh penyimpanan session bersama (Redis)","Stateless, mudah diskalakan","Tergantung penyedia"]},{"label":"Cocok untuk","values":["Web app server-rendered","API untuk mobile/SPA, antar layanan","Login sosial, SSO kampus/kantor"]}]}
```

```viz
{"type":"jwt"}
```

Praktik aman untuk JWT: masa berlaku **pendek** (5–15 menit) + **refresh token** yang disimpan di server sehingga bisa dicabut; tanda tangan diverifikasi di setiap request; algoritma dikunci (jangan terima `alg: none`); untuk aplikasi web, simpan token di cookie `HttpOnly; Secure; SameSite` agar tidak bisa dibaca JavaScript.

```viz
{"type":"sequence","title":"OAuth2 Authorization Code + PKCE (‘Login dengan Google’)","caption":"Aplikasimu tidak pernah melihat password Google pengguna, hanya menerima token akses terbatas.","actors":["Pengguna","Aplikasimu","Google"],"messages":[{"from":0,"to":1,"label":"klik ‘Login dengan Google’","note":"Aplikasi membuat code_verifier rahasia dan hash-nya (code_challenge)."},{"from":1,"to":2,"label":"redirect + code_challenge","note":"Pengguna diarahkan ke halaman login & persetujuan milik Google."},{"from":0,"to":2,"label":"login & setuju","note":"Password hanya diketik di domain Google."},{"from":2,"to":1,"label":"redirect + authorization code","note":"Kode sekali pakai dikirim ke callback URL yang terdaftar."},{"from":1,"to":2,"label":"tukar code + code_verifier","note":"Lewat backend. Google mencocokkan verifier dengan challenge, sehingga kode curian tidak berguna."},{"from":2,"to":1,"label":"access token + ID token","note":"ID token (OIDC) berisi identitas pengguna; aplikasimu lalu membuat session sendiri."}]}
```

:::tip
Jangan menulis sistem autentikasi dari nol untuk produksi. Gunakan pustaka yang teruji (Auth.js, Lucia, Passport, Django auth) atau penyedia identitas. Fokuskan energimu pada **otorisasi**: memastikan pengguna hanya bisa mengubah artikel miliknya sendiri.
:::

## Validasi & error handling

**Jangan pernah percaya input.** Validasi di batas sistem (controller) dengan skema, sehingga logika bisnis menerima data yang sudah pasti benar bentuknya.

```ts
import { z } from "zod";

const BuatArtikel = z.object({
  title: z.string().trim().min(5).max(120),
  body: z.string().min(20),
  tagList: z.array(z.string().max(20)).max(5).default([]),
});

app.post("/api/articles", auth, async (req, res, next) => {
  const parsed = BuatArtikel.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      type: "https://satutahu.dev/errors/validasi",
      title: "Data tidak valid",
      status: 422,
      errors: parsed.error.flatten().fieldErrors,   // { title: ["Minimal 5 karakter"] }
    });
  }
  try {
    const artikel = await artikelService.buat(req.user.id, parsed.data);
    res.status(201).location(`/api/articles/${artikel.slug}`).json({ article: artikel });
  } catch (e) {
    next(e);   // diteruskan ke error handler terpusat
  }
});
```

Gunakan **satu format error** di seluruh API, misalnya standar **Problem Details (RFC 9457)**: `type`, `title`, `status`, `detail`, plus field tambahan. Dengan **error handler terpusat**, error yang dikenal (tidak ditemukan, konflik) dipetakan ke 4xx, sedangkan sisanya menjadi 500 dengan pesan umum + `requestId`, tanpa stack trace ke klien.

## Testing API

Test integrasi API memanggil endpoint sungguhan (di memori) dan memeriksa status, body, serta efek ke database:

```ts
import request from "supertest";
import { app } from "../src/app";

describe("POST /api/articles", () => {
  it("menolak tanpa token dengan 401", async () => {
    await request(app).post("/api/articles").send({}).expect(401);
  });

  it("mengembalikan 422 dengan detail field saat judul terlalu pendek", async () => {
    const res = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${tokenUji}`)
      .send({ title: "Hai", body: "x".repeat(30) })
      .expect(422);
    expect(res.body.errors.title).toBeDefined();
  });

  it("membuat artikel dan mengembalikan 201 + Location", async () => {
    const res = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${tokenUji}`)
      .send({ title: "Belajar Go", body: "Isi artikel yang cukup panjang." })
      .expect(201);
    expect(res.headers.location).toMatch(/\/api\/articles\//);
  });
});
```

Jalankan test terhadap database khusus test (mis. container PostgreSQL yang dibuat ulang), dan uji jalur **gagal** sama seriusnya dengan jalur sukses: 401, 403 (mengubah artikel orang lain!), 404, 409, 422.

## Dokumentasi OpenAPI

**OpenAPI** (dulu Swagger) adalah format standar untuk mendeskripsikan API: endpoint, parameter, skema request/response, dan autentikasi. Dari satu file, kamu mendapat halaman dokumentasi interaktif, generator klien SDK, dan validasi kontrak.

```yaml
openapi: 3.1.0
info: { title: Conduit API, version: 1.0.0 }
paths:
  /api/articles/{slug}:
    get:
      summary: Ambil detail artikel
      parameters:
        - { name: slug, in: path, required: true, schema: { type: string } }
      responses:
        "200":
          description: Berhasil
          content:
            application/json:
              schema: { $ref: "#/components/schemas/ArticleResponse" }
        "404": { description: Artikel tidak ditemukan }
```

Di Python, **FastAPI** membuat dokumentasi OpenAPI otomatis dari type hint (buka `/docs`). Di Node.js, skema Zod bisa diubah menjadi OpenAPI dengan pustaka seperti `zod-openapi`, sehingga validasi dan dokumentasi tidak pernah berbeda.

## Logging

Saat produksi bermasalah pukul 2 pagi, log adalah satu-satunya saksi. Log yang berguna itu **terstruktur** (JSON), punya **level**, dan bisa ditelusuri per request.

```ts
import pino from "pino";
const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  const mulai = performance.now();
  res.on("finish", () => {
    log.info({ reqId: req.id, method: req.method, path: req.path, status: res.statusCode, ms: Math.round(performance.now() - mulai) }, "request selesai");
  });
  next();
});
// {"level":30,"reqId":"7f3c…","method":"POST","path":"/api/articles","status":201,"ms":42,"msg":"request selesai"}
```

| Level | Kapan |
|---|---|
| `error` | sesuatu gagal dan butuh perhatian |
| `warn` | aneh tetapi masih tertangani (retry, input mencurigakan) |
| `info` | peristiwa bisnis penting (pesanan dibuat, login) |
| `debug` | detail untuk pengembangan, dimatikan di produksi |

:::warning
Jangan pernah mencatat password, token, nomor kartu, atau data pribadi sensitif. Gunakan fitur *redaction* pustaka log untuk menyamarkan field tersebut secara otomatis.
:::

:::latihan
Milestone: implementasikan backend RealWorld (minimal: register/login JWT, CRUD artikel, komentar, favorit) sesuai spesifikasinya. Lengkapi dengan validasi skema, format error tunggal, 20+ test integrasi (termasuk kasus 401/403/404/422), dokumentasi OpenAPI di `/docs`, dan log JSON dengan request id. Uji dengan frontend RealWorld mana pun.
:::

## Rangkuman

- Resource = kata benda jamak; method = aksi; pagination, filter, dan versioning direncanakan sejak awal.
- Session mudah dicabut; JWT stateless tetapi sulit dicabut (pakai masa berlaku pendek + refresh token); OAuth2/OIDC untuk login pihak ketiga.
- Validasi dengan skema di batas sistem; satu format error (Problem Details); 500 tanpa bocoran internal.
- Test integrasi menguji jalur gagal dan sukses; OpenAPI menjadi kontrak dan dokumentasi.
- Log JSON berlevel dengan request id, tanpa data sensitif.
