---
title: Routing, switching & lab simulasi
minutes: 60
summary: Switch menghubungkan perangkat dalam satu jaringan, router menghubungkan jaringan-jaringan. Modul ini membahas switching dan VLAN, static routing, dasar OSPF dan BGP, Spanning Tree Protocol, serta cara membangun lab jaringan virtual dengan GNS3 dan containerlab tanpa perangkat fisik.
objectives:
  - Menjelaskan cara switch mempelajari MAC dan memisahkan jaringan dengan VLAN
  - Mengonfigurasi static route dan membaca tabel routing
  - Menjelaskan cara kerja OSPF (link-state) dan BGP (path-vector) secara konseptual
  - Menjelaskan masalah loop layer 2 dan solusi STP
  - Membangun topologi lab virtual yang dapat diulang
sources:
  - repo: GNS3/gns3-gui
    note: Simulator jaringan grafis GNS3
  - repo: srl-labs/containerlab
    note: Lab jaringan berbasis container yang dideklarasikan sebagai kode
  - repo: mininet/mininet
    note: Emulator jaringan untuk eksperimen SDN
quiz:
  - q: "Port switch yang membawa banyak VLAN ke switch lain disebut…"
    options: ["Access port", "Trunk port (802.1Q)", "Console port", "Loopback"]
    answer: 1
    explain: "Trunk menandai frame dengan VLAN ID; access port hanya untuk satu VLAN."
  - q: "Router memiliki route 10.0.0.0/8 dan 10.1.2.0/24. Paket ke 10.1.2.9 akan memakai…"
    options: ["10.0.0.0/8", "10.1.2.0/24 (longest prefix match)", "Default route", "Keduanya bergantian"]
    answer: 1
    explain: "Router memilih route yang paling spesifik."
  - q: "OSPF memilih jalur berdasarkan…"
    options: ["Jumlah hop saja", "Cost total (umumnya berbasis bandwidth) dengan algoritme shortest path (Dijkstra)", "Urutan konfigurasi", "Nama router"]
    answer: 1
    explain: "Setiap router punya peta topologi lengkap dan menghitung jalur terpendek."
  - q: "Tanpa STP, dua kabel redundan antar switch dapat menyebabkan…"
    options: ["Kecepatan dua kali lipat otomatis", "Broadcast storm dan tabel MAC yang tidak stabil", "IP konflik", "DNS gagal"]
    answer: 1
    explain: "Frame Ethernet tidak punya TTL sehingga broadcast berputar tanpa henti."
---

Di [modul sebelumnya](/belajar/jaringan/net-2) kita membagi alamat menjadi subnet. Sekarang: bagaimana perangkat dalam satu subnet saling terhubung (**switching**), dan bagaimana paket berpindah antar subnet hingga melintasi internet (**routing**). Semuanya dapat dipraktikkan di laptop dengan lab virtual.

## Switching & VLAN

**Switch** mempelajari alamat MAC: saat frame masuk, ia mencatat MAC sumber dan port asalnya di **tabel MAC**. Frame ke MAC yang sudah dikenal dikirim hanya ke port itu; MAC yang belum dikenal dan broadcast dikirim ke semua port (**flooding**).

**VLAN** membagi satu switch fisik menjadi beberapa jaringan logis yang terpisah, sehingga broadcast dan akses dapat diisolasi tanpa membeli switch tambahan.

```viz
{"type":"tree","root":{"label":"Switch inti (trunk 802.1Q)","children":[{"label":"VLAN 10 — Staf","detail":"192.168.10.0/24, port 1–12 (access)"},{"label":"VLAN 20 — Lab mahasiswa","detail":"192.168.20.0/24, port 13–36"},{"label":"VLAN 30 — Server","detail":"192.168.30.0/24, port 37–44"},{"label":"VLAN 99 — Manajemen","detail":"Akses SSH ke perangkat jaringan"}]}}
```

