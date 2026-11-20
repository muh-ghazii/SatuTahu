---
title: Network automation dengan Python
minutes: 60
summary: Mengonfigurasi ratusan perangkat lewat CLI satu per satu lambat dan rawan salah ketik. Modul ini membahas Python untuk jaringan, otomasi SSH dengan Netmiko, abstraksi multi-vendor dengan NAPALM, orkestrasi paralel dengan Nornir, NetBox sebagai source of truth, dan validasi konfigurasi sebelum serta sesudah perubahan.
objectives:
  - Memakai Python untuk mengolah data jaringan (IP, template, file)
  - Mengirim perintah dan konfigurasi ke perangkat dengan Netmiko
  - Mengambil data terstruktur dan menerapkan konfigurasi multi-vendor dengan NAPALM
  - Menjalankan tugas ke banyak perangkat secara paralel dengan Nornir
  - Menghasilkan konfigurasi dari NetBox dan memvalidasi perubahan
sources:
  - repo: networktocode/awesome-network-automation
    note: Peta alat & sumber network automation
  - repo: ktbyers/netmiko
    note: Pustaka SSH multi-vendor untuk perangkat jaringan
  - repo: napalm-automation/napalm
    note: Abstraksi multi-vendor (getters, config merge/replace)
  - repo: nornir-automation/nornir
    note: Framework otomasi Python dengan inventory & paralelisme
  - repo: netbox-community/netbox
    note: Source of truth untuk infrastruktur jaringan (IPAM/DCIM)
  - repo: PacktPublishing/Mastering-Python-Networking-Fourth-Edition
    note: Kode buku Mastering Python Networking edisi 4
quiz:
  - q: "Keunggulan NAPALM dibanding Netmiko adalah…"
    options: ["Lebih cepat terhubung", "Menyediakan fungsi seragam lintas vendor (get_facts, compare_config, commit/rollback) yang mengembalikan data terstruktur", "Tidak butuh SSH", "Hanya untuk Cisco"]
    answer: 1
    explain: "Netmiko mengirim perintah teks; NAPALM mengabstraksi operasi umum lintas vendor."
  - q: "Dalam praktik ‘source of truth’, konfigurasi perangkat seharusnya…"
    options: ["Diedit langsung di perangkat lalu dicatat bila sempat", "Dihasilkan dari data terstruktur (mis. NetBox) melalui template, sehingga perangkat mencerminkan SoT", "Disimpan di spreadsheet pribadi", "Tidak didokumentasikan"]
    answer: 1
    explain: "Perubahan dimulai dari data yang dikelola, bukan dari CLI."
  - q: "Sebelum menerapkan konfigurasi ke 200 router, langkah paling aman adalah…"
    options: ["Langsung ke semua sekaligus", "Dry-run (compare/diff), uji di lab, terapkan bertahap ke sebagian kecil, lalu validasi", "Matikan monitoring", "Reboot semua router dulu"]
    answer: 1
    explain: "Otomasi juga mengotomasi kesalahan; batasi radius dampaknya."
  - q: "Password perangkat dalam script otomasi sebaiknya…"
    options: ["Ditulis langsung di kode", "Diambil dari environment variable atau secret manager/vault", "Dikirim lewat email", "Disimpan di README"]
    answer: 1
    explain: "Kode masuk Git; rahasia tidak boleh."
---

**Network automation** mengubah cara mengelola jaringan dari mengetik perintah di CLI menjadi **kode yang dapat diuji, ditinjau, dan diulang**. Hasilnya: perubahan lebih cepat, konsisten, terdokumentasi, dan lebih jarang menyebabkan gangguan karena salah ketik.

```viz
{"type":"layers","layers":[{"label":"Validasi","detail":"Cek sebelum & sesudah: pyATS, Batfish, getters NAPALM","tag":"kepercayaan"},{"label":"Orkestrasi","detail":"Nornir / Ansible — banyak perangkat, paralel, inventory","tag":"skala"},{"label":"Abstraksi","detail":"NAPALM — operasi seragam lintas vendor","tag":"multi-vendor"},{"label":"Transport","detail":"Netmiko (SSH/CLI), NETCONF/RESTCONF, gNMI","tag":"koneksi"},{"label":"Source of truth","detail":"NetBox — data yang diinginkan (intended state)","tag":"data"}]}
```

