---
title: Cloud networking & SDN
minutes: 55
summary: Di cloud dan pusat data modern, jaringan didefinisikan oleh perangkat lunak dan dikonfigurasi lewat API. Modul ini membahas VPC, subnet, dan security group, load balancer, konsep SDN dan OpenFlow, jaringan Kubernetes, serta validasi konfigurasi jaringan secara otomatis dengan Batfish.
objectives:
  - Merancang VPC dengan subnet publik/privat, route table, dan security group
  - Memilih jenis load balancer dan algoritme distribusinya
  - Menjelaskan pemisahan control plane dan data plane pada SDN
  - Menjelaskan bagaimana Pod dan Service berkomunikasi di Kubernetes
  - Memvalidasi konfigurasi jaringan sebelum diterapkan
sources:
  - repo: sdnds-tw/awesome-sdn
    note: Kumpulan sumber Software-Defined Networking
  - repo: batfish/batfish
    note: Analisis & validasi konfigurasi jaringan berbasis model
  - repo: kelseyhightower/kubernetes-the-hard-way
    note: Membangun Kubernetes manual, termasuk jaringan Pod
quiz:
  - q: "Server database di subnet privat perlu mengunduh update dari internet tanpa bisa diakses dari luar. Komponen yang dipakai…"
    options: ["Internet Gateway langsung", "NAT Gateway di subnet publik", "Load balancer publik", "Elastic IP di database"]
    answer: 1
    explain: "NAT gateway mengizinkan koneksi keluar saja dari subnet privat."
  - q: "Inti gagasan SDN adalah…"
    options: ["Membuang semua switch fisik", "Memisahkan control plane (keputusan) dari data plane (penerusan) dan mengendalikannya terpusat lewat perangkat lunak", "Mengganti IP dengan MAC", "Menghapus routing"]
    answer: 1
    explain: "Controller memprogram aturan penerusan ke banyak perangkat melalui API/protokol seperti OpenFlow."
  - q: "Di Kubernetes, objek yang memberi alamat stabil ke sekumpulan Pod yang IP-nya berubah-ubah adalah…"
    options: ["ConfigMap", "Service", "Volume", "Namespace"]
    answer: 1
    explain: "Service memilih Pod dengan label dan memberi ClusterIP/DNS yang stabil."
  - q: "Keunggulan Batfish dibanding menguji di jaringan produksi adalah…"
    options: ["Lebih murah lisensinya", "Menganalisis konfigurasi secara offline untuk menjawab pertanyaan seperti ‘apakah A bisa menjangkau B?’ sebelum perubahan diterapkan", "Mempercepat paket", "Mengganti firewall"]
    answer: 1
    explain: "Kesalahan ditemukan sebelum berdampak pada pengguna."
---

Di cloud, kamu tidak memasang kabel atau switch. Kamu membuat jaringan dengan **API dan kode**. Konsepnya tetap sama — subnet, routing, firewall, load balancing — tetapi cara mengelola dan skalanya berbeda. Modul ini menjembatani pengetahuan jaringan tradisional dengan dunia cloud dan Kubernetes.

## VPC, subnet, security group

**VPC** (Virtual Private Cloud) adalah jaringan privat terisolasi milikmu di cloud. Desain umum tiga lapis:

```viz
{"type":"tree","root":{"label":"VPC 10.0.0.0/16 (region Jakarta)","children":[{"label":"Subnet publik (per AZ)","detail":"10.0.1.0/24, 10.0.2.0/24 — load balancer, NAT gateway, bastion; route 0.0.0.0/0 → Internet Gateway"},{"label":"Subnet privat aplikasi","detail":"10.0.11.0/24, 10.0.12.0/24 — server aplikasi; 0.0.0.0/0 → NAT gateway"},{"label":"Subnet privat data","detail":"10.0.21.0/24, 10.0.22.0/24 — database; tanpa route ke internet"}]}}
```

```viz
{"type":"compare","columns":["Komponen","Fungsi"],"rows":[{"label":"Route table","values":["Menentukan ke mana lalu lintas subnet diarahkan (IGW, NAT, peering, VPN)"]},{"label":"Internet Gateway","values":["Pintu dua arah ke internet untuk subnet publik"]},{"label":"NAT Gateway","values":["Koneksi keluar dari subnet privat, tanpa bisa diakses dari luar"]},{"label":"Security group","values":["Firewall stateful di level instance; aturan allow saja; bisa merujuk SG lain"]},{"label":"Network ACL","values":["Firewall stateless di level subnet; allow & deny"]},{"label":"Peering / Transit Gateway / VPN","values":["Menghubungkan VPC lain atau jaringan kantor"]}]}
```

