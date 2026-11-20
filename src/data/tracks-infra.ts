import type { Resource, Track } from "./types";

export const infraTracks: Track[] = [
  {
    slug: "jaringan",
    name: "Jaringan Komputer & Network Engineer",
    short: "Jaringan",
    category: "infra",
    icon: "Router",
    tagline: "Pahami bagaimana data berpindah, lalu otomasi jaringannya.",
    description:
      "Jalur ini membangun pemahaman jaringan dari model OSI/TCP-IP, subnetting, routing & switching, hingga keamanan dan network automation dengan Python. Catatan jujur: materi jaringan di GitHub lebih banyak berupa tool & lab daripada kursus berurutan, jadi jalur ini sengaja dipadukan dengan simulator (GNS3, containerlab) agar kamu banyak praktik.",
    level: "Pemula → Menengah",
    duration: "5–7 bulan",
    roles: ["Network Engineer", "NOC Engineer", "Network Automation Engineer", "SysAdmin"],
    tools: ["Wireshark", "GNS3", "containerlab", "Linux", "Python", "Netmiko", "Nornir", "Nmap"],
    concept: {
      title: "Model OSI: perjalanan satu paket",
      caption: "Setiap lapisan membungkus data dari lapisan di atasnya (enkapsulasi). Troubleshooting jaringan = menebak lapisan mana yang bermasalah.",
      nodes: [
        { label: "Aplikasi (L7)", detail: "HTTP, DNS, SMTP: protokol yang dipakai aplikasi." },
        { label: "Transport (L4)", detail: "TCP/UDP: port, segmentasi, keandalan pengiriman." },
        { label: "Network (L3)", detail: "IP & routing: memilih jalur antar jaringan." },
        { label: "Data Link (L2)", detail: "Ethernet, MAC address, switch, VLAN." },
        { label: "Fisik (L1)", detail: "Kabel, fiber, sinyal radio, bit di media transmisi." },
      ],
    },
    stages: [
      {
        id: "net-1",
        title: "Fondasi: OSI, TCP/IP & Linux",
        duration: "4 minggu",
        goal: "Memahami lapisan jaringan dan nyaman memakai Linux untuk diagnosis.",
        topics: ["Model OSI & TCP/IP", "Enkapsulasi", "DNS, DHCP, ARP", "Perintah: ping, traceroute, ip, ss, dig", "Apa yang terjadi saat membuka URL"],
        resources: [
          { repo: "alex/what-happens-when", kind: "referensi", lang: "EN", note: "Penelusuran detail dari menekan Enter hingga halaman tampil: DNS, ARP, TCP, TLS." },
          { repo: "facyber/awesome-networking", kind: "awesome", lang: "EN", note: "Kurasi kursus, buku, dan tutorial jaringan. Gunakan sebagai daftar bacaan utama." },
          { repo: "jlevy/the-art-of-command-line", kind: "referensi", lang: "EN", note: "Keterampilan command line yang wajib untuk admin jaringan." },
        ],
        milestone: "Diagram jaringan rumah/kos-mu + penjelasan alur paket saat membuka satu website.",
      },
      {
        id: "net-2",
        title: "IP addressing, subnetting & analisis paket",
        duration: "4 minggu",
        goal: "Merancang skema IP dan membaca lalu lintas jaringan.",
        topics: ["IPv4 & IPv6", "Subnetting & CIDR", "NAT", "TCP handshake & flags", "Analisis paket dengan Wireshark"],
        resources: [
          { repo: "wireshark/wireshark", kind: "tool", lang: "EN", note: "Mirror kode Wireshark. Pasang aplikasinya, lalu tangkap & analisis trafikmu sendiri." },
          { repo: "caesar0301/awesome-pcaptools", kind: "awesome", lang: "EN", note: "Tool untuk memproses file pcap; berguna untuk analisis trafik lanjutan." },
          { repo: "beejjorgensen/bgnet", kind: "buku", lang: "EN", note: "Beej's Guide to Network Programming: memahami socket TCP/UDP lewat kode C." },
        ],
        milestone: "Rancangan subnet kampus fiktif (5 gedung, VLAN per divisi) + analisis capture HTTP vs HTTPS.",
      },
      {
        id: "net-3",
        title: "Routing, switching & lab simulasi",
        duration: "6 minggu",
        goal: "Membangun dan men-troubleshoot topologi multi-router.",
        topics: ["Switching & VLAN", "Static routing", "OSPF & BGP dasar", "STP", "Lab virtual dengan GNS3 / containerlab"],
        resources: [
          { repo: "GNS3/gns3-gui", kind: "tool", lang: "EN", note: "Simulator jaringan grafis yang populer untuk latihan topologi router/switch." },
          { repo: "srl-labs/containerlab", kind: "tool", lang: "EN", note: "Bangun lab jaringan berbasis container dari file YAML. Ringan dan bisa di-versikan." },
          { repo: "mininet/mininet", kind: "tool", lang: "EN", note: "Emulator jaringan untuk eksperimen SDN dan topologi besar di satu laptop." },
        ],
        milestone: "Lab OSPF 4 router + 2 VLAN di containerlab/GNS3 dengan dokumentasi troubleshooting.",
      },
      {
        id: "net-4",
        title: "Keamanan jaringan & hardening",
        duration: "4 minggu",
        goal: "Mengamankan server dan jaringan dari serangan umum.",
        topics: ["Firewall & ACL", "VPN & TLS", "Port scanning", "Hardening server Linux", "Monitoring & log"],
        resources: [
          { repo: "imthenachoman/How-To-Secure-A-Linux-Server", kind: "referensi", lang: "EN", note: "Panduan langkah demi langkah mengamankan server Linux: SSH, firewall, audit." },
          { repo: "nmap/nmap", kind: "tool", lang: "EN", note: "Pemindai jaringan standar industri. Pakai hanya pada jaringan milikmu/lab." },
          { repo: "microsoft/Security-101", kind: "kurikulum", lang: "EN", note: "8 pelajaran dasar keamanan siber dari Microsoft, termasuk keamanan jaringan." },
          { repo: "sbilly/awesome-security", kind: "awesome", lang: "EN", note: "Kurasi tool & sumber keamanan (IDS, firewall, forensik jaringan)." },
        ],
        milestone: "Hardening VPS + laporan hasil scan sebelum & sesudah.",
      },
      {
        id: "net-5",
        title: "Network automation dengan Python",
        duration: "5 minggu",
        goal: "Mengotomasi konfigurasi dan validasi jaringan.",
        topics: ["Python untuk jaringan", "SSH automation (Netmiko)", "Multi-vendor (NAPALM)", "Orkestrasi (Nornir)", "Source of truth (NetBox)", "Validasi konfigurasi"],
        resources: [
          { repo: "networktocode/awesome-network-automation", kind: "awesome", lang: "EN", note: "Kurasi utama dunia network automation: tool, buku, blog, komunitas." },
          { repo: "ktbyers/netmiko", kind: "tool", lang: "EN", note: "Library SSH multi-vendor. Mulai otomasi dari sini." },
          { repo: "napalm-automation/napalm", kind: "tool", lang: "EN", note: "API seragam untuk berbagai vendor (Cisco, Juniper, Arista)." },
          { repo: "nornir-automation/nornir", kind: "tool", lang: "EN", note: "Framework otomasi Python murni dengan inventory & eksekusi paralel." },
          { repo: "netbox-community/netbox", kind: "tool", lang: "EN", note: "Source of truth untuk IPAM & inventaris perangkat." },
          { repo: "PacktPublishing/Mastering-Python-Networking-Fourth-Edition", kind: "buku", lang: "EN", note: "Kode buku Mastering Python Networking (edisi 4).", paidBook: true },
        ],
        milestone: "Script Nornir yang mem-backup konfigurasi semua router di lab dan mendeteksi perubahan.",
      },
      {
        id: "net-6",
        title: "Cloud networking & SDN",
        duration: "3 minggu",
        goal: "Memahami jaringan di era cloud dan software-defined.",
        topics: ["VPC, subnet, security group", "Load balancer", "SDN & OpenFlow", "Jaringan Kubernetes", "Validasi konfigurasi otomatis"],
        resources: [
          { repo: "sdnds-tw/awesome-sdn", kind: "awesome", lang: "EN", note: "Kurasi sumber Software Defined Networking." },
          { repo: "batfish/batfish", kind: "tool", lang: "EN", note: "Analisis konfigurasi jaringan untuk menemukan bug sebelum diterapkan." },
          { repo: "kelseyhightower/kubernetes-the-hard-way", kind: "kurikulum", lang: "EN", note: "Membangun Kubernetes manual: cara terbaik memahami jaringan pod & service." },
        ],
        milestone: "Diagram & implementasi VPC 3-tier (publik/privat/DB) dengan aturan keamanannya.",
      },
    ],
    projects: [
      { title: "Desain jaringan kantor/UMKM", detail: "Topologi, VLAN, IP plan, dan estimasi perangkat." },
      { title: "Monitoring jaringan kos/rumah", detail: "Deteksi perangkat baru & pemakaian bandwidth." },
      { title: "Backup konfigurasi otomatis", detail: "Nornir + Git untuk riwayat perubahan konfigurasi." },
    ],
    related: ["backend", "data-engineering", "ai-engineer"],
  },
];

