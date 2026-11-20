---
title: Fondasi keamanan informasi
minutes: 45
summary: Keamanan siber dimulai dari cara berpikir, bukan dari alat. Modul ini membahas CIA triad, hubungan ancaman, kerentanan, dan risiko, perbedaan autentikasi dan otorisasi, prinsip least privilege dan defense in depth, serta etika dan hukum yang membatasi kerja keamanan siber di Indonesia.
objectives:
  - Menganalisis insiden dengan kerangka kerahasiaan, integritas, dan ketersediaan
  - Menilai risiko dari kombinasi ancaman, kerentanan, dan dampak
  - Membedakan autentikasi dan otorisasi serta mengenali kesalahan umum keduanya
  - Menerapkan least privilege dan defense in depth dalam desain sistem
  - Memahami batas etika dan hukum dalam kegiatan keamanan siber
sources:
  - repo: microsoft/Security-101
    note: Kurikulum dasar keamanan siber Microsoft
  - repo: gracenolan/Notes
    note: Catatan persiapan wawancara security engineer
quiz:
  - q: "Ransomware mengenkripsi seluruh data rumah sakit sehingga layanan berhenti. Aspek CIA yang paling langsung terdampak adalah…"
    options: ["Confidentiality", "Integrity", "Availability", "Tidak ada"]
    answer: 2
    explain: "Data tidak dapat diakses; banyak ransomware modern juga mencuri data (confidentiality)."
  - q: "Pengguna yang sudah login dapat melihat pesanan pengguna lain dengan mengganti ID di URL. Ini kegagalan…"
    options: ["Autentikasi", "Otorisasi (access control)", "Enkripsi", "Ketersediaan"]
    answer: 1
    explain: "Sistem tahu siapa pengguna (authN), tetapi tidak memeriksa haknya atas objek itu (authZ)."
  - q: "Risiko paling tepat dirumuskan sebagai…"
    options: ["Jumlah serangan per hari", "Kemungkinan ancaman mengeksploitasi kerentanan dikali dampaknya", "Jumlah firewall", "Harga lisensi antivirus"]
    answer: 1
    explain: "Tanpa kerentanan atau tanpa dampak, ancaman tidak menjadi risiko besar."
  - q: "Menguji keamanan situs milik orang lain tanpa izin, meskipun ‘hanya untuk belajar’…"
    options: ["Boleh jika tidak merusak", "Dapat melanggar hukum (mis. akses ilegal dalam UU ITE) — selalu butuh izin tertulis", "Boleh di malam hari", "Boleh jika situsnya kecil"]
    answer: 1
    explain: "Niat baik bukan izin; gunakan lab sendiri atau program bug bounty resmi."
---

Keamanan siber bukan sekadar memasang antivirus atau firewall. Ia adalah disiplin **mengelola risiko** terhadap informasi dan sistem: memahami apa yang berharga, siapa yang mungkin menyerangnya, bagaimana caranya, dan pertahanan mana yang sepadan dengan biayanya. Modul ini membangun kerangka berpikir yang dipakai di seluruh jalur ini.

## CIA triad

Tiga sifat informasi yang ingin dilindungi:

```viz
{"type":"compare","columns":["Sifat","Arti","Contoh pelanggaran","Kontrol"],"rows":[{"label":"Confidentiality","values":["Hanya pihak berhak yang dapat membaca","Kebocoran data pelanggan, penyadapan Wi-Fi","Enkripsi, access control, klasifikasi data"]},{"label":"Integrity","values":["Data tidak diubah tanpa izin dan terdeteksi bila diubah","Nilai transfer dimanipulasi, situs di-deface","Hash, tanda tangan digital, audit log, validasi"]},{"label":"Availability","values":["Sistem & data tersedia saat dibutuhkan","DDoS, ransomware, server mati tanpa cadangan","Redundansi, backup teruji, rate limit, DR plan"]}]}
```

