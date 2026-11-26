---
title: Keamanan aplikasi web (OWASP)
minutes: 60
summary: Aplikasi web adalah pintu masuk paling umum bagi penyerang. Modul ini membahas OWASP Top 10 edisi 2025, SQL injection, Cross-Site Scripting, broken access control dan IDOR, serta CSRF dan keamanan session, lengkap dengan cara kerja serangan dan pertahanannya di kode.
objectives:
  - Menjelaskan kategori OWASP Top 10:2025 dan cara memakainya
  - Mencegah SQL injection dengan parameterized query
  - Mencegah XSS dengan output encoding, sanitasi, dan Content Security Policy
  - Menerapkan access control di server untuk mencegah IDOR
  - Mengamankan session dan mencegah CSRF
sources:
  - repo: OWASP/Top10
    note: OWASP Top 10 — risiko keamanan aplikasi web paling kritis
  - repo: OWASP/wstg
    note: Web Security Testing Guide
  - repo: OWASP/ASVS
    note: Application Security Verification Standard
  - repo: swisskyrepo/PayloadsAllTheThings
    note: Referensi pola serangan & bypass untuk memahami mekanisme kerentanan web
  - repo: paragonie/awesome-appsec
    note: Kumpulan sumber keamanan aplikasi
quiz:
  - q: "Pertahanan utama terhadap SQL injection adalah…"
    options: ["Menghapus tanda kutip dari input", "Parameterized query / prepared statement", "Menyembunyikan pesan error saja", "Memakai HTTPS"]
    answer: 1
    explain: "Data dikirim terpisah dari struktur query sehingga tidak bisa mengubah perintah SQL."
  - q: "Stored XSS terjadi ketika…"
    options: ["Server crash", "Input berbahaya disimpan (mis. komentar) lalu ditampilkan ke pengguna lain tanpa encoding sehingga skrip berjalan di browser mereka", "Database bocor", "Password lemah"]
    answer: 1
    explain: "Encode output sesuai konteks dan terapkan CSP."
  - q: "GET /api/pesanan/1043 mengembalikan pesanan milik orang lain saat ID diganti. Perbaikannya…"
    options: ["Memakai ID acak saja", "Memeriksa di server bahwa pesanan itu milik pengguna yang login (atau ia berhak), untuk setiap permintaan", "Menyembunyikan ID dari URL", "Menambah captcha"]
    answer: 1
    explain: "UUID mempersulit tebakan tetapi bukan otorisasi."
  - q: "Atribut cookie SameSite=Lax membantu mencegah…"
    options: ["SQL injection", "CSRF pada sebagian besar permintaan lintas situs", "Brute force", "DDoS"]
    answer: 1
    explain: "Browser tidak mengirim cookie pada permintaan POST lintas situs; tetap gunakan token CSRF untuk lapisan tambahan."
---

Sebagian besar pembobolan aplikasi tidak memakai teknik canggih, melainkan kesalahan klasik yang sudah dikenal puluhan tahun: input yang dipercaya begitu saja dan pemeriksaan hak akses yang terlupa. **OWASP** (Open Worldwide Application Security Project) menyediakan daftar, panduan pengujian, dan standar verifikasi yang menjadi rujukan industri.

:::warning
Praktikkan semua teknik di modul ini hanya di lab milikmu sendiri atau aplikasi latihan yang memang dirancang rentan (OWASP Juice Shop, DVWA) — lihat [Pengujian penetrasi etis](/belajar/cyber-security/cs-5).
:::

## OWASP Top 10

**OWASP Top 10** adalah dokumen kesadaran tentang kategori risiko keamanan aplikasi web yang paling kritis, disusun dari data pengujian dan survei komunitas. Edisi **2025**:

```viz
{"type":"compare","columns":["Kode","Kategori","Inti masalah"],"rows":[{"label":"A01","values":["Broken Access Control","Pengguna bisa melakukan/melihat yang bukan haknya (termasuk IDOR, SSRF)"]},{"label":"A02","values":["Security Misconfiguration","Default tidak aman, debug aktif, header hilang, bucket publik"]},{"label":"A03","values":["Software Supply Chain Failures","Dependensi rentan/berbahaya, build & distribusi yang tidak aman"]},{"label":"A04","values":["Cryptographic Failures","Data sensitif tanpa enkripsi, algoritme lemah"]},{"label":"A05","values":["Injection","SQL, command, XSS — data dieksekusi sebagai kode"]},{"label":"A06","values":["Insecure Design","Kelemahan sejak desain; tidak ada threat modeling"]},{"label":"A07","values":["Authentication Failures","Brute force, tanpa MFA, sesi tidak dikelola"]},{"label":"A08","values":["Software or Data Integrity Failures","Update/data tanpa verifikasi integritas, deserialisasi tidak aman"]},{"label":"A09","values":["Logging & Alerting Failures","Serangan tidak tercatat atau tidak memicu respons"]},{"label":"A10","values":["Mishandling of Exceptional Conditions","Error ditangani salah: fail open, bocor info, state tak konsisten"]}]}
```

