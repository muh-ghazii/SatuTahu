---
title: Storytelling data & studi kasus
minutes: 40
summary: Analisis baru bernilai ketika mengubah keputusan. Modul ini membahas cara menyusun cerita data, menjalankan dan membaca A/B test sederhana, menulis rekomendasi yang dapat ditindaklanjuti, dan membangun portofolio analyst yang meyakinkan.
objectives:
  - Menyusun temuan menjadi alur konteks–konflik–resolusi
  - Merancang dan membaca hasil A/B test dasar
  - Menulis rekomendasi yang spesifik, terukur, dan jujur soal ketidakpastian
  - Menyusun portofolio berbasis studi kasus
sources:
  - repo: CodeCutTech/Data-science
    note: Contoh notebook analisis
  - repo: academic/awesome-datascience
    note: Rujukan bacaan dan dataset untuk proyek portofolio
quiz:
  - q: "Pembuka laporan untuk manajer yang sibuk sebaiknya…"
    options: ["Metodologi lengkap", "Jawaban/rekomendasi utama di awal (bottom line up front)", "Daftar semua grafik", "Riwayat dataset"]
    answer: 1
    explain: "Pembaca sibuk butuh kesimpulan dulu, lalu bukti bagi yang ingin memeriksa."
  - q: "A/B test menunjukkan p-value 0,30 untuk perbedaan konversi. Artinya…"
    options: ["Varian B pasti lebih buruk", "Data belum cukup kuat untuk menyimpulkan ada perbedaan", "Ada 30% peluang B lebih baik", "Test harus dihentikan karena gagal"]
    answer: 1
    explain: "p-value tinggi berarti perbedaan yang teramati wajar terjadi karena kebetulan; bukan bukti bahwa keduanya sama."
  - q: "Mengintip hasil A/B test setiap hari lalu berhenti begitu signifikan berisiko…"
    options: ["Menurunkan biaya", "Menaikkan false positive (peeking problem)", "Membuat hasil lebih akurat", "Tidak berpengaruh"]
    answer: 1
    explain: "Setiap intipan adalah kesempatan tambahan untuk ‘menang’ secara kebetulan."
  - q: "Proyek portofolio yang paling meyakinkan biasanya…"
    options: ["Mengulang dataset Titanic", "Menjawab pertanyaan bisnis nyata dengan keputusan dan dampak yang jelas", "Memuat sebanyak mungkin grafik", "Hanya kode tanpa narasi"]
    answer: 1
    explain: "Perekrut mencari bukti cara berpikir: pertanyaan, pendekatan, temuan, dan rekomendasi."
---

Analisis yang benar tetapi tidak dipahami sama saja dengan tidak ada. Bagian akhir pekerjaan analyst, **mengomunikasikan**, sering menentukan apakah berminggu-minggu kerja menghasilkan keputusan atau hanya menjadi file di folder.

## Struktur cerita data

Cerita data yang efektif mengikuti struktur klasik:

```viz
{"type":"flow","title":"Alur cerita data","caption":"Satu cerita = satu pesan utama. Grafik lain yang tidak mendukung pesan dipindah ke lampiran.","steps":[{"label":"Konteks","detail":"Apa yang dipantau dan kenapa penting. ‘Omzet toko online menyumbang 40% pendapatan.’"},{"label":"Konflik","detail":"Apa yang berubah atau mengejutkan. ‘Konversi turun 18% sejak Agustus.’"},{"label":"Penyebab","detail":"Bukti yang menjelaskan. ‘Penurunan terpusat di pengguna mobile setelah halaman checkout diganti.’"},{"label":"Resolusi","detail":"Rekomendasi & dampak. ‘Kembalikan checkout lama di mobile; potensi pulih ±Rp45 juta/bulan.’"}]}
```

Teknik yang membantu:

- **Bottom line up front**: tulis kesimpulan di awal untuk pembaca sibuk.
- **Judul grafik berupa kalimat temuan**, bukan nama variabel.
- **Satu slide/bagian = satu gagasan**.
- **Sesuaikan dengan audiens**: direktur butuh dampak dan keputusan; tim teknis butuh metodologi.

## A/B test dasar

**A/B test** membandingkan dua versi (mis. tombol checkout lama vs baru) pada pengguna yang dibagi **secara acak**. Pengacakan membuat kedua grup setara dalam segala hal kecuali perlakuan, sehingga perbedaan hasil dapat diatribusikan ke perlakuan itu.

```viz
{"type":"ab-test"}
```

Langkah yang benar:

1. **Hipotesis & metrik utama** ditetapkan sebelum test: "Tombol baru menaikkan konversi checkout."
2. **Ukuran sampel** dihitung di awal berdasarkan konversi dasar dan efek minimum yang ingin dideteksi (MDE).
3. **Jalankan sampai sampel tercapai**, mencakup minimal satu siklus mingguan.
4. **Analisis**: selisih, confidence interval, dan p-value.

