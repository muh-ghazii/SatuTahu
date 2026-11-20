---
title: System design & skalabilitas
minutes: 50
summary: Bagaimana aplikasi yang melayani seratus pengguna bisa tumbuh melayani sejuta pengguna? Modul ini membahas komponen dasar sistem terdistribusi, yaitu scaling, cache dan CDN, message queue, konsistensi dan teorema CAP, serta pilihan monolith vs microservices, lalu menerapkannya pada studi kasus URL shortener.
objectives:
  - Membedakan scaling vertikal dan horizontal serta syarat aplikasi stateless
  - Menerapkan cache dan CDN beserta strategi invalidasinya
  - Memakai message queue untuk pekerjaan asinkron
  - Menjelaskan CAP dan memilih arsitektur dengan mempertimbangkan trade-off
sources:
  - repo: donnemartin/system-design-primer
    note: Kerangka topik dan pendekatan menjawab soal system design
  - repo: ByteByteGoHq/system-design-101
    note: Penjelasan visual konsep caching, queue, dan arsitektur
  - repo: karanpratapsingh/system-design
    note: Studi kasus URL shortener dan estimasi kapasitas
  - repo: binhnguyennus/awesome-scalability
    note: Contoh praktik skalabilitas dari perusahaan nyata
quiz:
  - q: "Syarat utama agar API bisa diskalakan horizontal (ditambah banyak instance)?"
    options: ["Memakai bahasa Go", "Stateless: tidak menyimpan session/file di memori/disk lokal instance", "Database NoSQL", "Satu server besar"]
    answer: 1
    explain: "Jika state ada di instance tertentu, request berikutnya yang jatuh ke instance lain akan ‘lupa’. Pindahkan state ke database/Redis/object storage."
  - q: "Mengirim email konfirmasi pesanan sebaiknya…"
    options: ["Dilakukan sinkron sebelum merespons pengguna", "Dimasukkan ke message queue dan dikirim oleh worker di latar belakang", "Tidak perlu dikirim", "Dikirim dari browser"]
    answer: 1
    explain: "Pekerjaan lambat dan tidak kritis untuk respons dipindah ke queue: respons cepat, dan retry bisa dilakukan jika SMTP sedang gangguan."
  - q: "Menurut CAP, saat terjadi partisi jaringan sistem terdistribusi harus memilih antara…"
    options: ["Kecepatan dan biaya", "Consistency dan Availability", "SQL dan NoSQL", "Cache dan CDN"]
    answer: 1
    explain: "Partisi pasti terjadi di sistem terdistribusi; saat itu terjadi, sistem memilih tetap konsisten (menolak sebagian request) atau tetap tersedia (mungkin menyajikan data basi)."
  - q: "Untuk startup dengan tim 4 orang, arsitektur awal yang paling masuk akal biasanya…"
    options: ["30 microservices", "Monolith yang modular", "Serverless untuk setiap fungsi", "Tidak perlu arsitektur"]
    answer: 1
    explain: "Microservices menambah kompleksitas operasional besar. Monolith modular cepat dikembangkan dan bisa dipecah nanti di batas modul yang sudah jelas."
---

System design bukan tentang menghafal diagram arsitektur perusahaan besar. Ia tentang **trade-off**: setiap komponen yang menambah kecepatan atau ketahanan juga menambah kompleksitas, biaya, atau kemungkinan data tidak konsisten. Engineer yang baik bisa menjelaskan **kenapa** memilih sesuatu, dan kapan **tidak** memakainya.

## Scaling horizontal vs vertikal

Ketika server kewalahan, ada dua arah:

```viz
{"type":"compare","title":"Dua cara menskalakan","columns":["Vertikal (scale up)","Horizontal (scale out)"],"rows":[{"label":"Caranya","values":["Server lebih besar: CPU/RAM ditambah","Server lebih banyak di belakang load balancer"]},{"label":"Kelebihan","values":["Sederhana, tanpa ubah kode","Hampir tanpa batas, tahan jika satu server mati"]},{"label":"Kekurangan","values":["Ada batas fisik & harga naik tajam; satu titik kegagalan","Butuh aplikasi stateless, load balancer, dan koordinasi"]},{"label":"Cocok untuk","values":["Database di tahap awal, beban kecil-menengah","Lapisan aplikasi/API yang stateless"]}]}
```

```viz
{"type":"load-balancer"}
```

Agar API bisa di-*scale out*, ia harus **stateless**: session disimpan di Redis atau token, file unggahan di object storage (S3/MinIO), bukan di memori atau disk server. Database lebih sulit diskalakan; langkah umumnya bertahap: index & optimasi query → **read replica** (salinan untuk beban baca) → cache → **sharding** (membagi data ke beberapa server berdasarkan kunci) sebagai upaya terakhir.

