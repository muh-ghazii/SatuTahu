---
title: Dasar pengujian perangkat lunak
minutes: 35
summary: Pengujian bukan sekadar mencari bug di akhir proyek. Ia adalah cara membangun keyakinan bahwa perangkat lunak bekerja sesuai harapan. Modul ini membahas kenapa testing penting dan berapa biaya bug, level-level pengujian, pendekatan black box dan white box, cara menulis test case, serta siklus hidup bug dan laporan bug yang baik.
objectives:
  - Menjelaskan nilai testing dan kenapa bug makin mahal bila ditemukan terlambat
  - Membedakan unit, integration, system, dan acceptance testing
  - Memilih pendekatan black box atau white box
  - Menulis test case dan laporan bug yang jelas serta dapat direproduksi
sources:
  - repo: TheJambo/awesome-testing
    note: Kurasi bacaan dasar software testing
  - repo: atinfo/awesome-test-automation
    note: Peta alat pengujian per level dan bahasa
quiz:
  - q: "Kenapa bug yang ditemukan di produksi jauh lebih mahal daripada yang ditemukan saat menulis kode?"
    options: ["Karena server produksi mahal", "Perlu diagnosis, perbaikan, rilis ulang, dan menimbulkan dampak ke pengguna/bisnis", "Karena bug di produksi lebih sulit dilihat", "Tidak ada bedanya"]
    answer: 1
    explain: "Semakin jauh dari saat bug dibuat, semakin banyak orang dan proses yang terlibat untuk memperbaikinya, ditambah kerugian reputasi dan data."
  - q: "Pengujian yang dilakukan pengguna/klien untuk memutuskan apakah sistem layak diterima disebut…"
    options: ["Unit testing", "Integration testing", "User Acceptance Testing (UAT)", "Smoke testing"]
    answer: 2
    explain: "UAT memvalidasi bahwa sistem memenuhi kebutuhan bisnis dari sudut pandang pengguna."
  - q: "Laporan bug ‘Login error, tolong diperbaiki’ kurang baik terutama karena…"
    options: ["Terlalu sopan", "Tidak ada langkah reproduksi, hasil yang diharapkan vs aktual, dan lingkungan", "Terlalu panjang", "Tidak memakai huruf kapital"]
    answer: 1
    explain: "Developer harus bisa mereproduksi bug. Tanpa langkah dan konteks, laporan akan bolak-balik atau diabaikan."
  - q: "Severity dan priority pada bug berbeda karena…"
    options: ["Keduanya sama", "Severity = dampak teknis; priority = urgensi bisnis untuk diperbaiki", "Severity ditentukan pengguna, priority oleh mesin", "Priority hanya untuk bug UI"]
    answer: 1
    explain: "Salah ketik nama perusahaan di beranda: severity rendah tetapi priority tinggi. Crash di fitur yang jarang dipakai: severity tinggi, priority bisa lebih rendah."
---

Pada 1999, wahana Mars Climate Orbiter milik NASA hilang karena satu bagian perangkat lunak memakai satuan imperial sementara bagian lain mengharapkan metrik. Bug tidak selalu sedramatis itu, tetapi prinsipnya sama: perangkat lunak dibuat oleh manusia, dan manusia membuat kesalahan. **Testing** adalah cara sistematis untuk menemukannya sebelum pengguna yang menemukannya.

## Kenapa testing & biaya bug

Testing tidak bisa membuktikan perangkat lunak **bebas** bug. Ia hanya bisa menunjukkan **keberadaan** bug. Tujuannya adalah mengurangi risiko sampai tingkat yang bisa diterima dan memberi informasi agar tim bisa memutuskan apakah siap rilis.

Prinsip penting: **semakin terlambat bug ditemukan, semakin mahal biayanya**.