```python
from statsmodels.stats.proportion import proportions_ztest, confint_proportions_2indep

konversi = [412, 468]          # A, B
pengunjung = [10_000, 10_000]
z, p = proportions_ztest(konversi, pengunjung)
lo, hi = confint_proportions_2indep(konversi[1], pengunjung[1], konversi[0], pengunjung[0])
print(f"p = {p:.3f}; selisih B−A antara {lo:.2%} s.d. {hi:.2%}")
```

:::warning[Jebakan umum]
**Peeking**: berhenti begitu p < 0,05 menaikkan false positive. **Banyak metrik**: dengan 20 metrik, satu kemungkinan ‘signifikan’ secara kebetulan. **Sample ratio mismatch**: pembagian 50/50 yang ternyata 52/48 menandakan bug pengacakan. **Novelty effect**: pengguna mencoba hal baru sebentar lalu kembali ke kebiasaan.
:::

Pembahasan statistiknya lebih dalam ada di [Matematika & statistik untuk data](/belajar/data-scientist/ds-1).

## Menulis rekomendasi

Rekomendasi yang dapat ditindaklanjuti punya ciri:

```viz
{"type":"compare","columns":["Lemah","Kuat"],"rows":[{"label":"Spesifik","values":["‘Tingkatkan pemasaran’","‘Alihkan 30% anggaran iklan dari Facebook ke WhatsApp Business untuk Kotabaru’"]},{"label":"Terukur","values":["‘Akan membantu penjualan’","‘Estimasi +8–12% pesanan berulang dalam 2 bulan’"]},{"label":"Berdasar bukti","values":["‘Menurut saya…’","‘Pelanggan dari WhatsApp punya repeat rate 2× lipat (n = 340)’"]},{"label":"Jujur soal risiko","values":["Tidak disebut","‘Data hanya 6 bulan; uji dulu di satu kota’"]}]}
```

Contoh lengkap dalam konteks usaha seragam yang menjual lewat toko fisik dan WhatsApp:

> - **Temuan:** 62% omzet kuartal ini datang dari pesanan kolektif (≥ 10 potong) yang dipesan pengurus majelis, tetapi waktu tunggu rata-rata pesanan kolektif naik dari 9 menjadi 16 hari.
> - **Implikasi:** Pelanggan terbesar mengalami layanan terburuk; dua pengurus sudah mengeluh di ulasan.
> - **Rekomendasi:** Jadwalkan produksi pesanan kolektif terpisah setiap Senin dan beri estimasi tanggal jadi saat pemesanan.
> - **Ukuran keberhasilan:** Waktu tunggu ≤ 10 hari dan repeat order pengurus dalam 3 bulan.
> - **Keterbatasan:** Data waktu tunggu dicatat manual; sebagian pesanan tanpa tanggal selesai (12%).

Format yang praktis: **Temuan → Implikasi → Rekomendasi → Cara mengukur keberhasilan → Risiko/keterbatasan**. Membedakan dengan jelas antara **apa yang data tunjukkan** dan **apa yang kamu duga** adalah tanda analyst yang dapat dipercaya.

## Portofolio analyst

Perekrut membaca puluhan portofolio; yang menonjol adalah yang menunjukkan **cara berpikir**, bukan banyaknya grafik.

- **2–3 studi kasus mendalam** lebih baik dari 10 notebook dangkal. Hindari dataset yang sudah jutaan kali dipakai (Titanic, Iris) kecuali dengan sudut pandang baru.
- Struktur tiap studi kasus: **pertanyaan bisnis → data & keterbatasannya → pendekatan → temuan → rekomendasi → dampak/tindak lanjut**.
- Tunjukkan **rentang alat**: satu proyek SQL, satu Python, satu dashboard.
- Data nyata lebih kuat: data usaha keluarga atau organisasi kampus (dengan izin dan dianonimkan), data terbuka BPS/Satu Data, atau data hasil scraping yang legal.
- Publikasikan: README yang rapi di GitHub, dashboard publik, dan tulisan singkat di blog/LinkedIn.

:::latihan
Milestone akhir jalur: satu studi kasus lengkap dari pertanyaan bisnis hingga rekomendasi, berisi query SQL, notebook pandas, dashboard, dan laporan 1 halaman dengan bottom line up front. Presentasikan dalam 5 menit kepada teman yang bukan orang data; catat pertanyaan mereka sebagai bahan perbaikan.
:::

## Rangkuman

- Cerita data: konteks → konflik → penyebab → resolusi, dengan satu pesan utama.
- A/B test: hipotesis & ukuran sampel ditetapkan di awal, hindari peeking dan banyak metrik.
- Rekomendasi: spesifik, terukur, berbasis bukti, dan jujur tentang risiko.
- Portofolio: sedikit studi kasus mendalam yang menunjukkan cara berpikir dan rentang alat.
