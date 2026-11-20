---
title: API & performance testing
minutes: 45
summary: Banyak bug paling serius tidak terlihat di layar, tetapi berada di API dan performa sistem saat ramai. Modul ini membekali tester dengan pemahaman HTTP, cara mengotomasi pengujian API, menjaga kesepakatan antar layanan lewat contract testing, menjalankan load test dengan k6, dan membaca metriknya dengan benar.
objectives:
  - Membaca dan menyusun request/response HTTP untuk keperluan pengujian
  - Mengotomasi test API untuk skenario positif, negatif, dan keamanan dasar
  - Memahami contract testing antara konsumen dan penyedia API
  - Menjalankan load test dengan k6 dan menafsirkan p95, throughput, dan error rate
sources:
  - repo: grafana/k6
    note: Konsep virtual user, threshold, dan skenario load test
  - repo: realworld-apps/realworld
    note: Spesifikasi API sebagai target latihan
  - repo: goldbergyoni/javascript-testing-best-practices
    note: Bagian pengujian backend dan kontrak
quiz:
  - q: "API mengembalikan 200 OK dengan body {\"error\": \"stok habis\"} saat stok habis. Masalahnya…"
    options: ["Tidak ada masalah", "Status code tidak mencerminkan hasil; klien bisa mengira request berhasil", "Body harus kosong", "Harus 500"]
    answer: 1
    explain: "Kondisi gagal karena aturan bisnis sebaiknya 4xx (mis. 409 Conflict/422). Tester harus memeriksa status DAN body."
  - q: "Rata-rata waktu respons 200 ms tetapi p95 = 3 detik. Artinya…"
    options: ["Semua pengguna puas", "5% request membutuhkan ≥ 3 detik. Rata-rata menyembunyikan pengalaman buruk sebagian pengguna", "Server mati", "Test salah"]
    answer: 1
    explain: "Persentil menunjukkan ekor distribusi. Pengguna yang aktif sering mengalami request lambat itu."
  - q: "Contract testing menjawab pertanyaan…"
    options: ["Berapa request per detik yang sanggup ditangani?", "Apakah penyedia API masih memenuhi bentuk request/response yang diharapkan konsumennya?", "Apakah UI rapi?", "Apakah password kuat?"]
    answer: 1
    explain: "Kontrak memastikan perubahan di satu layanan tidak diam-diam merusak layanan/aplikasi yang memakainya."
  - q: "Jenis test yang menaikkan beban secara bertahap sampai sistem gagal untuk menemukan batasnya disebut…"
    options: ["Smoke test", "Stress test", "Unit test", "Soak test"]
    answer: 1
    explain: "Stress test mencari titik patah. Soak test menahan beban normal dalam waktu lama untuk menemukan kebocoran memori."
---

Aplikasi mobile, web, dan layanan lain semuanya berbicara lewat API. Satu perubahan kecil di API, seperti nama field yang diganti atau status code yang berubah, bisa mematikan aplikasi yang memakainya. Dan aplikasi yang lancar dengan 10 pengguna bisa tumbang saat 1.000 orang membuka pengumuman kelulusan bersamaan. Modul ini membahas pengujian di dua area tersebut.

## HTTP & REST untuk tester

Tester API harus fasih membaca percakapan HTTP:

```viz
{"type":"sequence","title":"Anatomi request & response yang perlu diperiksa","actors":["Klien / test","API"],"messages":[{"from":0,"to":1,"label":"POST /api/articles","note":"Method + path + query string. Apakah method sesuai aksinya?"},{"from":0,"to":1,"label":"Header: Authorization, Content-Type","note":"Coba tanpa token, token kedaluwarsa, token pengguna lain."},{"from":0,"to":1,"label":"Body JSON","note":"Variasikan: field hilang, tipe salah, string sangat panjang, karakter khusus."},{"from":1,"to":0,"label":"Status code","note":"201 saat dibuat, 401/403/404/409/422 sesuai kondisi, bukan 200 untuk semuanya."},{"from":1,"to":0,"label":"Header respons","note":"Content-Type, Location, Cache-Control, header keamanan."},{"from":1,"to":0,"label":"Body & waktu respons","note":"Struktur sesuai kontrak, tidak membocorkan data sensitif (hash password, stack trace), waktu wajar."}]}
```