Sering ditambahkan: **autentisitas** (asal data dapat dipastikan) dan **non-repudiation** (pelaku tidak dapat menyangkal tindakannya), yang biasanya dicapai dengan tanda tangan digital dan log. Kontrol keamanan sering menyeimbangkan ketiganya: enkripsi yang kuat melindungi kerahasiaan, tetapi jika kuncinya hilang, ketersediaan data ikut hilang.

## Ancaman, kerentanan & risiko

Istilah ini sering tertukar, padahal maknanya berbeda:

- **Aset**: sesuatu yang bernilai (data pelanggan, server, reputasi).
- **Ancaman (threat)**: pihak atau kejadian yang berpotensi merugikan (penjahat siber, orang dalam, banjir).
- **Kerentanan (vulnerability)**: kelemahan yang dapat dimanfaatkan (password lemah, software belum di-patch, salah konfigurasi).
- **Eksploit**: cara konkret memanfaatkan kerentanan.
- **Risiko** ≈ **kemungkinan** × **dampak**.

```viz
{"type":"flow","title":"Proses manajemen risiko sederhana","steps":[{"label":"Identifikasi aset","detail":"Apa yang paling berharga? Data apa yang disimpan?"},{"label":"Threat modeling","detail":"Siapa penyerangnya & bagaimana caranya? (STRIDE)"},{"label":"Nilai risiko","detail":"Kemungkinan × dampak → matriks risiko."},{"label":"Tangani","detail":"Mitigasi, transfer (asuransi), hindari, atau terima secara sadar."},{"label":"Pantau","detail":"Risiko berubah saat sistem & ancaman berubah."}]}
```

**STRIDE** membantu memikirkan ancaman secara sistematis: **S**poofing (menyamar), **T**ampering (mengubah data), **R**epudiation (menyangkal), **I**nformation disclosure (kebocoran), **D**enial of service, **E**levation of privilege (menaikkan hak akses). Cara yang efektif: gambar diagram alur data aplikasi, tandai **batas kepercayaan** (browser ↔ server, server ↔ database), lalu tanyakan STRIDE di setiap batas.

## Autentikasi vs otorisasi

```viz
{"type":"compare","columns":["Autentikasi (authN)","Otorisasi (authZ)"],"rows":[{"label":"Pertanyaan","values":["Kamu siapa?","Kamu boleh melakukan apa?"]},{"label":"Mekanisme","values":["Password, OTP, passkey/WebAuthn, sertifikat, SSO","Role (RBAC), atribut (ABAC), kepemilikan objek, kebijakan"]},{"label":"Kegagalan umum","values":["Password lemah/bocor, tanpa MFA, sesi tidak kedaluwarsa","IDOR, admin endpoint tanpa cek role, cek hanya di frontend"]}]}
```

Faktor autentikasi: sesuatu yang **diketahui** (password), **dimiliki** (HP, security key), dan **melekat** (sidik jari). **MFA** menggabungkan lebih dari satu faktor dan menghentikan sebagian besar serangan pengambilalihan akun. **Passkey** (WebAuthn) tahan phishing karena terikat ke domain asli.

Otorisasi harus diperiksa **di server, untuk setiap permintaan dan setiap objek**. Menyembunyikan tombol di frontend bukan otorisasi. Broken access control menempati posisi pertama di OWASP Top 10 — dibahas mendalam di [Keamanan aplikasi web](/belajar/cyber-security/cs-3). Implementasi login dan token di backend dibahas di [Keamanan aplikasi backend](/belajar/backend/be-4).

```viz
{"type":"jwt"}
```

## Least privilege & defense in depth

**Least privilege**: setiap pengguna, proses, dan layanan hanya mendapat hak minimum yang dibutuhkan, selama waktu yang dibutuhkan.

- Aplikasi web tidak terhubung ke database sebagai superuser.
- Staf administrasi tidak memiliki akses ke server produksi.
- Token API dibatasi cakupan (scope) dan masa berlakunya.
- Hak admin sementara (*just-in-time*) alih-alih permanen.

