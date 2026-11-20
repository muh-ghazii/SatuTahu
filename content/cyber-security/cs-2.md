---
title: Kriptografi praktis
minutes: 55
summary: Kriptografi melindungi password, pesan, transaksi, dan setiap koneksi HTTPS. Modul ini membahas hashing dan cara menyimpan password dengan benar, enkripsi simetris dan asimetris, tanda tangan digital dan sertifikat, serta cara TLS menggabungkan semuanya untuk HTTPS, dengan fokus pada pemakaian yang benar, bukan merancang algoritme sendiri.
objectives:
  - Memilih fungsi hash dan algoritme penyimpanan password yang tepat
  - Memakai enkripsi simetris terautentikasi (AEAD) dengan benar
  - Menjelaskan enkripsi asimetris dan pertukaran kunci
  - Menjelaskan tanda tangan digital, sertifikat, dan rantai kepercayaan
  - Menelusuri handshake TLS 1.3 dan memeriksa konfigurasi HTTPS
sources:
  - repo: sobolevn/awesome-cryptography
    note: Kumpulan pustaka & sumber kriptografi
  - repo: OWASP/CheatSheetSeries
    note: Cheat sheet OWASP (Password Storage, Cryptographic Storage, TLS)
quiz:
  - q: "Cara yang benar menyimpan password pengguna adalah…"
    options: ["Enkripsi AES dengan kunci di server", "Hash cepat SHA-256 tanpa salt", "Algoritme hash password yang lambat dan ber-salt seperti Argon2id atau bcrypt", "Base64"]
    answer: 2
    explain: "Password tidak perlu didekripsi; hash lambat ber-salt menghambat brute force & rainbow table."
  - q: "Pada enkripsi AES-GCM, nonce yang sama dipakai ulang dengan kunci yang sama akan…"
    options: ["Tidak berpengaruh", "Merusak keamanan secara fatal (bocornya informasi plaintext & kemampuan memalsukan)", "Mempercepat enkripsi", "Membuat ciphertext lebih pendek"]
    answer: 1
    explain: "Nonce harus unik per kunci; gunakan nonce acak 96-bit atau penghitung."
  - q: "Tanda tangan digital dibuat dengan…"
    options: ["Kunci publik penerima", "Kunci privat penanda tangan, dan diverifikasi dengan kunci publiknya", "Password bersama", "Hash saja"]
    answer: 1
    explain: "Hanya pemilik kunci privat yang dapat menandatangani; siapa pun dapat memverifikasi."
  - q: "Kenapa TLS memakai kriptografi asimetris sekaligus simetris?"
    options: ["Agar lebih rumit", "Asimetris untuk autentikasi & pertukaran kunci, simetris (cepat) untuk mengenkripsi data", "Karena standar lama", "Simetris hanya untuk sertifikat"]
    answer: 1
    explain: "Kriptografi asimetris jauh lebih lambat untuk data besar."
---

Aturan pertama kriptografi praktis: **jangan membuat algoritme atau protokol sendiri**, dan sebisa mungkin jangan merangkai primitif tingkat rendah sendiri. Gunakan pustaka yang teruji dengan antarmuka tingkat tinggi. Tugas engineer adalah **memilih alat yang tepat** dan **memakainya dengan benar** — di situlah sebagian besar kegagalan terjadi.

## Hashing & penyimpanan password

**Fungsi hash kriptografis** mengubah input apa pun menjadi sidik jari berukuran tetap. Sifat yang diharapkan: satu arah (tidak dapat dibalik), perubahan kecil input mengubah total output (*avalanche*), dan sulit menemukan dua input dengan hash sama (*collision resistance*).

```viz
{"type":"hash"}
```

```python
import hashlib, hmac, secrets
hashlib.sha256(b"laporan-final.pdf").hexdigest()              # integritas file
hmac.new(kunci_rahasia, pesan, hashlib.sha256).hexdigest()     # HMAC: integritas + autentikasi dengan kunci
secrets.token_urlsafe(32)                                      # token acak aman (bukan random.random!)
```

Pilihan algoritme: **SHA-256/SHA-3/BLAKE2** untuk integritas dan sidik jari; **MD5 dan SHA-1 sudah rusak** untuk keamanan (collision dapat dibuat).

**Password berbeda**: hash cepat seperti SHA-256 justru buruk, karena penyerang yang mencuri database dapat mencoba miliaran tebakan per detik di GPU. Gunakan **fungsi hash password** yang sengaja lambat dan memakai banyak memori, dengan **salt** unik per pengguna:

```python
# pip install argon2-cffi
from argon2 import PasswordHasher
ph = PasswordHasher()                       # Argon2id dengan parameter default yang aman
h = ph.hash("rahasia-pengguna")             # salt acak sudah termasuk di string hasil
ph.verify(h, "rahasia-pengguna")            # True, atau melempar exception
if ph.check_needs_rehash(h): ...            # perbarui hash saat parameter dinaikkan
```

