# SatuTahu

Platform belajar teknologi gratis berbahasa Indonesia. Materi terbaik dari repositori GitHub publik **ditulis ulang menjadi modul interaktif** yang dibaca langsung di SatuTahu, lengkap dengan visualisasi, kuis, dan pelacak progres. Repo aslinya tetap dikreditkan dan tersedia di katalog sebagai rujukan.

- **19 jalur**: Fondasi CS, Frontend, Backend, Web Fullstack, Mobile, UI/UX, QA / Testing, Game Dev, Data Analyst, Data Scientist, Data Engineering, Machine Learning, Deep Learning, Computer Vision, AI Engineer, Jaringan, DevOps & Cloud, Cyber Security, IoT.
- **100 modul** (satu per tahap, ±121.000 kata) berisi tujuan belajar, penjelasan per topik, contoh kode dengan syntax highlighting, **431 visualisasi** (55 jenis, banyak yang interaktif), latihan/milestone, kuis, serta bagian *Sumber & kredit*.
- **260 repo rujukan** yang diverifikasi aktif (per 20 November 2026), dapat dicari di katalog.
- **Pelacak progres** di browser tanpa akun, atau **masuk dengan email/Google** (Supabase) agar progres tersinkron di semua perangkat.
- **Pencarian cepat** `Ctrl + K` untuk jalur, modul (termasuk nama topik), dan repo.

## Menjalankan

Butuh Node.js 20.9 atau lebih baru.

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

Fitur akun (login, daftar, Google, sinkron progres) aktif setelah `.env.local` diisi — lihat **[docs/SETUP.md](docs/SETUP.md)** untuk panduan Supabase, Google OAuth, dan hosting Netlify. Tanpa itu situs tetap berjalan; progres hanya disimpan di browser.

Build produksi (semua 100 modul dirender statis):

```bash
npm run build
npm start
```

## Struktur

```
content/<jalur>/<tahap>.md     # 100 modul (Markdown + frontmatter), mis. content/jaringan/net-2.md
src/
  app/
    page.tsx                   # Beranda
    jalur/page.tsx             # Daftar & perbandingan jalur
    jalur/[slug]/page.tsx      # Detail jalur (roadmap, peta konsep, tahap → tombol ‘Pelajari modul’)
    belajar/[track]/[stage]/   # Halaman modul (dibaca di sini, bukan di GitHub)
    katalog/page.tsx           # Katalog semua repo rujukan
    progres/page.tsx           # Ringkasan progres (+ ajakan masuk / status sinkron)
    masuk, daftar, lupa-password, akun/   # Halaman akun
    auth/callback/route.ts     # Tujuan kembali login Google, konfirmasi email & reset password
  components/
    lesson/                    # Markdown renderer, kuis, daftar isi, progres baca, checklist
    viz/                       # Visualisasi: generik (flow, sequence, layers, compare, tree, fsm)
                               # + khusus (sorting, subnet, attention, sqli, pwm, …)
  data/
    tracks-*.ts                # Kurikulum: tahap, topik, milestone, repo rujukan
    repos.json                 # Snapshot bintang & deskripsi GitHub
  lib/
    modules.ts                 # Memuat & mem-parsing modul (server-only)
    remark-satutahu.ts         # Plugin: blok ```viz dan callout :::tip / :::latihan / dll.
    progress.ts                # Penyimpanan progres (localStorage)
    progress-merge.ts          # Merge 3 arah progres lokal ↔ akun
    supabase/                  # Klien Supabase (browser & route handler)
  components/auth/             # AuthProvider (sesi + sinkron), formulir, menu akun
supabase/migrations/           # SQL tabel progress + Row Level Security
docs/SETUP.md                  # Panduan Supabase, Google OAuth, Netlify
netlify.toml                   # Konfigurasi build Netlify
scripts/
  validate-data.ts             # Cek semua repo yang dirujuk ada di repos.json
  validate-modules.ts          # Cek frontmatter, kuis, sub-bab vs topik, JSON viz, panjang modul
  topics.ts                    # Cetak daftar topik & repo per tahap sebuah jalur
  sync-github.mjs              # Perbarui bintang dari GitHub API
```

## Format modul

Setiap modul adalah file Markdown dengan frontmatter:

```markdown
---
title: IP addressing, subnetting & analisis paket
minutes: 60
summary: Satu–dua kalimat ringkasan (tanpa ": " kecuali dibungkus tanda kutip).
objectives:
  - Tujuan belajar 1
