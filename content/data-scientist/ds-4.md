---
title: Eksperimen, kausalitas & komunikasi
minutes: 50
summary: Pertanyaan bisnis yang paling bernilai biasanya kausal, misalnya apakah promo benar-benar menaikkan penjualan. Modul ini membahas desain eksperimen, bias dan confounding, metode inferensi kausal saat eksperimen tidak mungkin, cara menulis laporan teknis, dan etika dalam bekerja dengan data.
objectives:
  - Merancang eksperimen acak dengan unit, metrik, dan ukuran sampel yang tepat
  - Mengenali confounding, selection bias, dan survivorship bias
  - Menerapkan difference-in-differences dan pendekatan kausal dasar lainnya
  - Menulis laporan teknis yang jelas dan bekerja dengan data secara etis
sources:
  - repo: eugeneyan/applied-ml
    note: Kumpulan tulisan eksperimen & ML dari industri
  - repo: microsoft/Data-Science-For-Beginners
    note: Pelajaran etika data
quiz:
  - q: "Pengguna yang memakai fitur ‘wishlist’ belanja 3× lebih banyak. Kesimpulan paling aman…"
    options: ["Wishlist menyebabkan belanja naik", "Ada asosiasi; pengguna yang sudah aktif mungkin lebih sering memakai wishlist (confounding/self-selection)", "Wishlist harus diwajibkan", "Data salah"]
    answer: 1
    explain: "Pengguna memilih sendiri memakai fitur; keterlibatan adalah confounder yang jelas."
  - q: "Inti difference-in-differences adalah…"
    options: ["Membandingkan sebelum-sesudah saja", "Membandingkan perubahan grup yang diberi perlakuan dengan perubahan grup kontrol", "Mengacak ulang data", "Regresi tanpa kontrol"]
    answer: 1
    explain: "Asumsi kuncinya parallel trends: tanpa perlakuan, kedua grup akan bergerak sejajar."
  - q: "Menganalisis hanya UMKM yang masih bertahan untuk menyimpulkan resep sukses berisiko…"
    options: ["Survivorship bias", "Overfitting", "Data leakage", "Multikolinearitas"]
    answer: 0
    explain: "Yang gagal—mungkin dengan strategi sama—tidak masuk data."
  - q: "Unit randomisasi untuk menguji harga ongkir di marketplace dengan efek jaringan sebaiknya…"
    options: ["Per klik", "Per wilayah/klaster atau switchback per waktu", "Per baris log", "Tidak perlu acak"]
    answer: 1
    explain: "Jika perlakuan pada satu pengguna memengaruhi yang lain (interference), randomisasi individu bias."
---

Model prediksi menjawab *apa yang akan terjadi*. Keputusan bisnis butuh jawaban *apa yang terjadi jika kita melakukan X*. Itu pertanyaan **kausal**, dan data observasional saja hampir tidak pernah cukup untuk menjawabnya tanpa desain yang hati-hati.

## Desain eksperimen

Eksperimen acak terkontrol (**RCT**, dalam produk dikenal sebagai A/B test) adalah standar emas karena pengacakan menyeimbangkan semua faktor, yang terukur maupun tidak. Dasar A/B test sudah dibahas di [Storytelling data & studi kasus](/belajar/data-analyst/da-5); keputusan desain yang lebih dalam:

```viz
{"type":"flow","title":"Keputusan desain eksperimen","steps":[{"label":"Unit randomisasi","detail":"Pengguna, sesi, toko, wilayah, atau waktu. Harus sama dengan unit analisis, atau gunakan SE klaster."},{"label":"Metrik","detail":"Satu metrik utama (OEC) + guardrail (mis. pembatalan, keluhan) + metrik diagnostik."},{"label":"Power & ukuran sampel","detail":"Dari baseline, MDE, α, dan power (biasanya 80%)."},{"label":"Durasi","detail":"Minimal satu siklus mingguan; perhatikan novelty effect."},{"label":"Analisis terencana","detail":"Tulis rencana analisis sebelum data masuk (pre-registration)."}]}
```

```python
from statsmodels.stats.power import NormalIndPower
from statsmodels.stats.proportion import proportion_effectsize
es = proportion_effectsize(0.045, 0.050)            # baseline 4,5% → target 5,0%
n = NormalIndPower().solve_power(es, alpha=0.05, power=0.8)
print(f"≈{n:,.0f} pengguna per grup")               # ±14.000 per grup
```

Teknik pengurang varians seperti **CUPED** (memakai metrik sebelum eksperimen sebagai kovariat) bisa memangkas kebutuhan sampel secara signifikan. Jika ada **efek jaringan** (marketplace, ride-hailing), randomisasi per individu bias; gunakan randomisasi klaster/wilayah atau **switchback** (bergantian per periode waktu).

## Bias & confounding

**Confounder** adalah variabel yang memengaruhi perlakuan *dan* hasil sekaligus, sehingga menciptakan korelasi palsu.

```viz
{"type":"tree","root":{"label":"Bias yang sering menipu analisis","children":[{"label":"Confounding","detail":"Pengguna aktif lebih sering pakai fitur X dan lebih sering belanja — keaktifan adalah penyebab bersama."},{"label":"Selection bias","detail":"Survei kepuasan hanya diisi pelanggan yang sangat senang atau sangat kesal."},{"label":"Survivorship bias","detail":"Hanya meneliti usaha yang bertahan; pesawat yang pulang dengan lubang peluru."},{"label":"Simpson's paradox","detail":"Tren di setiap subgrup berbalik saat digabung karena komposisi grup berbeda."},{"label":"Regression to the mean","detail":"Toko dengan bulan terburuk ‘membaik’ setelah intervensi apa pun."}]}}
```

