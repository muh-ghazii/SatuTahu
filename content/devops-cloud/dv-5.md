---
title: Cloud & Infrastructure as Code
minutes: 55
summary: Cloud memungkinkan menyewa server, database, dan jaringan dalam hitungan menit, dan Infrastructure as Code membuat semuanya dapat ditinjau, diulang, dan dihancurkan dengan aman. Modul ini membahas model layanan IaaS, PaaS, dan SaaS, region, availability zone, dan VPC, dasar Terraform, state dan modul Terraform, serta biaya dan keamanan cloud.
objectives:
  - Memilih model layanan cloud yang tepat untuk sebuah kebutuhan
  - Merancang penempatan sumber daya lintas region dan availability zone
  - Menulis konfigurasi Terraform dengan provider, resource, variable, dan output
  - Mengelola state jarak jauh dan menyusun modul yang dapat dipakai ulang
  - Mengendalikan biaya dan menerapkan dasar keamanan cloud
sources:
  - repo: open-guides/og-aws
    note: The Open Guide to Amazon Web Services
  - repo: hashicorp/terraform
    note: Terraform — Infrastructure as Code
  - repo: shuaibiyy/awesome-tf
    note: Kumpulan modul, alat, dan sumber Terraform
quiz:
  - q: "Aplikasi web kecil tanpa tim ops ingin dideploy dengan usaha minimal. Model yang paling cocok biasanya…"
    options: ["IaaS (kelola VM sendiri)", "PaaS / serverless container", "Membeli server fisik", "SaaS"]
    answer: 1
    explain: "PaaS mengurus OS, patch, dan scaling; kamu fokus pada kode."
  - q: "Menyebar instance ke beberapa availability zone bertujuan…"
    options: ["Mengurangi latensi ke pengguna di benua lain", "Tetap berjalan bila satu pusat data (AZ) mengalami gangguan", "Mengurangi biaya", "Mematuhi aturan Git"]
    answer: 1
    explain: "AZ adalah pusat data terpisah dalam satu region; region berbeda untuk jarak geografis/DR."
  - q: "File terraform.tfstate sebaiknya…"
    options: ["Di-commit ke Git publik", "Disimpan di remote backend dengan locking dan enkripsi", "Dihapus setelah apply", "Diedit manual"]
    answer: 1
    explain: "State bisa berisi rahasia dan harus dibagi aman antar anggota tim tanpa konflik."
  - q: "Langkah ‘terraform plan’ berguna untuk…"
    options: ["Langsung membuat resource", "Melihat perubahan yang akan dilakukan sebelum diterapkan, untuk ditinjau", "Menghapus state", "Mengunduh image"]
    answer: 1
    explain: "Plan adalah ‘diff’ infrastruktur — tinjau di PR."
---

Membuat server dengan mengklik konsol cloud terasa mudah sampai kamu harus membuatnya ulang persis sama untuk staging, atau mencari tahu siapa yang membuka port database ke internet. **Infrastructure as Code (IaC)** mendefinisikan infrastruktur dalam file yang disimpan di Git, ditinjau, dan diterapkan secara otomatis.

## Model layanan: IaaS, PaaS, SaaS

```viz
{"type":"layers","layers":[{"label":"SaaS","detail":"Aplikasi jadi: Gmail, Google Workspace, Slack — kamu hanya memakai","tag":"kelola paling sedikit"},{"label":"FaaS / serverless","detail":"Fungsi berjalan per event: Lambda, Cloud Functions — bayar per eksekusi","tag":""},{"label":"PaaS / container serverless","detail":"Unggah kode/container: Cloud Run, App Service, Railway, Vercel","tag":""},{"label":"Managed services","detail":"Database, antrean, storage terkelola: RDS/Cloud SQL, S3/GCS","tag":""},{"label":"IaaS","detail":"VM, disk, jaringan: EC2, Compute Engine — kamu kelola OS ke atas","tag":"kontrol paling banyak"}]}
```