sources:
  - repo: wireshark/wireshark      # harus ada di repos.json
    note: Kenapa sumber ini dipakai
quiz:
  - q: "Pertanyaan?"
    options: ["A", "B", "C"]
    answer: 1                      # indeks opsi yang benar
    explain: "Alasan singkat."
---

Paragraf pembuka…

## <Topik 1>        ← satu H2 per topik tahap, urut sama dengan data jalur
…
## Rangkuman
```

Fitur Markdown tambahan:

- **Visualisasi**: blok kode berbahasa `viz` berisi JSON, misalnya
  ` ```viz {"type":"subnet"} ``` ` untuk visual interaktif khusus, atau visual generik seperti
  `{"type":"flow","title":"…","steps":[{"label":"…","detail":"…"}]}`.
  Daftar tipe yang valid ada di `src/components/viz/types.ts`.
- **Callout**: `:::tip[Judul]`, `:::info`, `:::warning`, `:::latihan`, `:::analogi`, `:::contoh`, diakhiri `:::`.
- **Tautan antar modul**: `[teks](/belajar/<jalur>/<tahap>)`.

Validasi sebelum commit:

```bash
npm run validate               # data jalur & repo
npm run validate:modules       # semua modul (atau: npx tsx scripts/validate-modules.ts jaringan)
```

## Menambah atau mengubah kurikulum

1. Edit `src/data/tracks-*.ts`. Setiap sumber berbentuk:
   ```ts
   { repo: "owner/nama-repo", kind: "kurikulum", lang: "EN", note: "Kenapa repo ini & bagian mana yang dibaca." }
   ```
   `kind`: `kurikulum | buku | latihan | proyek | referensi | awesome | tool`. Tambahkan `paidBook: true` jika repo hanya kode pendamping buku berbayar.
2. Tambahkan repo baru ke `src/data/repos.json`, lalu jalankan `npm run sync:github` (set `GITHUB_TOKEN`) dan `npm run validate`.
3. Jika topik tahap berubah, sesuaikan sub-bab modul di `content/` lalu jalankan `npm run validate:modules`.
4. Perbarui `SNAPSHOT_DATE` di `src/data/index.ts`.

## Akun & sinkron progres

- Autentikasi memakai **Supabase Auth** (email + password, dan Google OAuth). Sesi dikelola di browser sehingga semua halaman tetap statis dan cepat; server hanya dipakai di `/auth/callback` untuk menukar kode login.
- Progres disimpan di tabel `progress` (satu baris JSON per pengguna) yang dilindungi Row Level Security.
- Sinkronisasi memakai **merge 3 arah** per topik: centang dan hapus-centang dari perangkat berbeda tidak saling menimpa. Sinkron berjalan otomatis ±1 detik setelah perubahan, saat kembali ke tab, dan saat koneksi pulih.
- Saat pertama kali masuk, centang yang sudah ada di browser ikut dipindahkan ke akun. Saat keluar, progres dihapus dari browser itu.

## Deploy

Situs dideploy ke **Netlify** (dukungan penuh Next.js 16 & Cache Components lewat adapter OpenNext). Langkah lengkap ada di [docs/SETUP.md](docs/SETUP.md#6-hosting-di-netlify).

## Desain

- Palet dari logo: krem `#FDF9EE`, kuning `#FEC536`, dan navy `#12203A` sebagai warna tinta. Navy dipakai untuk teks dan garis karena kuning di atas putih tidak memenuhi kontras WCAG untuk teks.
- Gaya *soft-brutalist*: garis tegas 2px dan bayangan offset, meniru outline tebal pada maskot.
- Font: Plus Jakarta Sans dan JetBrains Mono (ligatur dimatikan di blok kode agar `>=` tidak berubah menjadi `≥`), di-bundle lewat `@fontsource`.
- Animasi memakai `motion` dan menghormati `prefers-reduced-motion`.

## Lisensi & kredit materi

Modul **tidak menyalin** isi repositori sumber. Penjelasan, contoh, dan visualisasi ditulis ulang dalam Bahasa Indonesia, karena sebagian sumber berlisensi NonCommercial atau NoDerivatives yang tidak mengizinkan penyalinan ulang. Setiap modul mencantumkan repo sumber di bagian *Sumber & kredit*, dan hak cipta materi asli tetap milik pembuatnya. Jika kamu pemilik repo dan keberatan dengan cara materimu dirujuk, buka issue.
