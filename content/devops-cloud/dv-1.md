---
title: Linux & shell untuk server
minutes: 55
summary: Hampir semua server, container, dan cloud berjalan di atas Linux, sehingga kenyamanan di terminal adalah keterampilan dasar DevOps. Modul ini membahas struktur filesystem Linux, user, grup dan permission, proses dan systemd, shell scripting, serta SSH dan manajemen server.
objectives:
  - Menavigasi filesystem Linux dan tahu di mana konfigurasi, log, dan data berada
  - Mengelola user, grup, dan permission dengan prinsip hak minimum
  - Mengelola proses dan layanan dengan systemd serta membaca log dengan journalctl
  - Menulis shell script yang aman dan dapat dipakai ulang
  - Mengelola server jarak jauh dengan SSH secara aman dan efisien
sources:
  - repo: MichaelCade/90DaysOfDevOps
    note: Perjalanan belajar DevOps 90 hari (Linux, jaringan, container, cloud)
  - repo: dylanaraps/pure-bash-bible
    note: Kumpulan teknik Bash murni
  - repo: imthenachoman/How-To-Secure-A-Linux-Server
    note: Panduan mengamankan server Linux
quiz:
  - q: "Permission ‘-rwxr-x---’ dalam notasi oktal adalah…"
    options: ["777", "750", "755", "640"]
    answer: 1
    explain: "rwx = 7 (pemilik), r-x = 5 (grup), --- = 0 (lainnya)."
  - q: "Log sebuah layanan systemd bernama ‘toko-api’ dibaca dengan…"
    options: ["cat /etc/toko-api", "journalctl -u toko-api -f", "systemctl log toko-api", "ps aux toko-api"]
    answer: 1
    explain: "-u memilih unit, -f mengikuti log secara live."
  - q: "Baris ‘set -euo pipefail’ di awal script Bash berfungsi untuk…"
    options: ["Mempercepat eksekusi", "Menghentikan script saat ada perintah gagal, variabel tak terdefinisi, atau kegagalan di dalam pipe", "Mengaktifkan mode root", "Menyembunyikan output"]
    answer: 1
    explain: "Tanpa ini, script melanjutkan setelah error dan bisa merusak sesuatu."
  - q: "Konfigurasi sistem di Linux umumnya disimpan di direktori…"
    options: ["/home", "/etc", "/bin", "/tmp"]
    answer: 1
    explain: "/var untuk data yang berubah (log), /home untuk data pengguna, /tmp sementara."
---

DevOps adalah praktik menyatukan pengembangan dan operasi agar perangkat lunak dapat dirilis dengan cepat dan andal. Hampir setiap alat DevOps (Docker, Kubernetes, CI runner, server cloud) berjalan di **Linux**, sehingga terminal adalah tempat kerjamu sehari-hari. Kamu tidak harus hafal semua perintah, tetapi harus tahu **di mana mencari** dan **bagaimana memeriksa** sesuatu.

Untuk latihan, gunakan VM (VirtualBox/Multipass), WSL2 di Windows, atau VPS murah. Jangan bereksperimen di server produksi.

## Struktur filesystem Linux

Linux memiliki satu pohon direktori yang berawal dari `/` (root). Semua disk dan perangkat ‘dipasang’ (*mount*) di suatu titik pohon itu.

```viz
{"type":"tree","root":{"label":"/","children":[{"label":"/etc","detail":"Konfigurasi sistem & layanan (nginx, ssh, systemd)"},{"label":"/var","detail":"Data yang berubah: /var/log (log), /var/lib (database, docker)"},{"label":"/home","detail":"Direktori pengguna"},{"label":"/usr","detail":"Program & pustaka yang diinstal paket"},{"label":"/opt, /srv","detail":"Aplikasi pihak ketiga, data layanan"},{"label":"/tmp","detail":"Sementara; dibersihkan saat boot"},{"label":"/proc, /sys","detail":"Filesystem virtual: info proses & kernel"}]}}
```

```bash
pwd; ls -lah; cd /var/log
df -h                      # ruang disk per filesystem
du -sh /var/* | sort -h    # folder mana yang besar
find /etc -name "*.conf" -mtime -1        # file konfigurasi yang berubah 24 jam terakhir
grep -rn "listen" /etc/nginx/             # cari teks dalam file
tail -f /var/log/nginx/access.log         # ikuti log
less /etc/ssh/sshd_config                 # baca file panjang
```

Prinsip “**semuanya adalah file**” memudahkan otomasi: konfigurasi, log, bahkan informasi proses (`/proc/<pid>/`) dapat dibaca dengan alat yang sama.

## User, grup & permission

Setiap file memiliki **pemilik**, **grup**, dan izin **baca (r=4)**, **tulis (w=2)**, **eksekusi (x=1)** untuk pemilik, grup, dan lainnya.

```viz
{"type":"compare","columns":["Notasi","Oktal","Kegunaan umum"],"rows":[{"label":"-rw-r--r--","values":["644","File konfigurasi/HTML yang boleh dibaca semua"]},{"label":"-rw-------","values":["600","Kunci privat SSH, file rahasia"]},{"label":"-rwxr-xr-x","values":["755","Script/program yang boleh dijalankan semua"]},{"label":"drwxr-x---","values":["750","Direktori aplikasi untuk pemilik & grupnya"]}]}
```

