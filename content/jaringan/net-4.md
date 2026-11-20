---
title: Keamanan jaringan & hardening
minutes: 55
summary: Jaringan yang berfungsi belum tentu aman. Modul ini membahas firewall dan ACL, VPN dan TLS, port scanning untuk melihat jaringan dari sudut pandang penyerang, hardening server Linux, serta monitoring dan log untuk mendeteksi hal yang tidak beres.
objectives:
  - Menyusun aturan firewall dengan prinsip default deny
  - Menjelaskan cara VPN dan TLS melindungi data dalam perjalanan
  - Melakukan port scanning yang etis dan menafsirkan hasilnya
  - Mengeraskan server Linux baru langkah demi langkah
  - Mengumpulkan log dan memasang deteksi dasar
sources:
  - repo: imthenachoman/How-To-Secure-A-Linux-Server
    note: Panduan hardening server Linux yang lengkap
  - repo: nmap/nmap
    note: Pemindai jaringan Nmap
  - repo: microsoft/Security-101
    note: Kurikulum dasar keamanan siber
  - repo: sbilly/awesome-security
    note: Kumpulan alat & sumber keamanan
quiz:
  - q: "Prinsip dasar kebijakan firewall yang aman adalah…"
    options: ["Izinkan semua, blokir yang berbahaya", "Tolak semua secara default, izinkan hanya yang dibutuhkan", "Blokir hanya ICMP", "Tanpa aturan agar cepat"]
    answer: 1
    explain: "Default deny memperkecil permukaan serangan; daftar ‘yang berbahaya’ tidak pernah lengkap."
  - q: "Hasil Nmap ‘filtered’ pada sebuah port berarti…"
    options: ["Port terbuka dan aman", "Tidak ada respons yang jelas — kemungkinan diblokir firewall", "Port tertutup dengan RST", "Layanan crash"]
    answer: 1
    explain: "Closed = host membalas RST; filtered = paket dibuang atau ditolak oleh filter."
  - q: "Langkah hardening SSH yang paling berdampak adalah…"
    options: ["Mengganti port ke 2222 saja", "Menonaktifkan login password & root, memakai kunci publik, dan membatasi pengguna", "Menginstal antivirus", "Menghapus log"]
    answer: 1
    explain: "Mengganti port hanya mengurangi kebisingan; autentikasi kunci menghentikan brute force."
  - q: "Fungsi utama TLS pada HTTPS adalah…"
    options: ["Mempercepat situs", "Kerahasiaan, integritas, dan autentikasi server melalui sertifikat", "Menyembunyikan alamat IP", "Memblokir malware"]
    answer: 1
    explain: "TLS tidak menyembunyikan tujuan IP/SNI dan tidak memeriksa isi berbahaya."
---

Setiap layanan yang terhubung ke internet akan dipindai oleh bot dalam hitungan menit setelah menyala. Keamanan jaringan bukan satu produk, melainkan **lapisan-lapisan pertahanan** (*defense in depth*) sehingga satu kegagalan tidak langsung berarti bobol.

:::warning[Etika & hukum]
Lakukan pemindaian dan pengujian hanya pada sistem milikmu atau dengan izin tertulis. Mengakses sistem orang lain tanpa izin melanggar UU ITE. Gunakan lab sendiri atau platform latihan legal.
:::

## Firewall & ACL

**Firewall** memutuskan paket mana yang boleh lewat berdasarkan aturan (alamat, port, protokol, status koneksi). **ACL** di router/switch melakukan hal serupa pada antarmuka jaringan.

```viz
{"type":"compare","columns":["Jenis","Cara kerja","Contoh"],"rows":[{"label":"Stateless (ACL)","values":["Memeriksa setiap paket terpisah","ACL router, NACL di AWS"]},{"label":"Stateful","values":["Melacak koneksi; balasan dari koneksi sah otomatis diizinkan","nftables/iptables conntrack, security group"]},{"label":"Next-gen / WAF","values":["Memeriksa isi lapisan aplikasi (HTTP, signature serangan)","WAF di depan web app"]}]}
```