Top 10 adalah titik awal kesadaran, **bukan** standar lengkap. Untuk persyaratan yang dapat diuji, gunakan **OWASP ASVS**; untuk metodologi pengujian, **OWASP WSTG**; untuk panduan implementasi, **OWASP Cheat Sheet Series**.

## Injection (SQL injection)

**Injection** terjadi saat data dari pengguna disisipkan ke dalam perintah (SQL, shell, LDAP) sehingga dapat mengubah struktur perintah itu. Coba masukkan input berbahaya pada simulasi berikut:

```viz
{"type":"sqli"}
```

```python
# RENTAN: input digabung ke string SQL
q = f"SELECT * FROM users WHERE email = '{email}' AND password_hash = '{h}'"
# email = "admin@x.id' --"  → sisa query menjadi komentar, cek password terlewati

# AMAN: parameterized query — data dikirim terpisah dari struktur query
cur.execute("SELECT * FROM users WHERE email = %s", (email,))

# ORM juga aman selama tidak memakai raw SQL dengan f-string
User.objects.filter(email=email)
```

Prinsip yang sama berlaku untuk **command injection**: jangan memanggil shell dengan string gabungan (`os.system(f"convert {nama_file} ...")`); gunakan `subprocess.run([...])` dengan daftar argumen dan validasi input dengan **allowlist**. Lapisan tambahan: akun database dengan hak minimum, dan pesan error yang tidak membocorkan detail query.

## Cross-Site Scripting (XSS)

**XSS** terjadi saat input pengguna ditampilkan di halaman tanpa encoding sehingga browser korban menjalankannya sebagai JavaScript. Penyerang dapat mencuri sesi, mengubah tampilan, atau bertindak atas nama korban.

```viz
{"type":"xss"}
```

```viz
{"type":"compare","columns":["Jenis","Cara","Contoh"],"rows":[{"label":"Reflected","values":["Payload di URL dipantulkan langsung ke halaman","/cari?q=<script>…</script>"]},{"label":"Stored","values":["Payload disimpan lalu ditampilkan ke banyak pengguna","Komentar, nama profil, ulasan produk"]},{"label":"DOM-based","values":["JavaScript klien memasukkan data ke DOM secara tidak aman","element.innerHTML = location.hash"]}]}
```

Pertahanan:

- **Output encoding sesuai konteks** (HTML, atribut, JavaScript, URL). Framework modern (React, Vue, template Jinja2/Django dengan autoescape) melakukannya secara default — bahaya muncul saat kamu melewatinya (`dangerouslySetInnerHTML`, `v-html`, `|safe`, `innerHTML`).
- Jika memang harus menerima HTML (editor teks kaya), **sanitasi** dengan pustaka seperti DOMPurify.
- **Content Security Policy (CSP)** sebagai lapisan kedua: batasi sumber skrip sehingga skrip sisipan tidak berjalan.
- Cookie sesi dengan **HttpOnly** agar tidak dapat dibaca JavaScript.

```text
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-r4nd0m'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'
```

## Broken access control & IDOR

**Broken access control** adalah kategori nomor satu. Bentuk yang paling sering ditemukan adalah **IDOR** (*Insecure Direct Object Reference*): aplikasi memakai ID dari pengguna untuk mengambil objek tanpa memeriksa kepemilikan.

```python
# RENTAN: siapa pun yang login bisa membaca pesanan siapa pun
@app.get("/api/pesanan/{pesanan_id}")
def detail(pesanan_id: int, user=Depends(user_login)):
    return db.get(Pesanan, pesanan_id)

# AMAN: kepemilikan diperiksa di server
@app.get("/api/pesanan/{pesanan_id}")
def detail(pesanan_id: int, user=Depends(user_login)):
    p = db.get(Pesanan, pesanan_id)
    if p is None or (p.pelanggan_id != user.id and not user.is_admin):
        raise HTTPException(404)          # 404 agar tidak membocorkan keberadaan objek
    return p
```