```viz
{"type":"compare","columns":["Pilihan","Penilaian"],"rows":[{"label":"Plaintext / Base64 / enkripsi bisa dibalik","values":["Tidak pernah — bocor sekali, semua password terbuka"]},{"label":"MD5 / SHA-256 tanpa salt","values":["Buruk — rainbow table & brute force GPU"]},{"label":"SHA-256 + salt","values":["Masih terlalu cepat"]},{"label":"bcrypt / scrypt / PBKDF2 (iterasi tinggi)","values":["Dapat diterima"]},{"label":"Argon2id","values":["Pilihan yang direkomendasikan OWASP saat ini"]}]}
```

Kekuatan password juga bergantung pada **entropi**: panjang lebih penting daripada simbol aneh. Ketik password di bawah dan lihat perkiraan entropinya:

```viz
{"type":"entropy"}
```

## Enkripsi simetris

**Enkripsi simetris** memakai **satu kunci yang sama** untuk enkripsi dan dekripsi. Cepat, cocok untuk data besar. Standar saat ini: **AES** (dengan mode **GCM**) dan **ChaCha20-Poly1305**.

```viz
{"type":"cipher"}
```

Sandi Caesar di atas menunjukkan gagasan dasarnya sekaligus kelemahannya: ruang kunci sangat kecil dan pola bahasa tetap terlihat. Algoritme modern mengatasi keduanya.

Selalu gunakan **enkripsi terautentikasi (AEAD)**: selain merahasiakan, ia mendeteksi bila ciphertext diubah. Mode lama seperti **ECB** membocorkan pola, dan **CBC tanpa MAC** rentan dimanipulasi.

```python
# pip install cryptography
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

kunci = AESGCM.generate_key(bit_length=256)       # simpan di secret manager / KMS, bukan di kode
aes = AESGCM(kunci)
nonce = os.urandom(12)                            # WAJIB unik untuk setiap enkripsi dengan kunci ini
ct = aes.encrypt(nonce, b"No. rekening: ...", b"pelanggan:77")   # data tambahan terautentikasi (AAD)
pt = aes.decrypt(nonce, ct, b"pelanggan:77")      # gagal (InvalidTag) bila ct/AAD diubah

# Lebih sederhana untuk kebanyakan kasus: Fernet (AES + HMAC, nonce dikelola otomatis)
from cryptography.fernet import Fernet
f = Fernet(Fernet.generate_key()); token = f.encrypt(b"data rahasia"); f.decrypt(token)
```

Bagian tersulit bukan algoritmenya, melainkan **manajemen kunci**: di mana kunci disimpan, siapa yang dapat mengaksesnya, bagaimana kunci dirotasi. Di cloud, gunakan **KMS** dan pola **envelope encryption** (data dienkripsi dengan data key, data key dienkripsi dengan master key di KMS).

## Enkripsi asimetris

**Kriptografi kunci publik** memakai pasangan kunci: **kunci publik** boleh disebar, **kunci privat** dirahasiakan. Yang dienkripsi dengan kunci publik hanya dapat didekripsi dengan kunci privat pasangannya.

```viz
{"type":"sequence","actors":["Ani","Budi"],"messages":[{"from":"Budi","to":"Ani","label":"kunci publik Budi (boleh dilihat siapa saja)"},{"from":"Ani","to":"Budi","label":"pesan dienkripsi dengan kunci publik Budi"},{"from":"Budi","to":"Budi","label":"dekripsi dengan kunci privat Budi","note":"hanya Budi yang bisa"}]}
```

Algoritme: **RSA** (klasik; kunci ≥ 2048-bit), **kurva eliptik** (ECDH/ECDSA, X25519/Ed25519 — kunci lebih kecil dan cepat). Kriptografi asimetris jauh lebih lambat, sehingga dalam praktik dipakai untuk **pertukaran kunci** dan **tanda tangan**, sedangkan data dienkripsi secara simetris.

**Diffie-Hellman (ECDHE)** memungkinkan dua pihak menyepakati kunci rahasia bersama melalui saluran publik tanpa pernah mengirim kunci itu. Dengan kunci sementara per sesi, didapat **forward secrecy**: bocornya kunci privat server di kemudian hari tidak membuka rekaman lalu lintas lama.

Ke depan, komputer kuantum skala besar dapat memecahkan RSA dan ECC. Standar **kriptografi pasca-kuantum** (seperti ML-KEM) mulai diadopsi, misalnya dalam pertukaran kunci hibrida di TLS pada browser modern.

## Tanda tangan digital & sertifikat

