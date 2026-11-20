---
title: IP addressing, subnetting & analisis paket
minutes: 60
summary: Alamat IP dan subnetting menentukan siapa bisa berbicara dengan siapa di sebuah jaringan, dan analisis paket menunjukkan apa yang benar-benar terjadi di kabel. Modul ini membahas IPv4 dan IPv6, subnetting dan CIDR, NAT, TCP handshake dan flag, serta analisis paket dengan Wireshark.
objectives:
  - Membaca dan menulis alamat IPv4/IPv6 beserta jenis-jenisnya
  - Menghitung network, broadcast, rentang host, dan jumlah host dari CIDR
  - Merancang pembagian subnet (VLSM) untuk sebuah organisasi
  - Menjelaskan NAT dan dampaknya
  - Menganalisis handshake TCP dan lalu lintas aplikasi di Wireshark
sources:
  - repo: wireshark/wireshark
    note: Penganalisis protokol jaringan
  - repo: caesar0301/awesome-pcaptools
    note: Alat & dataset untuk analisis capture paket
  - repo: beejjorgensen/bgnet
    note: Beej's Guide to Network Programming (socket, TCP/UDP)
quiz:
  - q: "Berapa jumlah host yang dapat dipakai pada subnet /26?"
    options: ["64", "62", "30", "126"]
    answer: 1
    explain: "2^(32−26) = 64 alamat, dikurangi alamat network dan broadcast = 62."
  - q: "Alamat 192.168.10.77/27 berada di network…"
    options: ["192.168.10.64", "192.168.10.32", "192.168.10.72", "192.168.10.0"]
    answer: 0
    explain: "Blok /27 berukuran 32: 0, 32, 64, 96 … 77 ada di blok 64–95."
  - q: "Paket dengan flag SYN tanpa ACK menandakan…"
    options: ["Koneksi ditutup", "Permintaan membuka koneksi TCP baru", "Data biasa", "Reset paksa"]
    answer: 1
    explain: "Langkah pertama three-way handshake; banyak SYN tanpa ACK bisa berarti scan atau SYN flood."
  - q: "Filter tampilan Wireshark untuk hanya melihat lalu lintas DNS adalah…"
    options: ["port == 53", "dns", "tcp.dns", "filter dns"]
    answer: 1
    explain: "Display filter memakai nama protokol; capture filter (BPF) memakai sintaks berbeda, mis. 'port 53'."
---

Hampir setiap konfigurasi jaringan, dari router rumah hingga VPC cloud, menuntut kamu memahami **alamat IP** dan **subnet**. Dan saat ada masalah yang tidak terjelaskan, **capture paket** adalah sumber kebenaran terakhir.

## IPv4 & IPv6

**IPv4** adalah angka 32-bit yang ditulis sebagai empat oktet desimal: `192.168.1.10`. Setiap oktet bernilai 0–255 (8 bit).

```viz
{"type":"binary"}
```

```viz
{"type":"compare","columns":["Jenis alamat","Rentang","Kegunaan"],"rows":[{"label":"Privat (RFC 1918)","values":["10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16","Jaringan internal; tidak dirutekan di internet"]},{"label":"Loopback","values":["127.0.0.0/8","Mesin itu sendiri (localhost)"]},{"label":"Link-local","values":["169.254.0.0/16","Otomatis saat DHCP gagal"]},{"label":"CGNAT","values":["100.64.0.0/10","NAT di sisi ISP (umum di jaringan seluler)"]},{"label":"Publik","values":["Selain di atas (dan rentang khusus lain)","Dapat dijangkau dari internet"]}]}
```

Dengan hanya sekitar 4,3 miliar alamat, IPv4 sudah habis dialokasikan. **IPv6** memakai 128 bit, ditulis dalam heksadesimal: `2001:db8:85a3::8a2e:370:7334` (`::` menggantikan deretan nol sekali). Ciri penting IPv6: ruang alamat sangat besar (subnet standar /64), **SLAAC** (host mengonfigurasi alamat sendiri), tanpa broadcast (memakai multicast), dan **NDP** menggantikan ARP. Banyak jaringan berjalan **dual-stack** (IPv4 dan IPv6 bersamaan).