Latihlah semua contoh di lab virtual dari [modul routing & switching](/belajar/jaringan/net-3) (containerlab, GNS3, atau sandbox gratis vendor), **bukan** di jaringan produksi.

## Python untuk jaringan

Python dipakai karena pustaka jaringannya kaya dan mudah dibaca oleh engineer jaringan yang bukan programmer penuh. Keterampilan inti:

```python
import ipaddress, json, os
from jinja2 import Template

# 1. Mengolah alamat
net = ipaddress.ip_network("10.10.0.0/22")
subnets = list(net.subnets(new_prefix=24))          # 4 subnet /24

# 2. Data terstruktur (YAML/JSON) sebagai input
vlans = [{"id": 10, "name": "STAF"}, {"id": 20, "name": "LAB"}]

# 3. Template konfigurasi (Jinja2)
tpl = Template("""{% for v in vlans %}vlan {{ v.id }}
 name {{ v.name }}
{% endfor %}""")
print(tpl.render(vlans=vlans))

# 4. Rahasia dari environment, bukan dari kode
PASSWORD = os.environ["NET_PASSWORD"]
```

Pemisahan **data** (VLAN apa yang diinginkan) dari **template** (sintaks vendor) adalah gagasan kunci: menambah VLAN cukup mengubah data, bukan menulis ulang konfigurasi. Untuk parsing output CLI menjadi data terstruktur, gunakan **TextFSM/ntc-templates**, **TTP**, atau **Genie**.

## SSH automation (Netmiko)

**Netmiko** menangani detail koneksi SSH ke berbagai vendor (prompt, paging, mode konfigurasi).

```python
from netmiko import ConnectHandler

perangkat = {
    "device_type": "cisco_ios",            # juga: arista_eos, juniper_junos, mikrotik_routeros, linux, …
    "host": "192.168.56.11",
    "username": "admin",
    "password": os.environ["NET_PASSWORD"],
}
with ConnectHandler(**perangkat) as conn:
    ver = conn.send_command("show version", use_textfsm=True)     # parsing ke list of dict
    print(ver[0]["version"], ver[0]["uptime"])
    out = conn.send_config_set(["vlan 30", "name SERVER"])
    conn.save_config()
```

Netmiko cocok untuk tugas cepat dan perangkat yang tidak punya API. Kelemahannya: kamu tetap bekerja dengan teks CLI per vendor dan harus menangani sendiri pemeriksaan hasil.

## Multi-vendor (NAPALM)

**NAPALM** menyediakan antarmuka yang sama untuk berbagai sistem operasi jaringan:

```python
from napalm import get_network_driver

driver = get_network_driver("ios")              # eos, junos, nxos, iosxr, …
with driver("192.168.56.11", "admin", os.environ["NET_PASSWORD"]) as dev:
    print(dev.get_facts()["os_version"])
    print(dev.get_interfaces_ip())
    print(dev.get_bgp_neighbors())              # data terstruktur, seragam lintas vendor

    dev.load_merge_candidate(config="ntp server 10.0.0.5\n")
    diff = dev.compare_config()                 # dry-run: apa yang akan berubah?
    if diff and input(diff + "\nTerapkan? [y/N] ") == "y":
        dev.commit_config()                     # (rollback_config() tersedia jika perlu)
    else:
        dev.discard_config()
```

**Getters** (`get_facts`, `get_interfaces`, `get_lldp_neighbors`, …) sangat berguna untuk inventaris dan validasi. **Config merge/replace + compare** memungkinkan alur aman: lihat diff dulu, terapkan, dan rollback bila perlu.

## Orkestrasi (Nornir)

Menjalankan tugas ke ratusan perangkat satu per satu terlalu lambat. **Nornir** adalah framework Python murni dengan **inventory**, **paralelisme (threads)**, dan plugin untuk Netmiko/NAPALM.

```python
from nornir import InitNornir
from nornir.core.filter import F
from nornir_napalm.plugins.tasks import napalm_get
from nornir_utils.plugins.functions import print_result

nr = InitNornir(config_file="config.yaml")          # hosts.yaml, groups.yaml, atau plugin NetBox
cabang = nr.filter(F(groups__contains="cabang"))     # hanya perangkat grup cabang
hasil = cabang.run(task=napalm_get, getters=["facts", "interfaces"])
print_result(hasil)

gagal = [h for h, r in hasil.items() if r.failed]
print("gagal:", gagal)
```