Semakin ke atas, semakin sedikit yang kamu kelola dan semakin cepat mulai, tetapi kontrol dan portabilitas berkurang. Model **tanggung jawab bersama**: penyedia mengamankan infrastruktur fisik dan layanan dasarnya; kamu bertanggung jawab atas konfigurasi, data, identitas, dan akses. Sebagian besar insiden keamanan cloud berasal dari **salah konfigurasi** di sisi pelanggan (bucket publik, kunci bocor, security group terlalu terbuka).

## Region, availability zone & VPC

- **Region**: lokasi geografis (mis. Jakarta, Singapura). Pilih berdasarkan latensi ke pengguna, regulasi data, harga, dan ketersediaan layanan.
- **Availability Zone (AZ)**: satu atau lebih pusat data terpisah di dalam region dengan daya dan jaringan independen. Sebar aplikasi ke **minimal dua AZ** untuk ketahanan.
- **VPC**: jaringan privat milikmu di region tersebut, dibagi menjadi subnet publik/privat per AZ.

```viz
{"type":"tree","root":{"label":"Region asia-southeast2 (Jakarta)","children":[{"label":"AZ a","detail":"Subnet publik (LB, NAT) · subnet privat (aplikasi) · subnet data (DB primer)"},{"label":"AZ b","detail":"Subnet publik · subnet privat (aplikasi) · subnet data (DB standby)"},{"label":"Layanan regional","detail":"Object storage, load balancer, managed database multi-AZ"}]}}
```

Rancangan jaringan VPC secara rinci (route table, NAT gateway, security group) dibahas di [Cloud networking & SDN](/belajar/jaringan/net-6). Untuk pemulihan bencana skala besar, salin data/backup ke **region lain**.

## Terraform dasar

**Terraform** memakai bahasa deklaratif **HCL**. Kamu mendeskripsikan sumber daya yang diinginkan; Terraform menghitung dan menjalankan perubahan melalui **provider** (AWS, Google Cloud, Azure, Cloudflare, GitHub, Kubernetes, dll.).

```hcl
# versions.tf
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}
provider "aws" { region = var.region }

# variables.tf
variable "region" {
  type    = string
  default = "ap-southeast-3"   # Jakarta
}
variable "project" { type = string }

# main.tf
resource "aws_s3_bucket" "aset" {
  bucket = "${var.project}-aset-statis"
  tags   = { project = var.project, env = "dev" }
}
resource "aws_s3_bucket_public_access_block" "aset" {
  bucket                  = aws_s3_bucket.aset.id      # referensi → Terraform tahu urutannya
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# outputs.tf
output "bucket_name" { value = aws_s3_bucket.aset.bucket }
```

```viz
{"type":"flow","title":"Alur kerja Terraform","steps":[{"label":"init","detail":"Unduh provider, siapkan backend."},{"label":"fmt & validate","detail":"Rapikan & cek sintaks."},{"label":"plan","detail":"Diff: + buat, ~ ubah, − hapus. Tinjau di PR!"},{"label":"apply","detail":"Terapkan perubahan sesuai plan."},{"label":"destroy","detail":"Hapus semua (lab/sementara)."}]}
```

Perhatikan simbol **`-/+`** (destroy lalu create) pada plan: beberapa perubahan atribut memaksa resource dibuat ulang, dan pada database itu berarti kehilangan data jika tidak hati-hati. Gunakan `lifecycle { prevent_destroy = true }` untuk sumber daya kritis. Alternatif Terraform: **OpenTofu** (fork open source yang kompatibel), **Pulumi** (IaC dengan bahasa pemrograman), dan **CloudFormation/Bicep** (khusus satu cloud).

## State & modul Terraform

**State** (`terraform.tfstate`) adalah catatan Terraform tentang sumber daya yang ia kelola, pemetaan antara kode dan objek nyata di cloud. Aturannya:

- Simpan di **remote backend** (S3 + locking, GCS, Terraform Cloud) agar tim berbagi state yang sama dan tidak menjalankan `apply` bersamaan.
- State bisa berisi **rahasia** — enkripsi dan batasi aksesnya; jangan commit ke Git.
- Jangan edit manual; gunakan `terraform state mv/rm` dan blok `import`/`moved` saat merestrukturisasi.

