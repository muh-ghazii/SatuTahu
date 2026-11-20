---
title: Container dengan Docker
minutes: 55
summary: Container mengemas aplikasi beserta seluruh dependensinya sehingga berjalan sama di laptop, server, maupun cloud. Modul ini membahas container versus virtual machine, image dan layer, menulis Dockerfile yang efisien dan aman, volume dan network, serta menjalankan aplikasi multi-layanan dengan Docker Compose.
objectives:
  - Menjelaskan perbedaan container dan virtual machine
  - Memahami image, layer, dan cache build
  - Menulis Dockerfile multi-stage yang kecil, cepat, dan aman
  - Menyimpan data persisten dengan volume dan menghubungkan container dengan network
  - Menjalankan stack aplikasi dengan Docker Compose
sources:
  - repo: docker/awesome-compose
    note: Contoh Docker Compose untuk berbagai stack
  - repo: wsargent/docker-cheat-sheet
    note: Lembar ringkas perintah & konsep Docker
  - repo: veggiemonk/awesome-docker
    note: Kumpulan sumber & alat ekosistem Docker
quiz:
  - q: "Container lebih ringan daripada VM karena…"
    options: ["Tidak punya filesystem", "Berbagi kernel sistem operasi host; hanya mengisolasi proses", "Tidak bisa menjalankan aplikasi", "Selalu memakai Alpine"]
    answer: 1
    explain: "VM menjalankan kernel sendiri di atas hypervisor; container memakai namespace & cgroups."
  - q: "Mengapa ‘COPY requirements.txt’ dan ‘RUN pip install’ sebaiknya diletakkan sebelum ‘COPY . .’?"
    options: ["Agar file lebih kecil", "Agar layer instalasi dependensi tetap ter-cache saat hanya kode yang berubah", "Karena urutan tidak boleh diubah", "Agar lebih aman"]
    answer: 1
    explain: "Layer setelah perubahan pertama harus dibangun ulang."
  - q: "Data database di dalam container hilang setelah container dihapus karena…"
    options: ["Bug Docker", "Tidak memakai volume; lapisan tulis container bersifat sementara", "Database tidak didukung", "Network salah"]
    answer: 1
    explain: "Simpan data persisten di named volume atau bind mount."
  - q: "Dalam Docker Compose, layanan ‘api’ terhubung ke Postgres dengan host…"
    options: ["localhost", "Nama service, mis. ‘db’", "IP laptop", "0.0.0.0"]
    answer: 1
    explain: "Compose membuat network dengan DNS berbasis nama service; localhost di dalam container adalah container itu sendiri."
---

"Di laptop saya jalan kok" adalah keluhan klasik yang dipecahkan container. **Docker** mengemas aplikasi, runtime, pustaka, dan konfigurasinya menjadi satu **image** yang dapat dijalankan di mana pun Docker tersedia. Container juga menjadi unit dasar untuk CI/CD dan Kubernetes di modul berikutnya.

## Container vs virtual machine

```viz
{"type":"compare","columns":["Virtual machine","Container"],"rows":[{"label":"Isolasi","values":["Hypervisor; setiap VM punya kernel OS sendiri","Namespace & cgroups; berbagi kernel host"]},{"label":"Ukuran","values":["GB (OS lengkap)","MB (aplikasi + dependensi)"]},{"label":"Waktu start","values":["Puluhan detik–menit","Milidetik–detik"]},{"label":"Kepadatan","values":["Belasan per host","Ratusan per host"]},{"label":"Isolasi keamanan","values":["Lebih kuat","Lebih lemah — jangan anggap batas keamanan mutlak"]}]}
```

Di Linux, container adalah proses biasa yang diisolasi dengan **namespace** (proses, jaringan, filesystem, user terlihat terpisah) dan dibatasi dengan **cgroups** (CPU, memori). Di Windows dan macOS, Docker Desktop menjalankan VM Linux kecil di belakang layar. Container dan VM sering dipakai bersama: VM di cloud yang menjalankan banyak container.

## Image & layer

**Image** adalah templat read-only yang tersusun dari **layer**: setiap instruksi Dockerfile yang mengubah filesystem menambah satu layer. **Container** adalah instance image yang berjalan, dengan lapisan tulis tipis di atasnya.

```viz
{"type":"layers","layers":[{"label":"Lapisan tulis container","detail":"Perubahan saat runtime — hilang saat container dihapus","tag":"read-write"},{"label":"COPY . .","detail":"Kode aplikasi — paling sering berubah","tag":"layer 4"},{"label":"RUN pip install","detail":"Dependensi","tag":"layer 3"},{"label":"COPY requirements.txt","detail":"Daftar dependensi","tag":"layer 2"},{"label":"FROM python:3.12-slim","detail":"Base image","tag":"layer 1"}]}
```

```bash
docker pull nginx:1.27-alpine
docker images
docker run -d --name web -p 8080:80 nginx:1.27-alpine   # host:container
docker ps; docker logs -f web
docker exec -it web sh                                   # masuk ke container
docker stop web && docker rm web
docker history nginx:1.27-alpine                         # lihat layer
```

