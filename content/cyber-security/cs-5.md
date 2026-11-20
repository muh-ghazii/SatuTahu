---
title: Pengujian penetrasi etis & CTF
minutes: 55
summary: Pengujian penetrasi mensimulasikan serangan nyata secara terkendali dan berizin untuk menemukan celah sebelum penjahat menemukannya. Modul ini membahas metodologi pentest dan izin, reconnaissance, lab latihan legal seperti Juice Shop dan DVWA, kompetisi Capture The Flag, dan cara menulis laporan temuan yang dapat ditindaklanjuti.
objectives:
  - Menjelaskan tahapan pentest dan dokumen izin (rules of engagement)
  - Melakukan reconnaissance pasif dan aktif dalam ruang lingkup
  - Menyiapkan dan memakai lab rentan secara aman
  - Berlatih CTF dengan pendekatan sistematis per kategori
  - Menulis laporan temuan dengan dampak, bukti, dan rekomendasi yang jelas
sources:
  - repo: juice-shop/juice-shop
    note: OWASP Juice Shop — aplikasi web sengaja rentan untuk latihan
  - repo: digininja/DVWA
    note: Damn Vulnerable Web Application
  - repo: ctf-wiki/ctf-wiki
    note: Wiki pengetahuan CTF per kategori
  - repo: apsdehal/awesome-ctf
    note: Kumpulan alat & sumber CTF
quiz:
  - q: "Dokumen yang WAJIB ada sebelum memulai pentest adalah…"
    options: ["Daftar exploit", "Izin tertulis dengan ruang lingkup, waktu, metode, dan kontak darurat (rules of engagement)", "Akun admin klien", "Laporan akhir"]
    answer: 1
    explain: "Tanpa izin tertulis, pengujian adalah akses ilegal."
  - q: "Mencari subdomain lewat log Certificate Transparency termasuk…"
    options: ["Reconnaissance aktif", "Reconnaissance pasif (tidak menyentuh sistem target secara langsung)", "Eksploitasi", "Post-exploitation"]
    answer: 1
    explain: "Data diambil dari sumber publik, bukan dari server target."
  - q: "Lab rentan seperti DVWA sebaiknya dijalankan…"
    options: ["Di server publik agar teman bisa mencoba", "Secara lokal/terisolasi (localhost atau jaringan host-only)", "Di jaringan kampus tanpa izin", "Di laptop tanpa firewall terhubung Wi-Fi publik"]
    answer: 1
    explain: "Aplikasi yang sengaja rentan bisa dibobol orang lain bila terpapar."
  - q: "Bagian laporan pentest yang paling dibaca manajemen adalah…"
    options: ["Output mentah alat", "Ringkasan eksekutif: risiko utama dalam bahasa bisnis dan prioritas perbaikan", "Daftar perintah yang diketik", "Lampiran screenshot saja"]
    answer: 1
    explain: "Detail teknis untuk tim teknis; ringkasan untuk pengambil keputusan."
---

**Penetration testing** (pentest) adalah serangan yang disimulasikan secara **berizin, terukur, dan terdokumentasi** untuk menemukan celah keamanan beserta dampaknya. **Capture The Flag (CTF)** adalah kompetisi yang melatih keterampilan yang sama dalam bentuk teka-teki. Keduanya hanya bernilai bila dilakukan secara etis — fondasinya ada di [Fondasi keamanan informasi](/belajar/cyber-security/cs-1).

## Metodologi pentest & izin

```viz
{"type":"flow","title":"Tahapan pentest","steps":[{"label":"Pra-keterlibatan","detail":"Tujuan, ruang lingkup (IP, domain, aplikasi), larangan (DoS, social engineering?), waktu, kontak darurat — ditandatangani."},{"label":"Reconnaissance","detail":"Mengumpulkan informasi tentang target dalam ruang lingkup."},{"label":"Pemodelan ancaman & pemindaian","detail":"Memetakan permukaan serangan dan kandidat kerentanan."},{"label":"Eksploitasi","detail":"Membuktikan kerentanan secara terkendali."},{"label":"Pasca-eksploitasi","detail":"Menilai dampak (akses data, pergerakan lateral) sesuai izin."},{"label":"Pelaporan & retest","detail":"Temuan, bukti, rekomendasi; uji ulang setelah perbaikan."}]}
```

Jenis pengujian berdasarkan informasi awal: **black box** (tanpa informasi), **grey box** (akun pengguna biasa, dokumentasi sebagian), dan **white box** (akses kode & arsitektur). Grey/white box biasanya lebih efisien menemukan lebih banyak masalah dalam waktu terbatas.

