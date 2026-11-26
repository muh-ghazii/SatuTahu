---
title: "Fondasi backend: Linux, Git, HTTP & satu bahasa"
minutes: 40
summary: Backend developer bekerja di ‘belakang layar’, yaitu server yang menerima request, menjalankan logika, dan menyimpan data. Modul ini menyiapkan fondasi yang dipakai setiap hari, yaitu terminal Linux, alur Git di tim, protokol HTTP secara detail, memilih bahasa pertama, dan menata proyek.
objectives:
  - Memakai terminal Linux untuk navigasi, proses, dan log
  - Menerapkan alur Git berbasis branch dan pull request
  - Menjelaskan anatomi request/response HTTP dan memilih status code yang tepat
  - Membuat server HTTP pertama dan struktur proyek yang rapi
sources:
  - repo: jlevy/the-art-of-command-line
    note: Perintah terminal yang esensial untuk server
  - repo: alex/what-happens-when
    note: Alur DNS, TCP, TLS, dan HTTP saat sebuah URL dibuka
  - repo: quii/learn-go-with-tests
    note: Contoh server HTTP Go dan pendekatan berbasis test
  - repo: ProgrammerZamanNow/belajar-nodejs-dasar
    note: Contoh modul inti Node.js berbahasa Indonesia
  - repo: bellshade/Golang
    note: Materi Go berbahasa Indonesia
  - repo: novalagung/dasarpemrogramangolang
    note: Ebook gratis 160+ bab Dasar Pemrograman Golang berbahasa Indonesia
quiz:
  - q: "Klien mengirim data registrasi dengan email yang formatnya salah. Status code paling tepat?"
    options: ["200 OK", "400 Bad Request (atau 422)", "404 Not Found", "500 Internal Server Error"]
    answer: 1
    explain: "Kesalahan ada di input klien → 4xx. 400 umum dipakai; 422 Unprocessable Content untuk data yang sintaksnya valid tapi gagal validasi. 500 berarti bug di server."
  - q: "Method HTTP mana yang idempoten (dipanggil berkali-kali hasilnya sama)?"
    options: ["POST", "PUT", "Keduanya tidak", "Hanya PATCH"]
    answer: 1
    explain: "PUT mengganti resource dengan nilai yang sama berulang kali tanpa efek tambahan. POST umumnya membuat resource baru setiap kali dipanggil."
  - q: "Perintah untuk mengikuti log server secara real-time?"
    options: ["cat app.log", "tail -f app.log", "rm app.log", "ls app.log"]
    answer: 1
    explain: "tail -f terus menampilkan baris baru yang ditulis ke file, berguna saat men-debug server yang sedang berjalan."
  - q: "Kenapa file .env berisi password database tidak boleh di-commit?"
    options: ["Ukurannya besar", "Rahasia akan tersimpan selamanya di riwayat Git dan bisa bocor", "Git tidak bisa membaca .env", "Membuat build lambat"]
    answer: 1
    explain: "Riwayat Git sulit dibersihkan. Masukkan .env ke .gitignore dan sediakan .env.example tanpa nilai rahasia."
---

Setiap aplikasi yang kamu pakai, seperti m-banking, marketplace, atau sistem akademik kampus, punya backend yang melayani jutaan request. Pekerjaan backend developer adalah memastikan server menjawab dengan **benar**, **cepat**, dan **aman**. Sebelum masuk ke database dan API, kuasai dulu alat dan protokol dasarnya.

## Command line & shell

Server produksi hampir selalu Linux tanpa tampilan grafis, dan kamu mengaksesnya lewat SSH. Selain perintah dasar navigasi (dibahas di jalur Fondasi CS), backend developer sering memakai perintah berikut:

```bash
ssh ghazi@203.0.113.10          # masuk ke server
ps aux | grep node              # proses node apa saja yang berjalan?
kill -15 12345                  # minta proses berhenti dengan sopan (SIGTERM)
ss -tulpn                       # port apa yang sedang mendengarkan?
curl -i http://localhost:3000/health   # uji endpoint, -i tampilkan header
tail -f /var/log/app.log        # ikuti log secara real-time
df -h && free -h                # sisa disk & memori
grep -rn "TODO" src/            # cari teks di seluruh folder
```

`curl` akan jadi sahabatmu: alat untuk mengirim request HTTP langsung dari terminal tanpa browser.

```bash
curl -X POST http://localhost:3000/api/produk \
  -H "Content-Type: application/json" \
  -d '{"nama":"Gamis","harga":150000}'
```

