---
title: "Fondasi jaringan: OSI, TCP/IP & Linux"
minutes: 50
summary: Setiap aplikasi modern bergantung pada jaringan, dan sebagian besar masalah ‘aplikasi lambat’ atau ‘tidak bisa terhubung’ sebenarnya masalah jaringan. Modul ini membahas model OSI dan TCP/IP, enkapsulasi, layanan DNS, DHCP, dan ARP, perintah diagnosis di Linux, dan apa yang terjadi saat membuka sebuah URL.
objectives:
  - Memetakan protokol ke lapisan OSI dan TCP/IP
  - Menjelaskan enkapsulasi data dari aplikasi hingga sinyal fisik
  - Menjelaskan cara kerja DNS, DHCP, dan ARP
  - Mendiagnosis koneksi dengan ping, traceroute, ip, ss, dan dig
  - Menceritakan perjalanan lengkap permintaan saat membuka URL
sources:
  - repo: alex/what-happens-when
    note: Penjelasan rinci apa yang terjadi saat mengetik URL
  - repo: facyber/awesome-networking
    note: Kumpulan sumber belajar jaringan
  - repo: jlevy/the-art-of-command-line
    note: Panduan command line (termasuk alat jaringan)
quiz:
  - q: "Switch biasa bekerja terutama di lapisan…"
    options: ["Physical (1)", "Data link (2) dengan alamat MAC", "Network (3) dengan alamat IP", "Application (7)"]
    answer: 1
    explain: "Switch meneruskan frame berdasarkan tabel MAC; router bekerja di lapisan 3."
  - q: "ARP berfungsi untuk…"
    options: ["Menerjemahkan nama domain ke IP", "Mencari alamat MAC dari alamat IP di jaringan lokal yang sama", "Memberi IP otomatis", "Mengenkripsi paket"]
    answer: 1
    explain: "Sebelum mengirim frame ke 192.168.1.1, host perlu tahu MAC-nya."
  - q: "ping ke 8.8.8.8 berhasil tetapi ping google.com gagal. Masalah paling mungkin…"
    options: ["Kabel putus", "DNS", "Kartu jaringan rusak", "Router mati"]
    answer: 1
    explain: "Konektivitas IP ada; resolusi nama yang gagal."
  - q: "Perintah untuk melihat port yang sedang listen di Linux modern adalah…"
    options: ["ping -l", "ss -tulpn", "dig -p", "traceroute -p"]
    answer: 1
    explain: "ss menggantikan netstat; -t TCP, -u UDP, -l listen, -p proses, -n numerik."
---

Jaringan komputer adalah fondasi yang tidak terlihat sampai ia rusak. Programmer, data engineer, dan admin sistem sama-sama perlu memahami bagaimana data berpindah dari satu mesin ke mesin lain, karena di situlah banyak bug ‘misterius’ bersembunyi.

## Model OSI & TCP/IP

Model berlapis membagi komunikasi menjadi tanggung jawab terpisah. Setiap lapisan hanya berbicara dengan lapisan di atas dan di bawahnya.

```viz
{"type":"layers","layers":[{"label":"7 Application","detail":"HTTP, DNS, SMTP, SSH — data yang dipahami aplikasi","tag":"TCP/IP: Application"},{"label":"6 Presentation","detail":"Enkoding, kompresi, enkripsi (TLS sering ditempatkan di sini)","tag":"TCP/IP: Application"},{"label":"5 Session","detail":"Mengelola sesi komunikasi","tag":"TCP/IP: Application"},{"label":"4 Transport","detail":"TCP (andal, berurutan) / UDP (cepat, tanpa jaminan); port","tag":"segmen"},{"label":"3 Network","detail":"IP, routing antar jaringan; router","tag":"paket"},{"label":"2 Data link","detail":"Ethernet, Wi-Fi, alamat MAC; switch","tag":"frame"},{"label":"1 Physical","detail":"Kabel, fiber, gelombang radio; bit","tag":"bit"}]}
```

**OSI** (7 lapisan) adalah model konseptual untuk belajar dan berdiskusi ("ini masalah layer 2"). **TCP/IP** (4 lapisan: link, internet, transport, application) adalah model yang benar-benar diimplementasikan di internet. Saat troubleshooting, bergeraklah dari bawah ke atas: kabel/Wi-Fi tersambung? dapat IP? bisa ping gateway? DNS jalan? port terbuka? aplikasi merespons?

## Enkapsulasi

Saat data dikirim, setiap lapisan menambahkan **header** miliknya; saat diterima, header dilepas lapis demi lapis.

```viz
{"type":"flow","title":"Enkapsulasi permintaan HTTP","steps":[{"label":"Data","detail":"GET /index.html HTTP/1.1 …"},{"label":"+ Header TCP","detail":"Port sumber 51544 → tujuan 443, nomor urut → segmen"},{"label":"+ Header IP","detail":"IP sumber 192.168.1.10 → tujuan 104.21.x.x, TTL → paket"},{"label":"+ Header & trailer Ethernet","detail":"MAC laptop → MAC router, CRC → frame"},{"label":"Bit di medium","detail":"Sinyal listrik/cahaya/radio"}]}
```

Perhatikan: **alamat IP** tujuan tetap sama sepanjang perjalanan (kecuali diubah NAT), sedangkan **alamat MAC** berganti di setiap hop karena hanya berlaku di jaringan lokal. **MTU** (biasanya 1500 byte untuk Ethernet) membatasi ukuran paket; paket lebih besar harus dipecah atau ditolak.

## DNS, DHCP, ARP

Tiga layanan yang bekerja diam-diam setiap kali kamu terhubung ke jaringan:

