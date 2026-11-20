---
title: CI/CD dengan GitHub Actions
minutes: 55
summary: CI/CD mengotomasi jalur dari commit hingga aplikasi berjalan di produksi, sehingga rilis menjadi kejadian rutin yang membosankan, bukan peristiwa menegangkan. Modul ini membahas konsep CI/CD, workflow GitHub Actions, test otomatis di pipeline, artefak dan container registry, serta strategi deploy rolling, blue-green, dan canary.
objectives:
  - Menjelaskan continuous integration, delivery, dan deployment
  - Menulis workflow GitHub Actions dengan trigger, job, matrix, dan cache
  - Menyusun tahap test yang cepat dan bermakna di pipeline
  - Membangun, menandai, dan mempublikasikan image ke container registry
  - Memilih strategi deploy dan rencana rollback
sources:
  - repo: sdras/awesome-actions
    note: Kumpulan GitHub Actions & sumber belajar
  - repo: milanm/DevOps-Roadmap
    note: Peta jalan belajar DevOps
  - repo: bregman-arie/devops-exercises
    note: Latihan & pertanyaan DevOps (CI/CD, Docker, K8s, cloud)
quiz:
  - q: "Perbedaan continuous delivery dan continuous deployment adalah…"
    options: ["Tidak ada", "Delivery: setiap perubahan siap dirilis tetapi rilis ke produksi butuh persetujuan; deployment: otomatis sampai produksi", "Delivery hanya untuk mobile", "Deployment tidak memakai test"]
    answer: 1
    explain: "Keduanya butuh pipeline otomatis yang andal; bedanya pada gerbang terakhir."
  - q: "Cara paling aman memberi akses cloud ke GitHub Actions adalah…"
    options: ["Menyimpan access key di kode", "OIDC: workflow mendapat kredensial sementara dari cloud tanpa secret jangka panjang", "Mengirim password lewat issue", "Memakai akun root"]
    answer: 1
    explain: "Kredensial berumur pendek yang dibatasi per repo/branch mengurangi risiko kebocoran."
  - q: "Canary deployment berarti…"
    options: ["Menghapus versi lama dulu", "Merilis versi baru ke sebagian kecil pengguna, memantau metrik, lalu memperluas bertahap", "Menjalankan dua versi selamanya", "Rilis tanpa test"]
    answer: 1
    explain: "Masalah terdeteksi saat dampaknya masih kecil."
  - q: "Image produksi sebaiknya ditandai dengan…"
    options: ["latest saja", "Tag tidak berubah seperti SHA commit atau versi semantik", "Nama developer", "Tanggal tanpa jam"]
    answer: 1
    explain: "Tag yang tidak berubah membuat deploy dan rollback dapat ditelusuri."
---

Tanpa otomasi, rilis biasanya berarti seseorang menjalankan langkah-langkah manual di malam hari sambil berharap tidak ada yang terlupa. **CI/CD** mengubah rilis menjadi pipeline yang berjalan sama setiap kali, cepat memberi umpan balik, dan mudah dibatalkan.

## Konsep CI/CD

```viz
{"type":"flow","title":"Pipeline CI/CD","steps":[{"label":"Commit / PR","detail":"Developer push ke branch; PR dibuka."},{"label":"CI: build & test","detail":"Lint, unit test, build; hasil dalam hitungan menit."},{"label":"Artefak","detail":"Image container bertag SHA, dipindai, didorong ke registry."},{"label":"Deploy staging","detail":"Otomatis; test integrasi/E2E."},{"label":"Deploy produksi","detail":"Otomatis (deployment) atau dengan persetujuan (delivery)."},{"label":"Pantau & rollback","detail":"Metrik & error; kembali ke versi sebelumnya bila perlu."}]}
```

- **Continuous Integration (CI)**: setiap perubahan digabungkan sering (minimal harian) dan diverifikasi otomatis. Branch berumur pendek mengurangi konflik besar.
- **Continuous Delivery**: setiap perubahan yang lolos pipeline **siap** dirilis; rilis ke produksi dengan satu klik.
- **Continuous Deployment**: tanpa gerbang manual; setiap perubahan yang lolos langsung ke produksi.

Prasyaratnya bukan alat, melainkan kebiasaan: test otomatis yang dipercaya, perubahan kecil, dan kemampuan rollback. Metrik **DORA** mengukur kinerjanya: frekuensi deploy, lead time perubahan, tingkat kegagalan perubahan, dan waktu pemulihan.

## Workflow GitHub Actions

Workflow adalah file YAML di `.github/workflows/`. Strukturnya: **trigger** (`on`) → **job** (berjalan di runner) → **step** (perintah atau action).

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push: { branches: [main] }
  pull_request:
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }   # batalkan run lama di branch sama
permissions: { contents: read }                                         # hak minimum

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix: { python: ["3.11", "3.12"] }
    services:
      postgres:
        image: postgres:17
        env: { POSTGRES_PASSWORD: test }
        ports: ["5432:5432"]
        options: --health-cmd pg_isready --health-interval 5s --health-retries 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "${{ matrix.python }}", cache: pip }
      - run: pip install -r requirements.txt -r requirements-dev.txt
      - run: ruff check . && mypy app
      - run: pytest -q --cov=app --cov-report=xml
        env: { DATABASE_URL: "postgresql://postgres:test@localhost:5432/postgres" }