Praktik baik: rencanakan **CIDR yang tidak tumpang tindih** dengan jaringan kantor dan VPC lain (subnetting dari [modul IP addressing](/belajar/jaringan/net-2) sangat terpakai di sini); sebar subnet ke **beberapa availability zone**; dan rujuk security group antar lapis ("DB hanya menerima port 5432 dari SG aplikasi") alih-alih alamat IP. Definisikan semuanya dengan Terraform (lihat [Cloud & Infrastructure as Code](/belajar/devops-cloud/dv-5)).

## Load balancer

**Load balancer** membagi lalu lintas ke banyak server, memeriksa kesehatannya, dan menyembunyikan kegagalan satu server dari pengguna.

```viz
{"type":"load-balancer"}
```

```viz
{"type":"compare","columns":["Layer 4 (TCP/UDP)","Layer 7 (HTTP)"],"rows":[{"label":"Keputusan berdasarkan","values":["IP & port","Host, path, header, cookie"]},{"label":"Kemampuan","values":["Sangat cepat, protokol apa pun","Routing per path (/api → layanan A), terminasi TLS, WAF"]},{"label":"Contoh","values":["AWS NLB, IPVS, MetalLB","AWS ALB, Nginx, HAProxy, Envoy, Cloudflare"]}]}
```

Algoritme: **round robin**, **least connections**, **weighted**, dan **consistent hashing** (permintaan dari klien yang sama ke server yang sama). Fitur penting: **health check**, **connection draining** saat server dikeluarkan, dan **sticky session** (sebaiknya dihindari dengan membuat aplikasi stateless). Pada skala global, **DNS-based load balancing** dan **anycast** mengarahkan pengguna ke region terdekat.

## SDN & OpenFlow

Pada jaringan tradisional, setiap router/switch memiliki **control plane** (menghitung rute) dan **data plane** (meneruskan paket) sendiri. **Software-Defined Networking** memisahkan keduanya:

```viz
{"type":"layers","layers":[{"label":"Aplikasi","detail":"Load balancing, firewall, traffic engineering, monitoring — lewat northbound API","tag":"kebijakan"},{"label":"Controller SDN","detail":"Pandangan global jaringan; menghitung & memasang aturan (ONOS, OpenDaylight, Ryu)","tag":"control plane"},{"label":"Southbound API","detail":"OpenFlow, NETCONF, P4Runtime","tag":"protokol"},{"label":"Switch","detail":"Hanya meneruskan sesuai tabel flow: match (header) → action (forward/drop/modify)","tag":"data plane"}]}
```

**OpenFlow** mendefinisikan bagaimana controller memasang aturan *match → action* ke tabel flow switch. Coba dengan **Mininet**:

```bash
sudo mn --topo tree,depth=2,fanout=2 --controller remote,ip=127.0.0.1 --switch ovsk,protocols=OpenFlow13
mininet> pingall
sudo ovs-ofctl -O OpenFlow13 dump-flows s1      # lihat aturan yang dipasang controller
```

Dalam praktik, gagasan SDN hidup di **jaringan cloud** (VPC sepenuhnya didefinisikan perangkat lunak), **SD-WAN** untuk menghubungkan kantor cabang, **overlay** seperti VXLAN/EVPN di pusat data, dan **programmable data plane** (P4, eBPF).

## Jaringan Kubernetes

Kubernetes punya model jaringan sederhana namun penting dipahami:

```viz
{"type":"flow","title":"Perjalanan permintaan ke aplikasi di Kubernetes","steps":[{"label":"Pengguna","detail":"https://toko.contoh.id"},{"label":"Load balancer / Ingress","detail":"Routing berdasarkan host & path, terminasi TLS."},{"label":"Service","detail":"ClusterIP + nama DNS stabil (toko-api.default.svc)."},{"label":"kube-proxy / eBPF","detail":"Meneruskan ke salah satu Pod sehat (iptables/IPVS atau Cilium)."},{"label":"Pod","detail":"Setiap Pod punya IP sendiri; plugin CNI menghubungkan Pod antar node."}]}
```

