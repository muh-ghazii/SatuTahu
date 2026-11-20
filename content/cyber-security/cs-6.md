---
title: Blue team & incident response
minutes: 55
summary: Tidak ada pertahanan yang sempurna, sehingga kemampuan mendeteksi dan merespons sama pentingnya dengan mencegah. Modul ini membahas peran Security Operations Center (SOC), deteksi dan triase alert, siklus incident response, forensik digital dasar, dan pemakaian threat intelligence untuk memperkuat pertahanan.
objectives:
  - Menjelaskan peran, tingkatan, dan metrik SOC
  - Melakukan triase alert secara konsisten dengan playbook
  - Menjalankan siklus incident response dari persiapan hingga pelajaran
  - Mengumpulkan dan menganalisis bukti digital dengan menjaga integritasnya
  - Memakai threat intelligence dan MITRE ATT&CK untuk deteksi dan perburuan
sources:
  - repo: meirwah/awesome-incident-response
    note: Kumpulan alat & sumber incident response
  - repo: microsoft/Security-101
    note: Kurikulum dasar keamanan (termasuk operasi keamanan)
  - repo: trimstray/the-book-of-secret-knowledge
    note: Kumpulan alat & perintah praktis untuk admin & security
quiz:
  - q: "Saat menemukan server yang dikompromikan, tindakan yang sebaiknya DIHINDARI adalah…"
    options: ["Mengisolasi dari jaringan", "Langsung mematikan & menginstal ulang tanpa mengamankan bukti", "Mencatat linimasa", "Mengambil image memori bila memungkinkan"]
    answer: 1
    explain: "Bukti volatil (memori, koneksi aktif) hilang; akar masalah dan cakupan tidak diketahui."
  - q: "MITRE ATT&CK adalah…"
    options: ["Antivirus", "Basis pengetahuan taktik & teknik penyerang yang diamati di dunia nyata", "Firewall", "Bahasa pemrograman"]
    answer: 1
    explain: "Dipakai untuk memetakan cakupan deteksi dan merencanakan perburuan."
  - q: "Hash file pada bukti digital dihitung untuk…"
    options: ["Mengompresi bukti", "Membuktikan bukti tidak berubah sejak dikumpulkan (integritas & chain of custody)", "Menyembunyikan isi", "Mempercepat analisis"]
    answer: 1
    explain: "Analisis dilakukan pada salinan; hash membuktikan salinan identik dengan aslinya."
  - q: "Indicator of Compromise (IoC) seperti alamat IP penyerang memiliki kelemahan…"
    options: ["Tidak bisa dicari", "Mudah diganti penyerang sehingga cepat usang; deteksi berbasis perilaku (TTP) lebih tahan lama", "Terlalu mahal", "Tidak ada"]
    answer: 1
    explain: "Pyramid of Pain: semakin tinggi (TTP), semakin sulit penyerang mengubahnya."
---

**Red team** menyerang untuk menguji pertahanan; **blue team** mempertahankan: memantau, mendeteksi, merespons, dan memulihkan. Karena pencegahan pasti suatu saat gagal, organisasi yang tangguh adalah yang **mendeteksi lebih cepat** dan **merespons lebih terarah**. Modul ini melanjutkan fondasi logging dan SIEM dari [Keamanan jaringan & sistem](/belajar/cyber-security/cs-4).

## Peran SOC

**Security Operations Center (SOC)** adalah tim (internal atau layanan terkelola) yang memantau keamanan organisasi secara terus-menerus.

```viz
{"type":"layers","layers":[{"label":"Tier 3 / threat hunter & engineer","detail":"Perburuan ancaman proaktif, pengembangan deteksi, analisis malware","tag":"proaktif"},{"label":"Tier 2 / incident responder","detail":"Investigasi mendalam, penanganan insiden, koordinasi pemulihan","tag":"investigasi"},{"label":"Tier 1 / analis triase","detail":"Memantau antrean alert, triase, eskalasi","tag":"pemantauan"},{"label":"Teknologi","detail":"SIEM, EDR, NDR, SOAR (otomasi playbook), ticketing","tag":"alat"}]}
```

Metrik umum SOC: **MTTD** (rata-rata waktu mendeteksi), **MTTR** (rata-rata waktu merespons/memulihkan), rasio **false positive**, dan **cakupan deteksi** terhadap teknik ATT&CK yang relevan. Tantangan terbesar di SOC sering bukan kurangnya alert, melainkan **terlalu banyak alert berkualitas rendah** yang membuat analis kelelahan. Karena itu rekayasa deteksi (memperbaiki aturan) dan otomasi (**SOAR**) sama pentingnya dengan menambah alat.