## Git workflow

Di tim backend, alur yang umum adalah **trunk-based** atau **GitHub flow**: `main` selalu siap rilis, setiap perubahan dikerjakan di branch pendek, lalu masuk lewat pull request yang ditinjau dan diuji otomatis.

```viz
{"type":"git-graph"}
```

Kebiasaan yang membedakan engineer yang rapi:

- Branch bernama jelas: `feat/login-google`, `fix/total-diskon`.
- Commit kecil dengan pesan kalimat perintah: `Tambah validasi email pada registrasi`.
- `.gitignore` memuat `node_modules/`, `.env`, file build, dan log.
- Rahasia **tidak pernah** di-commit. Sediakan `.env.example` sebagai contoh variabel yang dibutuhkan.

## HTTP: method, status code, header

HTTP adalah bahasa yang dipakai klien dan servermu untuk berbicara. Memahaminya secara detail membuat API-mu terasa ‘benar’ bagi developer lain.

```viz
{"type":"sequence","title":"Satu siklus request–response","actors":["Klien","Server API","Database"],"messages":[{"from":0,"to":1,"label":"POST /api/pesanan","note":"Header: Content-Type: application/json, Authorization: Bearer <token>. Body: {produkId: 7, qty: 2}."},{"from":1,"to":1,"label":"validasi + auth","note":"Server memeriksa token dan memvalidasi body. Jika gagal: 401 atau 400 tanpa menyentuh database."},{"from":1,"to":2,"label":"INSERT pesanan","note":"Logika bisnis berjalan dan data disimpan."},{"from":2,"to":1,"label":"id = 981","note":"Database mengonfirmasi penyimpanan."},{"from":1,"to":0,"label":"201 Created","note":"Header Location: /api/pesanan/981, body berisi pesanan yang baru dibuat."}]}
```

| Method | Makna | Idempoten? | Contoh |
|---|---|---|---|
| `GET` | ambil data | ya | `GET /produk?kategori=gamis` |
| `POST` | buat baru / aksi | tidak | `POST /pesanan` |
| `PUT` | ganti seluruh resource | ya | `PUT /produk/7` |
| `PATCH` | ubah sebagian | tergantung | `PATCH /produk/7 {harga}` |
| `DELETE` | hapus | ya | `DELETE /produk/7` |

Status code yang wajib hafal: **200** OK, **201** Created, **204** No Content, **301/302** redirect, **304** Not Modified (cache), **400** Bad Request, **401** Unauthorized (belum login), **403** Forbidden (sudah login tapi tidak berhak), **404** Not Found, **409** Conflict (mis. email sudah terdaftar), **422** gagal validasi, **429** Too Many Requests, **500** Internal Server Error, **503** Service Unavailable.

Header penting: `Content-Type`, `Authorization`, `Cache-Control`, `ETag`, `Set-Cookie`, dan header CORS (`Access-Control-Allow-Origin`) yang menentukan domain mana yang boleh memanggil API-mu dari browser.

## Bahasa: Node.js, Go, atau Python

Pilih **satu** bahasa dan dalami. Konsep backend (HTTP, database, keamanan) berlaku di semua bahasa.

```viz
{"type":"compare","title":"Memilih bahasa backend pertama","columns":["Node.js (TypeScript)","Go","Python"],"rows":[{"label":"Kelebihan","values":["Satu bahasa dengan frontend, ekosistem npm terbesar","Cepat, hemat memori, concurrency bawaan (goroutine), satu file binary","Sintaks paling mudah, kuat untuk data/AI"]},{"label":"Framework populer","values":["Express, Fastify, NestJS","net/http (standar), Gin, Echo","FastAPI, Django, Flask"]},{"label":"Cocok untuk","values":["Startup, API untuk aplikasi web/mobile","Layanan berperforma tinggi, infrastruktur","API yang dekat dengan model ML, admin panel"]},{"label":"Hati-hati","values":["Kerja CPU berat memblokir event loop","Lebih verbose, generics relatif baru","Lebih lambat untuk CPU-bound, GIL"]}]}
```

Server HTTP paling sederhana di masing-masing bahasa:

```ts
// Node.js: server.ts
import { createServer } from "node:http";

createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "ok" }));
  }
  res.writeHead(404).end();
}).listen(3000, () => console.log("http://localhost:3000"));
```

```go
// Go: main.go
package main

import (
	"encoding/json"
	"net/http"
)

func main() {
	http.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})
	http.ListenAndServe(":3000", nil)
}
```