- **Setiap Pod mendapat IP** dan dapat berkomunikasi dengan Pod lain di node mana pun tanpa NAT; implementasinya oleh plugin **CNI** (Calico, Cilium, Flannel).
- **Service** memberi alamat stabil untuk Pod yang datang dan pergi; **CoreDNS** menyediakan nama.
- **Ingress / Gateway API** membuka layanan HTTP ke luar cluster.
- **NetworkPolicy** adalah firewall antar Pod: secara default semua Pod boleh saling bicara, jadi terapkan *default deny* per namespace.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: db-hanya-dari-api, namespace: toko }
spec:
  podSelector: { matchLabels: { app: postgres } }
  policyTypes: [Ingress]
  ingress:
    - from: [{ podSelector: { matchLabels: { app: api } } }]
      ports: [{ port: 5432, protocol: TCP }]
```

Objek Kubernetes lainnya dibahas di [Orkestrasi dengan Kubernetes](/belajar/devops-cloud/dv-4); `kubernetes-the-hard-way` menunjukkan cara jaringan Pod disusun secara manual.

## Validasi konfigurasi otomatis

Menguji perubahan jaringan langsung di produksi itu berisiko. **Batfish** membangun **model** jaringan dari file konfigurasi (router, switch, firewall, bahkan konfigurasi cloud) dan menjawab pertanyaan secara offline:

```python
from pybatfish.client.session import Session
from pybatfish.datamodel.flow import HeaderConstraints

bf = Session(host="localhost")
bf.set_network("kampus")
bf.init_snapshot("snapshots/sesudah", name="sesudah", overwrite=True)

# Apakah ada konfigurasi yang tidak dikenali atau referensi yang hilang?
print(bf.q.initIssues().answer().frame())
print(bf.q.undefinedReferences().answer().frame())

# Bisakah subnet lab mahasiswa menjangkau server database di port 5432? (seharusnya TIDAK)
hasil = bf.q.reachability(
    pathConstraints={"startLocation": "@enter(sw-lab[Vlan20])"},
    headers=HeaderConstraints(dstIps="192.168.30.10", applications=["postgresql"]),
    actions="SUCCESS").answer().frame()
assert hasil.empty, "Lab dapat menjangkau database!"
```

```viz
{"type":"flow","title":"Validasi di pipeline perubahan jaringan","steps":[{"label":"Pull request","detail":"Perubahan konfigurasi/Terraform."},{"label":"Batfish","detail":"Parsing, referensi, reachability, ACL, differential (sebelum vs sesudah)."},{"label":"Kebijakan sebagai test","detail":"‘Lab tidak boleh ke DB’, ‘manajemen selalu terjangkau’."},{"label":"Lolos → terapkan","detail":"Bertahap, dengan verifikasi pasca-perubahan."}]}
```

Mendefinisikan **kebijakan jaringan sebagai test** yang dijalankan otomatis di CI adalah puncak dari pendekatan NetDevOps yang dimulai di [Network automation](/belajar/jaringan/net-5).

:::latihan
Milestone akhir jalur: (1) rancang dan bangun dengan Terraform sebuah VPC tiga lapis di dua AZ (free tier atau LocalStack), lengkap dengan security group berlapis dan diagram; (2) jalankan Mininet dengan controller Ryu dan amati flow yang dipasang; (3) di cluster lokal (kind/minikube), deploy dua aplikasi dan terapkan NetworkPolicy default deny, lalu buktikan hanya lalu lintas yang diizinkan yang berhasil; (4) analisis konfigurasi lab dari modul sebelumnya dengan Batfish dan tulis 3 test kebijakan yang dijalankan di CI.
:::

## Rangkuman

- VPC: subnet publik/privat per AZ, route table, IGW, NAT gateway, security group (stateful) & NACL (stateless).
- Load balancer L4 vs L7, algoritme distribusi, health check, connection draining.
- SDN memisahkan control plane dan data plane; OpenFlow memasang aturan match → action.
- Kubernetes: IP per Pod lewat CNI, Service + DNS, Ingress/Gateway API, NetworkPolicy default deny.
- Batfish memvalidasi konfigurasi secara offline; kebijakan jaringan sebagai test di CI.