**Defense in depth**: beberapa lapisan pertahanan independen, sehingga satu kegagalan tidak langsung berarti kebobolan.

```viz
{"type":"layers","layers":[{"label":"Data","detail":"Enkripsi, klasifikasi, backup offline/immutable","tag":""},{"label":"Aplikasi","detail":"Validasi input, access control, dependency scanning","tag":""},{"label":"Host","detail":"Patch, hardening, EDR, least privilege","tag":""},{"label":"Jaringan","detail":"Segmentasi, firewall, TLS","tag":""},{"label":"Identitas","detail":"MFA, SSO, review akses berkala","tag":""},{"label":"Manusia & proses","detail":"Pelatihan phishing, prosedur, respons insiden","tag":""}]}
```

Prinsip lain yang sering dipakai: **secure by default** (konfigurasi awal yang aman), **fail securely** (saat error, tolak akses), **separation of duties** (tidak ada satu orang yang dapat melakukan transaksi kritis sendirian), dan **Zero Trust** (jangan percaya hanya karena berada di jaringan internal; verifikasi setiap akses).

## Etika & hukum keamanan siber

Pengetahuan yang sama dapat dipakai untuk melindungi atau menyerang. Yang membedakan profesional keamanan adalah **izin**, **niat**, dan **tanggung jawab**.

```viz
{"type":"tree","root":{"label":"Batas kerja keamanan siber","children":[{"label":"Izin tertulis","detail":"Ruang lingkup, waktu, metode, dan kontak darurat disepakati sebelum pengujian"},{"label":"Hukum Indonesia","detail":"UU ITE (akses ilegal, intersepsi, gangguan sistem), UU No. 27/2022 Pelindungan Data Pribadi"},{"label":"Responsible disclosure","detail":"Laporkan kerentanan ke pemilik secara privat; beri waktu perbaikan sebelum publikasi"},{"label":"Tempat latihan legal","detail":"Lab sendiri, Juice Shop, DVWA, platform CTF, program bug bounty resmi"}]}}
```

:::warning
‘Hanya mencoba’, ‘tidak merusak apa-apa’, atau ‘ingin membantu’ bukan pembelaan hukum. Mengakses sistem orang lain tanpa izin, termasuk akun media sosial teman atau sistem informasi kampus, dapat berujung pidana. Jika menemukan celah secara tidak sengaja, berhenti, jangan mengakses data, dan laporkan melalui kanal resmi.
:::

Banyak organisasi di Indonesia menyediakan kanal pelaporan kerentanan (*vulnerability disclosure program*), dan BSSN mengoordinasikan penanganan insiden siber nasional. Sertifikasi dan kode etik profesional (mis. dari ISC2, EC-Council, atau CompTIA) juga menegaskan kewajiban menjaga kerahasiaan dan bertindak hanya dalam ruang lingkup yang diizinkan.

:::latihan
Milestone: pilih satu sistem yang kamu kenal (mis. aplikasi kasir usaha keluarga atau sistem akademik kampus — secara konseptual, tanpa menguji sistem aslinya). (1) Daftar aset dan klasifikasinya; (2) gambar diagram alur data dengan batas kepercayaan; (3) terapkan STRIDE di setiap batas dan buat matriks risiko 5×5; (4) usulkan kontrol berlapis untuk 5 risiko teratas; (5) tulis satu halaman tentang batas etika & hukum bila kamu ingin menguji sistem tersebut.
:::

## Rangkuman

- CIA: kerahasiaan, integritas, ketersediaan — kerangka untuk menganalisis insiden dan kontrol.
- Risiko = kemungkinan × dampak dari ancaman yang mengeksploitasi kerentanan; threat modeling dengan STRIDE.
- Autentikasi (siapa) vs otorisasi (boleh apa); MFA/passkey; otorisasi di server untuk setiap objek.
- Least privilege dan defense in depth; secure by default, fail securely, Zero Trust.
- Selalu dengan izin tertulis; pahami UU ITE & UU PDP; responsible disclosure; latihan di lab legal.
