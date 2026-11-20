---
title: Automation end-to-end dengan Playwright
minutes: 45
summary: Test end-to-end menjalankan aplikasi seperti pengguna sungguhan, yaitu membuka browser, mengetik, mengklik, dan memeriksa hasilnya. Modul ini membahas kapan E2E sepadan dengan biayanya, dasar Playwright, memilih locator dan assertion yang tahan perubahan, menyusun suite dengan Page Object Model, dan menjinakkan flaky test.
objectives:
  - Menentukan alur yang layak diotomasi dengan E2E
  - Menulis dan menjalankan test Playwright beserta trace-nya
  - Memakai locator berbasis peran dan web-first assertion
  - Menyusun Page Object Model dan mengatasi penyebab flaky test
sources:
  - repo: microsoft/playwright
    note: API, konsep auto-waiting, locator, dan trace viewer
  - repo: cypress-io/cypress-realworld-app
    note: Contoh struktur suite E2E pada aplikasi lengkap
  - repo: SeleniumHQ/selenium
    note: Pembanding pendekatan WebDriver klasik
quiz:
  - q: "Alur mana yang paling layak dijadikan E2E test?"
    options: ["Validasi format email (sudah ada unit test)", "Login → tambah ke keranjang → checkout → pembayaran sukses", "Warna setiap tombol", "Semua kombinasi filter produk"]
    answer: 1
    explain: "E2E mahal dan lambat, jadi gunakan untuk alur kritis bisnis yang melibatkan banyak bagian sistem. Variasi detail cukup di level unit/integrasi."
  - q: "Locator Playwright yang paling tahan terhadap perubahan desain adalah…"
    options: ["page.locator('div > div:nth-child(3) > button')", "page.getByRole('button', { name: 'Checkout' })", "XPath absolut", "Kelas CSS hasil build seperti .css-1x2y3z"]
    answer: 1
    explain: "Peran + nama aksesibel mencerminkan apa yang dilihat pengguna dan jarang berubah saat CSS/struktur diubah."
  - q: "Cara yang SALAH untuk menunggu elemen muncul adalah…"
    options: ["await expect(locator).toBeVisible()", "await page.waitForTimeout(5000)", "Mengandalkan auto-wait pada click()", "await expect(page).toHaveURL(/checkout/)"]
    answer: 1
    explain: "Jeda tetap membuat test lambat sekaligus tetap bisa gagal saat server lebih lambat dari 5 detik. Gunakan assertion yang otomatis menunggu."
  - q: "Manfaat utama Page Object Model adalah…"
    options: ["Test berjalan lebih cepat", "Detail halaman (locator, aksi) terkumpul di satu kelas sehingga perubahan UI cukup diperbaiki di satu tempat", "Tidak perlu assertion", "Menggantikan unit test"]
    answer: 1
    explain: "Test membaca seperti skenario bisnis, sedangkan kelas halaman menyembunyikan detail teknisnya."
---

Unit test memastikan setiap bagian benar. **End-to-end (E2E) test** memastikan bagian-bagian itu **benar saat bekerja bersama**: frontend memanggil API yang benar, API menyimpan ke database, dan halaman menampilkan hasilnya. E2E paling meyakinkan sekaligus paling mahal, jadi gunakan dengan bijak.

## Kapan memakai E2E

```viz
{"type":"compare","title":"Trade-off level pengujian","columns":["Unit","Integration/API","E2E (browser)"],"rows":[{"label":"Kecepatan","values":["Milidetik","Detik","Detik–menit per test"]},{"label":"Keyakinan sistem utuh","values":["Rendah","Sedang","Tinggi"]},{"label":"Lokasi bug saat gagal","values":["Sangat jelas","Cukup jelas","Bisa di mana saja"]},{"label":"Kerapuhan","values":["Rendah","Sedang","Tinggi (jaringan, timing, data)"]},{"label":"Jumlah ideal","values":["Ratusan–ribuan","Puluhan–ratusan","Belasan–puluhan alur kritis"]}]}
```

Kandidat E2E yang baik adalah **alur kritis bisnis** yang jika rusak berarti kerugian langsung: registrasi & login, pencarian → checkout → pembayaran, unggah tugas, dan reset password. Jangan memindahkan semua variasi validasi ke E2E, karena itu tempat unit test.

