---
title: Portofolio, proyek nyata & wawancara fullstack
minutes: 35
summary: Modul penutup jalur fullstack ini fokus pada pembuktian, yaitu memilih proyek yang benar-benar bernilai, menguasai algoritma dasar yang ditanyakan saat seleksi, menjelaskan desain sistem sederhana, dan berkontribusi ke open source.
objectives:
  - Memilih dan membingkai ide proyek yang menunjukkan kemampuan fullstack
  - Menyelesaikan soal algoritma dasar dengan analisis kompleksitas
  - Menjelaskan arsitektur aplikasi web sederhana beserta trade-off-nya
  - Membuat kontribusi open source pertama
sources:
  - repo: florinpop17/app-ideas
    note: Kumpulan ide aplikasi bertingkat beserta user story
  - repo: practical-tutorials/project-based-learning
    note: Tutorial berbasis proyek sebagai referensi implementasi
  - repo: public-apis/public-apis
    note: Sumber API gratis untuk bahan proyek
  - repo: jwasham/coding-interview-university
    note: Daftar topik algoritma untuk persiapan seleksi
quiz:
  - q: "Proyek portofolio mana yang paling meyakinkan untuk posisi fullstack junior?"
    options: ["Clone tampilan Netflix tanpa backend", "Sistem antrean klinik yang dipakai 1 klinik nyata, dengan auth, database, dan deploy", "Kalkulator sederhana", "To-do list dari tutorial tanpa modifikasi"]
    answer: 1
    explain: "Masalah nyata + pengguna nyata + seluruh lapisan (UI, API, data, deploy) menunjukkan kemampuan sekaligus inisiatif."
  - q: "Untuk mencari apakah dua angka dalam array berjumlah target, solusi O(n) memakai…"
    options: ["Dua loop bersarang", "Hash map/Set untuk mengingat angka yang sudah dilihat", "Sorting lalu loop bersarang", "Rekursi tanpa memo"]
    answer: 1
    explain: "Untuk setiap angka x, cek apakah target − x sudah pernah dilihat. Satu kali lewat, operasi Set O(1)."
  - q: "Langkah pertama yang baik sebelum membuat pull request ke proyek open source?"
    options: ["Langsung ubah banyak file", "Baca CONTRIBUTING.md dan diskusikan di issue (mis. label good first issue)", "Fork lalu hapus repo asli", "Kirim email ke semua maintainer"]
    answer: 1
    explain: "Setiap proyek punya aturan sendiri. Mengikuti panduan dan berdiskusi dulu membuat PR-mu jauh lebih mungkin diterima."
---

Setelah empat modul, kamu sudah bisa membangun aplikasi web utuh. Tantangan berikutnya adalah meyakinkan orang lain, baik rekruter, klien freelance, maupun dosen pembimbing, bahwa kamu bisa. Bukti terbaik adalah **produk yang dipakai orang** dan **kemampuan menjelaskan keputusanmu**.

## Ide proyek bernilai

Proyek yang paling meyakinkan memenuhi tiga syarat: menyelesaikan **masalah nyata**, punya **pengguna nyata** (sekecil apa pun), dan menyentuh **semua lapisan** fullstack.

```viz
{"type":"compare","title":"Mengubah ide biasa menjadi proyek bernilai","columns":["Versi tutorial","Versi portofolio"],"rows":[{"label":"To-do list","values":["CRUD lokal","Pengingat tugas kuliah per kelas, notifikasi WhatsApp/email H-1, berbagi ke teman sekelas"]},{"label":"Toko online","values":["Clone tampilan","Katalog UMKM keluarga + stok + laporan penjualan + checkout ke WhatsApp"]},{"label":"Blog","values":["Markdown statis","Platform catatan organisasi kampus dengan peran admin/anggota & moderasi"]},{"label":"Buku kontak","values":["CRUD sederhana","Direktori alumni prodi dengan pencarian, privasi per field, dan import CSV"]}]}
```

Gunakan `florinpop17/app-ideas` untuk inspirasi bertingkat (Beginner → Advanced), dan `public-apis` untuk sumber data. Lalu tanyakan: **siapa di sekitarku yang punya masalah ini?** Organisasi kampus, usaha keluarga, masjid, dan komunitas adalah ‘klien’ pertama yang paling realistis.

Satu proyek yang selesai, dipakai, dan didokumentasikan lebih bernilai daripada lima proyek setengah jadi. Tuliskan juga **apa yang kamu pelajari dan apa yang akan kamu lakukan berbeda**, karena itu menunjukkan kedewasaan berpikir.

## Algoritma dasar

Seleksi fullstack junior biasanya berisi soal algoritma tingkat dasar–menengah. Polanya berulang, dan kuncinya adalah mengenali struktur data yang tepat.

```viz
{"type":"binary-search"}
```

Contoh soal tipikal dan pendekatannya:

| Soal | Pendekatan naif | Pendekatan baik |
|---|---|---|
| Ada duplikat di array? | bandingkan semua pasangan O(n²) | Set, O(n) |
| Dua angka berjumlah target | dua loop O(n²) | hash map, O(n) |
| Cari angka di array terurut | linear O(n) | binary search, O(log n) |
| Kata paling sering muncul | hitung ulang tiap kata O(n²) | dict penghitung + sort, O(n log n) |
| Kurung seimbang? | ganti-ganti string berulang | stack, O(n) |