## Deteksi & triase alert

**Triase** menjawab dengan cepat: apakah alert ini benar, seberapa parah, dan apa langkah berikutnya?

```viz
{"type":"flow","title":"Triase satu alert","steps":[{"label":"Baca konteks","detail":"Aturan apa yang memicu? Aset siapa? Seberapa kritis?"},{"label":"Kumpulkan bukti","detail":"Log terkait ±30 menit: proses, login, koneksi jaringan."},{"label":"Perkaya","detail":"Reputasi IP/domain/hash, riwayat pengguna, perubahan terjadwal?"},{"label":"Putuskan","detail":"True positive, benign (benar tapi sah), atau false positive."},{"label":"Tindak lanjut","detail":"Eskalasi sebagai insiden, tutup dengan catatan, atau perbaiki aturan."}]}
```

```viz
{"type":"confusion"}
```

Matriks di atas berlaku juga untuk deteksi keamanan: **false negative** (serangan tidak terdeteksi) berbahaya, tetapi **false positive** yang berlebihan juga berbahaya karena membuat alert asli terabaikan. Setiap false positive sebaiknya menghasilkan perbaikan aturan (pengecualian yang tepat, ambang yang lebih baik).

Gunakan **playbook** tertulis untuk jenis alert yang sering muncul (phishing dilaporkan, login mencurigakan, malware di endpoint) agar analis bertindak konsisten. Contoh query perburuan sederhana pada log autentikasi:

```bash
# login berhasil dari IP yang sebelumnya gagal >20 kali (lab)
awk '/Failed password/ {f[$(NF-3)]++} /Accepted/ {a[$(NF-3)]++}
     END {for (ip in a) if (f[ip] > 20) print ip, f[ip], a[ip]}' /var/log/auth.log
```

## Siklus incident response

Kerangka **NIST** (SP 800-61) menggambarkan penanganan insiden sebagai siklus:

```viz
{"type":"flow","title":"Siklus incident response","loop":true,"steps":[{"label":"Persiapan","detail":"Rencana IR, peran & kontak, playbook, alat, backup teruji, latihan tabletop."},{"label":"Deteksi & analisis","detail":"Konfirmasi insiden, tentukan cakupan & tingkat keparahan, mulai linimasa."},{"label":"Penahanan","detail":"Isolasi host, nonaktifkan akun, blokir IoC — jangka pendek & panjang."},{"label":"Pembasmian","detail":"Hapus akses penyerang: malware, akun/backdoor, celah yang dipakai."},{"label":"Pemulihan","detail":"Pulihkan dari sumber bersih, pantau ketat, kembali normal bertahap."},{"label":"Pelajaran","detail":"Postmortem, perbaiki kontrol & deteksi, perbarui playbook."}]}
```

Hal-hal yang sering menentukan keberhasilan:

- **Persiapan** adalah fase terpenting: siapa memutuskan apa, siapa dihubungi (manajemen, hukum, humas), dan apakah **backup** benar-benar bisa dipulihkan (ransomware sering menargetkan backup).
- **Catat linimasa** sejak awal: waktu, tindakan, siapa, temuan.
- **Penahanan sebelum pembasmian**: membersihkan satu host sementara penyerang masih punya akses di tempat lain hanya memberi tahu penyerang bahwa ia ketahuan.
- **Komunikasi** terkoordinasi; untuk kebocoran data pribadi, **UU PDP** mewajibkan pemberitahuan tertulis kepada subjek data dan lembaga terkait dalam batas waktu tertentu (paling lambat 3 × 24 jam) — libatkan bagian hukum sejak awal.
- Gunakan **saluran komunikasi terpisah** bila email atau chat internal mungkin ikut dikompromikan.

## Forensik digital dasar

Tujuan forensik dalam IR: memahami **apa yang terjadi, kapan, bagaimana, dan seberapa luas**, dengan bukti yang dapat dipertanggungjawabkan.

```viz
{"type":"compare","columns":["Prinsip","Praktik"],"rows":[{"label":"Urutan volatilitas","values":["Kumpulkan yang paling cepat hilang dulu: memori & koneksi aktif → proses → disk → log jarak jauh"]},{"label":"Integritas","values":["Analisis pada salinan; hitung hash (SHA-256) bukti asli dan salinan"]},{"label":"Chain of custody","values":["Catat siapa mengumpulkan, kapan, bagaimana, disimpan di mana, dan siapa yang mengakses"]},{"label":"Dokumentasi","values":["Setiap perintah & temuan dicatat dengan waktu"]}]}
```