**Simpson's paradox** layak diingat: tingkat kesembuhan obat A bisa lebih tinggi di setiap kelompok usia tetapi lebih rendah secara keseluruhan, karena obat A lebih banyak diberikan kepada pasien berisiko tinggi. Variabel mana yang harus dikontrol tidak bisa diputuskan oleh data saja; perlu **model kausal** tentang bagaimana dunia bekerja.

## Kausal inferensi dasar

Ketika eksperimen tidak mungkin (mahal, tidak etis, atau sudah terjadi), ada metode kuasi-eksperimen. Alat berpikir utamanya adalah **DAG kausal**: gambar panah sebab-akibat, lalu tentukan variabel mana yang menutup jalur ‘belakang’ (backdoor) dan mana yang tidak boleh dikontrol (mediator, collider).

```viz
{"type":"compare","columns":["Metode","Ide","Asumsi kunci"],"rows":[{"label":"Difference-in-differences","values":["Bandingkan perubahan grup perlakuan vs perubahan grup kontrol","Parallel trends"]},{"label":"Regression discontinuity","values":["Bandingkan yang tepat di atas vs tepat di bawah ambang (mis. nilai beasiswa)","Tidak ada manipulasi di sekitar ambang"]},{"label":"Instrumental variable","values":["Pakai variabel yang memengaruhi perlakuan tetapi tidak langsung hasil","Exclusion restriction"]},{"label":"Matching / propensity score","values":["Pasangkan unit serupa yang berbeda perlakuan","Semua confounder terukur"]},{"label":"Synthetic control","values":["Bangun ‘kembaran’ dari kombinasi unit kontrol","Pra-periode cocok dengan baik"]}]}
```

Contoh difference-in-differences: promo ongkir diberlakukan di Kotabaru mulai Juli, tidak di Tanah Bumbu.

```python
import statsmodels.formula.api as smf
# df: kolom omzet, treated (1=Kotabaru), post (1=sejak Juli), minggu, kota
m = smf.ols("omzet ~ treated * post + C(minggu)", data=df).fit(
    cov_type="cluster", cov_kwds={"groups": df["kota"]})
print(m.params["treated:post"])      # estimasi efek promo
```

Selalu plot tren pra-perlakuan kedua grup untuk memeriksa asumsi parallel trends. Dengan hanya dua kota, ketidakpastiannya besar; sampaikan itu dengan jujur.

## Menulis laporan teknis

Laporan teknis yang baik bisa dibaca dua tingkat: ringkasan untuk pengambil keputusan, detail untuk yang ingin memeriksa.

```viz
{"type":"layers","layers":[{"label":"Ringkasan eksekutif","detail":"Pertanyaan, jawaban, rekomendasi, tingkat keyakinan — maksimal setengah halaman.","tag":"wajib"},{"label":"Latar & pertanyaan","detail":"Kenapa ini penting; definisi metrik.","tag":""},{"label":"Data & metode","detail":"Sumber, periode, filter, asumsi, alasan memilih metode.","tag":""},{"label":"Hasil","detail":"Estimasi + interval ketidakpastian; grafik berjudul temuan.","tag":""},{"label":"Keterbatasan","detail":"Apa yang bisa membuat kesimpulan salah.","tag":"jujur"},{"label":"Lampiran & kode","detail":"Link repo/notebook untuk replikasi.","tag":""}]}
```

Gunakan bahasa yang mencerminkan kekuatan bukti: "menyebabkan" hanya untuk eksperimen atau desain kausal yang kuat; "berasosiasi dengan" untuk data observasional. Laporkan **interval**, bukan hanya angka tunggal.

## Etika data

Data science menyentuh kehidupan orang sungguhan. Prinsip yang harus menjadi kebiasaan:

- **Privasi & dasar hukum**: Indonesia memiliki **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi**. Kumpulkan seperlunya (data minimization), anonimkan atau pseudonimkan, dan batasi akses.
- **Fairness**: model kredit atau rekrutmen bisa mendiskriminasi lewat proksi (alamat, nama sekolah) walau atribut sensitif tidak dipakai. Ukur performa per kelompok.
- **Persetujuan & tujuan**: data yang dikumpulkan untuk satu tujuan tidak otomatis boleh dipakai untuk tujuan lain.
- **Transparansi**: orang yang terdampak keputusan otomatis berhak mendapat penjelasan.
- **Dampak eksperimen**: eksperimen yang bisa merugikan pengguna (harga diskriminatif, manipulasi emosi) perlu pertimbangan etis sebelum dijalankan.

:::warning
"Datanya bilang begitu" bukan alasan etis. Data mencerminkan proses yang menghasilkannya, termasuk ketidakadilan historis. Model yang dilatih pada keputusan lama yang bias akan mengotomasi bias itu dalam skala besar.
:::

:::latihan
Milestone: ambil satu kebijakan nyata (mis. kenaikan harga, promo, perubahan jam operasional) dengan data sebelum–sesudah. Gambar DAG kausalnya, pilih metode (DiD atau lainnya) dengan alasan, estimasi efeknya beserta interval, periksa asumsinya, lalu tulis laporan teknis 2–3 halaman dengan struktur di atas dan bagian etika singkat.
:::

## Rangkuman

- Eksperimen: unit randomisasi, metrik utama + guardrail, power, durasi, rencana analisis.
- Waspadai confounding, selection/survivorship bias, Simpson's paradox, regression to the mean.
- Tanpa eksperimen: DAG + DiD, RDD, IV, matching, synthetic control — dengan asumsi yang diperiksa.
- Laporan: ringkasan di depan, metode transparan, interval, keterbatasan.
- Etika: privasi (UU PDP), fairness, persetujuan, transparansi.