```hcl
terraform {
  backend "s3" {
    bucket       = "toko-tfstate"
    key          = "prod/network.tfstate"
    region       = "ap-southeast-3"
    encrypt      = true
    use_lockfile = true
  }
}
```

**Modul** membungkus sekumpulan resource menjadi komponen yang dapat dipakai ulang dengan input dan output:

```hcl
module "jaringan" {
  source   = "./modules/vpc"            # atau modul publik dari registry
  nama     = "toko-prod"
  cidr     = "10.20.0.0/16"
  az_count = 2
}
module "app" {
  source     = "./modules/app"
  subnet_ids = module.jaringan.subnet_privat_ids
}
```

Pisahkan lingkungan (dev/staging/prod) dengan state terpisah (folder atau workspace) dan modul yang sama dengan input berbeda. Jalankan `plan` otomatis di **CI pada setiap PR** dan `apply` hanya setelah disetujui (alur yang sama dengan [CI/CD](/belajar/devops-cloud/dv-3)). Alat seperti **tflint**, **checkov**, atau **trivy config** memeriksa kesalahan dan konfigurasi tidak aman sebelum diterapkan.

## Biaya & keamanan cloud

Cloud ditagih berdasarkan pemakaian, dan tagihan bisa membengkak diam-diam.

```viz
{"type":"compare","columns":["Sumber biaya tak terduga","Pencegahan"],"rows":[{"label":"Resource lupa dimatikan (VM, GPU, NAT gateway, load balancer)","values":["Tag pemilik & proyek; destroy lingkungan lab; jadwal mati otomatis"]},{"label":"Transfer data keluar (egress) & antar AZ","values":["CDN, kompresi, tempatkan layanan yang sering bicara di AZ sama bila aman"]},{"label":"Ukuran berlebihan","values":["Right-sizing berdasarkan metrik; autoscaling"]},{"label":"Log & snapshot menumpuk","values":["Kebijakan retensi & lifecycle storage"]},{"label":"Kunci bocor dipakai menambang kripto","values":["Jangan simpan kunci di kode; MFA; alert anggaran"]}]}
```

Langkah pertama di akun cloud mana pun: aktifkan **alert anggaran**, gunakan **free tier** dengan sadar, dan beri **tag** setiap sumber daya. Untuk beban stabil, **reserved instance/committed use** lebih murah; untuk beban yang toleran gangguan, **spot/preemptible**.

Dasar keamanan cloud:

- **Lindungi akun root/owner** dengan MFA dan jangan dipakai sehari-hari.
- **IAM hak minimum**: role per aplikasi dan per orang; kredensial sementara (SSO, OIDC dari CI) alih-alih access key permanen.
- **Enkripsi** data at-rest dan in-transit (umumnya cukup diaktifkan).
- **Jangan buka** database/SSH ke `0.0.0.0/0`; gunakan subnet privat, bastion, atau akses berbasis identitas.
- **Audit log** (CloudTrail/Cloud Audit Logs) aktif dan disimpan terpisah.

:::latihan
Milestone: dengan akun free tier (atau LocalStack untuk simulasi AWS), tulis Terraform untuk VPC dua AZ (gunakan modul publik atau buat sendiri), bucket privat untuk aset, dan satu layanan aplikasi (VM kecil atau container serverless). Simpan state di remote backend dengan locking, pisahkan `dev` dan `prod` dengan input berbeda, jalankan `tflint` dan `checkov` di CI pada setiap PR, pasang alert anggaran, lalu `destroy` semuanya dan pastikan tagihan nol.
:::

## Rangkuman

- IaaS → PaaS → serverless → SaaS: semakin sedikit yang dikelola; model tanggung jawab bersama.
- Region untuk lokasi & regulasi, AZ untuk ketahanan, VPC untuk isolasi jaringan.
- Terraform: provider, resource, variable, output; init → plan (tinjau) → apply; waspadai replace.
- State di remote backend terenkripsi dengan locking; modul untuk pemakaian ulang; plan di CI.
- Biaya: tag, anggaran, right-sizing, retensi, destroy lab; keamanan: MFA, IAM minimum, kredensial sementara, enkripsi, audit log.