Checklist pengujian per endpoint:

- **Positif**: input valid → status & body sesuai.
- **Validasi**: field wajib hilang, tipe salah, batas panjang (teknik EP/BVA dari modul 2 berlaku di sini!).
- **Autentikasi & otorisasi**: tanpa token → 401; token pengguna lain mengakses resource orang lain → 403/404 (bukan 200!).
- **Idempotensi & konkurensi**: PUT/DELETE dua kali, dua request bersamaan.
- **Tidak bocor**: respons tidak berisi field internal atau data sensitif.

## API testing otomatis

Alat GUI seperti **Postman/Insomnia/Bruno** bagus untuk eksplorasi. Untuk regresi, simpan test sebagai **kode** di repository agar bisa direview dan dijalankan di CI. Playwright juga punya klien API:

```ts
import { test, expect } from "@playwright/test";

test.describe("API artikel", () => {
  test("membuat artikel mengembalikan 201 dan bentuk data yang benar", async ({ request }) => {
    const res = await request.post("/api/articles", {
      headers: { Authorization: `Token ${process.env.TOKEN_AYU}` },
      data: { article: { title: `Uji ${Date.now()}`, description: "d", body: "isi artikel", tagList: ["qa"] } },
    });
    expect(res.status()).toBe(201);
    const { article } = await res.json();
    expect(article).toMatchObject({ title: expect.stringContaining("Uji"), tagList: ["qa"], author: { username: "ayu" } });
    expect(article).not.toHaveProperty("author.password");
  });

  test("pengguna lain tidak bisa menghapus artikel Ayu", async ({ request }) => {
    const res = await request.delete(`/api/articles/${slugMilikAyu}`, { headers: { Authorization: `Token ${process.env.TOKEN_BIMA}` } });
    expect([403, 404]).toContain(res.status());
  });

  test("422 dengan pesan per field saat judul kosong", async ({ request }) => {
    const res = await request.post("/api/articles", { headers: { Authorization: `Token ${process.env.TOKEN_AYU}` }, data: { article: { title: "" } } });
    expect(res.status()).toBe(422);
    expect((await res.json()).errors).toHaveProperty("title");
  });
});
```

Validasi struktur respons secara menyeluruh bisa dilakukan dengan **JSON Schema** atau skema Zod yang sama dengan backend, sehingga field yang hilang atau tipe yang berubah langsung tertangkap.

## Contract testing

Di sistem dengan banyak tim (web, mobile, beberapa layanan backend), test E2E untuk semua kombinasi menjadi lambat dan rapuh. **Contract testing** memeriksa setiap pasangan konsumen–penyedia secara terpisah.

```viz
{"type":"flow","title":"Consumer-driven contract testing (mis. dengan Pact)","caption":"Jika tim backend mengubah nama field ‘total’ menjadi ‘grandTotal’, verifikasi kontrak gagal di CI backend sebelum aplikasi mobile rusak di tangan pengguna.","steps":[{"label":"Konsumen menulis ekspektasi","detail":"Test aplikasi mobile: ‘GET /pesanan/1 harus mengembalikan {id: number, total: number, status: string}’."},{"label":"Kontrak dihasilkan","detail":"File kontrak (JSON) berisi request & bentuk response yang diharapkan."},{"label":"Dibagikan","detail":"Kontrak diterbitkan ke broker (Pact Broker/PactFlow) atau repo bersama."},{"label":"Penyedia memverifikasi","detail":"CI backend memutar ulang request dari kontrak ke API sungguhan dan memeriksa respons."},{"label":"Aman untuk rilis?","detail":"Rilis hanya jika semua kontrak konsumen yang aktif masih terpenuhi."}]}
```

