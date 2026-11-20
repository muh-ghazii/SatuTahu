---
title: Keamanan aplikasi backend
minutes: 45
summary: Satu celah keamanan bisa menghapus kepercayaan yang dibangun bertahun-tahun. Modul ini membahas keamanan dari sudut pandang orang yang menulis kode server, yaitu daftar risiko OWASP Top 10, cara mencegah injection dan XSS, menyimpan password dengan benar, membatasi request, dan mengelola rahasia.
objectives:
  - Memetakan risiko OWASP Top 10:2025 ke keputusan kode sehari-hari
  - Mencegah SQL injection dan XSS secara sistematis
  - Menyimpan password dengan algoritma hashing yang tepat
  - Menerapkan rate limiting dan pengelolaan secret yang aman
sources:
  - repo: OWASP/CheatSheetSeries
    note: Cheat sheet Password Storage, Injection Prevention, XSS Prevention, dan Secrets Management
  - repo: shieldfy/API-Security-Checklist
    note: Checklist keamanan API yang menjadi kerangka latihan audit
quiz:
  - q: "Pengguna mengganti URL /api/pesanan/1001 menjadi /api/pesanan/1002 dan bisa melihat pesanan orang lain. Kategori OWASP-nya?"
    options: ["Injection", "Broken Access Control", "Cryptographic Failures", "Security Logging Failures"]
    answer: 1
    explain: "Ini IDOR, bagian dari Broken Access Control (A01). Server wajib memeriksa bahwa pesanan milik pengguna yang login."
  - q: "Algoritma mana yang TEPAT untuk menyimpan password?"
    options: ["MD5", "SHA-256 tanpa salt", "Argon2id atau bcrypt", "Enkripsi AES dengan kunci di kode"]
    answer: 2
    explain: "Argon2id/bcrypt sengaja lambat dan memakai salt sehingga brute force menjadi sangat mahal. Hash cepat seperti MD5/SHA-256 bisa dicoba miliaran kali per detik."
  - q: "Endpoint login sering dicoba ribuan kali per menit dari satu IP. Kontrol paling langsung?"
    options: ["Memperbesar server", "Rate limiting + penundaan bertahap atau CAPTCHA setelah beberapa kegagalan", "Mematikan login", "Mengganti JSON ke XML"]
    answer: 1
    explain: "Rate limiting membatasi brute force dan credential stuffing. Kombinasikan dengan MFA dan pemantauan."
  - q: "API key layanan pembayaran tidak sengaja ter-push ke repo publik. Langkah PERTAMA?"
    options: ["Hapus file lalu commit lagi", "Segera rotasi/cabut key tersebut di penyedia layanan", "Jadikan repo private", "Tunggu dan lihat"]
    answer: 1
    explain: "Bot memindai GitHub dalam hitungan menit. Anggap key sudah bocor: cabut dulu, baru bersihkan riwayat dan selidiki penyalahgunaan."
---

Keamanan bukan fitur yang ditambahkan menjelang rilis, melainkan kebiasaan di setiap baris kode. Kabar baiknya, sebagian besar kebocoran data tidak disebabkan teknik canggih, tetapi kesalahan yang sama yang terus berulang. Jika kamu menguasai pola-pola di modul ini, aplikasimu sudah lebih aman daripada kebanyakan aplikasi di luar sana.

:::warning[Etika]
Semua contoh serangan di modul ini untuk memahami cara bertahan. Menguji sistem milik orang lain tanpa izin tertulis adalah pelanggaran hukum (di Indonesia diatur antara lain dalam UU ITE).
:::

## OWASP Top 10

**OWASP Top 10** adalah dokumen kesadaran yang merangkum risiko keamanan aplikasi web paling kritis berdasarkan data pengujian dan survei komunitas. Edisi terbarunya adalah **OWASP Top 10:2025**. Dibanding edisi 2021, ada dua kategori baru (Software Supply Chain Failures dan Mishandling of Exceptional Conditions), sedangkan SSRF digabung ke Broken Access Control.