Layer dibagi antar image dan di-**cache** saat build: jika instruksi dan input-nya tidak berubah, Docker memakai ulang hasil sebelumnya. Urutan instruksi menentukan seberapa sering cache dapat dipakai. **Tag** seperti `latest` dapat berubah isinya; untuk reproducibility, gunakan tag versi spesifik.

## Menulis Dockerfile

```dockerfile
# syntax=docker/dockerfile:1
# ---- tahap build: pasang dependensi ----
FROM python:3.12-slim AS build
WORKDIR /app
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

# ---- tahap runtime: hanya yang diperlukan ----
FROM python:3.12-slim
RUN useradd --create-home --uid 10001 app
WORKDIR /app
COPY --from=build /venv /venv
COPY --chown=app:app . .
ENV PATH="/venv/bin:$PATH" PYTHONUNBUFFERED=1
USER app
EXPOSE 8000
HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```text
# .dockerignore — jangan kirim ini ke build context
.git
.venv
__pycache__
.env
node_modules
```

Praktik baik:

- **Multi-stage build**: alat build tidak ikut ke image akhir → lebih kecil dan lebih sedikit celah keamanan.
- **Urutan instruksi** dari yang jarang ke yang sering berubah.
- **User non-root** dan base image minimal (`-slim`, distroless).
- **Jangan masukkan rahasia** ke image (ENV/COPY); berikan saat runtime.
- **Pindai kerentanan** image (`docker scout cves`, Trivy) di CI.

```bash
docker build -t toko-api:1.0.0 .
docker run --rm -p 8000:8000 --env-file .env toko-api:1.0.0
```

## Volume & network

Data di lapisan tulis container hilang saat container dihapus. **Volume** menyimpan data di luar siklus hidup container.

```viz
{"type":"compare","columns":["Jenis","Contoh","Kegunaan"],"rows":[{"label":"Named volume","values":["-v pgdata:/var/lib/postgresql/data","Data database; dikelola Docker"]},{"label":"Bind mount","values":["-v ./src:/app/src","Development: kode di laptop langsung terlihat di container"]},{"label":"tmpfs","values":["--tmpfs /tmp","Data sementara di memori"]}]}
```

**Network**: container dalam satu **user-defined bridge network** dapat saling menghubungi berdasarkan **nama container**. Port hanya perlu dipublikasikan (`-p`) jika harus diakses dari luar host.

```bash
docker network create tokonet
docker volume create pgdata
docker run -d --name db --network tokonet -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=rahasia postgres:17
docker run -d --name api --network tokonet -p 8000:8000 \
  -e DATABASE_URL=postgresql://postgres:rahasia@db:5432/postgres toko-api:1.0.0
```

Perhatikan bahwa database **tidak** dipublikasikan ke host; hanya `api` yang bisa menjangkaunya melalui network internal.

## Docker Compose

Mengetik perintah `docker run` panjang untuk banyak layanan melelahkan dan rawan salah. **Docker Compose** mendefinisikan seluruh stack dalam satu file YAML:

```yaml
# compose.yaml
services:
  api:
    build: .
    ports: ["8000:8000"]
    env_file: .env
    environment:
      DATABASE_URL: postgresql://toko:${DB_PASSWORD}@db:5432/toko
      REDIS_URL: redis://cache:6379/0
    depends_on:
      db: { condition: service_healthy }
      cache: { condition: service_started }
    restart: unless-stopped
  db:
    image: postgres:17
    environment: { POSTGRES_USER: toko, POSTGRES_PASSWORD: "${DB_PASSWORD}", POSTGRES_DB: toko }
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U toko"]
      interval: 5s
      retries: 10
  cache:
    image: redis:7-alpine
volumes:
  pgdata:
```

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f api
docker compose exec db psql -U toko
docker compose down          # hentikan (volume tetap); tambahkan -v untuk menghapus volume
```

Compose sangat cocok untuk **pengembangan lokal**, **test integrasi di CI**, dan deployment sederhana di satu server. Untuk banyak server, ketersediaan tinggi, dan autoscaling, gunakan orkestrator seperti Kubernetes. Contoh stack siap pakai tersedia di `awesome-compose`.

:::latihan
Milestone: containerisasi aplikasi web milikmu (atau contoh FastAPI/Express sederhana) dengan Dockerfile multi-stage, user non-root, healthcheck, dan `.dockerignore`; bandingkan ukuran image single-stage vs multi-stage. Buat `compose.yaml` berisi aplikasi + Postgres + Redis dengan volume dan healthcheck. Buktikan data database bertahan setelah `docker compose down` lalu `up` lagi, dan pindai image dengan Trivy atau Docker Scout.
:::

## Rangkuman

- Container berbagi kernel host (namespace + cgroups): ringan dan cepat; VM mengisolasi lebih kuat.
- Image tersusun dari layer yang di-cache; urutkan instruksi dari jarang ke sering berubah; gunakan tag versi.
- Dockerfile baik: multi-stage, base minimal, non-root, tanpa rahasia, .dockerignore, scan kerentanan.
- Volume untuk data persisten; user-defined network dengan DNS nama container; publikasikan port seperlunya.
- Compose mendefinisikan stack multi-layanan untuk dev, CI, dan server tunggal.