/** Sumber umum yang berguna untuk semua jalur */
export const foundations: Resource[] = [
  { repo: "nilbuild/developer-roadmap", kind: "referensi", lang: "EN", note: "Roadmap interaktif untuk puluhan peran teknologi (sebelumnya kamranahmedse/developer-roadmap)." },
  { repo: "ossu/computer-science", kind: "kurikulum", lang: "EN", note: "Kurikulum ilmu komputer setara S1, sepenuhnya dari kursus gratis." },
  { repo: "EbookFoundation/free-programming-books", kind: "buku", lang: "EN", note: "Ribuan buku pemrograman gratis, termasuk bagian Bahasa Indonesia." },
  { repo: "jwasham/coding-interview-university", kind: "kurikulum", lang: "EN", note: "Rencana belajar CS lengkap untuk persiapan software engineer." },
  { repo: "codecrafters-io/build-your-own-x", kind: "proyek", lang: "EN", note: "Bangun ulang teknologi favorit (Git, Redis, database) dari nol." },
  { repo: "practical-tutorials/project-based-learning", kind: "proyek", lang: "EN", note: "Tutorial berbasis proyek di berbagai bahasa." },
  { repo: "Developer-Y/cs-video-courses", kind: "kurikulum", lang: "EN", note: "Daftar kuliah CS universitas dengan video gratis." },
  { repo: "TheAlgorithms/Python", kind: "latihan", lang: "EN", note: "Implementasi algoritma di Python untuk dipelajari & dikontribusi." },
  { repo: "sindresorhus/awesome", kind: "awesome", lang: "EN", note: "Induk dari semua ‘awesome list’ di GitHub." },
];