## Playwright dasar

**Playwright** (dari Microsoft) mengendalikan Chromium, Firefox, dan WebKit, dengan fitur **auto-waiting**, isolasi lewat *browser context*, dan **trace viewer** untuk men-debug kegagalan.

```bash
npm init playwright@latest        # pilih TypeScript, folder tests/, GitHub Actions workflow
npx playwright test               # jalankan semua test (headless, paralel)
npx playwright test --ui          # mode UI interaktif untuk menulis & debug
npx playwright codegen localhost:3000   # rekam aksi menjadi kode sebagai titik awal
npx playwright show-report        # laporan HTML + trace
```

```ts
// tests/checkout.spec.ts
import { test, expect } from "@playwright/test";

test("pembeli bisa checkout satu produk", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Gamis BKMT" }).click();
  await page.getByRole("button", { name: "Tambah ke keranjang" }).click();
  await page.getByRole("link", { name: /keranjang/i }).click();

  await expect(page.getByText("Total: Rp150.000")).toBeVisible();
  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/pesanan\/\d+/);
  await expect(page.getByRole("heading", { name: "Pesanan berhasil dibuat" })).toBeVisible();
});
```

```viz
{"type":"sequence","title":"Auto-waiting: apa yang terjadi di balik click()","caption":"Playwright menunggu elemen siap sebelum bertindak, sehingga sebagian besar sleep() manual tidak dibutuhkan.","actors":["Test","Playwright","Browser"],"messages":[{"from":0,"to":1,"label":"getByRole('button').click()","note":"Locator hanya deskripsi; elemen dicari saat aksi dijalankan."},{"from":1,"to":2,"label":"cari elemen","note":"Diulang sampai ketemu atau timeout (default 30 detik)."},{"from":1,"to":2,"label":"cek actionability","note":"Terlihat? stabil (tidak sedang animasi)? aktif (tidak disabled)? tidak tertutup elemen lain?"},{"from":1,"to":2,"label":"klik","note":"Baru diklik setelah semua syarat terpenuhi."},{"from":0,"to":1,"label":"expect(...).toBeVisible()","note":"Web-first assertion juga mengulang pengecekan sampai lulus atau timeout."}]}
```

## Locator & assertion

Pilihan locator menentukan seberapa sering test rusak karena perubahan yang bukan bug.

| Prioritas | Locator | Contoh |
|---|---|---|
| 1 | peran + nama | `getByRole("button", { name: "Simpan" })` |
| 2 | label form | `getByLabel("Email")` |
| 3 | teks/placeholder | `getByText("Pesanan berhasil")`, `getByPlaceholder("Cari…")` |
| 4 | test id khusus | `getByTestId("ringkasan-total")` (atribut `data-testid`) |
| ✗ | CSS/XPath struktural | `div:nth-child(3) > span`, kelas hasil build |

**Web-first assertion** (`await expect(locator).toHaveText(...)`) otomatis menunggu, berbeda dengan memeriksa nilai sekali lalu membandingkannya:

```ts
// ❌ rapuh: membaca teks sekali, bisa saat data belum datang
expect(await page.locator("#total").textContent()).toBe("Rp150.000");

// ✅ menunggu sampai teks sesuai (atau timeout)
await expect(page.getByTestId("ringkasan-total")).toHaveText("Rp150.000");
```

Assertion yang sering dipakai: `toBeVisible`, `toHaveText`, `toHaveValue`, `toHaveURL`, `toHaveCount`, `toBeEnabled`, serta `toHaveScreenshot` untuk visual regression.

## Page Object Model

Saat suite tumbuh, locator yang sama tersebar di puluhan test. Jika label tombol berubah, puluhan file harus diedit. **Page Object Model (POM)** mengumpulkan detail setiap halaman ke satu kelas.