## Subnetting & CIDR

**Subnet mask** memisahkan bagian **network** dan **host** dari alamat. Notasi **CIDR** menulis jumlah bit network: `/24` = 255.255.255.0.

Coba ubah prefix dan lihat perubahan rentang host:

```viz
{"type":"subnet"}
```

Cara cepat menghitung tanpa kalkulator:

1. **Ukuran blok** = 2^(32 − prefix). /26 → 64, /27 → 32, /28 → 16.
2. **Alamat network** = kelipatan ukuran blok yang ≤ alamat.
3. **Broadcast** = network + ukuran blok − 1.
4. **Host terpakai** = ukuran blok − 2.

Contoh: `10.20.5.130/25` → blok 128 pada oktet terakhir → network `10.20.5.128`, broadcast `10.20.5.255`, host `.129`–`.254` (126 host).

```python
import ipaddress
net = ipaddress.ip_network("10.20.5.130/25", strict=False)
print(net.network_address, net.broadcast_address, net.num_addresses - 2)
print(list(ipaddress.ip_network("192.168.10.0/24").subnets(new_prefix=26)))   # bagi jadi 4 subnet
```

**VLSM** (Variable Length Subnet Mask): bagi alamat sesuai kebutuhan, alokasikan dari kebutuhan **terbesar** dulu. Misalnya kantor dengan 192.168.10.0/24: lab 100 host (/25), staf 50 host (/26), server 20 host (/27), link router 2 host (/30 atau /31).

## NAT

**NAT** (Network Address Translation) memungkinkan banyak perangkat beralamat privat berbagi satu alamat publik. Router menulis ulang alamat dan port sumber, lalu mencatatnya di tabel translasi agar balasan dapat dikembalikan.

```viz
{"type":"sequence","actors":["Laptop 192.168.1.10","Router NAT","Server 93.184.216.34"],"messages":[{"from":"Laptop 192.168.1.10","to":"Router NAT","label":"src 192.168.1.10:51544 → dst :443"},{"from":"Router NAT","to":"Server 93.184.216.34","label":"src 36.85.x.x:40001 → dst :443","note":"tabel: 40001 ↔ 192.168.1.10:51544"},{"from":"Server 93.184.216.34","to":"Router NAT","label":"dst 36.85.x.x:40001"},{"from":"Router NAT","to":"Laptop 192.168.1.10","label":"dst 192.168.1.10:51544"}]}
```

Jenis: **PAT/NAT overload** (banyak ke satu — yang dipakai di rumah), **static NAT/port forwarding** (membuka layanan internal ke luar), dan **CGNAT** di ISP. Konsekuensi NAT: perangkat di belakang NAT tidak bisa langsung dihubungi dari luar (efek samping yang sering dianggap ‘keamanan’, padahal bukan pengganti firewall), dan aplikasi peer-to-peer butuh teknik seperti STUN/TURN.

## TCP handshake & flags

**TCP** menjamin data tiba lengkap dan berurutan. Koneksi dibuka dengan **three-way handshake** dan ditutup dengan pertukaran FIN.

```viz
{"type":"sequence","actors":["Klien","Server"],"messages":[{"from":"Klien","to":"Server","label":"SYN, seq=x"},{"from":"Server","to":"Klien","label":"SYN-ACK, seq=y, ack=x+1"},{"from":"Klien","to":"Server","label":"ACK, ack=y+1","note":"ESTABLISHED"},{"from":"Klien","to":"Server","label":"data (PSH, ACK)"},{"from":"Server","to":"Klien","label":"ACK"},{"from":"Klien","to":"Server","label":"FIN"},{"from":"Server","to":"Klien","label":"ACK + FIN"},{"from":"Klien","to":"Server","label":"ACK","note":"TIME_WAIT"}]}
```

