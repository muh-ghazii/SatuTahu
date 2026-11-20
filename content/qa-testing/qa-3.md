---
title: Unit & integration testing
minutes: 45
summary: Test otomatis di level kode adalah fondasi piramida testing, karena cepat, murah, dan dijalankan ribuan kali sehari. Modul ini membahas cara menulis test yang terbaca, mengisolasi dependensi dengan mock/stub/spy, membaca code coverage dengan kritis, mempraktikkan TDD, dan menguji komponen UI seperti pengguna.
objectives:
  - Menulis test dengan pola Arrange-Act-Assert dan nama yang deskriptif
  - Memakai test double (stub, mock, spy, fake) secara tepat
  - Membaca code coverage tanpa terjebak mengejar angka
  - Mempraktikkan siklus TDD dan menguji komponen UI
sources:
  - repo: goldbergyoni/javascript-testing-best-practices
    note: Prinsip test yang menguji perilaku, struktur AAA, dan penggunaan mock
  - repo: vitest-dev/vitest
    note: Test runner, assertion, dan fitur mock yang dipakai di contoh
  - repo: testing-library/react-testing-library
    note: Prinsip menguji komponen dari sudut pandang pengguna
quiz:
  - q: "Kamu ingin memastikan fungsi kirimEmail dipanggil sekali dengan alamat yang benar setelah registrasi. Test double yang tepat?"
    options: ["Stub", "Spy/mock yang merekam pemanggilan", "Fake database", "Tidak perlu test double"]
    answer: 1
    explain: "Spy/mock memverifikasi interaksi (berapa kali, dengan argumen apa). Stub hanya menyediakan jawaban."
  - q: "Coverage 100% berarti…"
    options: ["Tidak ada bug", "Setiap baris/cabang pernah dijalankan oleh test, belum tentu diverifikasi dengan benar", "Semua requirement terpenuhi", "Test pasti cepat"]
    answer: 1
    explain: "Test tanpa assertion pun bisa menaikkan coverage. Coverage menunjukkan bagian yang BELUM diuji, bukan kualitas test."
  - q: "Urutan siklus TDD yang benar adalah…"
    options: ["Green → Red → Refactor", "Red → Green → Refactor", "Refactor → Red → Green", "Tulis semua kode dulu lalu test"]
    answer: 1
    explain: "Tulis test yang gagal (red), tulis kode minimal agar lulus (green), lalu rapikan dengan aman (refactor)."
  - q: "Mengapa test yang memeriksa nama state internal komponen dianggap rapuh?"
    options: ["Karena lambat", "Refactor yang tidak mengubah perilaku tetap membuat test gagal (false negative)", "Karena tidak bisa dijalankan di CI", "Karena butuh browser"]
    answer: 1
    explain: "Uji perilaku yang terlihat pengguna (teks, peran, aksi), bukan detail implementasi."
---

Test otomatis yang baik adalah **dokumentasi yang selalu benar**: ia menjelaskan apa yang seharusnya dilakukan kode, dan langsung berteriak ketika perilaku itu berubah. Test yang buruk adalah beban, karena lambat, sering gagal tanpa alasan, dan harus diubah setiap kali kode dirapikan. Modul ini fokus pada perbedaan keduanya.

Contoh memakai **Vitest** (JavaScript/TypeScript). Konsepnya berlaku sama di pytest (Python), JUnit (Java/Kotlin), atau `testing` (Go).

## Pola Arrange-Act-Assert

Setiap test punya tiga bagian yang dipisahkan jelas:

```ts
import { describe, it, expect } from "vitest";
import { hitungOngkir } from "./ongkir";

describe("hitungOngkir", () => {
  it("gratis untuk member gold walau belanja kecil", () => {
    // Arrange: siapkan data
    const pesanan = { total: 50_000, provinsi: "Jawa Barat", member: "gold" as const };
    // Act: jalankan satu aksi
    const ongkir = hitungOngkir(pesanan);
    // Assert: periksa hasil
    expect(ongkir).toBe(0);
  });

  it("menolak total negatif dengan pesan yang jelas", () => {
    expect(() => hitungOngkir({ total: -1, provinsi: "Kalsel", member: "biasa" })).toThrow(/total/i);
  });
});
```