```viz
{"type":"flow","title":"Biaya bug menurut tahap ditemukannya","caption":"Angka pastinya bervariasi antar studi dan sering dibesar-besarkan, tetapi polanya konsisten: menemukan lebih awal = lebih murah. Inilah dasar gagasan ‘shift-left testing’.","steps":[{"label":"Requirement","detail":"Ambiguitas ditemukan saat review: cukup diskusi 15 menit."},{"label":"Menulis kode","detail":"Unit test gagal: developer memperbaiki dalam hitungan menit, konteks masih segar."},{"label":"Integrasi/QA","detail":"Butuh laporan bug, reproduksi, perbaikan, dan uji ulang: jam hingga hari."},{"label":"Produksi","detail":"Pengguna terdampak, data mungkin rusak, hotfix, rilis ulang, komunikasi: hari hingga minggu, plus reputasi."}]}
```

QA (*Quality Assurance*) modern tidak hanya ‘menguji di akhir’, tetapi terlibat sejak awal: meninjau requirement agar dapat diuji, membantu developer menulis test, dan membangun automation yang berjalan di setiap perubahan.

## Level testing

```viz
{"type":"layers","title":"Level pengujian","caption":"Setiap level menangkap jenis kesalahan yang berbeda. Lolos unit test tidak menjamin integrasi benar, dan sebaliknya.","layers":[{"label":"Acceptance (UAT)","tag":"bisnis","detail":"Pengguna/klien memvalidasi bahwa sistem memenuhi kebutuhan bisnis. Contoh: bagian keuangan mencoba alur pembayaran UKT end-to-end."},{"label":"System","tag":"keseluruhan","detail":"Sistem utuh diuji terhadap spesifikasi, termasuk non-fungsional: performa, keamanan, kompatibilitas browser."},{"label":"Integration","tag":"antar bagian","detail":"Modul diuji bersama: API + database, layanan pembayaran + layanan pesanan. Menangkap salah format data dan salah asumsi antar modul."},{"label":"Unit","tag":"terkecil","detail":"Satu fungsi/kelas diuji terisolasi oleh developer. Cepat dan banyak."}]}
```

Istilah lain yang sering muncul:

- **Smoke test**: pemeriksaan cepat fungsi paling vital setelah build/deploy (‘apakah aplikasi bisa dibuka dan login?’).
- **Regression test**: memastikan perubahan baru tidak merusak fitur lama. Kandidat utama untuk automation.
- **Non-fungsional**: performa, keamanan, aksesibilitas, usability.

## Black box vs white box

```viz
{"type":"compare","title":"Dua sudut pandang pengujian","columns":["Black box","White box","Grey box"],"rows":[{"label":"Melihat kode?","values":["Tidak, hanya input → output","Ya, struktur internal","Sebagian (mis. skema database, API)"]},{"label":"Dasar test","values":["Spesifikasi & requirement","Jalur kode, cabang, kondisi","Gabungan"]},{"label":"Teknik","values":["Equivalence partitioning, BVA, decision table","Statement/branch coverage","Uji API dengan pengetahuan struktur data"]},{"label":"Biasanya oleh","values":["QA, pengguna","Developer","QA teknis/SDET"]}]}
```

Black box menangkap kesalahan **requirement** (fitur bekerja ‘benar’ tetapi bukan seperti yang diminta). White box menangkap **jalur kode yang tidak pernah dijalankan**. Keduanya saling melengkapi.

## Test case & skenario

**Test scenario** adalah ‘apa’ yang diuji secara garis besar (‘Pengguna dapat login’). **Test case** adalah langkah konkret untuk menguji satu kondisi.

| Field | Isi contoh |
|---|---|
| ID | TC-LOGIN-003 |
| Judul | Login gagal dengan password salah menampilkan pesan umum |
| Prasyarat | Akun `ayu@contoh.id` terdaftar dan aktif |
| Langkah | 1. Buka /login 2. Isi email `ayu@contoh.id` 3. Isi password `salah123` 4. Klik ‘Masuk’ |
| Data uji | email valid, password salah |
| Hasil yang diharapkan | Tetap di /login; pesan ‘Email atau password salah’; field password dikosongkan; tidak menyebut bahwa emailnya terdaftar |
| Hasil aktual / status | (diisi saat eksekusi) Pass / Fail |

