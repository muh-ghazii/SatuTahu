---
title: "Kualitas: testing, performa, aksesibilitas"
minutes: 40
summary: Aplikasi yang ‘jalan di laptopku’ belum tentu siap dipakai ribuan orang. Modul ini membahas empat pilar kualitas frontend, yaitu test otomatis, performa terukur lewat Core Web Vitals, aksesibilitas sesuai WCAG, dan kode yang mudah dirawat, ditutup dengan checklist sebelum rilis.
objectives:
  - Menulis unit test dan component test yang menguji perilaku, bukan implementasi
  - Membaca dan memperbaiki metrik LCP, INP, dan CLS
  - Mengaudit aksesibilitas termasuk kontras warna dan navigasi keyboard
  - Menerapkan prinsip clean code dan checklist rilis
sources:
  - repo: goldbergyoni/javascript-testing-best-practices
    note: Prinsip test yang menguji perilaku dan pola Arrange-Act-Assert
  - repo: ryanmcdermott/clean-code-javascript
    note: Contoh penamaan, fungsi kecil, dan menghindari efek samping
  - repo: thedaviddias/Front-End-Checklist
    note: Kerangka checklist sebelum rilis
  - repo: a11yproject/a11yproject.com
    note: Checklist WCAG yang praktis
quiz:
  - q: "Test komponen yang baik sebaiknya mencari tombol dengan…"
    options: ["Nama kelas CSS", "getByRole('button', { name: 'Simpan' })", "Indeks elemen di DOM", "ID acak"]
    answer: 1
    explain: "Mencari berdasarkan peran dan label meniru cara pengguna (dan pembaca layar) melihat halaman, sehingga test tidak rusak saat CSS berubah."
  - q: "Halaman ‘melompat’ saat iklan/gambar selesai dimuat sehingga pengguna salah klik. Metrik yang memburuk?"
    options: ["LCP", "INP", "CLS", "TTFB"]
    answer: 2
    explain: "Cumulative Layout Shift mengukur pergeseran tata letak yang tak terduga. Solusinya: tetapkan width/height atau aspect-ratio untuk media."
  - q: "Rasio kontras minimal teks normal untuk WCAG level AA adalah…"
    options: ["2:1", "3:1", "4,5:1", "10:1"]
    answer: 2
    explain: "4,5:1 untuk teks normal, 3:1 untuk teks besar (≥ 24px, atau ≥ 18,66px tebal)."
  - q: "Nama fungsi mana yang paling ‘clean’?"
    options: ["proses()", "doIt2()", "hitungTotalSetelahDiskon()", "x()"]
    answer: 2
    explain: "Nama yang menjelaskan maksud membuat kode bisa dibaca tanpa komentar."
---

Kualitas bukan tahap terakhir yang ditambahkan menjelang rilis. Ia adalah kebiasaan yang mencegah bug, kelambatan, dan pengguna yang tersisih. Kabar baiknya, sebagian besar bisa diotomasi dan diukur.

## Unit & component testing

Test otomatis adalah kode yang memeriksa kode lain. Manfaatnya bukan hanya menangkap bug, tetapi juga memberi **keberanian untuk mengubah kode** tanpa takut merusak fitur lain.

```viz
{"type":"layers","title":"Piramida testing frontend","caption":"Semakin ke bawah, semakin cepat dan murah, jadi semakin banyak jumlahnya. E2E paling meyakinkan tetapi paling lambat dan rapuh.","layers":[{"label":"End-to-end","tag":"sedikit","detail":"Menjalankan browser sungguhan dan mengikuti alur pengguna: login → cari → checkout. Alat: Playwright, Cypress."},{"label":"Component / integrasi","tag":"sedang","detail":"Me-render komponen di DOM simulasi dan berinteraksi seperti pengguna. Alat: Testing Library + Vitest/Jest."},{"label":"Unit","tag":"banyak","detail":"Menguji fungsi murni secara terisolasi: format Rupiah, hitung diskon, validasi. Berjalan dalam milidetik."},{"label":"Static (lint & types)","tag":"selalu","detail":"TypeScript dan ESLint menangkap salah ketik dan pola berbahaya bahkan sebelum test dijalankan."}]}
```