Rujukan metodologi: **OWASP WSTG** untuk aplikasi web, **PTES**, dan **NIST SP 800-115**. **Rules of engagement** yang jelas melindungi penguji dan klien: apa yang boleh, jam berapa, bagaimana jika menemukan data sangat sensitif atau celah kritis (biasanya: hentikan dan laporkan segera).

## Reconnaissance

Semakin baik pemahaman tentang target, semakin efektif pengujian. Reconnaissance dibagi dua:

```viz
{"type":"compare","columns":["Pasif (tanpa menyentuh target)","Aktif (berinteraksi dengan target)"],"rows":[{"label":"Contoh","values":["Pencarian web, DNS publik, log Certificate Transparency (crt.sh), arsip web, repositori publik, lowongan kerja","Port scan, enumerasi direktori & endpoint, fingerprint versi layanan"]},{"label":"Risiko","values":["Rendah, tidak terdeteksi target","Terdeteksi & tercatat; harus dalam ruang lingkup"]},{"label":"Alat","values":["dig, whois, crt.sh, subfinder","nmap, ffuf/gobuster, whatweb, Burp Suite"]}]}
```

```bash
# HANYA pada target dalam ruang lingkup / lab sendiri
subfinder -d lab.contoh.test -silent                      # subdomain dari sumber pasif
nmap -sV -sC -oA hasil/nmap 10.10.10.5                     # layanan & versi
ffuf -u http://10.10.10.5/FUZZ -w wordlist.txt -mc 200,301,403   # direktori tersembunyi
```

Untuk aplikasi web, alat utama adalah **proxy intersepsi** seperti **Burp Suite Community** atau **OWASP ZAP**: semua permintaan browser lewat proxy sehingga dapat dilihat, diubah, dan diulang. Catat semua yang ditemukan secara terstruktur sejak awal; catatan yang rapi menghemat waktu saat menulis laporan.

## Lab legal: Juice Shop & DVWA

Tempat terbaik untuk berlatih adalah aplikasi yang **sengaja dibuat rentan** dan dijalankan di mesinmu sendiri:

```bash
docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop     # http://localhost:3000
docker run --rm -p 127.0.0.1:8080:80 vulnerables/web-dvwa          # http://localhost:8080
```

```viz
{"type":"compare","columns":["Lab","Isi","Cocok untuk"],"rows":[{"label":"OWASP Juice Shop","values":["Toko online modern (Angular + Node) dengan 100+ tantangan berjenjang & papan skor","Kerentanan web modern, API, JWT"]},{"label":"DVWA","values":["Aplikasi PHP dengan tingkat keamanan low/medium/high/impossible","Memahami kerentanan klasik dan membandingkan kode rentan vs aman"]},{"label":"PortSwigger Web Security Academy","values":["Materi + lab online gratis per topik","Pendalaman per jenis kerentanan"]},{"label":"Mesin latihan (HTB, TryHackMe, VulnHub)","values":["Mesin utuh untuk dieksploitasi","Alur pentest lengkap"]}]}
```

Perhatikan `127.0.0.1:` pada perintah Docker: lab hanya dapat diakses dari mesinmu sendiri, tidak dari jaringan. Simulasi di bawah menunjukkan inti dari banyak tantangan injeksi:

```viz
{"type":"sqli"}
```

Nilai belajar terbesar ada pada **memahami akar masalah**: setelah berhasil mengeksploitasi DVWA tingkat low, buka kode sumbernya, bandingkan dengan tingkat impossible, dan jelaskan perbaikannya dengan kata-katamu sendiri (lihat [Keamanan aplikasi web](/belajar/cyber-security/cs-3)).

## Capture The Flag

**CTF** adalah kompetisi di mana peserta mencari ‘flag’ (string rahasia, mis. `CTF{...}`) dengan menyelesaikan tantangan keamanan. Format **Jeopardy** berisi soal per kategori dengan poin; format **Attack-Defense** mempertemukan tim yang saling menyerang dan mempertahankan layanan.

```viz
{"type":"tree","root":{"label":"Kategori CTF Jeopardy","children":[{"label":"Web","detail":"Injection, XSS, logika autentikasi, deserialisasi"},{"label":"Crypto","detail":"Kelemahan implementasi kriptografi, sandi klasik, RSA lemah"},{"label":"Forensics","detail":"Analisis file, memori, pcap, metadata, steganografi"},{"label":"Reverse engineering","detail":"Memahami program biner tanpa kode sumber (Ghidra)"},{"label":"Pwn / binary exploitation","detail":"Buffer overflow, format string — tingkat lanjut"},{"label":"OSINT & misc","detail":"Informasi publik, teka-teki logika, scripting"}]}}
```