Sebelum menskalakan apa pun, lakukan **estimasi kasar** (*back-of-the-envelope*): 1 juta pengguna aktif harian × 10 request = 10 juta request/hari ≈ **115 request/detik** rata-rata, dengan puncak mungkin 5–10×. Angka ini sering lebih kecil dari yang dibayangkan, dan satu server yang dioptimasi dengan baik bisa menanganinya.

## Caching & CDN

**Cache** menyimpan hasil yang mahal dihitung di tempat yang cepat diakses. Ada di banyak lapisan: browser, CDN, reverse proxy, aplikasi (Redis), dan database.

```viz
{"type":"cache"}
```

Pola paling umum di aplikasi adalah **cache-aside**:

```ts
async function getProduk(id: number) {
  const key = `produk:${id}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);                 // HIT

  const produk = await db.produk.findUnique({ where: { id } });   // MISS → DB
  await redis.set(key, JSON.stringify(produk), "EX", 300);        // simpan 5 menit
  return produk;
}

async function updateProduk(id: number, data: object) {
  await db.produk.update({ where: { id }, data });
  await redis.del(`produk:${id}`);                       // invalidasi
}
```

> ‘There are only two hard things in Computer Science: cache invalidation and naming things.’ (Phil Karlton)

Keputusan penting: berapa lama data boleh basi (**TTL**), bagaimana menghapus cache saat data berubah (**invalidasi**), dan apa yang terjadi ketika cache populer kedaluwarsa bersamaan sehingga ribuan request menghantam database (**cache stampede**; solusinya lock atau TTL acak).

**CDN** (*Content Delivery Network*) menyimpan salinan aset statis (gambar, JS, CSS, bahkan halaman HTML) di server yang tersebar di banyak kota, sehingga pengguna di Banjarmasin tidak perlu mengambil gambar dari server di Singapura atau Amerika.

## Message queue

Tidak semua pekerjaan harus selesai sebelum pengguna mendapat respons. Mengirim email, membuat thumbnail, menghitung laporan, atau memanggil API pihak ketiga yang lambat bisa dipindah ke **message queue**.

```viz
{"type":"sequence","title":"Checkout dengan pekerjaan asinkron","caption":"Pengguna menerima respons dalam ~100 ms; pekerjaan lambat diproses di belakang dan bisa diulang otomatis jika gagal.","actors":["Pengguna","API","Queue","Worker"],"messages":[{"from":0,"to":1,"label":"POST /checkout","note":"Pesanan disimpan di database dalam satu transaksi."},{"from":1,"to":2,"label":"publish ‘pesanan.dibuat’","note":"API hanya menaruh pesan di antrean (RabbitMQ, Redis Streams, SQS, Kafka)."},{"from":1,"to":0,"label":"201 Created","note":"Respons cepat tanpa menunggu email atau invoice PDF."},{"from":2,"to":3,"label":"ambil pesan","note":"Worker terpisah memproses pesan sesuai kapasitasnya; bisa ditambah saat antrean menumpuk."},{"from":3,"to":3,"label":"kirim email + buat PDF","note":"Jika gagal (SMTP down), pesan dikembalikan dan dicoba ulang dengan jeda; setelah N kali masuk dead-letter queue."}]}
```

Manfaat: respons cepat, **meratakan lonjakan** (antrean menampung saat ramai, worker memproses dengan laju stabil), dan layanan **terlepas** satu sama lain. Konsekuensinya: sistem menjadi *eventually consistent*, dan pesan bisa terkirim lebih dari sekali, sehingga worker harus **idempoten** (memproses pesan yang sama dua kali tidak mengirim dua email).

## Konsistensi & CAP

Begitu data direplikasi ke beberapa server, muncul pertanyaan: apakah semua pembaca selalu melihat nilai terbaru?

**Teorema CAP**: sistem terdistribusi hanya bisa menjamin dua dari tiga sifat, yaitu **C**onsistency (setiap pembacaan mendapat tulisan terakhir), **A**vailability (setiap request mendapat respons), dan **P**artition tolerance (tetap berjalan walau jaringan antar node terputus). Karena partisi jaringan pasti terjadi, pilihan sebenarnya adalah: **saat partisi terjadi, utamakan C atau A?**

```viz
{"type":"compare","title":"Memilih konsistensi sesuai kebutuhan bisnis","columns":["Utamakan konsistensi (CP)","Utamakan ketersediaan (AP)"],"rows":[{"label":"Saat partisi","values":["Menolak/menunda sebagian request","Tetap menjawab, mungkin dengan data basi"]},{"label":"Contoh data","values":["Saldo rekening, stok terakhir, kursi pesawat","Jumlah like, timeline sosial media, katalog"]},{"label":"Contoh sistem","values":["PostgreSQL primer tunggal, etcd, ZooKeeper","Cassandra, DynamoDB (mode default), DNS"]},{"label":"Risiko","values":["Downtime sebagian","Pengguna melihat angka berbeda sesaat"]}]}
```

Di antara ‘kuat’ dan ‘lemah’ ada spektrum, misalnya *read-your-writes* (pengguna setidaknya selalu melihat perubahan yang ia buat sendiri). Pertanyaan yang tepat untuk setiap fitur: **apa akibatnya jika pengguna melihat data yang terlambat beberapa detik?**

## Microservices vs monolith

```viz
{"type":"compare","title":"Monolith modular vs microservices","columns":["Monolith (modular)","Microservices"],"rows":[{"label":"Deploy","values":["Satu unit","Banyak layanan, masing-masing independen"]},{"label":"Kecepatan awal","values":["Sangat cepat","Lambat: butuh infrastruktur, CI/CD, observability per layanan"]},{"label":"Skalabilitas tim","values":["Mulai sulit di puluhan engineer","Tim otonom per layanan"]},{"label":"Kegagalan","values":["Bug bisa menjatuhkan semua","Terisolasi, tetapi muncul kegagalan jaringan antar layanan"]},{"label":"Data","values":["Satu database, transaksi mudah","Database per layanan, konsistensi lintas layanan sulit"]},{"label":"Cocok untuk","values":["Startup, tim kecil, domain belum stabil","Organisasi besar dengan batas domain jelas"]}]}
```

Banyak perusahaan yang sukses dengan microservices memulai dari monolith. Strategi yang sehat: bangun **monolith modular** dengan batas modul yang tegas (modul pesanan tidak langsung mengakses tabel modul pembayaran). Ketika ada alasan kuat, misalnya satu modul butuh skala jauh berbeda atau dikelola tim terpisah, modul itu bisa diekstrak menjadi layanan.

## Studi kasus nyata

Mari terapkan semuanya pada soal klasik: **merancang URL shortener** seperti bit.ly atau s.id.

```viz
{"type":"flow","title":"Langkah menjawab soal system design","steps":[{"label":"Requirement","detail":"Fungsional: buat short URL, redirect, statistik klik, custom alias. Non-fungsional: redirect < 100 ms, sangat tersedia, link tidak boleh hilang."},{"label":"Estimasi","detail":"100 jt link baru/bulan ≈ 40 tulis/detik; rasio baca:tulis 100:1 ≈ 4.000 redirect/detik. 5 tahun × 1,2 M/tahun × 500 byte ≈ 3 TB data."},{"label":"API","detail":"POST /api/links {url} → {kode}; GET /{kode} → 301/302 ke URL asli; GET /api/links/{kode}/stats."},{"label":"Data & kode unik","detail":"Tabel links(kode PK, url, pemilik, dibuat). Kode 7 karakter base62 = 62⁷ ≈ 3,5 triliun kombinasi. Bangkitkan dari counter + encode base62, atau acak + cek tabrakan."},{"label":"Arsitektur","detail":"Load balancer → API stateless → Redis cache untuk kode populer → database (replika baca). Statistik klik dikirim ke queue lalu diagregasi worker."},{"label":"Bottleneck & trade-off","detail":"Redirect 301 di-cache browser (ringan) tetapi statistik tidak tercatat; 302 tercatat tetapi beban lebih besar. Penyalahgunaan: rate limit & pemindaian URL berbahaya."}]}
```

Perhatikan polanya: hampir semua komponen di modul ini muncul (load balancer, cache, queue, replika), dan setiap pilihan disertai alasan serta konsekuensinya. Itulah yang dinilai pewawancara, bukan diagram yang ‘benar’.

:::latihan
Milestone: tulis dokumen desain 2–3 halaman untuk salah satu sistem: (a) URL shortener di atas, atau (b) sistem antrean layanan akademik kampus (ambil nomor antrean online, notifikasi saat giliran dekat). Sertakan requirement, estimasi kapasitas, API, skema data, diagram arsitektur, dan minimal tiga trade-off yang kamu sadari.
:::

## Rangkuman

- Scale up sederhana tetapi terbatas; scale out butuh aplikasi stateless. Estimasi dulu sebelum menskalakan.
- Cache-aside + TTL + invalidasi; CDN mendekatkan aset ke pengguna; waspadai cache stampede.
- Message queue untuk pekerjaan lambat: respons cepat, retry, worker idempoten.
- CAP: saat partisi, pilih konsistensi atau ketersediaan per jenis data.
- Mulai dari monolith modular; microservices adalah solusi untuk masalah organisasi dan skala yang nyata.