Gunakan pola **Arrange–Act–Assert** dan nama test yang menjelaskan skenario:

```ts
// diskon.test.ts (Vitest)
import { describe, it, expect } from "vitest";
import { hitungTotal } from "./diskon";

describe("hitungTotal", () => {
  it("memberi diskon 10% untuk belanja di atas Rp500.000", () => {
    // Arrange
    const items = [{ harga: 300_000, qty: 2 }];
    // Act
    const total = hitungTotal(items);
    // Assert
    expect(total).toBe(540_000);
  });

  it("tidak memberi diskon tepat di batas Rp500.000", () => {
    expect(hitungTotal([{ harga: 500_000, qty: 1 }])).toBe(500_000);
  });
});
```

Untuk komponen, uji **apa yang dilihat dan dilakukan pengguna**, bukan detail implementasi seperti nama state:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("menambah item ke keranjang saat tombol diklik", async () => {
  render(<Katalog produk={[{ id: 1, nama: "Gamis", harga: 150000 }]} />);
  await userEvent.click(screen.getByRole("button", { name: /tambah/i }));
  expect(screen.getByText("1 item di keranjang")).toBeInTheDocument();
});
```

## Core Web Vitals

Google mengukur pengalaman pengguna nyata dengan tiga metrik **Core Web Vitals**:

```viz
{"type":"compare","title":"Tiga metrik Core Web Vitals","caption":"Ukur di DevTools → Lighthouse untuk data lab, dan PageSpeed Insights untuk data pengguna nyata (bila trafik cukup).","columns":["LCP","INP","CLS"],"rows":[{"label":"Mengukur","values":["Kapan konten utama terbesar tampil","Seberapa cepat halaman merespons interaksi","Seberapa banyak tata letak bergeser tiba-tiba"]},{"label":"Target ‘baik’","values":["≤ 2,5 detik","≤ 200 ms","≤ 0,1"]},{"label":"Penyebab umum buruk","values":["Gambar hero besar, server lambat, CSS/JS memblokir","JavaScript berat di main thread","Gambar/iklan tanpa ukuran, font yang berganti"]},{"label":"Perbaikan","values":["Kompres & ukur gambar (WebP/AVIF), preload hero, CDN","Pecah tugas panjang, kurangi JS, pindahkan kerja ke server","Tetapkan width/height atau aspect-ratio, font-display"]}]}
```

Kebiasaan performa yang paling berdampak:

- **Gambar**: format modern, ukuran sesuai tampilan, `loading="lazy"` untuk gambar di bawah layar. Di Next.js, `next/image` mengurus semuanya.
- **JavaScript**: kirim sesedikit mungkin. Periksa ukuran bundle; muat komponen berat secara dinamis (`import()`), dan pertahankan Server Components.
- **Font**: batasi jumlah varian; gunakan `font-display: swap`.

## Aksesibilitas (WCAG)

Sekitar satu dari enam penduduk dunia hidup dengan disabilitas (menurut WHO). Aksesibilitas juga membantu semua orang: pengguna yang tangannya sedang sibuk, layar di bawah terik matahari, atau koneksi lambat. **WCAG** (*Web Content Accessibility Guidelines*) menyusunnya dalam empat prinsip **POUR**: *Perceivable*, *Operable*, *Understandable*, *Robust*.

Salah satu pemeriksaan yang paling sering gagal adalah kontras warna:

```viz
{"type":"contrast"}
```

Audit cepat yang bisa kamu lakukan sekarang:

1. **Keyboard saja**: cabut mouse. Bisakah semua fitur dicapai dengan Tab/Shift+Tab/Enter/Esc? Apakah fokus selalu terlihat?
2. **Zoom 200%**: apakah konten masih terbaca tanpa scroll horizontal?
3. **Pembaca layar**: nyalakan NVDA (Windows, gratis) atau TalkBack (Android). Apakah tombol ikon punya nama (`aria-label`)?
4. **Form**: setiap input punya label; pesan error diumumkan (`role="alert"`) dan terhubung lewat `aria-describedby`.
5. **Otomatis**: Lighthouse/axe DevTools hanya menangkap sebagian masalah (kira-kira sepertiga hingga separuh, tergantung cara menghitungnya); sisanya butuh pemeriksaan manual.

:::tip[Aturan pertama ARIA]
Jangan pakai ARIA jika ada elemen HTML asli yang bisa melakukannya. `<button>` lebih baik daripada `<div role="button" tabindex="0">` plus handler keyboard buatan sendiri.
:::

## Clean code

Kode dibaca jauh lebih sering daripada ditulis. Beberapa prinsip yang paling terasa manfaatnya:

```js
// ❌ sulit dipahami
function p(d) {
  let t = 0;
  for (let i = 0; i < d.length; i++) { if (d[i].s == 1) t += d[i].h * d[i].q; }
  if (t > 500000) t = t * 0.9;
  return t;
}