Ciri test yang baik:

- **Nama menjelaskan skenario dan harapan**: saat gagal, laporan CI langsung bercerita (‘hitungOngkir › gratis untuk member gold walau belanja kecil’).
- **Satu perilaku per test**. Beberapa `expect` boleh, asalkan memeriksa satu perilaku.
- **Mandiri & deterministik**: tidak bergantung urutan test lain, waktu sekarang, atau jaringan. Jika butuh tanggal, ‘bekukan’ waktunya (`vi.useFakeTimers()`).
- **Cepat**: unit test diukur dalam milidetik.

## Mock, stub & spy

Kode nyata bergantung pada hal-hal di luar kendali test: database, API pembayaran, email, waktu. **Test double** menggantikannya:

```viz
{"type":"compare","title":"Jenis test double","columns":["Stub","Spy","Mock","Fake"],"rows":[{"label":"Fungsi","values":["Memberi jawaban yang sudah diatur","Merekam pemanggilan pada fungsi (asli/palsu)","Stub + ekspektasi interaksi yang diverifikasi","Implementasi ringan yang benar-benar bekerja"]},{"label":"Contoh","values":["getKurs() selalu mengembalikan 16.000","Catat berapa kali logger.warn dipanggil","Pastikan email.kirim dipanggil 1× dengan alamat X","Repository di memori (Map) menggantikan PostgreSQL"]},{"label":"Kapan","values":["Mengendalikan input tidak langsung","Memeriksa efek samping","Memverifikasi kolaborasi penting","Integrasi cepat tanpa database sungguhan"]}]}
```

```ts
import { vi, it, expect } from "vitest";
import { daftarkanPengguna } from "./registrasi";

it("mengirim email selamat datang setelah registrasi berhasil", async () => {
  const repo = { simpan: vi.fn().mockResolvedValue({ id: 7, email: "ayu@contoh.id" }) };  // stub
  const email = { kirim: vi.fn().mockResolvedValue(undefined) };                          // mock/spy

  await daftarkanPengguna({ email: "ayu@contoh.id", password: "rahasia-panjang" }, { repo, email });

  expect(email.kirim).toHaveBeenCalledOnce();
  expect(email.kirim).toHaveBeenCalledWith(expect.objectContaining({ ke: "ayu@contoh.id", template: "selamat-datang" }));
});
```

:::warning[Jangan berlebihan mock]
Jika setiap test memalsukan semua kolaborator, test hanya membuktikan bahwa ‘kode memanggil apa yang kamu tulis untuk dipanggil’. Mock hal yang **lambat, tidak deterministik, atau mahal** (jaringan, email, pembayaran, waktu). Untuk logika internal dan database, pertimbangkan **integration test** dengan database sungguhan dalam container: lebih lambat sedikit, tetapi jauh lebih meyakinkan.
:::

## Code coverage

**Code coverage** mengukur bagian kode yang dijalankan oleh test: **statement**, **branch** (setiap cabang `if`/`else`), **function**, dan **line**. Jalankan dengan `vitest run --coverage`.

```ts
function kategoriNilai(n: number) {
  if (n < 0 || n > 100) throw new RangeError("nilai 0-100");
  if (n >= 85) return "A";
  if (n >= 70) return "B";
  return "C";
}
// Test hanya kategoriNilai(90) → line coverage tinggi-ish, branch coverage rendah:
// cabang error, "B", dan "C" tidak pernah dijalankan.
```

Cara membaca coverage dengan sehat:

- Coverage berguna untuk menemukan **bagian yang belum diuji**, terutama cabang error.
- Coverage **bukan** ukuran kualitas: test tanpa assertion tetap menaikkan angka.
- Target masuk akal 70–85% untuk logika bisnis; 100% di semua tempat biasanya membuang waktu pada kode sepele.
- Jadikan coverage **tidak boleh turun** di CI, lebih berguna daripada angka absolut.

## Test-Driven Development

**TDD** membalik urutan: tulis test dulu, baru kodenya.