Bentuk lain: endpoint admin tanpa pemeriksaan role, mengubah field `role` atau `harga` lewat *mass assignment*, menaikkan hak dengan memanipulasi token, dan **SSRF** (server dipaksa mengambil URL internal). Prinsip pencegahan:

- **Tolak secara default**; setiap endpoint menyatakan siapa yang boleh mengaksesnya.
- Pusatkan logika otorisasi (middleware/kebijakan), jangan disebar di banyak tempat.
- Batasi field yang boleh diubah pengguna (skema input eksplisit).
- **Uji otomatis**: test yang memastikan pengguna A tidak bisa mengakses data pengguna B.

## CSRF & keamanan session

**CSRF** (*Cross-Site Request Forgery*): situs jahat membuat browser korban mengirim permintaan ke aplikasi tempat korban sedang login, dan browser ikut menyertakan cookie sesi korban.

```viz
{"type":"sequence","actors":["Korban","Situs jahat","toko.contoh.id"],"messages":[{"from":"Korban","to":"toko.contoh.id","label":"login (cookie sesi tersimpan)"},{"from":"Korban","to":"Situs jahat","label":"membuka tautan"},{"from":"Situs jahat","to":"Korban","label":"form tersembunyi auto-submit"},{"from":"Korban","to":"toko.contoh.id","label":"POST /ubah-email + cookie korban","note":"tanpa perlindungan → berhasil"}]}
```

Pertahanan CSRF: cookie **SameSite=Lax/Strict**, **token CSRF** pada form dan permintaan yang mengubah data, memeriksa header **Origin/Referer**, dan tidak pernah mengubah data lewat GET.

Keamanan session secara umum:

```text
Set-Cookie: sid=9f8a…; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600
```

- ID sesi acak dan panjang; **buat ulang setelah login** (mencegah session fixation).
- **Kedaluwarsa** saat idle dan absolut; logout benar-benar menghapus sesi di server.
- Batasi percobaan login (rate limit, lockout bertahap), dukung **MFA**, dan beri notifikasi login baru.
- Untuk token (JWT), simpan masa berlaku pendek, verifikasi tanda tangan dan algoritme, dan siapkan mekanisme pencabutan.

Implementasi lengkap di sisi server dibahas di [Keamanan aplikasi backend](/belajar/backend/be-4).

:::kasus[Kenapa UUID saja tidak menyelesaikan IDOR]
Sebuah aplikasi tagihan mengganti `/api/invoice/1042` menjadi `/api/invoice/f47ac10b-58cc-...` dengan harapan tidak bisa ditebak. Namun URL tersebut tetap bisa bocor lewat riwayat browser, log server, header Referer, atau tautan yang dibagikan. Tanpa pemeriksaan `invoice.owner_id == current_user.id` di server, siapa pun yang memiliki UUID itu tetap bisa membukanya. Obfuskasi ≠ otorisasi!
:::

:::latihan
Milestone: jalankan OWASP Juice Shop secara lokal (Docker). Selesaikan minimal 10 tantangan yang mencakup injection, XSS, broken access control, dan autentikasi. Untuk setiap tantangan, tulis: kategori Top 10, akar masalah, dan perbaikan di level kode. Lalu audit satu aplikasi web milikmu dengan checklist ASVS level 1 (bagian autentikasi, sesi, access control, validasi) dan perbaiki minimal 3 temuan.
:::

:::solusi[Perintah Docker cepat untuk menyalakan OWASP Juice Shop]
Jalankan lab legal di laptopmu sendiri dalam satu baris:
```bash
docker run --rm -p 3000:3000 bkimminich/juice-shop
```
Buka `http://localhost:3000`. Jangan lupa akses halaman `/#/score-board` (temukan dulu jalurnya lewat DevTools!) untuk melacak semua tantangan secara terstruktur.
:::

## Rangkuman

- OWASP Top 10:2025 dipimpin Broken Access Control; gunakan ASVS, WSTG, dan Cheat Sheet untuk detail.
- SQL/command injection: parameterized query, argumen terpisah, allowlist, hak database minimum.
- XSS: encoding sesuai konteks (default framework), sanitasi HTML, CSP, cookie HttpOnly.
- Access control di server untuk setiap objek; tolak default; uji ‘A tidak bisa melihat milik B’.
- Session aman: cookie HttpOnly/Secure/SameSite, regenerasi setelah login, kedaluwarsa, MFA; CSRF dengan SameSite + token.