```viz
{"type":"layers","title":"OWASP Top 10:2025 dari sudut pandang backend developer","caption":"Klik setiap kategori untuk melihat contoh konkret dan kebiasaan kode yang mencegahnya.","layers":[{"label":"A01 Broken Access Control","tag":"#1","detail":"Pengguna bisa mengakses data/aksi yang bukan haknya (IDOR, admin endpoint tanpa cek peran, SSRF). Cegah: deny by default; cek kepemilikan resource di setiap endpoint, bukan hanya ‘sudah login’."},{"label":"A02 Security Misconfiguration","tag":"#2","detail":"Debug mode aktif di produksi, password default, CORS *, bucket storage publik, header keamanan hilang. Cegah: konfigurasi sebagai kode, review, scan otomatis."},{"label":"A03 Software Supply Chain Failures","tag":"baru","detail":"Paket npm/pip berbahaya atau rentan, pipeline CI yang bisa dibajak. Cegah: lock file, npm audit/Dependabot, sedikit dependency, verifikasi asal paket."},{"label":"A04 Cryptographic Failures","tag":"#4","detail":"Data sensitif tanpa enkripsi, HTTP tanpa TLS, hash password lemah, algoritma usang. Cegah: TLS di mana pun, Argon2id/bcrypt, pustaka kripto standar."},{"label":"A05 Injection","tag":"#5","detail":"SQL/NoSQL/command injection, XSS. Cegah: parameterized query, escaping output, validasi input."},{"label":"A06 Insecure Design","tag":"#6","detail":"Celah di level desain, mis. reset password lewat pertanyaan rahasia yang mudah ditebak. Cegah: threat modeling sejak desain."},{"label":"A07 Authentication Failures","tag":"#7","detail":"Brute force tanpa batas, session tidak kedaluwarsa, tanpa MFA. Cegah: pustaka auth teruji, rate limit, MFA."},{"label":"A08 Software or Data Integrity Failures","tag":"#8","detail":"Update atau data yang tidak diverifikasi integritasnya, deserialisasi tidak aman. Cegah: tanda tangan digital, validasi skema."},{"label":"A09 Security Logging & Alerting Failures","tag":"#9","detail":"Serangan berlangsung berbulan-bulan tanpa ketahuan. Cegah: log peristiwa keamanan (login gagal, akses ditolak) + alert."},{"label":"A10 Mishandling of Exceptional Conditions","tag":"baru","detail":"Error yang ditangani salah: fail-open (cek gagal → akses diberikan), bocoran stack trace. Cegah: fail-closed, error handler terpusat."}]}
```

Kategori nomor satu, **Broken Access Control**, paling sering dilupakan di kode CRUD biasa:

```ts
// ❌ hanya cek ‘sudah login’
app.get("/api/pesanan/:id", auth, async (req, res) => {
  res.json(await db.pesanan.findUnique({ where: { id: +req.params.id } }));
});

// ✅ cek kepemilikan: query dibatasi milik pengguna yang login
app.get("/api/pesanan/:id", auth, async (req, res) => {
  const p = await db.pesanan.findFirst({ where: { id: +req.params.id, pelangganId: req.user.id } });
  if (!p) return res.sendStatus(404);   // 404, bukan 403: jangan bocorkan bahwa id itu ada
  res.json(p);
});
```

## SQL injection & XSS

**Injection** terjadi ketika data dari pengguna dicampur dengan kode (SQL, HTML, perintah shell) sehingga data itu ikut dieksekusi sebagai kode.

```viz
{"type":"sqli"}
```

Pencegahan SQL injection bersifat mutlak: **selalu parameterized query** (placeholder `?`/`$1`) atau ORM/query builder yang melakukannya untukmu. Hati-hati dengan bagian query yang tidak bisa diparameterkan, seperti nama kolom untuk `ORDER BY`: gunakan *allowlist* (`["harga", "nama"].includes(sort)`).

**XSS** (*Cross-Site Scripting*) adalah injection ke HTML. Jika komentar pengguna ditampilkan apa adanya, skrip penyerang berjalan di browser pengunjung lain.

```viz
{"type":"xss"}
```

Lapisan pertahanan terhadap XSS:

1. **Escape output** sesuai konteks (HTML, atribut, URL, JavaScript). Template engine dan React melakukannya otomatis. Hindari `dangerouslySetInnerHTML`/`innerHTML` dengan data pengguna.
2. Jika memang harus menerima HTML (mis. editor artikel), **sanitasi** dengan pustaka seperti DOMPurify, jangan dengan regex buatan sendiri.
3. **Content-Security-Policy** header membatasi sumber skrip yang boleh berjalan, sehingga satu celah tidak langsung fatal.
4. Cookie session dengan `HttpOnly` agar tidak bisa dibaca JavaScript.

## Hashing password

Password **tidak pernah** disimpan dalam bentuk asli, dan **tidak dienkripsi** (enkripsi bisa dibalik jika kuncinya bocor). Password di-**hash** dengan fungsi satu arah. Tetapi tidak sembarang hash:

```viz
{"type":"hash"}
```