```viz
{"type":"flow","title":"Siklus TDD: Red → Green → Refactor","caption":"Siklus berukuran menit, bukan jam. Test yang ditulis lebih dulu memaksa kamu merancang API yang mudah dipakai dan diuji.","loop":true,"steps":[{"label":"Red","detail":"Tulis satu test kecil untuk perilaku berikutnya. Jalankan: harus GAGAL (membuktikan test benar-benar menguji sesuatu)."},{"label":"Green","detail":"Tulis kode paling sederhana agar test lulus. Belum perlu elegan."},{"label":"Refactor","detail":"Rapikan kode & test (nama, duplikasi) sambil memastikan semua test tetap hijau."}]}
```

Contoh mini: fungsi format Rupiah.

```ts
// 1. RED
it("memformat ribuan dengan titik", () => expect(rupiah(150000)).toBe("Rp150.000"));
// 2. GREEN: implementasi minimal
export const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");
// 3. Test berikutnya (RED): angka negatif
it("menampilkan minus di depan", () => expect(rupiah(-5000)).toBe("-Rp5.000"));
// → ubah implementasi, jalankan semua test, refactor...
```

TDD paling bermanfaat untuk **logika dengan aturan jelas** (perhitungan, validasi, parser). Untuk eksplorasi UI atau prototipe, menulis test setelahnya sering lebih praktis. Yang penting adalah test yang berarti, bukan urutannya.

## Testing komponen UI

Uji komponen **seperti pengguna memakainya**: cari elemen berdasarkan peran dan teks yang terlihat, lakukan aksi, lalu periksa hasil yang terlihat.

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormDaftar } from "./FormDaftar";

it("menampilkan pesan error saat email tidak valid dan tidak memanggil onSubmit", async () => {
  const onSubmit = vi.fn();
  render(<FormDaftar onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText(/email/i), "bukan-email");
  await userEvent.click(screen.getByRole("button", { name: /daftar/i }));

  expect(screen.getByRole("alert")).toHaveTextContent(/email tidak valid/i);
  expect(onSubmit).not.toHaveBeenCalled();
});
```

Prioritas query Testing Library mencerminkan aksesibilitas: `getByRole` → `getByLabelText` → `getByText` → (terakhir) `getByTestId`. Jika test sulit menemukan tombol lewat perannya, kemungkinan pembaca layar juga kesulitan. Test menjadi alat audit aksesibilitas gratis.

```viz
{"type":"layers","title":"Di mana unit & integration test berada","caption":"Modul ini membahas dua lapisan bawah. E2E dan API testing dibahas di modul berikutnya.","layers":[{"label":"E2E (browser)","tag":"modul 4","detail":"Alur pengguna lengkap dengan Playwright."},{"label":"API / kontrak","tag":"modul 5","detail":"Endpoint HTTP dan kesepakatan antar layanan."},{"label":"Integration","tag":"modul ini","detail":"Beberapa unit bersama: service + database container, komponen + store."},{"label":"Unit","tag":"modul ini","detail":"Fungsi & komponen terisolasi, test double untuk dependensi luar."}]}
```

:::latihan
Milestone: ambil satu proyek (milikmu atau open source yang minim test). Tulis 15+ unit test dengan AAA, 3 test yang memakai mock/spy untuk dependensi luar, 2 integration test dengan database dalam container (Testcontainers atau docker compose), dan 3 test komponen dengan Testing Library. Kerjakan satu fitur kecil dengan TDD penuh. Targetkan coverage ≥ 80% pada modul logika bisnis dan tambahkan ke CI.
:::

## Rangkuman

- AAA, nama deskriptif, satu perilaku per test, mandiri dan deterministik.
- Stub memberi jawaban, spy/mock memverifikasi interaksi, fake menggantikan implementasi berat. Jangan mock berlebihan.
- Coverage menunjukkan yang belum diuji, bukan kualitas; jaga agar tidak turun.
- TDD: red → green → refactor dalam siklus menit.
- Uji komponen seperti pengguna: berdasarkan peran, label, dan teks yang terlihat.