// ✅ nama menjelaskan maksud, konstanta bernama, fungsi kecil
const BATAS_DISKON = 500_000;
const TARIF_DISKON = 0.1;

const subtotal = (items) => items.reduce((sum, i) => sum + i.harga * i.qty, 0);

function hitungTotal(items) {
  const aktif = items.filter((i) => i.tersedia);
  const sub = subtotal(aktif);
  return sub > BATAS_DISKON ? sub * (1 - TARIF_DISKON) : sub;
}
```

- **Nama yang jujur**: `hitungTotalSetelahDiskon` lebih baik daripada komentar yang menjelaskan `p()`.
- **Fungsi kecil, satu tugas**; hindari parameter boolean yang mengubah perilaku (`render(true)`). Buat dua fungsi.
- **Tanpa angka ajaib**: beri nama pada konstanta.
- **Hindari efek samping tersembunyi**; fungsi murni lebih mudah diuji.
- Jalankan **ESLint + Prettier** otomatis agar diskusi gaya penulisan tidak menghabiskan waktu review.

## Checklist sebelum rilis

```viz
{"type":"flow","title":"Gerbang kualitas sebelum rilis","caption":"Otomasi langkah 1–3 di CI (GitHub Actions) agar tidak bergantung pada ingatan manusia.","steps":[{"label":"Lint & type check","detail":"npm run lint && tsc --noEmit tanpa error."},{"label":"Test","detail":"Semua unit & component test hijau; alur kritis (login, checkout) punya E2E."},{"label":"Build produksi","detail":"npm run build berhasil; periksa peringatan ukuran bundle."},{"label":"Audit Lighthouse","detail":"Performance, Accessibility, Best Practices, SEO ≥ 90 di halaman utama."},{"label":"Cek manual","detail":"HP sungguhan, koneksi lambat (throttling 3G), mode keyboard, browser berbeda."},{"label":"Meta & keamanan","detail":"Judul/deskripsi/OG image, favicon, 404 page, HTTPS, tidak ada API key di kode klien."}]}
```

:::latihan
Ambil proyek Next.js dari modul sebelumnya. (1) Tulis 5 unit test untuk fungsi utilitas dan 2 component test. (2) Jalankan Lighthouse dan catat skor awal. (3) Perbaiki sampai Accessibility = 100: kontras, label, alt, urutan heading. (4) Tambahkan workflow GitHub Actions yang menjalankan lint + test setiap push.
:::

## Rangkuman

- Piramida testing: banyak unit test, cukup component test, sedikit E2E; uji perilaku seperti pengguna.
- Core Web Vitals: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1; gambar & JavaScript adalah tersangka utama.
- Aksesibilitas = HTML semantik, kontras ≥ 4,5:1, navigasi keyboard, label yang jelas; alat otomatis hanya menangkap sebagian.
- Clean code: nama jujur, fungsi kecil, konstanta bernama, linter otomatis.
- Otomasi gerbang kualitas di CI.