Hash umum seperti SHA-256 dirancang **cepat**. GPU modern bisa mencoba miliaran tebakan per detik terhadap hash yang bocor. Untuk password dibutuhkan fungsi yang **sengaja lambat dan haus memori**, dengan **salt** acak unik per pengguna agar dua password sama menghasilkan hash berbeda dan *rainbow table* tidak berguna.

```ts
import argon2 from "argon2";

// saat registrasi
const hash = await argon2.hash(password, { type: argon2.argon2id });
// simpan ‘hash’ (sudah berisi salt & parameter), mis. $argon2id$v=19$m=65536,t=3,p=4$...

// saat login
const cocok = await argon2.verify(user.passwordHash, passwordInput);
```

| Algoritma | Status untuk password |
|---|---|
| MD5, SHA-1, SHA-256 polos | ❌ terlalu cepat |
| bcrypt | ✅ masih layak (perhatikan batas 72 byte input) |
| scrypt | ✅ layak |
| **Argon2id** | ✅ rekomendasi utama OWASP |

Ingat juga sisi pengguna: izinkan password panjang (frasa), periksa terhadap daftar password yang pernah bocor, dan tawarkan MFA.

```viz
{"type":"entropy"}
```

## Rate limiting

Tanpa batas, satu klien bisa mencoba ribuan password per menit, menguras kuota API berbayar, atau membuat server kewalahan. **Rate limiting** membatasi jumlah request per identitas (IP, user id, API key) dalam jendela waktu.

```viz
{"type":"flow","title":"Algoritma token bucket","caption":"Token bucket mengizinkan lonjakan singkat (burst) sambil tetap membatasi rata-rata. Ini algoritma yang dipakai banyak API gateway.","loop":true,"steps":[{"label":"Ember berisi token","detail":"Setiap klien punya ember berkapasitas mis. 10 token."},{"label":"Isi ulang","detail":"Token bertambah dengan laju tetap, mis. 1 token per detik, sampai penuh."},{"label":"Request datang","detail":"Setiap request mengambil 1 token."},{"label":"Token habis?","detail":"Jika kosong: tolak dengan 429 Too Many Requests + header Retry-After."}]}
```

```ts
import rateLimit from "express-rate-limit";

app.use("/api/", rateLimit({ windowMs: 60_000, limit: 100 }));          // umum
app.use("/api/login", rateLimit({ windowMs: 15 * 60_000, limit: 10 })); // ketat untuk login
```

Jika aplikasimu berjalan di beberapa server, simpan hitungan di penyimpanan bersama seperti **Redis**, karena hitungan di memori tiap server tidak saling tahu. Untuk login, kombinasikan dengan penundaan bertahap per akun dan notifikasi login mencurigakan.

## Manajemen secret

**Secret** adalah apa pun yang memberi akses: password database, API key, kunci JWT, kredensial cloud. Prinsipnya:

- **Tidak pernah** di kode atau di repo. Baca dari *environment variable* (`process.env.DATABASE_URL`). Untuk pengembangan lokal, file `.env` masuk `.gitignore`.
- Di produksi, gunakan **secret manager** (GitHub Actions Secrets, AWS Secrets Manager, Vault, Doppler) yang memberi kontrol akses, audit log, dan rotasi.
- **Least privilege**: user database untuk aplikasi tidak perlu hak `DROP TABLE`.
- **Rotasi** berkala, dan **segera** saat ada dugaan bocor.
- Pasang pemindai rahasia (GitHub secret scanning, gitleaks) sebagai pre-commit atau di CI.

```ts
// config.ts: gagal cepat jika konfigurasi wajib tidak ada
import { z } from "zod";
export const env = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]),
}).parse(process.env);
```

:::latihan
Milestone: audit keamanan backend RealWorld-mu memakai **API Security Checklist**. Untuk setiap temuan tulis: deskripsi, langkah reproduksi, dampak, perbaikan, dan bukti setelah diperbaiki. Minimal periksa: IDOR di semua endpoint `/:id`, password hashing, rate limit login, header keamanan (pakai `helmet`), CORS, dan apakah ada secret di riwayat Git (jalankan gitleaks).
:::

## Rangkuman

- OWASP Top 10:2025: Broken Access Control tetap nomor satu, dan selalu cek kepemilikan resource.
- Injection dicegah dengan parameterized query; XSS dengan escaping output, sanitasi, CSP, dan cookie HttpOnly.
- Password: Argon2id/bcrypt dengan salt, bukan hash cepat atau enkripsi.
- Rate limiting (token bucket, simpan di Redis) melindungi login dan sumber daya.
- Secret di environment/secret manager, least privilege, rotasi, dan pemindaian otomatis.