Ciri test case yang baik: **satu tujuan**, **langkah dapat diulang siapa saja**, **hasil yang diharapkan spesifik dan dapat diverifikasi**, dan **independen** dari test case lain. Cakup juga skenario negatif dan kasus batas, bukan hanya *happy path*. Teknik memilih data uji dibahas di modul berikutnya.

## Siklus hidup & laporan bug

```viz
{"type":"fsm","title":"Siklus hidup bug","caption":"Setiap tim punya variasinya sendiri (di Jira, GitHub Issues, dll.), tetapi alur dasarnya serupa.","start":"New","states":[{"id":"New","detail":"Bug dilaporkan, menunggu ditinjau."},{"id":"Triaged","detail":"Dikonfirmasi; severity & priority ditetapkan."},{"id":"Rejected","detail":"Bukan bug, duplikat, atau tidak dapat direproduksi (perlu info tambahan)."},{"id":"In Progress","detail":"Developer sedang memperbaiki."},{"id":"Ready for Test","detail":"Perbaikan sudah di-deploy ke lingkungan uji."},{"id":"Reopened","detail":"Uji ulang gagal: bug masih ada."},{"id":"Closed","detail":"Terverifikasi diperbaiki; idealnya ditambah regression test."}],"transitions":[{"from":"New","to":"Triaged","event":"konfirmasi"},{"from":"New","to":"Rejected","event":"tolak"},{"from":"Triaged","to":"In Progress","event":"dikerjakan"},{"from":"In Progress","to":"Ready for Test","event":"fix dirilis"},{"from":"Ready for Test","to":"Closed","event":"verifikasi lulus"},{"from":"Ready for Test","to":"Reopened","event":"masih gagal"},{"from":"Reopened","to":"In Progress","event":"perbaiki lagi"}]}
```

Laporan bug yang baik bisa direproduksi oleh orang lain tanpa bertanya:

```text
Judul: [Checkout] Total tidak berubah setelah menghapus item dari keranjang

Lingkungan: staging v2.4.1 · Chrome 131 · Android 14 (Samsung A54)
Severity: Mayor   Priority: Tinggi

Langkah reproduksi:
1. Login sebagai pembeli@contoh.id
2. Tambahkan ‘Gamis BKMT’ (Rp150.000) dan ‘Jilbab’ (Rp45.000) ke keranjang
3. Buka /keranjang, hapus ‘Jilbab’

Hasil yang diharapkan: Total menjadi Rp150.000
Hasil aktual: Total tetap Rp195.000 sampai halaman dimuat ulang
Frekuensi: 5/5 percobaan
Lampiran: rekaman layar 12 detik, log console (tidak ada error)
```

**Severity** = dampak teknis (crash, data rusak, tampilan); **priority** = seberapa cepat harus diperbaiki menurut kebutuhan bisnis. Keduanya tidak selalu sejalan.

:::latihan
Milestone: pilih satu aplikasi web nyata (mis. web kampus atau toko online kecil). Tulis 15 test case (minimal 5 negatif/batas) untuk login, pencarian, dan satu alur utama. Eksekusi, lalu tulis 3 laporan bug lengkap untuk temuanmu. Jangan menguji fitur yang bisa merusak data orang lain, dan laporkan temuan dengan sopan ke pemilik situs bila relevan.
:::

## Rangkuman

- Testing menunjukkan keberadaan bug, bukan ketiadaannya; temukan sedini mungkin (shift-left).
- Level: unit → integration → system → acceptance; ditambah smoke dan regression.
- Black box dari spesifikasi, white box dari struktur kode; saling melengkapi.
- Test case: satu tujuan, langkah dapat diulang, hasil diharapkan yang spesifik, termasuk skenario negatif.
- Laporan bug: judul jelas, lingkungan, langkah, harapan vs aktual, bukti; bedakan severity dan priority.