**Tanda tangan digital**: penanda tangan menghitung hash dokumen lalu menandatanganinya dengan **kunci privat**; siapa pun memverifikasi dengan **kunci publik**. Ini memberi **integritas**, **autentisitas**, dan **non-repudiation**. Dipakai untuk rilis software, commit Git, JWT, dokumen elektronik, dan update aplikasi.

```bash
ssh-keygen -t ed25519 -f kunci_rilis
ssh-keygen -Y sign -f kunci_rilis -n file aplikasi.zip                         # buat aplikasi.zip.sig
ssh-keygen -Y verify -f allowed_signers -I rilis@contoh.id -n file -s aplikasi.zip.sig < aplikasi.zip
```

Tetapi bagaimana kamu tahu kunci publik itu benar-benar milik `bank.co.id`, bukan milik penyerang? **Sertifikat X.509** mengikat identitas (nama domain) ke kunci publik, ditandatangani oleh **Certificate Authority (CA)** yang dipercaya browser/OS.

```viz
{"type":"tree","root":{"label":"Root CA (tersimpan di trust store OS/browser)","children":[{"label":"Intermediate CA","detail":"Ditandatangani root; root disimpan offline","children":[{"label":"Sertifikat www.contoh.id","detail":"Kunci publik server, masa berlaku, SAN; ditandatangani intermediate"}]}]}}
```

Browser memverifikasi **rantai** dari sertifikat situs hingga root yang dipercaya, mencocokkan nama domain, dan memeriksa masa berlaku. **Let's Encrypt** menerbitkan sertifikat gratis yang diperbarui otomatis (ACME), dan **Certificate Transparency** mencatat semua sertifikat publik agar penerbitan yang salah dapat terdeteksi.

## TLS & HTTPS

**TLS** menggabungkan semua primitif di atas untuk mengamankan koneksi:

```viz
{"type":"sequence","actors":["Browser","Server"],"messages":[{"from":"Browser","to":"Server","label":"ClientHello: versi, cipher suite, key share (ECDHE), SNI"},{"from":"Server","to":"Browser","label":"ServerHello + key share; sejak sini terenkripsi"},{"from":"Server","to":"Browser","label":"Sertifikat + CertificateVerify (tanda tangan) + Finished"},{"from":"Browser","to":"Browser","label":"Verifikasi rantai & nama domain","note":"gagal → peringatan"},{"from":"Browser","to":"Server","label":"Finished"},{"from":"Browser","to":"Server","label":"Data HTTP terenkripsi (AES-GCM / ChaCha20)"}]}
```

TLS 1.3 menyelesaikan handshake dalam satu putaran, hanya mengizinkan cipher modern, dan selalu memberi forward secrecy. Yang **tidak** dilindungi TLS: alamat IP tujuan, nama domain di SNI (kecuali dengan ECH), volume dan waktu lalu lintas, serta keamanan server itu sendiri.

```bash
curl -vI https://contoh.id 2>&1 | grep -E "SSL connection|subject|issuer|expire"
openssl s_client -connect contoh.id:443 -tls1_3 </dev/null 2>/dev/null | grep -E "Protocol|Cipher"
```

Konfigurasi HTTPS yang baik: hanya **TLS 1.2 dan 1.3**, sertifikat diperbarui otomatis, redirect HTTP → HTTPS, header **HSTS**, dan cookie dengan atribut `Secure`. Uji dengan alat seperti SSL Labs atau `testssl.sh`. Sisi jaringan TLS dan VPN juga dibahas di [Keamanan jaringan & hardening](/belajar/jaringan/net-4).

:::latihan
Milestone: (1) bandingkan waktu hash 10.000 tebakan password dengan SHA-256 vs Argon2id dan jelaskan implikasinya; (2) buat utilitas CLI Python yang mengenkripsi/mendekripsi file dengan AES-GCM (kunci dari environment) dan buktikan bahwa mengubah satu byte ciphertext membuat dekripsi gagal; (3) tanda tangani dan verifikasi file rilis dengan Ed25519; (4) periksa rantai sertifikat, versi TLS, dan cipher tiga situs (termasuk situs kampusmu) lalu tulis temuanmu.
:::

## Rangkuman

- Hash (SHA-256/BLAKE2) untuk integritas, HMAC untuk integritas + kunci; MD5/SHA-1 rusak.
- Password: Argon2id/bcrypt ber-salt, lambat; panjang password memberi entropi.
- Simetris: AEAD (AES-GCM, ChaCha20-Poly1305), nonce unik; manajemen kunci dengan KMS/envelope encryption.
- Asimetris: RSA/ECC untuk pertukaran kunci (ECDHE, forward secrecy) dan tanda tangan; pasca-kuantum mulai diadopsi.
- Sertifikat mengikat domain ke kunci publik melalui rantai CA; TLS 1.3 menggabungkan semuanya untuk HTTPS.