Prinsip: **default deny**, izinkan hanya yang dibutuhkan, aturan paling spesifik di atas, dan dokumentasikan alasan setiap aturan. Contoh dengan **UFW** (antarmuka sederhana di Ubuntu):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 10.8.0.0/24 to any port 22 proto tcp   # SSH hanya dari VPN
sudo ufw allow 443/tcp                                     # HTTPS publik
sudo ufw enable && sudo ufw status numbered
```

**Segmentasi** jaringan (VLAN + aturan antar segmen, lihat [Routing, switching](/belajar/jaringan/net-3)) membatasi pergerakan penyerang yang sudah masuk; pendekatan **Zero Trust** melangkah lebih jauh dengan memverifikasi setiap akses berdasarkan identitas, bukan lokasi jaringan.

## VPN & TLS

Data yang melintasi jaringan publik dapat disadap atau diubah. Dua mekanisme utama melindunginya:

```viz
{"type":"compare","columns":["VPN","TLS"],"rows":[{"label":"Lapisan","values":["Jaringan (seluruh lalu lintas antar jaringan/perangkat)","Per koneksi aplikasi (HTTPS, SMTPS, dll.)"]},{"label":"Contoh","values":["WireGuard, IPsec, OpenVPN","HTTPS, gRPC over TLS, database dengan TLS"]},{"label":"Kegunaan","values":["Akses jaringan internal dari jauh; menghubungkan kantor cabang","Mengamankan komunikasi klien–server"]}]}
```

**TLS 1.3** handshake singkat: klien dan server menyepakati cipher dan bertukar kunci (Diffie-Hellman), server membuktikan identitas dengan **sertifikat** yang ditandatangani CA tepercaya, lalu data dienkripsi dengan kunci sesi simetris. TLS memberi **kerahasiaan**, **integritas**, dan **autentikasi server**.

```viz
{"type":"cipher"}
```

```bash
# periksa sertifikat & versi TLS sebuah situs
openssl s_client -connect contoh.id:443 -servername contoh.id </dev/null | openssl x509 -noout -subject -issuer -dates
```

**WireGuard** adalah VPN modern yang ringkas (konfigurasi beberapa baris, kriptografi modern) dan kini menjadi pilihan populer untuk akses jarak jauh ke server. Dasar kriptografi dibahas di [jalur Cyber Security](/belajar/cyber-security/cs-2).

## Port scanning

Melihat jaringan dari sudut pandang penyerang: layanan apa yang terekspos? **Nmap** adalah alat standarnya.

```bash
nmap -sn 192.168.56.0/24                 # host discovery (siapa yang hidup)
nmap -sS -p- 192.168.56.10               # SYN scan semua port (butuh root)
nmap -sV -sC -p 22,80,443 192.168.56.10  # versi layanan + skrip default
nmap -O 192.168.56.10                    # tebak sistem operasi
```

```viz
{"type":"compare","columns":["Status","Arti","Tindakan"],"rows":[{"label":"open","values":["Ada layanan yang menerima koneksi","Apakah memang perlu terbuka? Versinya terbaru?"]},{"label":"closed","values":["Host membalas RST; tidak ada layanan","Aman, tetapi menunjukkan host hidup"]},{"label":"filtered","values":["Tidak ada balasan jelas; firewall membuang paket","Biasanya hasil yang diinginkan untuk port tak dipakai"]}]}
```

Gunakan pemindaian rutin terhadap **asetmu sendiri** untuk menemukan layanan yang terbuka tanpa sengaja (database, panel admin, port debug). Bandingkan hasil dari dalam dan luar jaringan.

## Hardening server Linux

Server baru biasanya tidak aman secara default. Daftar langkah dasar (rujukan lengkap: `How-To-Secure-A-Linux-Server`):

```viz
{"type":"flow","title":"Checklist hardening server baru","steps":[{"label":"Update","detail":"apt update && apt upgrade; aktifkan unattended-upgrades untuk patch keamanan."},{"label":"Pengguna","detail":"Buat user non-root dengan sudo; nonaktifkan login root."},{"label":"SSH","detail":"Kunci publik saja, PasswordAuthentication no, PermitRootLogin no, AllowUsers."},{"label":"Firewall","detail":"Default deny; buka hanya port yang dibutuhkan."},{"label":"Fail2ban","detail":"Blokir IP yang gagal login berulang."},{"label":"Minimalkan","detail":"Hapus paket & layanan tak terpakai; cek ss -tulpn."},{"label":"Audit","detail":"Lynis untuk pemeriksaan; log terpusat."}]}
```

```text
# /etc/ssh/sshd_config.d/hardening.conf
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AllowUsers deploy
MaxAuthTries 3
```

```bash
ssh-keygen -t ed25519 -C "laptop-ghazi"          # di laptop
ssh-copy-id deploy@server                         # salin kunci publik
sudo sshd -t && sudo systemctl reload ssh         # uji konfigurasi sebelum reload!
sudo apt install fail2ban lynis && sudo lynis audit system
```

Selalu uji konfigurasi SSH baru di sesi kedua sebelum menutup sesi pertama, agar tidak terkunci di luar server.

## Monitoring & log

Pertahanan bisa ditembus; yang penting adalah **mendeteksi** dengan cepat.

```bash
journalctl -u ssh --since "1 hour ago"           # log layanan SSH
sudo grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head
last -a | head                                   # riwayat login
sudo ss -tnp state established                   # koneksi aktif sekarang
```

```viz
{"type":"layers","layers":[{"label":"Respons","detail":"Alert → runbook → isolasi, investigasi, pemulihan","tag":"SOC"},{"label":"Deteksi","detail":"Aturan & korelasi: brute force, login dari negara tak biasa, port scan","tag":"SIEM"},{"label":"Penyimpanan terpusat","detail":"Log dikirim ke server lain agar tidak bisa dihapus penyerang","tag":"Loki / ELK / Wazuh"},{"label":"Sumber log","detail":"auth.log, firewall, web server, aplikasi, flow jaringan (NetFlow)","tag":"agen"}]}
```

Alat open source populer: **Wazuh** (SIEM/XDR), **Suricata** dan **Zeek** (deteksi intrusi berbasis jaringan), **Grafana Loki** atau **ELK** untuk log. Sinkronkan waktu semua server dengan **NTP**, karena korelasi log tanpa waktu yang akurat hampir mustahil. Pembahasan operasi keamanan lebih lanjut ada di [Blue team & incident response](/belajar/cyber-security/cs-6).

:::latihan
Milestone: siapkan dua VM (server Ubuntu dan penyerang Kali/Ubuntu) di jaringan host-only. Scan server dengan Nmap sebelum hardening dan simpan hasilnya; terapkan checklist hardening (SSH kunci, UFW default deny, fail2ban, unattended-upgrades); uji brute force SSH dari VM penyerang dan pastikan diblokir; pasang WireGuard sehingga SSH hanya bisa diakses lewat VPN; scan ulang dan bandingkan. Jalankan Lynis sebelum dan sesudah, lalu tulis laporan hardening.
:::

## Rangkuman

- Firewall stateless vs stateful vs WAF; default deny, segmentasi, Zero Trust.
- VPN (WireGuard/IPsec) melindungi lalu lintas antar jaringan; TLS melindungi koneksi aplikasi dengan sertifikat.
- Nmap: open/closed/filtered; pindai asetmu sendiri secara rutin — hanya dengan izin.
- Hardening: update otomatis, user non-root, SSH kunci saja, firewall, fail2ban, layanan minimal, audit Lynis.
- Monitoring: log terpusat, deteksi (SIEM/IDS), waktu tersinkron, dan runbook respons.