```python
# Python: main.py  (pip install fastapi uvicorn, lalu: uvicorn main:app --reload)
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}
```

:::info
Pola `"GET /health"` di `HandleFunc` membutuhkan Go 1.22 atau lebih baru, yang menambahkan pencocokan method dan path parameter pada router standar.
:::

## Struktur proyek & dependency

Proyek backend yang rapi memisahkan **lapisan** sehingga logika bisnis tidak bercampur dengan detail HTTP atau database:

```viz
{"type":"layers","title":"Arsitektur berlapis sederhana","caption":"Ketergantungan mengarah ke bawah. Logika bisnis (service) bisa diuji tanpa server HTTP dan tanpa database sungguhan.","layers":[{"label":"Routes / Controller","tag":"HTTP","detail":"Menerima request, membaca parameter, memanggil service, dan mengubah hasilnya menjadi response + status code."},{"label":"Validation","tag":"input","detail":"Memastikan input sesuai skema sebelum masuk ke logika bisnis (mis. Zod, Pydantic)."},{"label":"Service","tag":"bisnis","detail":"Aturan bisnis: hitung total, cek stok, terapkan diskon. Tidak tahu apa-apa soal HTTP."},{"label":"Repository","tag":"data","detail":"Satu-satunya lapisan yang berbicara dengan database (query SQL / ORM)."},{"label":"Database","tag":"storage","detail":"PostgreSQL, MySQL, dll."}]}
```

```text
api-toko/
├── src/
│   ├── routes/produk.ts
│   ├── services/produk.service.ts
│   ├── repositories/produk.repo.ts
│   ├── schemas/produk.schema.ts
│   ├── config.ts           ← membaca variabel lingkungan
│   └── server.ts
├── tests/
├── .env.example
├── package.json            ← dependency + script (dev, test, build)
└── package-lock.json       ← versi persis: WAJIB di-commit
```

**Lock file** (`package-lock.json`, `go.sum`, `poetry.lock`) memastikan semua orang dan server produksi memasang versi dependency yang sama persis. Tanpa itu, ‘jalan di laptopku’ menjadi masalah sehari-hari.

:::jebakan[Mengembalikan HTTP 200 OK untuk semua error]
Banyak pemula membungkus error seperti `{ "status": "gagal", "msg": "User tidak ditemukan" }` tetapi tetap mengirim status HTTP **200 OK**. Akibatnya monitoring server mengira sistem 100% sehat, dan `fetch()` di frontend mengira request sukses! Gunakan 400/422 untuk input salah, 401/403 untuk masalah izin, 404 jika data tidak ada, dan 500 hanya jika server sendiri yang crash.
:::

:::latihan
Milestone: buat CLI kecil yang memanggil API publik (mis. kurs mata uang), lalu ubah menjadi server HTTP dengan dua endpoint: `GET /health` dan `GET /kurs?dari=USD&ke=IDR`. Kembalikan 400 jika parameter kurang, dan 502 jika API sumber gagal. Uji semuanya dengan `curl -i`.
:::

:::solusi[Lihat alur penanganan error endpoint `/kurs`]
Pecah logikanya menjadi 3 cek berurutan:
1. Baca query `dari` dan `ke`. Jika salah satu kosong → langsung `return` status **400** dengan JSON `{ "error": "Parameter dari dan ke wajib diisi" }`.
2. Bungkus panggilan `fetch` ke API eksternal dalam `try / catch` dengan batas waktu (`AbortSignal.timeout(5000)`). Jika gagal atau `!res.ok` → kembalikan **502 Bad Gateway**.
3. Jika sukses → kembalikan **200 OK** beserta timestamp dan nilai tukar. Uji ketiga skenario itu memakai `curl -i "http://localhost:3000/kurs"` (tanpa query) dan `curl -i "http://localhost:3000/kurs?dari=USD&ke=IDR"`.
:::

## Rangkuman

- Terminal Linux, SSH, `curl`, dan `tail -f` adalah alat harian backend developer.
- GitHub flow: `main` selalu siap rilis, perubahan lewat branch pendek dan PR; rahasia tidak pernah di-commit.
- Kuasai method, status code (2xx/4xx/5xx), dan header HTTP.
- Pilih satu bahasa (Node.js, Go, atau Python) dan dalami; konsepnya bisa dipindahkan ke bahasa lain.
- Pisahkan lapisan route → validasi → service → repository; commit lock file.
