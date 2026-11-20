# Setup akun (Supabase + Google) & hosting (Netlify)

Panduan ini mengaktifkan login email/Google, sinkron progres, dan menayangkan SatuTahu ke internet.
Tanpa langkah ini situs tetap berjalan normal; tombol akun hanya menampilkan pesan "belum dikonfigurasi".

Perkiraan waktu: 30–45 menit. Semua layanan di bawah punya paket gratis.

> Nama menu di dashboard Supabase, Google Cloud, dan Netlify kadang berubah. Jika letaknya berbeda, cari dengan kata kunci yang dicetak tebal.

---

## 1. Buat project Supabase

1. Daftar di <https://supabase.com> → **New project**. Pilih region terdekat (mis. **Singapore**), buat password database yang kuat dan simpan.
2. Setelah project siap, buka **Project Settings → API Keys**. Salin:
   - **Project URL** (bentuknya `https://<ref>.supabase.co`, juga ada di **Data API**)
   - **Publishable key** (diawali `sb_publishable_`). Jika project-mu hanya menampilkan *anon key*, itu juga bisa dipakai.
   - Jangan pernah menyalin **secret / service_role key** ke proyek ini.
3. Buka **SQL Editor → New query**, tempel seluruh isi `supabase/migrations/20261121000000_progress.sql`, lalu **Run**. Ini membuat tabel `progress` beserta Row Level Security.
4. Cek di **Table Editor → progress**: harus ada label **RLS enabled**.

## 2. Isi environment variable lokal

Di folder proyek, salin `.env.example` menjadi `.env.local`, lalu isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Restart `npm run dev`. Tombol **Masuk** sekarang muncul di navbar.

## 3. Atur URL autentikasi di Supabase

**Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (nanti ganti ke domain Netlify-mu).
- **Redirect URLs**, tambahkan:
  - `http://localhost:3000/auth/callback`
  - `https://<nama-situs>.netlify.app/auth/callback` (setelah langkah 5)
  - opsional untuk deploy preview: `https://*--<nama-situs>.netlify.app/auth/callback`

Tanpa daftar ini, login Google dan tautan email akan ditolak.

## 4. Aktifkan login Google

### 4a. Google Cloud Console

1. Buka <https://console.cloud.google.com>, buat project baru (mis. "SatuTahu").
2. Buka **Google Auth Platform** (atau **APIs & Services → OAuth consent screen**):
   - Isi **Branding**: nama aplikasi "SatuTahu", email dukungan, logo (opsional).
   - **Audience**: *External*. Selama status *Testing*, hanya akun yang kamu tambahkan sebagai test user yang bisa login; klik **Publish app** saat siap untuk umum.
   - **Data access / Scopes**: cukup `openid`, `email`, `profile` (bawaan).
3. **Clients → Create client** (atau **Credentials → Create credentials → OAuth client ID**):
   - Application type: **Web application**
   - **Authorized JavaScript origins**: `http://localhost:3000` dan `https://<nama-situs>.netlify.app`
   - **Authorized redirect URIs**: `https://<ref>.supabase.co/auth/v1/callback`
     (salin persis dari Supabase pada langkah 4b — **bukan** URL situsmu)
4. Simpan **Client ID** dan **Client secret**.

### 4b. Supabase

**Authentication → Sign In / Providers → Google** → aktifkan, tempel Client ID & Client secret, **Save**.
Halaman ini juga menampilkan *Callback URL* yang harus dimasukkan di langkah 4a.3.

## 5. Email (konfirmasi & reset password)

- Secara bawaan Supabase mengirim email konfirmasi saat mendaftar. Pengirim email bawaan Supabase **dibatasi ketat jumlahnya** dan hanya untuk percobaan.
- Untuk dipakai banyak orang, atur SMTP sendiri di **Authentication → Emails → SMTP Settings** (mis. Resend, Brevo, atau SMTP Gmail Workspace).
- Opsional: ubah template email ke Bahasa Indonesia di **Authentication → Emails → Templates**. Biarkan tautannya memakai `{{ .ConfirmationURL }}`.
- Jika ingin pendaftaran tanpa konfirmasi email (tidak disarankan untuk produksi), matikan **Confirm email** di pengaturan provider Email.