- **Access port**: milik satu VLAN, untuk perangkat akhir.
- **Trunk port**: membawa banyak VLAN dengan **tag 802.1Q**, untuk antar switch atau ke router.
- Komunikasi antar VLAN butuh perangkat layer 3: **router-on-a-stick** (subinterface per VLAN) atau **switch layer 3** (SVI).

```text
! Contoh sintaks gaya Cisco IOS
vlan 10
 name STAF
interface Gi0/1
 switchport mode access
 switchport access vlan 10
interface Gi0/24
 switchport mode trunk
 switchport trunk allowed vlan 10,20,30,99
```

## Static routing

Router meneruskan paket berdasarkan **tabel routing**: untuk setiap tujuan, ke mana paket diteruskan (next hop) dan lewat antarmuka mana. Aturan pemilihan: **longest prefix match** — route paling spesifik menang.

```bash
# Linux sebagai router
ip route                                         # lihat tabel
sudo ip route add 10.30.0.0/16 via 192.168.1.254 # static route
sudo ip route add default via 192.168.1.1        # default route (0.0.0.0/0)
sudo sysctl -w net.ipv4.ip_forward=1             # aktifkan forwarding
```

```text
! Cisco IOS
ip route 10.30.0.0 255.255.0.0 192.168.1.254
ip route 0.0.0.0 0.0.0.0 203.0.113.1
```

Static routing sederhana dan dapat diprediksi, cocok untuk jaringan kecil atau default route ke ISP. Kelemahannya: tidak beradaptasi saat link putus, dan sulit dikelola saat jumlah jaringan bertambah. Di situlah **dynamic routing** berperan.

## OSPF & BGP dasar

```viz
{"type":"compare","columns":["OSPF","BGP"],"rows":[{"label":"Lingkup","values":["Di dalam satu organisasi (IGP)","Antar organisasi/ISP di internet (EGP)"]},{"label":"Jenis","values":["Link-state: setiap router punya peta topologi lengkap","Path-vector: bertukar rute beserta jalur AS yang dilalui"]},{"label":"Pemilihan jalur","values":["Cost terendah (berbasis bandwidth) — Dijkstra","Kebijakan (atribut: local preference, AS path, dll.)"]},{"label":"Konvergensi","values":["Cepat","Lebih lambat, sangat stabil & skalabel"]},{"label":"Contoh","values":["Jaringan kampus, kantor multi-gedung","ISP, perusahaan multi-homed, cloud"]}]}
```

**OSPF**: router menemukan tetangga (Hello), bertukar informasi link (LSA) hingga semua punya database topologi yang sama, lalu masing-masing menghitung pohon jalur terpendek. Jaringan besar dibagi menjadi **area** (area 0 sebagai backbone) untuk membatasi ukuran database.

```viz
{"type":"graph-search"}
```

**BGP** adalah ‘protokol yang membuat internet bekerja’: setiap **Autonomous System** (AS, mis. ISP atau kampus besar dengan nomor ASN) mengumumkan prefix IP yang dimilikinya ke tetangga. Keputusan BGP didominasi **kebijakan bisnis**, bukan sekadar jarak. Kesalahan konfigurasi BGP pernah menyebabkan gangguan internet berskala global, sehingga praktik seperti **RPKI** (validasi asal rute) semakin penting.

```text
router ospf 1
 network 192.168.10.0 0.0.0.255 area 0
 network 10.0.0.0 0.0.0.3 area 0
```

## STP

Kabel redundan antar switch meningkatkan ketersediaan, tetapi menciptakan **loop layer 2**. Frame Ethernet tidak punya TTL, sehingga broadcast berputar tanpa henti (**broadcast storm**) dan melumpuhkan jaringan dalam hitungan detik.

**Spanning Tree Protocol (STP, 802.1D)** dan versi cepatnya **RSTP (802.1w)** mencegahnya:

```viz
{"type":"flow","title":"Cara STP memutus loop","steps":[{"label":"Pilih root bridge","detail":"Bridge ID terendah (prioritas + MAC)."},{"label":"Root port","detail":"Setiap switch memilih port dengan cost terendah menuju root."},{"label":"Designated port","detail":"Satu port penerus per segmen."},{"label":"Blokir sisanya","detail":"Port lain diblokir; hasilnya pohon tanpa loop."},{"label":"Rekonvergensi","detail":"Jika link aktif putus, port terblokir diaktifkan."}]}
```

Praktik baik: tetapkan **root bridge secara manual** di switch inti (prioritas rendah), aktifkan **PortFast + BPDU Guard** di port perangkat akhir agar pengguna tidak sengaja membuat loop. Di pusat data modern, desain berbasis routing (leaf-spine dengan ECMP) mengurangi ketergantungan pada STP.

## Lab virtual dengan GNS3 / containerlab

Belajar jaringan butuh praktik, tetapi perangkat fisik mahal. Lab virtual adalah solusinya:

```viz
{"type":"compare","columns":["Alat","Cara kerja","Cocok untuk"],"rows":[{"label":"Cisco Packet Tracer","values":["Simulator (bukan OS asli)","Pemula, materi sertifikasi CCNA"]},{"label":"GNS3 / EVE-NG","values":["Emulasi image router/switch asli dalam VM, topologi grafis","Lab multi-vendor yang realistis"]},{"label":"containerlab","values":["Router berbasis container (FRR, Nokia SR Linux, Arista cEOS) dari file YAML","Lab sebagai kode, cepat, cocok untuk automation & CI"]},{"label":"Mininet","values":["Jaringan virtual host & switch dengan OpenFlow","Eksperimen SDN"]}]}
```

Contoh topologi containerlab dengan dua router FRRouting:

```yaml
# lab.clab.yml
name: ospf-dasar
topology:
  nodes:
    r1: { kind: linux, image: quay.io/frrouting/frr:10.2.1 }
    r2: { kind: linux, image: quay.io/frrouting/frr:10.2.1 }
    pc1: { kind: linux, image: alpine:latest }
  links:
    - endpoints: ["r1:eth1", "r2:eth1"]
    - endpoints: ["r1:eth2", "pc1:eth1"]
```

```bash
sudo containerlab deploy -t lab.clab.yml
docker exec -it clab-ospf-dasar-r1 vtysh      # CLI FRR mirip Cisco
sudo containerlab destroy -t lab.clab.yml
```

Karena topologinya berupa file, lab dapat disimpan di Git, dibagikan, dan dipakai untuk menguji automation di [Network automation dengan Python](/belajar/jaringan/net-5).

:::latihan
Milestone: bangun lab (Packet Tracer, GNS3, atau containerlab) berisi 3 router dan 2 switch: (1) 3 VLAN dengan trunk dan inter-VLAN routing; (2) static route antara dua router lalu ganti dengan OSPF area 0; (3) putus satu link dan amati rekonvergensi OSPF dengan `traceroute`; (4) buat link redundan antar switch, amati status port STP, dan tetapkan root bridge manual. Dokumentasikan topologi, tabel alamat, konfigurasi, dan bukti uji.
:::

## Rangkuman

- Switch belajar MAC dan flooding untuk tujuan tak dikenal; VLAN memisahkan jaringan logis, trunk 802.1Q membawa banyak VLAN.
- Routing memakai longest prefix match; static route sederhana tetapi tidak adaptif.
- OSPF: link-state, cost, Dijkstra, area; BGP: path-vector antar AS berbasis kebijakan.
- STP/RSTP memblokir port redundan untuk mencegah broadcast storm; tetapkan root manual, PortFast + BPDU Guard.
- Lab virtual: Packet Tracer, GNS3/EVE-NG, containerlab (lab sebagai kode), Mininet (SDN).