Pendekatan sistematis saat menghadapi soal:

1. Baca deskripsi dengan teliti (sering ada petunjuk di judul).
2. Identifikasi jenis file/layanan (`file`, `strings`, `binwalk`, `exiftool`, CyberChef).
3. Cari pola yang dikenal dan baca **ctf-wiki** untuk teknik di kategori itu.
4. Tulis skrip kecil (Python, pwntools) alih-alih mencoba manual berulang.
5. Setelah kompetisi, **baca writeup** soal yang tidak terpecahkan — di sinilah pembelajaran terbesar.

Di Indonesia, banyak kampus, komunitas, dan instansi rutin menyelenggarakan CTF tingkat pelajar dan mahasiswa; arsip soal di CTFtime juga dapat dipakai latihan.

## Menulis laporan temuan

Pentest tanpa laporan yang baik tidak menghasilkan perbaikan. Struktur laporan:

```viz
{"type":"layers","layers":[{"label":"Lampiran","detail":"Output alat, daftar host, metodologi rinci","tag":"rujukan"},{"label":"Temuan rinci","detail":"Satu bagian per temuan: judul, tingkat risiko, aset, deskripsi, langkah reproduksi, bukti, dampak, rekomendasi, referensi","tag":"tim teknis"},{"label":"Ruang lingkup & metodologi","detail":"Apa yang diuji, kapan, batasan","tag":"konteks"},{"label":"Ringkasan eksekutif","detail":"Postur keamanan, risiko utama dalam bahasa bisnis, prioritas perbaikan","tag":"manajemen"}]}
```

Contoh satu temuan:

```text
Judul      : IDOR pada endpoint detail pesanan memungkinkan akses data pelanggan lain
Risiko     : Tinggi (CVSS 3.1: 7.1 — AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:L/A:N)
Aset       : https://lab.contoh.test/api/pesanan/{id}
Deskripsi  : Endpoint mengembalikan pesanan berdasarkan ID tanpa memeriksa kepemilikan.
Reproduksi : 1) Login sebagai pengguna A. 2) GET /api/pesanan/1043 (milik pengguna B).
             3) Respons 200 berisi nama, alamat, dan nomor HP pengguna B.
Bukti      : [screenshot permintaan & respons, data sensitif disamarkan]
Dampak     : Penyerang dengan akun biasa dapat mengunduh data seluruh pelanggan (±12.000 pesanan).
Rekomendasi: Periksa kepemilikan objek di server untuk setiap permintaan; tambahkan test otomatis
             ‘pengguna A tidak dapat membaca pesanan B’; tinjau endpoint serupa.
Referensi  : OWASP Top 10:2025 A01; ASVS V8
```

Prinsip: **dapat direproduksi**, **dampak dalam bahasa bisnis**, **rekomendasi spesifik** (bukan sekadar ‘perbaiki validasi’), **bukti dengan data sensitif disamarkan**, dan kirim laporan melalui kanal yang aman.

:::latihan
Milestone: (1) tulis dokumen rules of engagement fiktif untuk menguji lab sendiri; (2) jalankan Juice Shop dan DVWA secara lokal, lakukan reconnaissance dengan Burp/ZAP, dan selesaikan minimal 15 tantangan lintas kategori; (3) ikuti satu CTF pemula (atau arsip CTF) dan selesaikan minimal 5 soal dari 3 kategori berbeda; (4) tulis laporan pentest lengkap (ringkasan eksekutif + 5 temuan rinci dengan CVSS) atas lab tersebut.
:::

## Rangkuman

- Pentest = simulasi serangan berizin: pra-keterlibatan & rules of engagement → recon → pemindaian → eksploitasi → pasca-eksploitasi → laporan & retest.
- Recon pasif (sumber publik) vs aktif (berinteraksi dengan target dalam ruang lingkup); Burp/ZAP untuk web.
- Berlatih di lab legal yang terisolasi (Juice Shop, DVWA, Web Security Academy) dan pahami akar masalahnya.
- CTF: kategori web, crypto, forensics, reversing, pwn, OSINT; pendekatan sistematis dan baca writeup.
- Laporan: ringkasan eksekutif + temuan dapat direproduksi dengan dampak bisnis dan rekomendasi spesifik.