Pendekatan yang lebih ringan untuk tim kecil: jadikan **spesifikasi OpenAPI** sebagai kontrak, lalu validasi respons API terhadapnya secara otomatis di CI.

## Load testing dengan k6

**k6** (dari Grafana) menulis skenario beban dalam JavaScript dan menjalankannya dari CLI.

```viz
{"type":"compare","title":"Jenis performance test","columns":["Smoke","Load","Stress","Spike","Soak"],"rows":[{"label":"Tujuan","values":["Skrip & sistem berfungsi","Perilaku pada beban normal/puncak yang diharapkan","Mencari titik patah","Lonjakan mendadak","Stabil dalam waktu lama"]},{"label":"Beban","values":["1–5 VU","Target realistis","Naik terus melampaui target","Naik drastis dalam detik","Normal, berjam-jam"]},{"label":"Contoh kasus","values":["Setelah ubah skrip","Pendaftaran KRS hari biasa","Kapan server menyerah?","Pengumuman kelulusan dirilis","Kebocoran memori/koneksi"]}]}
```

```js
// load-test.js: jalankan dengan: k6 run load-test.js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 50 },    // naik ke 50 virtual user
    { duration: "3m", target: 50 },    // tahan
    { duration: "1m", target: 0 },     // turun
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],  // 95% request < 500 ms
    http_req_failed: ["rate<0.01"],    // error < 1%
  },
};

export default function () {
  const res = http.get(`${__ENV.BASE_URL}/api/articles?limit=20`);
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(1);                             // jeda ‘berpikir’ pengguna
}
```

Aturan penting: uji di lingkungan yang **mirip produksi** dan **milikmu sendiri**. Load test ke sistem orang lain tanpa izin sama saja dengan serangan DoS.

## Membaca metrik performa

```viz
{"type":"distribution"}
```

Waktu respons hampir tidak pernah terdistribusi rapi; selalu ada **ekor panjang** request yang jauh lebih lambat. Karena itu laporan performa memakai **persentil**, bukan rata-rata:

| Metrik | Arti | Contoh target |
|---|---|---|
| p50 (median) | separuh request lebih cepat dari ini | < 150 ms |
| p95 / p99 | 95%/99% request lebih cepat dari ini, yaitu pengalaman pengguna ‘sial’ | p95 < 500 ms |
| Throughput (RPS) | request per detik yang berhasil dilayani | ≥ 200 RPS |
| Error rate | % request gagal (5xx, timeout) | < 1% |
| Saturasi | CPU, memori, koneksi DB, antrean | CPU < 70% saat puncak |

Cara membaca hasil: cari **titik belok**, yaitu saat VU bertambah tetapi throughput berhenti naik sementara p95 melonjak. Di situlah ada sumber daya yang jenuh (sering koneksi database atau query tanpa index). Laporan yang baik menyebutkan skenario, beban, hasil terhadap threshold, titik belok, dan dugaan bottleneck beserta buktinya.

:::latihan
Milestone: untuk satu API (RealWorld atau API dari jalur Backend): (1) 20+ test API otomatis termasuk 401/403/404/422 dan pemeriksaan kebocoran data, (2) validasi respons terhadap skema, (3) skrip k6 smoke + load dengan threshold, (4) laporan 1 halaman berisi p50/p95/p99, throughput, error rate, titik belok, dan rekomendasi. Jalankan test API di CI pada setiap PR.
:::

## Rangkuman

- Periksa method, header, body, status code, dan waktu; uji otorisasi lintas pengguna.
- Simpan test API sebagai kode; validasi struktur respons dengan skema.
- Contract testing mencegah perubahan API diam-diam merusak konsumen.
- k6: stages + thresholds; pilih jenis test sesuai pertanyaan (load/stress/spike/soak); uji hanya sistem milikmu.
- Laporkan persentil (p95/p99), throughput, error rate, dan saturasi, bukan rata-rata saja.