```bash
sudo adduser deploy                       # buat user
sudo usermod -aG docker deploy            # tambahkan ke grup docker (-a: append!)
id deploy; groups deploy
sudo chown -R deploy:www-data /srv/toko   # ubah pemilik & grup
chmod 750 /srv/toko; chmod 600 ~/.ssh/id_ed25519
sudo -u deploy whoami                     # jalankan sebagai user lain
sudo visudo                               # edit hak sudo dengan aman
```

Prinsip **hak minimum**: aplikasi berjalan sebagai user khusus tanpa sudo, bukan root; hanya grup yang perlu yang dapat menulis ke direktori aplikasi. Hindari `chmod 777` — itu bukan solusi, melainkan lubang keamanan.

## Proses & systemd

```bash
ps aux | grep python          # daftar proses
top                           # (atau htop) CPU & memori live
kill -15 <pid>                # minta berhenti dengan sopan (SIGTERM)
kill -9 <pid>                 # paksa (SIGKILL) — upaya terakhir
free -h; uptime               # memori & load average
```

**systemd** mengelola layanan: menjalankan saat boot, me-restart saat crash, dan mencatat log.

```ini
# /etc/systemd/system/toko-api.service
[Unit]
Description=Toko API
After=network-online.target

[Service]
User=deploy
WorkingDirectory=/srv/toko
EnvironmentFile=/etc/toko/env
ExecStart=/srv/toko/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now toko-api      # aktif saat boot & jalankan sekarang
systemctl status toko-api
journalctl -u toko-api -f --since "10 min ago"
```

```viz
{"type":"fsm","states":[{"id":"inactive","detail":"Belum berjalan"},{"id":"activating","detail":"Sedang start"},{"id":"active","detail":"Berjalan normal"},{"id":"failed","detail":"Crash / exit error"}],"start":"inactive","transitions":[{"from":"inactive","to":"activating","event":"systemctl start"},{"from":"activating","to":"active","event":"proses siap"},{"from":"active","to":"failed","event":"crash"},{"from":"failed","to":"activating","event":"Restart=on-failure"},{"from":"active","to":"inactive","event":"systemctl stop"}]}
```

## Shell scripting

Shell script mengotomasi tugas berulang: backup, deploy sederhana, pembersihan log. Template yang aman:

```bash
#!/usr/bin/env bash
set -euo pipefail                     # berhenti saat error, variabel kosong, atau pipe gagal
IFS=$'\n\t'

BACKUP_DIR="/var/backups/toko"
RETENSI_HARI="${RETENSI_HARI:-7}"     # bisa dioverride lewat environment
TANGGAL="$(date +%F_%H%M)"

log() { echo "[$(date +%T)] $*" >&2; }

main() {
  mkdir -p "$BACKUP_DIR"
  log "Backup database ke $BACKUP_DIR/db_$TANGGAL.sql.gz"
  pg_dump --no-owner toko | gzip > "$BACKUP_DIR/db_$TANGGAL.sql.gz"

  log "Hapus backup lebih dari $RETENSI_HARI hari"
  find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +"$RETENSI_HARI" -delete

  log "Selesai"
}
main "$@"
```

Kebiasaan penting: **kutip variabel** (`"$VAR"`) agar spasi tidak memecah argumen, gunakan `shellcheck` untuk menemukan bug, dan beralihlah ke Python ketika logika mulai rumit (banyak percabangan, parsing JSON, error handling detail). Jadwalkan dengan `cron` atau **systemd timer**.

```bash
# crontab -e   → setiap hari pukul 02.30
30 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

## SSH & manajemen server

```bash
ssh-keygen -t ed25519 -C "laptop-ghazi"
ssh-copy-id deploy@203.0.113.10
```

```text
# ~/.ssh/config — singkatan host
Host toko-prod
    HostName 203.0.113.10
    User deploy
    IdentityFile ~/.ssh/id_ed25519
    ProxyJump bastion            # lewat server bastion
```

```bash
ssh toko-prod                                   # cukup nama alias
scp laporan.csv toko-prod:/tmp/                 # salin file
rsync -avz --delete ./build/ toko-prod:/srv/toko/static/    # sinkronisasi efisien
ssh -L 5432:localhost:5432 toko-prod            # tunnel: akses DB server dari laptop
tmux new -s kerja                                # sesi tetap hidup walau koneksi putus
```

Amankan server dengan login kunci saja dan firewall (rincian di [Keamanan jaringan & hardening](/belajar/jaringan/net-4)). Saat jumlah server bertambah, beralihlah dari SSH manual ke **otomasi** (Ansible, Infrastructure as Code) dan **container**, yang dibahas di modul-modul berikutnya.

:::latihan
Milestone: di sebuah VM, (1) buat user `deploy` dengan hak terbatas dan login SSH berbasis kunci melalui alias di `~/.ssh/config`; (2) jalankan aplikasi web kecil sebagai layanan systemd dengan restart otomatis, lalu matikan prosesnya secara paksa dan buktikan systemd menghidupkannya kembali lewat `journalctl`; (3) tulis script backup dengan `set -euo pipefail`, lolos `shellcheck`, dan jadwalkan dengan systemd timer atau cron.
:::

## Rangkuman

- Filesystem: /etc konfigurasi, /var data & log, /home pengguna; df, du, find, grep, tail.
- Permission rwx (4-2-1) untuk pemilik/grup/lainnya; hak minimum, hindari 777 dan root.
- systemd: unit service, enable/start/status, Restart=on-failure; journalctl untuk log.
- Shell script aman: set -euo pipefail, kutip variabel, shellcheck; pindah ke Python saat rumit.
- SSH: kunci ed25519, ~/.ssh/config, rsync, tunnel, tmux; skala dengan otomasi.