```ts
// Kata yang paling sering muncul: dict penghitung
function kataTerbanyak(teks: string, k = 3) {
  const hitung = new Map<string, number>();
  for (const kata of teks.toLowerCase().match(/[a-z]+/g) ?? []) {
    hitung.set(kata, (hitung.get(kata) ?? 0) + 1);
  }
  return [...hitung].sort((a, b) => b[1] - a[1]).slice(0, k);
}
```

Latihan rutin yang realistis: 3–4 soal per minggu, selalu tulis kompleksitas waktu dan ruangnya, dan coba jelaskan solusimu dengan suara keras seolah-olah sedang diwawancara. Pembahasan lengkap pola-pola ini ada di modul [Algoritma & kompleksitas](/belajar/fondasi/fd-5).

## System design ringan

Untuk junior, pertanyaan desain biasanya berbentuk ‘jelaskan arsitektur proyekmu’ atau ‘bagaimana kalau penggunanya bertambah 100×?’. Siapkan diagram sederhana proyek terbaikmu dan latih menjawab pertanyaan lanjutan.

```viz
{"type":"layers","title":"Arsitektur aplikasi fullstack yang perlu bisa kamu jelaskan","caption":"Untuk setiap lapisan, siapkan jawaban: kenapa memilih ini, apa batasnya, dan apa yang akan diubah saat skala naik.","layers":[{"label":"Browser / klien","tag":"UI","detail":"Next.js/React. Bagaimana menangani state memuat & error? Apa yang di-cache di klien?"},{"label":"CDN & hosting","tag":"edge","detail":"Aset statis dan halaman ter-cache dekat pengguna. Apa yang tidak boleh di-cache (data pribadi)?"},{"label":"Aplikasi / API","tag":"logic","detail":"Stateless agar bisa ditambah instance. Validasi, auth, dan aturan bisnis ada di sini."},{"label":"Cache & queue","tag":"opsional","detail":"Redis untuk data yang sering dibaca; queue untuk email & tugas berat. Kapan benar-benar dibutuhkan?"},{"label":"Database","tag":"data","detail":"PostgreSQL dengan index & constraint. Bagaimana backup dilakukan? Bagaimana jika baca jauh lebih banyak dari tulis (replika)?"}]}
```

Pertanyaan lanjutan yang sering muncul dan arah jawabannya:

- *‘Halaman daftar lambat saat data 100 ribu baris?’* → pagination, index pada kolom filter/sort, hindari N+1, ukur dulu dengan EXPLAIN.
- *‘Dua pengguna booking slot yang sama bersamaan?’* → constraint unik di database + tangani error-nya dengan pesan ramah.
- *‘Email konfirmasi membuat respons lambat?’* → pindahkan ke queue/background job.

Untuk pendalaman, lihat modul [System design & skalabilitas](/belajar/backend/be-6).

## Open source contribution

Kontribusi open source membuktikan kamu bisa membaca kode orang lain, mengikuti aturan proyek, dan berkolaborasi lewat review. Itulah tiga hal yang dilakukan setiap hari di tim profesional.

```viz
{"type":"flow","title":"Alur kontribusi pertama","caption":"Kontribusi tidak harus kode: perbaikan dokumentasi, terjemahan, dan laporan bug yang jelas juga sangat dihargai maintainer.","steps":[{"label":"Pilih proyek","detail":"Proyek yang kamu pakai sendiri. Cari label ‘good first issue’ atau ‘help wanted’."},{"label":"Baca aturan","detail":"README, CONTRIBUTING.md, code of conduct. Jalankan proyeknya di lokal."},{"label":"Diskusikan","detail":"Komentar di issue: jelaskan rencana perbaikanmu sebelum mengerjakan."},{"label":"Fork & branch","detail":"Fork repo, clone, buat branch fix/deskripsi-singkat."},{"label":"Kerjakan & uji","detail":"Perubahan kecil dan fokus; jalankan test & linter proyek."},{"label":"Pull request","detail":"Jelaskan apa & kenapa, tautkan issue (‘Closes #123’), sertakan screenshot bila UI."},{"label":"Tanggapi review","detail":"Perbaiki sesuai masukan dengan sopan. Review adalah bagian dari belajar, bukan penolakan."}]}
```

Latihan aman pertama: repo `firstcontributions/first-contributions` yang memang dibuat untuk mencoba alur fork → PR. Setelah itu, cari proyek nyata yang kamu pakai, misalnya library UI, dokumentasi framework, atau proyek komunitas Indonesia.

:::latihan
Dalam 4 minggu: (1) wawancarai satu calon pengguna di sekitarmu dan tulis 5 user story, (2) bangun MVP-nya dengan stack dari modul 2–4, (3) selesaikan 12 soal algoritma dari tabel pola di atas, (4) buat satu PR ke proyek open source. Tulis ringkasan pengalamanmu di README proyek.
:::

## Rangkuman

- Proyek bernilai = masalah nyata + pengguna nyata + seluruh lapisan, didokumentasikan dengan baik.
- Algoritma dasar: kenali polanya (Set/Map, binary search, stack, sorting) dan selalu sebutkan kompleksitasnya.
- Siapkan diagram arsitektur proyekmu dan jawaban untuk ‘bagaimana jika 100×?’.
- Open source: mulai dari issue kecil, ikuti aturan proyek, terima review dengan terbuka.