```viz
{"type":"compare","columns":["Protokol","Pertanyaan yang dijawab","Cara kerja singkat"],"rows":[{"label":"DHCP","values":["‘Saya baru terhubung, IP saya berapa?’","Discover → Offer → Request → Ack (DORA); memberi IP, subnet mask, gateway, DNS"]},{"label":"ARP","values":["‘Siapa pemilik IP 192.168.1.1? MAC-nya apa?’","Broadcast pertanyaan; pemilik membalas unicast; disimpan di cache ARP"]},{"label":"DNS","values":["‘IP untuk satutahu.id berapa?’","Resolver bertanya ke root → TLD (.id) → server otoritatif; hasil di-cache sesuai TTL"]}]}
```

```viz
{"type":"sequence","actors":["Laptop","Resolver","Root","TLD .id","Otoritatif"],"messages":[{"from":"Laptop","to":"Resolver","label":"A? www.contoh.id"},{"from":"Resolver","to":"Root","label":"www.contoh.id?"},{"from":"Root","to":"Resolver","label":"tanya server .id"},{"from":"Resolver","to":"TLD .id","label":"www.contoh.id?"},{"from":"TLD .id","to":"Resolver","label":"tanya ns1.contoh.id"},{"from":"Resolver","to":"Otoritatif","label":"www.contoh.id?"},{"from":"Otoritatif","to":"Resolver","label":"203.0.113.7 (TTL 300)"},{"from":"Resolver","to":"Laptop","label":"203.0.113.7","note":"di-cache 300 detik"}]}
```

Jenis record DNS yang sering dipakai: **A** (IPv4), **AAAA** (IPv6), **CNAME** (alias), **MX** (server email), **TXT** (verifikasi, SPF), **NS** (server nama). Karena caching dan TTL, perubahan DNS bisa butuh waktu untuk terlihat di semua tempat.

## Perintah: ping, traceroute, ip, ss, dig

```bash
ip addr                      # alamat IP setiap antarmuka
ip route                     # tabel routing; 'default via 192.168.1.1' = gateway
ip neigh                     # cache ARP

ping -c 4 192.168.1.1        # gateway terjangkau? (ICMP)
ping -c 4 8.8.8.8            # internet terjangkau?
ping -c 4 google.com         # DNS bekerja?

traceroute google.com        # hop demi hop menuju tujuan (Windows: tracert)
mtr google.com               # gabungan ping + traceroute secara live

dig satutahu.id +short       # resolusi DNS
dig MX gmail.com             # record tertentu
dig @1.1.1.1 contoh.id       # bertanya ke resolver tertentu

ss -tulpn                    # port yang listen & prosesnya
ss -tn state established     # koneksi aktif
curl -v https://contoh.id    # lihat DNS, TCP, TLS, dan header HTTP
```

```viz
{"type":"flow","title":"Urutan diagnosis ‘internet tidak jalan’","steps":[{"label":"ip addr","detail":"Ada IP? 169.254.x.x = DHCP gagal."},{"label":"ping gateway","detail":"Gagal → masalah lokal (Wi-Fi, kabel, VLAN)."},{"label":"ping 8.8.8.8","detail":"Gagal → routing/ISP."},{"label":"dig domain","detail":"Gagal → DNS."},{"label":"curl -v","detail":"Gagal → firewall, TLS, atau aplikasi."}]}
```

Pembahasan perintah Linux lainnya ada di [Linux & shell untuk server](/belajar/devops-cloud/dv-1).

## Apa yang terjadi saat membuka URL

Pertanyaan wawancara klasik ini menyatukan semua konsep di atas:

```viz
{"type":"flow","title":"https://www.contoh.id/produk","steps":[{"label":"Parsing URL","detail":"Skema https, host www.contoh.id, port 443, path /produk."},{"label":"DNS","detail":"Cache browser/OS → resolver → IP tujuan."},{"label":"ARP & routing","detail":"IP tujuan di luar subnet → kirim ke MAC gateway."},{"label":"TCP handshake","detail":"SYN → SYN-ACK → ACK ke port 443."},{"label":"TLS handshake","detail":"Negosiasi cipher, verifikasi sertifikat, kunci sesi."},{"label":"HTTP request","detail":"GET /produk dengan header & cookie."},{"label":"Server","detail":"Load balancer → aplikasi → database → respons HTML."},{"label":"Render","detail":"Browser mem-parsing HTML, mengunduh CSS/JS/gambar (koneksi tambahan), menampilkan halaman."}]}
```

Repo `what-happens-when` menguraikan proses ini hingga detail penekanan tombol keyboard. Bagian render di browser dibahas di [Fondasi web](/belajar/frontend/fe-1), dan HTTP di [Fondasi backend](/belajar/backend/be-1).

:::latihan
Milestone: (1) di laptopmu, catat IP, gateway, server DNS, dan isi cache ARP; (2) jalankan urutan diagnosis lima langkah ke tiga situs dan simpan output-nya; (3) dengan `dig +trace`, telusuri resolusi DNS satu domain .id dari root; (4) tulis penjelasanmu sendiri (±1 halaman) tentang apa yang terjadi saat membuka URL kampusmu, lengkap dengan output `curl -v` sebagai bukti.
:::

## Rangkuman

- OSI (7 lapisan) untuk berpikir; TCP/IP (4 lapisan) yang diimplementasikan; troubleshoot dari bawah ke atas.
- Enkapsulasi: data → segmen → paket → frame → bit; MAC berganti per hop, IP tetap (kecuali NAT).
- DHCP memberi konfigurasi, ARP memetakan IP→MAC lokal, DNS memetakan nama→IP dengan cache dan TTL.
- Alat: ip, ping, traceroute/mtr, dig, ss, curl -v.
- Membuka URL: DNS → ARP/routing → TCP → TLS → HTTP → server → render.