Dibandingkan **Ansible** (berbasis YAML, sangat populer, tanpa perlu menulis Python), Nornir memberi fleksibilitas penuh Python dan debugging yang lebih mudah. Keduanya valid; pilih yang paling cocok dengan tim.

## Source of truth (NetBox)

**NetBox** adalah aplikasi web untuk mendokumentasikan infrastruktur: situs, rak, perangkat, antarmuka, kabel, VLAN, prefix, dan alamat IP (**IPAM/DCIM**). Dalam otomasi, NetBox menjadi **source of truth**: keadaan yang **diinginkan**.

```viz
{"type":"flow","title":"Alur otomasi berbasis source of truth","steps":[{"label":"Ubah data","detail":"Tambah VLAN/IP di NetBox (lewat UI atau API), ditinjau."},{"label":"Render","detail":"Template Jinja2 + data NetBox → konfigurasi kandidat."},{"label":"Validasi","detail":"Diff, linting, simulasi (Batfish)."},{"label":"Terapkan","detail":"Nornir/NAPALM, bertahap."},{"label":"Verifikasi","detail":"Keadaan aktual dibandingkan dengan SoT; selisih = drift."}]}
```

```python
import pynetbox
nb = pynetbox.api("https://netbox.lab", token=os.environ["NETBOX_TOKEN"])
for iface in nb.dcim.interfaces.filter(device="r1-cabang-kotabaru"):
    ips = nb.ipam.ip_addresses.filter(interface_id=iface.id)
    print(iface.name, [str(ip.address) for ip in ips])
```

Dengan pola ini, NetBox selalu akurat (karena konfigurasi berasal darinya), dan perubahan yang dilakukan manual di perangkat terdeteksi sebagai **configuration drift**.

## Validasi konfigurasi

Otomasi mempercepat perubahan, termasuk perubahan yang salah. Validasi mengurangi risiko:

```viz
{"type":"compare","columns":["Tahap","Contoh pemeriksaan","Alat"],"rows":[{"label":"Sebelum (statis)","values":["Sintaks valid, tidak ada subnet tumpang tindih, ACL tidak memblokir manajemen","Batfish, linting, unit test template"]},{"label":"Pra-perubahan (snapshot)","values":["Catat neighbor OSPF/BGP, status antarmuka, tabel routing","NAPALM getters, pyATS"]},{"label":"Penerapan","values":["Diff dulu, canary ke 1–2 perangkat, rollback otomatis bila gagal","NAPALM commit/rollback"]},{"label":"Pasca-perubahan","values":["Bandingkan snapshot: neighbor sama? route hilang? ping antar situs?","pyATS, skrip Nornir"]}]}
```

```python
def cek_neighbor(sebelum: dict, sesudah: dict) -> list[str]:
    hilang = set(sebelum) - set(sesudah)
    return [f"neighbor hilang: {n}" for n in hilang]
```

Simpan konfigurasi, template, dan skrip di **Git**, gunakan **pull request** untuk peninjauan, dan jalankan validasi otomatis di CI. Praktik ini sering disebut **NetDevOps**. Validasi berbasis model dengan Batfish dibahas lebih lanjut di [Cloud networking & SDN](/belajar/jaringan/net-6).

:::latihan
Milestone: di lab containerlab/GNS3 berisi ≥ 4 perangkat, (1) buat inventory Nornir; (2) kumpulkan `facts` dan antarmuka semua perangkat ke file JSON dengan NAPALM; (3) pasang NetBox (Docker) dan isi data VLAN serta IP; (4) render konfigurasi VLAN dari NetBox dengan Jinja2, tampilkan diff, terapkan bertahap; (5) buat skrip validasi pra/pasca perubahan yang membandingkan neighbor dan status antarmuka. Simpan semuanya di repo Git dengan README.
:::

## Rangkuman

- Pisahkan data (intended state) dari template vendor; rahasia dari environment/vault.
- Netmiko: SSH multi-vendor untuk perintah & konfigurasi teks; TextFSM untuk parsing.
- NAPALM: getters terstruktur dan merge/replace dengan diff, commit, rollback lintas vendor.
- Nornir: inventory + paralelisme dalam Python; Ansible sebagai alternatif berbasis YAML.
- NetBox sebagai source of truth; perubahan dimulai dari data, drift terdeteksi.
- Validasi berlapis: statis, snapshot pra/pasca, canary, Git + CI (NetDevOps).
