---
title: ML di industri & wawancara
minutes: 45
summary: Di industri, keberhasilan ML diukur dari dampak sistem secara keseluruhan, bukan akurasi model semata. Modul ini membahas ML system design, pola dari studi kasus industri, pertanyaan teori ML yang sering muncul, dan cara membaca paper secara efisien.
objectives:
  - Menjawab soal ML system design dengan kerangka yang terstruktur
  - Mengenali pola arsitektur dari studi kasus industri (rekomendasi, fraud, pencarian)
  - Menjelaskan konsep teori ML dengan intuisi dan trade-off
  - Membaca paper ML secara bertahap dan kritis
sources:
  - repo: chiphuyen/ml-interviews-book
    note: Buku wawancara ML (Chip Huyen)
  - repo: eugeneyan/applied-ml
    note: Kumpulan studi kasus ML di perusahaan
  - repo: josephmisiti/awesome-machine-learning
    note: Peta pustaka & framework ML
quiz:
  - q: "Langkah pertama dalam soal ML system design adalah…"
    options: ["Memilih arsitektur neural network", "Mengklarifikasi tujuan bisnis, metrik, dan batasan (latensi, skala)", "Menulis kode", "Mencari dataset"]
    answer: 1
    explain: "Desain yang benar bergantung pada apa yang dioptimalkan dan batasannya."
  - q: "Sistem rekomendasi skala besar umumnya memakai arsitektur…"
    options: ["Satu model besar untuk semua item", "Dua tahap: retrieval kandidat cepat lalu ranking yang lebih berat", "Aturan manual saja", "Clustering saja"]
    answer: 1
    explain: "Menilai jutaan item dengan model berat untuk setiap permintaan terlalu mahal."
  - q: "Saat pertama membaca paper, bagian yang sebaiknya dibaca dulu…"
    options: ["Seluruh lampiran matematika", "Judul, abstrak, gambar, dan kesimpulan", "Daftar pustaka", "Kode sumber"]
    answer: 1
    explain: "Pembacaan pertama untuk memutuskan apakah paper relevan dan apa klaim utamanya."
  - q: "Model fraud dengan offline AUC tinggi tetapi tidak menurunkan kerugian setelah rilis. Kemungkinan penyebab…"
    options: ["AUC selalu salah", "Ketidaksesuaian metrik offline vs tujuan bisnis, feedback loop, atau training-serving skew", "Terlalu banyak data", "GPU kurang"]
    answer: 1
    explain: "Metrik offline adalah proksi; validasi dampak dengan eksperimen online."
---

Kemampuan melatih model adalah syarat masuk. Yang membedakan ML engineer senior adalah kemampuan **merancang sistem** yang memecahkan masalah bisnis, memahami trade-off, dan belajar dari praktik industri.

## ML system design

Soal seperti *"Rancang sistem rekomendasi produk untuk marketplace"* tidak punya satu jawaban benar. Penilai melihat **struktur berpikir** dan **trade-off**.

```viz
{"type":"flow","title":"Kerangka ML system design","steps":[{"label":"Klarifikasi","detail":"Tujuan bisnis, pengguna, skala (QPS, jumlah item), latensi, batasan privasi."},{"label":"Rumuskan sebagai ML","detail":"Input, output, label (eksplisit/implisit), apakah ML memang perlu?"},{"label":"Data & fitur","detail":"Sumber, label, fitur pengguna/item/konteks, feature store."},{"label":"Model","detail":"Baseline sederhana → model lebih kompleks; alasan pemilihan."},{"label":"Evaluasi","detail":"Metrik offline (NDCG, AUC) + online (CTR, GMV) lewat A/B test."},{"label":"Serving & skala","detail":"Batch vs online, caching, arsitektur multi-tahap."},{"label":"Monitoring & iterasi","detail":"Drift, feedback loop, retrain, fairness."}]}
```

Contoh singkat untuk rekomendasi marketplace: tujuan bisnis = GMV dan kepuasan; label implisit = klik, tambah ke keranjang, beli (beri bobot berbeda); **tahap retrieval** mengambil ratusan kandidat dari jutaan produk dengan embedding two-tower dan approximate nearest neighbor; **tahap ranking** memakai gradient boosting atau DNN dengan fitur pengguna, produk, dan konteks (jam, lokasi); **re-ranking** menambahkan diversitas dan aturan bisnis (stok habis disembunyikan). Evaluasi offline dengan NDCG@k pada data waktu berikutnya, lalu A/B test terhadap model lama.

Topik yang hampir selalu ditanya lanjut: **cold start** (pengguna/item baru), **feedback loop** (model hanya belajar dari item yang ia tampilkan sendiri), **training-serving skew**, **label tertunda**, dan **biaya** inferensi.

## Studi kasus industri

Membaca blog engineering perusahaan (dikumpulkan di `applied-ml`) menunjukkan pola berulang:

```viz
{"type":"compare","columns":["Domain","Pola arsitektur","Tantangan khas"],"rows":[{"label":"Rekomendasi & feed","values":["Retrieval (two-tower embedding, ANN) → ranking (GBDT/DNN) → re-ranking (diversitas, aturan bisnis)","Cold start, feedback loop, popularitas"]},{"label":"Fraud & risiko","values":["Fitur agregat real-time (velocity), GBDT, aturan + model, review manusia","Data sangat tidak seimbang, adversarial, label tertunda"]},{"label":"Pencarian","values":["Retrieval leksikal/vektor (hybrid) → learning-to-rank","Relevansi query pendek, bahasa campur"]},{"label":"Forecasting permintaan","values":["Model global GBDT/deep atas banyak deret + fitur kalender & promo","Hari libur, promo, stok habis menyensor permintaan"]},{"label":"ETA & logistik","values":["GBDT/GNN dengan fitur rute & lalu lintas","Ekor distribusi; error besar lebih merugikan"]}]}
```

Pelajaran yang berulang: **mulai sederhana** (heuristik dan GBDT sering menang lama), **data dan fitur lebih penting dari arsitektur**, **metrik offline tidak sama dengan dampak online**, dan **infrastruktur** (feature store, monitoring) menentukan kecepatan iterasi.

## Pertanyaan teori ML

Pola jawaban yang kuat: **definisi singkat → intuisi/contoh → kapan dipakai → kelemahannya**.

```viz
{"type":"compare","columns":["Pertanyaan","Poin kunci"],"rows":[{"label":"Bias–variance","values":["Dekomposisi error; diagnosis dengan learning curve; solusi berbeda untuk masing-masing"]},{"label":"Kenapa regularisasi bekerja?","values":["Membatasi kapasitas/kompleksitas; L1 jarang (sparse), L2 mengecilkan; tafsiran prior Bayesian"]},{"label":"Bagging vs boosting","values":["Paralel & mengurangi variance vs sekuensial & mengurangi bias"]},{"label":"Data tidak seimbang","values":["Metrik PR-AUC, class weight, threshold, resampling di dalam CV, kumpulkan data"]},{"label":"Vanishing gradient","values":["Turunan sigmoid kecil dikalikan berulang; ReLU, normalisasi, residual"]},{"label":"Batch norm","values":["Normalisasi aktivasi per batch; training stabil; perilaku train vs eval berbeda"]},{"label":"Kurse dimensionalitas","values":["Jarak kehilangan makna di dimensi tinggi; butuh data eksponensial; reduksi dimensi"]}]}
```

```viz
{"type":"gradient-descent"}
```

Siapkan juga **soal coding ML**: implementasi k-means, regresi logistik, atau metrik (AUC, precision@k) dengan NumPy dari nol. Materi latihannya ada di [Matematika ML](/belajar/machine-learning/ml-1).

## Membaca paper

Membaca paper adalah keterampilan yang dilatih. Gunakan metode **tiga lintasan** (S. Keshav):

```viz
{"type":"flow","title":"Tiga lintasan membaca paper","steps":[{"label":"Lintasan 1 (10 menit)","detail":"Judul, abstrak, pendahuluan, judul bagian, gambar, kesimpulan. Apa klaimnya? Relevan?"},{"label":"Lintasan 2 (1 jam)","detail":"Baca isi, pahami gambar & tabel, abaikan bukti rinci. Catat rujukan penting."},{"label":"Lintasan 3 (beberapa jam)","detail":"Rekonstruksi ulang: turunkan rumus, jalankan atau implementasikan kode, kritisi asumsi."}]}
```

Pertanyaan kritis saat membaca: **Baseline apa yang dibandingkan, dan apakah adil?** **Apakah peningkatannya melebihi variasi antar seed?** **Dataset apa, dan apakah mewakili kondisi nyata?** **Ablation study apa yang menunjukkan komponen mana yang penting?** Paper dengan kode di GitHub (lihat Papers with Code atau Hugging Face Papers) jauh lebih mudah diverifikasi.

:::tip
Untuk mahasiswa, latihan terbaik adalah *paper replication*: pilih paper klasik yang sederhana (mis. dropout, batch norm, ResNet kecil), implementasikan ulang dalam skala kecil, dan bandingkan hasilmu dengan klaim paper. Itu juga menjadi proyek portofolio yang kuat.
:::

:::latihan
Milestone akhir jalur: (1) tulis dokumen ML system design 2–3 halaman untuk sebuah kasus (rekomendasi produk UMKM, deteksi transaksi mencurigakan, atau forecasting stok) dengan kerangka di atas; (2) rangkum tiga studi kasus industri dari `applied-ml` dalam satu paragraf masing-masing; (3) jawab 30 pertanyaan teori dari `ml-interviews-book` secara lisan; (4) baca satu paper dengan metode tiga lintasan dan replikasi satu hasil intinya.
:::

## Rangkuman

- System design: klarifikasi → rumuskan → data/fitur → model → evaluasi offline & online → serving → monitoring.
- Pola industri: retrieval → ranking; fitur real-time untuk fraud; mulai sederhana.
- Teori: definisi → intuisi → kapan → kelemahan.
- Paper: tiga lintasan, periksa baseline, variasi seed, ablation, dan kode.