```

```viz
{"type":"compare","columns":["Konsep","Arti"],"rows":[{"label":"on","values":["Pemicu: push, pull_request, schedule (cron), workflow_dispatch (manual), release"]},{"label":"jobs","values":["Berjalan paralel secara default; needs: untuk urutan"]},{"label":"matrix","values":["Satu job dijalankan untuk beberapa kombinasi (versi, OS)"]},{"label":"cache","values":["Simpan dependensi antar run agar lebih cepat"]},{"label":"secrets & vars","values":["Nilai rahasia/konfigurasi; tidak tercetak di log"]},{"label":"environments","values":["staging/production dengan aturan persetujuan & secret terpisah"]}]}
```

Keamanan workflow: tetapkan `permissions` minimum, **pin action pihak ketiga** ke SHA commit, hati-hati dengan trigger `pull_request_target`, dan jangan pernah mencetak secret ke log.

## Test otomatis di pipeline

Pipeline hanya sebaik test-nya. Susun agar **cepat** dan **dapat dipercaya**:

```viz
{"type":"layers","layers":[{"label":"E2E","detail":"Alur kritis pengguna (login, checkout) di staging — sedikit, lambat","tag":"menit"},{"label":"Integrasi","detail":"API + database nyata (service container), kontrak antar layanan","tag":"puluhan detik"},{"label":"Unit","detail":"Logika murni, banyak, sangat cepat","tag":"detik"},{"label":"Statis","detail":"Lint, format, type check, scan rahasia & dependensi","tag":"detik"}]}
```

- Jalankan yang cepat lebih dulu (**fail fast**) dan paralelkan job.
- **Test yang flaky** (kadang lulus kadang gagal) merusak kepercayaan; perbaiki atau karantina segera, jangan biasakan menekan *re-run*.
- Jadikan pemeriksaan wajib sebelum merge dengan **branch protection** (required status checks + review).
- Tambahkan **pemindaian keamanan**: dependensi (Dependabot), kode (CodeQL), rahasia, dan image.

Strategi pengujian yang lebih lengkap dibahas di [jalur QA / Software Testing](/belajar/qa-testing/qa-1).

## Artefak & container registry

Prinsip: **build sekali, deploy berkali-kali**. Image yang sama yang lolos test di staging adalah image yang dipromosikan ke produksi.

```yaml
  build-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write, id-token: write }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with: { registry: ghcr.io, username: "${{ github.actor }}", password: "${{ secrets.GITHUB_TOKEN }}" }
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Registry**: GitHub Container Registry (ghcr.io), Docker Hub, Amazon ECR, Google Artifact Registry. Gunakan **tag yang tidak berubah** (SHA commit atau versi semantik) untuk deploy; `latest` hanya untuk kenyamanan. Untuk akses ke cloud, gunakan **OIDC** (kredensial sementara) daripada menyimpan access key jangka panjang sebagai secret. Lebih lanjut, tanda tangani image (cosign) dan buat **SBOM** untuk keamanan rantai pasok.

## Strategi deploy: rolling, blue-green, canary

```viz
{"type":"compare","columns":["Strategi","Cara","Kelebihan","Kekurangan"],"rows":[{"label":"Recreate","values":["Matikan versi lama, nyalakan baru","Sederhana","Ada downtime"]},{"label":"Rolling","values":["Ganti instance satu per satu","Tanpa downtime; default Kubernetes","Dua versi berjalan bersamaan sementara; rollback bertahap"]},{"label":"Blue-green","values":["Siapkan lingkungan baru penuh, alihkan trafik sekaligus","Rollback instan (alihkan kembali)","Butuh kapasitas ganda"]},{"label":"Canary","values":["Sebagian kecil trafik ke versi baru, perluas bertahap sambil memantau","Risiko terkecil, berbasis data","Butuh routing trafik & metrik yang baik"]}]}
```

```viz
{"type":"load-balancer"}
```

Apa pun strateginya, siapkan:

- **Health check** sehingga instance baru hanya menerima trafik saat siap.
- **Migrasi database yang kompatibel mundur** (expand–contract): tambah kolom dulu, deploy kode, baru hapus kolom lama di rilis berikutnya — agar versi lama dan baru dapat berjalan bersamaan.
- **Feature flag** untuk memisahkan *deploy* (kode sampai di produksi) dari *release* (fitur diaktifkan untuk pengguna).
- **Rollback** yang sudah diuji, bukan sekadar direncanakan.

:::latihan
Milestone: untuk repositori aplikasi container dari modul sebelumnya, buat (1) workflow CI dengan lint, type check, unit test, dan test integrasi memakai service container Postgres, termasuk matrix dua versi runtime dan cache; (2) job build-push image bertag SHA ke ghcr.io hanya dari `main`; (3) branch protection yang mewajibkan CI lulus; (4) workflow deploy manual (`workflow_dispatch`) dengan environment `production` yang membutuhkan persetujuan, ke server via SSH atau ke layanan PaaS. Ukur durasi pipeline dan optimalkan hingga di bawah 5 menit.
:::

## Rangkuman

- CI: integrasi sering + verifikasi otomatis; CD: selalu siap rilis (delivery) atau rilis otomatis (deployment); ukur dengan DORA.
- GitHub Actions: on → jobs → steps; matrix, cache, services, environments; permissions minimum dan action di-pin.
- Test cepat dulu (statis → unit → integrasi → E2E), basmi flaky test, branch protection, scan keamanan.
- Build sekali, deploy berkali-kali; tag tidak berubah; OIDC untuk akses cloud; tanda tangan & SBOM.
- Strategi rilis: rolling, blue-green, canary; health check, migrasi kompatibel mundur, feature flag, rollback teruji.