```viz
{"type":"compare","columns":["Flag","Arti"],"rows":[{"label":"SYN","values":["Minta membuka koneksi, sinkronisasi nomor urut"]},{"label":"ACK","values":["Mengakui data yang diterima"]},{"label":"FIN","values":["Selesai mengirim, tutup dengan sopan"]},{"label":"RST","values":["Tutup paksa — port tertutup atau koneksi tidak dikenal"]},{"label":"PSH","values":["Segera serahkan data ke aplikasi"]}]}
```

TCP juga mengatur **flow control** (window size: jangan kirim lebih cepat dari kemampuan penerima) dan **congestion control** (melambat saat jaringan padat). **UDP** tidak punya handshake maupun jaminan; dipakai untuk DNS, streaming, game, dan **QUIC** (dasar HTTP/3) yang membangun keandalan sendiri di atas UDP.

## Analisis paket dengan Wireshark

**Wireshark** menangkap paket dan menguraikannya per lapisan. Di server tanpa GUI, tangkap dengan `tcpdump` lalu buka file `.pcap` di Wireshark.

```bash
sudo tcpdump -i eth0 -w tangkapan.pcap port 443 or port 53     # capture filter (BPF)
```

Display filter yang paling berguna:

```text
ip.addr == 192.168.1.10          # semua lalu lintas ke/dari host
dns                               # hanya DNS
tcp.flags.syn == 1 && tcp.flags.ack == 0    # permintaan koneksi baru
tcp.analysis.retransmission       # paket yang dikirim ulang (indikasi masalah)
http.request.method == "POST"
tls.handshake.type == 1           # Client Hello (lihat SNI = nama situs)
```

```viz
{"type":"flow","title":"Latihan membaca satu sesi HTTPS","steps":[{"label":"DNS","detail":"Query A & AAAA, lihat jawaban dan waktu respons."},{"label":"TCP","detail":"Temukan SYN, SYN-ACK, ACK; hitung RTT."},{"label":"TLS","detail":"Client Hello (SNI, cipher), Server Hello, sertifikat."},{"label":"Data","detail":"Application Data terenkripsi — isi tidak terbaca tanpa kunci."},{"label":"Penutupan","detail":"FIN/ACK atau RST; adakah retransmisi?"}]}
```

Gunakan *Statistics → Conversations* dan *IO Graph* untuk gambaran besar, dan *Follow TCP Stream* untuk protokol tidak terenkripsi. **Etika**: tangkap paket hanya di jaringan milikmu atau dengan izin tertulis; menyadap lalu lintas orang lain melanggar hukum.

:::latihan
Milestone: (1) kerjakan 20 soal subnetting (cari network, broadcast, rentang, jumlah host) lalu verifikasi dengan modul `ipaddress` Python; (2) rancang skema VLSM untuk kampus kecil dengan 5 departemen berukuran berbeda dan 3 link antar-router; (3) capture lalu lintas saat membuka satu situs HTTPS dan satu situs HTTP lokal, lalu tulis laporan yang menunjukkan DNS, handshake TCP beserta RTT, Client Hello dengan SNI, dan penutupan koneksi.
:::

## Rangkuman

- IPv4 32-bit (privat, loopback, publik); IPv6 128-bit dengan SLAAC dan NDP; dual-stack umum.
- CIDR: ukuran blok 2^(32−prefix), network = kelipatan blok, broadcast = network + blok − 1, host = blok − 2; VLSM dari kebutuhan terbesar.
- NAT/PAT memungkinkan berbagi IP publik; bukan pengganti firewall.
- TCP: SYN → SYN-ACK → ACK, flag FIN/RST, flow & congestion control; UDP dan QUIC.
- Wireshark/tcpdump: capture filter vs display filter; baca DNS, TCP, TLS; tangkap hanya dengan izin.