## 6. Hosting di Netlify

### Cara A — lewat GitHub (disarankan: deploy otomatis setiap push)

1. Buat repo di GitHub lalu push proyek ini (folder `node_modules`, `.next`, dan `.env.local` sudah diabaikan oleh `.gitignore`):
   ```bash
   git init
   git add .
   git commit -m "SatuTahu"
   git branch -M main
   git remote add origin https://github.com/<username>/satutahu.git
   git push -u origin main
   ```
2. Di <https://app.netlify.com> → **Add new project → Import an existing project → GitHub** → pilih repo.
3. Build settings terbaca dari `netlify.toml` (`npm run build`, publish `.next`, Node 22). Biarkan.
4. **Environment variables** → tambahkan ketiga variabel dari langkah 2, dengan `NEXT_PUBLIC_SITE_URL` berisi domain Netlify-mu (mis. `https://satutahu.netlify.app`).
5. **Deploy**. Setelah selesai, ubah nama situs di **Site configuration → Change site name** bila perlu.
6. Kembali ke Supabase (langkah 3) dan Google Cloud (langkah 4a): tambahkan domain Netlify-mu ke Site URL, Redirect URLs, dan Authorized JavaScript origins.

### Cara B — lewat CLI (tanpa GitHub)

```bash
npm install -g netlify-cli
netlify login
netlify init            # buat situs baru
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://<ref>.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "sb_publishable_..."
netlify env:set NEXT_PUBLIC_SITE_URL "https://<nama-situs>.netlify.app"
netlify deploy --build --prod
```

> Variabel `NEXT_PUBLIC_*` disisipkan ke kode saat **build**. Jika mengubahnya di Netlify, jalankan ulang deploy (**Deploys → Trigger deploy → Clear cache and deploy site**).

### Domain sendiri (opsional)

**Domain management → Add a domain**, ikuti instruksi DNS. HTTPS gratis otomatis. Setelah aktif, tambahkan domain itu juga ke Supabase (Site URL & Redirect URLs) dan Google (JavaScript origins).

## 7. Uji setelah deploy

- [ ] Daftar dengan email → menerima email konfirmasi → tautan membuka situs dalam keadaan login.
- [ ] Keluar, lalu **Masuk dengan Google** berhasil.
- [ ] Centang beberapa topik → buka situs di perangkat/browser lain dan masuk → centang yang sama muncul.
- [ ] Hapus satu centang di perangkat kedua → kembali ke perangkat pertama (pindah tab atau refresh) → centang ikut hilang.
- [ ] **Lupa password** → email reset → membuat password baru berhasil.
- [ ] Di Supabase **Table Editor → progress** terlihat satu baris per pengguna.

## Pemecahan masalah

| Gejala | Penyebab umum |
|---|---|
| Tombol "Masuk" tidak muncul | Env belum diisi, atau dev server/deploy belum diulang setelah mengisi env |
| Google: `redirect_uri_mismatch` | Authorized redirect URI di Google bukan `https://<ref>.supabase.co/auth/v1/callback` |
| Setelah login Google kembali ke `localhost` padahal di situs online | Site URL / Redirect URLs Supabase belum memuat domain Netlify |
| "Provider is not enabled" | Provider Google belum diaktifkan di Supabase |
| "Terlalu banyak percobaan" saat mendaftar | Batas email bawaan Supabase tercapai — pasang SMTP sendiri |
| Tautan email: "tautan tidak lengkap / kedaluwarsa" | Tautan dibuka di browser berbeda dari saat mendaftar, atau sudah dipakai/kedaluwarsa — minta tautan baru |
| Progres tidak tersinkron | Migrasi SQL belum dijalankan (cek tabel `progress` & RLS) |

## Catatan keamanan

- Keamanan data bergantung pada **Row Level Security** di tabel `progress`. Jangan nonaktifkan RLS.
- Publishable key memang terlihat di browser; itu normal. Secret / service_role key **tidak boleh** ada di proyek frontend.
- Saat keluar, progres disimpan ke akun lalu dihapus dari browser itu (aman untuk komputer bersama).
- Menghapus akun pengguna dilakukan admin di **Authentication → Users**; baris progres ikut terhapus otomatis (`on delete cascade`).