```bash
# Linux — pengumpulan triase cepat (simpan output ke media eksternal, bukan ke disk korban)
date -u; uptime; who -a
ps auxf > proses.txt
ss -tanp > koneksi.txt
ls -la /tmp /dev/shm /var/tmp > tmp_listing.txt
crontab -l; ls -la /etc/cron.* /etc/systemd/system/
last -Faiw > login.txt
sha256sum proses.txt koneksi.txt > hash_bukti.txt
```

Untuk analisis lebih dalam: **image disk** (dd/FTK Imager) dan **image memori** (LiME, WinPmem) dianalisis dengan **Volatility**, **Autopsy/The Sleuth Kit**, dan pembuatan **super timeline** (Plaso). Di Windows, sumber penting antara lain Event Log (logon 4624/4625, pembuatan proses 4688), Sysmon, prefetch, dan registry. Bila insiden mungkin berlanjut ke ranah hukum, libatkan ahli forensik bersertifikat karena standar pembuktiannya lebih ketat.

## Threat intelligence

**Threat intelligence** adalah informasi tentang ancaman (siapa, bagaimana, dengan alat apa) yang diolah agar dapat ditindaklanjuti.

```viz
{"type":"layers","layers":[{"label":"TTP (taktik, teknik, prosedur)","detail":"Cara kerja penyerang — paling sulit diubah, paling bernilai untuk deteksi","tag":"sulit diubah"},{"label":"Alat","detail":"Malware/tool tertentu","tag":""},{"label":"Artefak jaringan/host","detail":"Pola user-agent, nama file, kunci registry","tag":""},{"label":"Domain","detail":"Domain C2/phishing","tag":""},{"label":"Alamat IP","detail":"Mudah diganti","tag":""},{"label":"Hash file","detail":"Sangat mudah diganti","tag":"mudah diubah"}]}
```

Tingkatan ini disebut **Pyramid of Pain**: mendeteksi berdasarkan hash atau IP berguna tetapi cepat usang, sedangkan deteksi berbasis **perilaku (TTP)** memaksa penyerang mengubah cara kerjanya. **MITRE ATT&CK** memetakan taktik (tujuan, mis. *Initial Access*, *Persistence*, *Exfiltration*) dan teknik (cara, mis. T1566 Phishing, T1059 Command and Scripting Interpreter) yang diamati di dunia nyata. Pakai untuk:

- Memetakan **cakupan deteksi**: teknik mana yang sudah punya aturan, mana yang belum.
- Merencanakan **threat hunting** berbasis hipotesis ("apakah ada persistence lewat scheduled task baru?").
- Menyusun **latihan purple team**: red team menjalankan teknik, blue team memverifikasi deteksinya.

Sumber intelijen: laporan vendor dan CERT (termasuk BSSN/ID-SIRTII di Indonesia), feed terbuka (abuse.ch, AlienVault OTX), dan platform berbagi seperti **MISP**. Intelijen hanya bernilai bila **relevan** dengan organisasimu dan **ditindaklanjuti** menjadi deteksi atau kontrol.

:::latihan
Milestone akhir jalur: di lab Wazuh/Security Onion dari modul sebelumnya, (1) tulis 3 playbook triase (login mencurigakan, phishing dilaporkan, proses mencurigakan); (2) jalankan simulasi serangan sederhana di VM korban (mis. brute force SSH lalu pembuatan cron persistence) dan tangani mengikuti siklus NIST dengan linimasa; (3) kumpulkan bukti triase dengan hash dan catatan chain of custody; (4) petakan langkah serangan ke teknik MITRE ATT&CK dan buat satu aturan deteksi baru berbasis perilaku; (5) tulis laporan insiden dan postmortem.
:::

## Rangkuman

- SOC bertingkat (triase, responder, hunter/engineer) dengan SIEM, EDR, SOAR; ukur MTTD, MTTR, false positive, cakupan.
- Triase: konteks → bukti → pengayaan → keputusan → tindak lanjut; playbook dan perbaikan aturan dari false positive.
- IR (NIST): persiapan → deteksi & analisis → penahanan → pembasmian → pemulihan → pelajaran; patuhi kewajiban notifikasi UU PDP.
- Forensik: urutan volatilitas, salinan + hash, chain of custody, dokumentasi; Volatility, Autopsy, Plaso.
- Threat intelligence: Pyramid of Pain, MITRE ATT&CK untuk cakupan deteksi, hunting, dan purple team.
