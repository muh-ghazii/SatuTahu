---
title: Container, deployment & DevOps dasar
minutes: 45
summary: Kode yang belum di-deploy belum memberi nilai. Modul ini membawa API-mu dari laptop ke server, dengan mengemasnya ke container, memisahkan konfigurasi, mengotomasi test dan deploy, menaruh reverse proxy di depan, dan memantau kesehatannya.
objectives:
  - Menulis Dockerfile multi-stage dan docker-compose untuk API + database
  - Mengelola konfigurasi per lingkungan dengan prinsip 12-factor
  - Membuat pipeline CI/CD sederhana dengan GitHub Actions
  - Menempatkan Nginx sebagai reverse proxy dan memasang observability dasar
sources:
  - repo: docker/awesome-compose
    note: Pola docker-compose untuk berbagai stack aplikasi
  - repo: wsargent/docker-cheat-sheet
    note: Rujukan perintah dan praktik Docker
  - repo: MichaelCade/90DaysOfDevOps
    note: Urutan materi container dan CI/CD
  - repo: bregman-arie/devops-exercises
    note: Soal latihan untuk menguji pemahaman
quiz:
  - q: "Kenapa urutan instruksi di Dockerfile penting untuk kecepatan build?"
    options: ["Docker membaca dari bawah", "Setiap instruksi menjadi layer yang di-cache; layer setelah perubahan harus dibangun ulang", "Urutan tidak berpengaruh", "Agar image lebih aman"]
    answer: 1
    explain: "Salin package.json dan install dependency SEBELUM menyalin kode sumber, agar perubahan kode tidak memicu npm install ulang."
  - q: "Di docker-compose, API terhubung ke database dengan hostname…"
    options: ["localhost", "Nama service di compose, mis. db", "IP laptop", "127.0.0.1:5432"]
    answer: 1
    explain: "Compose membuat jaringan internal dengan DNS berdasarkan nama service. Di dalam container, localhost menunjuk ke container itu sendiri."
  - q: "Salah satu fungsi reverse proxy seperti Nginx di depan aplikasi adalah…"
    options: ["Menggantikan database", "Terminasi TLS/HTTPS, kompresi, dan meneruskan request ke aplikasi", "Menulis kode backend", "Menyimpan session"]
    answer: 1
    explain: "Reverse proxy menangani HTTPS, file statis, kompresi, dan bisa membagi beban ke beberapa instance aplikasi."
  - q: "Endpoint /health dipakai untuk…"
    options: ["Menampilkan data pengguna", "Health check oleh load balancer/orchestrator agar instance yang rusak tidak diberi trafik", "Login admin", "Dokumentasi"]
    answer: 1
    explain: "Health check yang memeriksa dependensi penting (mis. database) membuat sistem bisa mengganti instance bermasalah secara otomatis."
---

‘Di laptopku jalan kok’ adalah kalimat yang ditakuti setiap tim. Penyebabnya klasik: versi Node berbeda, variabel lingkungan lupa diset, atau database belum dimigrasi. Container dan otomasi menghapus kelas masalah ini. Modul ini adalah versi ringkas yang cukup untuk backend developer; pendalaman Kubernetes, cloud, dan SRE ada di jalur DevOps & Cloud.

## Docker & Docker Compose

**Container** membungkus aplikasi beserta semua yang dibutuhkannya (runtime, library, file) sehingga berjalan identik di mana pun. Berbeda dengan virtual machine, container berbagi kernel host sehingga ringan dan cepat dinyalakan.

**Image** tersusun dari **layer**. Setiap instruksi Dockerfile membuat layer yang di-cache:

```viz
{"type":"layers","title":"Layer pada image Node.js","caption":"Layer bawah jarang berubah sehingga tetap di-cache. Menaruh COPY kode sumber paling akhir membuat build ulang hanya beberapa detik.","layers":[{"label":"CMD [\"node\", \"dist/server.js\"]","tag":"metadata","detail":"Perintah default saat container dijalankan. Tidak menambah ukuran."},{"label":"COPY --from=build /app/dist","tag":"sering berubah","detail":"Hasil build kode sumber. Berubah setiap ada commit."},{"label":"RUN npm ci --omit=dev","tag":"kadang","detail":"Dependency produksi. Hanya dibangun ulang jika package-lock.json berubah."},{"label":"COPY package*.json","tag":"kadang","detail":"Disalin terpisah agar cache dependency bisa dipakai ulang."},{"label":"FROM node:22-alpine","tag":"jarang","detail":"Base image: sistem minimal + Node.js. Alpine kecil (±50 MB)."}]}
```

```dockerfile
# --- tahap build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- tahap produksi: hanya yang dibutuhkan saat runtime ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node                      # jangan jalankan sebagai root
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Docker Compose** menjalankan beberapa container sekaligus dari satu file:

```yaml
# compose.yaml
services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://app:rahasia@db:5432/toko   # ‘db’ = nama service
      REDIS_URL: redis://cache:6379
    depends_on:
      db: { condition: service_healthy }
  db:
    image: postgres:17
    environment: { POSTGRES_USER: app, POSTGRES_PASSWORD: rahasia, POSTGRES_DB: toko }
    volumes: [pgdata:/var/lib/postgresql/data]          # data tidak hilang saat container dihapus
    healthcheck: { test: ["CMD", "pg_isready", "-U", "app"], interval: 5s }
  cache:
    image: redis:7-alpine
volumes:
  pgdata:
```

```bash
docker compose up -d --build     # bangun & jalankan di latar belakang
docker compose logs -f api       # ikuti log
docker compose down              # matikan (tambahkan -v untuk hapus data)
```

## Environment & konfigurasi

Prinsip **12-factor app**: konfigurasi yang berbeda antar lingkungan (dev, staging, produksi) disimpan di **environment variable**, bukan di kode. Image yang **sama persis** dipromosikan dari staging ke produksi; yang berbeda hanya konfigurasinya.

| Jenis | Contoh | Disimpan di |
|---|---|---|
| Konfigurasi biasa | `PORT`, `LOG_LEVEL`, `NODE_ENV` | env var / file compose |
| Secret | `DATABASE_URL`, `JWT_SECRET` | secret manager / GitHub Secrets |
| Feature flag | `FITUR_CHECKOUT_BARU=true` | env var atau layanan feature flag |

Validasi konfigurasi saat aplikasi mulai (lihat contoh Zod di modul keamanan), sehingga aplikasi **gagal cepat** dengan pesan jelas, bukan error misterius saat request pertama datang.

## CI/CD dengan GitHub Actions

**CI** (*Continuous Integration*): setiap push dan PR otomatis di-lint, di-test, dan di-build. **CD** (*Continuous Delivery/Deployment*): hasil yang lolos otomatis dikemas dan di-deploy.

```viz
{"type":"flow","title":"Pipeline dari push sampai produksi","caption":"Jika satu langkah gagal, pipeline berhenti dan kode rusak tidak pernah sampai ke pengguna.","steps":[{"label":"Push / PR","detail":"Developer push ke branch atau membuka pull request."},{"label":"Lint & test","detail":"Runner GitHub menyalakan PostgreSQL sementara lalu menjalankan seluruh test."},{"label":"Build image","detail":"Setelah merge ke main, image Docker dibangun dan diberi tag sesuai commit SHA."},{"label":"Push ke registry","detail":"Image disimpan di GitHub Container Registry (ghcr.io)."},{"label":"Deploy","detail":"Server menarik image baru dan menjalankannya; migrasi database dijalankan lebih dulu."},{"label":"Verifikasi","detail":"Health check & smoke test; jika gagal, rollback ke image sebelumnya."}]}
```

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env: { POSTGRES_PASSWORD: test }
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 5s --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test
        env: { DATABASE_URL: postgres://postgres:test@localhost:5432/postgres }
```

## Reverse proxy (Nginx)

Aplikasi Node/Go/Python jarang langsung menghadap internet. Di depannya diletakkan **reverse proxy** seperti Nginx, Caddy, atau Traefik.

```viz
{"type":"load-balancer"}
```

Tugas reverse proxy: **terminasi TLS** (HTTPS), meneruskan request ke satu atau beberapa instance aplikasi (*load balancing*), menyajikan file statis, kompresi gzip/brotli, batas ukuran body, dan header keamanan.

```nginx
upstream api {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;          # instance kedua: load balancing round-robin
}

server {
    listen 443 ssl;
    server_name api.tokoseragam.id;
    ssl_certificate     /etc/letsencrypt/live/api.tokoseragam.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tokoseragam.id/privkey.pem;

    client_max_body_size 5m;

    location / {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Sertifikat HTTPS bisa didapat gratis dari **Let’s Encrypt** dengan `certbot`, atau otomatis jika memakai **Caddy**. Jangan lupa: karena request kini datang dari proxy, aplikasi harus membaca IP asli dari `X-Forwarded-For` (di Express: `app.set("trust proxy", 1)`), termasuk untuk rate limiting.

## Observability dasar

Setelah rilis, kamu perlu menjawab: apakah layanan hidup? cepat? ada error? Tiga pilar **observability**:

- **Logs**: catatan peristiwa (JSON terstruktur, dibahas di modul REST API).
- **Metrics**: angka dari waktu ke waktu, misalnya jumlah request per detik, latensi p95, error rate, CPU/memori.
- **Traces**: perjalanan satu request melewati beberapa layanan dan query, untuk menemukan bagian yang lambat.

Mulailah dari yang paling sederhana dan paling berdampak:

```ts
// /health: dipakai load balancer & monitoring untuk memeriksa kesehatan instance
app.get("/health", async (_req, res) => {
  try {
    await db.$queryRaw`SELECT 1`;
    res.json({ status: "ok", uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: "db-down" });
  }
});
```

Lalu tambahkan **uptime monitor** eksternal (mis. Uptime Kuma, gratis & self-hosted) yang memanggil `/health` tiap menit dan mengirim notifikasi Telegram/email saat gagal. Untuk metrics dan dashboard (Prometheus + Grafana) serta konsep SLO, lanjutkan ke jalur DevOps & Cloud.

:::latihan
Milestone: jalankan API + PostgreSQL + Redis dengan satu perintah `docker compose up`. Tambahkan workflow GitHub Actions yang menjalankan test dan membangun image ke `ghcr.io` saat merge ke `main`. Deploy ke VPS (atau VM lokal) di belakang Nginx/Caddy dengan HTTPS, dan pasang Uptime Kuma untuk memantau `/health`.
:::

## Rangkuman

- Container = aplikasi + semua dependensinya; Dockerfile multi-stage, urutan layer untuk cache, jalankan sebagai non-root.
- Compose menjalankan API + database + cache; antar service saling memanggil lewat nama service.
- Konfigurasi di environment variable; image yang sama untuk semua lingkungan.
- CI menguji setiap perubahan, CD mengemas dan men-deploy otomatis dengan health check dan rollback.
- Reverse proxy menangani HTTPS dan load balancing; observability dimulai dari log terstruktur, `/health`, dan uptime monitor.