```viz
{"type":"tree","title":"Struktur suite E2E dengan POM","root":{"label":"e2e/","detail":"Folder test end-to-end.","children":[{"label":"pages/","detail":"Satu kelas per halaman/komponen besar.","children":[{"label":"LoginPage.ts","detail":"locator email, password, tombol; aksi login(email, pw)."},{"label":"ProdukPage.ts","detail":"aksi tambahKeKeranjang(nama)."},{"label":"KeranjangPage.ts","detail":"locator total; aksi checkout()."}]},{"label":"fixtures.ts","detail":"Menyediakan page object & pengguna yang sudah login ke setiap test."},{"label":"tests/","detail":"Skenario yang terbaca seperti cerita bisnis.","children":[{"label":"checkout.spec.ts","detail":"Memakai page object, tanpa selector mentah."}]}]}}
```

```ts
// e2e/pages/KeranjangPage.ts
import { type Page, expect } from "@playwright/test";
export class KeranjangPage {
  constructor(private page: Page) {}
  total = () => this.page.getByTestId("ringkasan-total");
  async buka() { await this.page.goto("/keranjang"); }
  async checkout() {
    await this.page.getByRole("button", { name: "Checkout" }).click();
    await expect(this.page).toHaveURL(/\/pesanan\//);
  }
}

// e2e/tests/checkout.spec.ts
test("checkout satu produk", async ({ produk, keranjang }) => {
  await produk.tambahKeKeranjang("Gamis BKMT");
  await keranjang.buka();
  await expect(keranjang.total()).toHaveText("Rp150.000");
  await keranjang.checkout();
});
```

Agar test cepat, **jangan login lewat UI di setiap test**. Login sekali di *setup project*, simpan *storage state* (cookie), lalu pakai ulang. Siapkan data uji lewat API/seed database, bukan dengan mengklik form panjang.

## Mengatasi flaky test

**Flaky test** kadang lulus, kadang gagal tanpa perubahan kode. Tim cepat kehilangan kepercayaan dan mulai mengabaikan kegagalan, termasuk yang sungguhan. Penyebab dan obatnya:

```viz
{"type":"flow","title":"Diagnosis flaky test","caption":"Retry otomatis di CI (retries: 2) berguna sebagai jaring pengaman, tetapi test yang lulus hanya setelah retry harus diselidiki, bukan didiamkan.","steps":[{"label":"Timing","detail":"waitForTimeout, assertion non-web-first, animasi. → Pakai auto-wait & web-first assertion; tunggu respons jaringan tertentu (waitForResponse) bila perlu."},{"label":"Data bersama","detail":"Test saling bergantung atau memakai akun/data yang sama saat paralel. → Data unik per test (mis. email dengan timestamp), reset/seed database."},{"label":"Urutan test","detail":"Test B hanya lulus jika A jalan dulu. → Setiap test menyiapkan kebutuhannya sendiri."},{"label":"Dependensi eksternal","detail":"API pihak ketiga, email, pembayaran. → Mock jaringan dengan page.route() atau sandbox."},{"label":"Lingkungan","detail":"Zona waktu, bahasa, ukuran layar berbeda di CI. → Tetapkan locale, timezone, viewport di config."},{"label":"Investigasi","detail":"Buka trace (trace: 'on-first-retry'): lihat DOM, jaringan, & screenshot di setiap langkah."}]}
```

```ts
// playwright.config.ts (potongan)
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    locale: "id-ID",
    timezoneId: "Asia/Makassar",
  },
  webServer: { command: "npm run start", url: "http://localhost:3000", reuseExistingServer: !process.env.CI },
});
```

:::latihan
Milestone: bangun suite E2E untuk aplikasi contoh (RealWorld, aplikasi web dari jalur lain, atau `cypress-realworld-app`) dengan alur login, pencarian, dan checkout/buat artikel. Gunakan POM + fixtures, login lewat storage state, data unik per test, jalankan paralel di 2 browser, dan aktifkan di GitHub Actions dengan laporan HTML sebagai artifact. Jalankan 10× berturut-turut: harus 10/10 hijau.
:::

## Rangkuman

- E2E untuk alur kritis bisnis; variasi detail di unit/integration.
- Playwright: auto-wait, multi-browser, codegen sebagai titik awal, trace untuk debugging.
- Locator berbasis peran/label; web-first assertion; jangan `waitForTimeout`.
- POM + fixtures membuat suite terbaca dan perubahan UI diperbaiki di satu tempat.
- Flaky test berasal dari timing, data bersama, urutan, dependensi eksternal, atau lingkungan. Selidiki dengan trace.
