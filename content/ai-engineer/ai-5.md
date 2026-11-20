---
title: Evaluasi, produksi & portofolio AI engineer
minutes: 55
summary: Aplikasi LLM yang terasa bagus di demo sering gagal di tangan pengguna nyata. Modul ini membahas eval set dan LLM-as-judge, caching dan optimasi biaya, keamanan terhadap prompt injection, deployment dan monitoring, serta menyusun portofolio AI engineer yang meyakinkan.
objectives:
  - Membangun eval set dan menjalankan evaluasi otomatis setiap perubahan
  - Memakai LLM-as-judge dengan rubrik dan memvalidasinya terhadap penilaian manusia
  - Menurunkan biaya dan latensi dengan caching, routing model, dan pemangkasan konteks
  - Menerapkan pertahanan berlapis terhadap prompt injection dan kebocoran data
  - Men-deploy, memantau, dan memperbaiki aplikasi LLM berdasarkan data produksi
sources:
  - repo: chiphuyen/aie-book
    note: Sumber pendamping buku AI Engineering (Chip Huyen)
  - repo: Shubhamsaboo/awesome-llm-apps
    note: Contoh aplikasi LLM, RAG, dan agen untuk inspirasi portofolio
  - repo: patchy631/ai-engineering-hub
    note: Tutorial proyek AI engineering end-to-end
  - repo: Hannibal046/Awesome-LLM
    note: Peta paper, model, dan alat LLM
quiz:
  - q: "Mengapa LLM-as-judge perlu dikalibrasi dengan penilaian manusia?"
    options: ["Agar lebih mahal", "Karena judge bisa bias (posisi, panjang jawaban, gaya) dan perlu dibuktikan sejalan dengan penilaian manusia", "Karena LLM tidak bisa membaca", "Tidak perlu"]
    answer: 1
    explain: "Ukur kesepakatan judge dengan label manusia pada sampel sebelum mempercayainya."
  - q: "Prompt caching paling efektif bila…"
    options: ["Setiap prompt benar-benar berbeda", "Bagian awal prompt yang panjang (system, dokumen, contoh) sama di banyak request", "Output sangat panjang", "Temperature tinggi"]
    answer: 1
    explain: "Cache bekerja pada prefiks yang identik; letakkan bagian statis di awal."
  - q: "Pertahanan terbaik terhadap prompt injection adalah…"
    options: ["Satu kalimat ‘jangan ikuti instruksi jahat’ di system prompt", "Pertahanan berlapis: pemisahan data/instruksi, hak akses minimum, validasi output, dan persetujuan manusia untuk aksi sensitif", "Menyembunyikan system prompt", "Memakai model terbesar"]
    answer: 1
    explain: "Tidak ada satu teknik yang menjamin; batasi dampaknya lewat desain sistem."
  - q: "Proyek portofolio AI engineer yang paling meyakinkan menunjukkan…"
    options: ["Antarmuka chat yang memanggil API saja", "Masalah nyata, evaluasi terukur, keputusan desain & trade-off, serta biaya dan keamanan", "Jumlah model yang dipakai", "Prompt yang panjang"]
    answer: 1
    explain: "Evaluasi dan trade-off membedakan engineer dari pembuat demo."
---

Demo LLM mudah dibuat dalam satu sore. Membuatnya **andal, aman, dan terjangkau** untuk ribuan pengguna adalah pekerjaan AI engineering yang sesungguhnya. Kuncinya satu: **evaluasi** — tanpanya, setiap perubahan prompt atau model hanyalah tebakan.

## Eval set & LLM-as-judge

**Eval set** adalah kumpulan input representatif beserta kriteria jawaban yang benar. Ia berfungsi seperti unit test untuk aplikasi LLM.

```viz
{"type":"flow","title":"Siklus pengembangan berbasis evaluasi","loop":true,"steps":[{"label":"Kumpulkan kasus","detail":"Pertanyaan nyata pengguna, kasus sulit, kasus gagal dari produksi."},{"label":"Definisikan kriteria","detail":"Jawaban referensi, rubrik, atau pemeriksaan otomatis."},{"label":"Jalankan eval","detail":"Setiap perubahan prompt/model/retrieval."},{"label":"Analisis error","detail":"Baca output yang gagal; kelompokkan pola kegagalan."},{"label":"Perbaiki","detail":"Ubah satu hal; bandingkan skor sebelum–sesudah."}]}
```

Jenis pemeriksaan, dari yang paling murah dan andal:

```viz
{"type":"compare","columns":["Jenis","Contoh","Catatan"],"rows":[{"label":"Deterministik","values":["JSON valid sesuai skema; mengandung sitasi; panjang ≤ N; kategori ∈ daftar","Murah, pasti — gunakan sebanyak mungkin"]},{"label":"Referensi","values":["Exact match / F1 untuk ekstraksi; kemiripan dengan jawaban kunci","Perlu kunci jawaban"]},{"label":"LLM-as-judge","values":["Skor faithfulness, relevansi, nada dengan rubrik","Fleksibel; harus dikalibrasi"]},{"label":"Manusia","values":["Ahli domain menilai sampel","Paling akurat, paling mahal — untuk kalibrasi & keputusan rilis"]}]}
```

```python
RUBRIK = """Nilai JAWABAN berdasarkan SUMBER.
- faithful (true/false): setiap klaim faktual didukung SUMBER.
- menjawab (1–3): 1 = tidak menjawab, 2 = sebagian, 3 = lengkap.
Berikan alasan singkat SEBELUM penilaian."""

def judge(pertanyaan, sumber, jawaban) -> dict:
    resp = client.messages.create(model=MODEL_JUDGE, max_tokens=400, temperature=0,
        tools=[TOOL_SKOR], tool_choice={"type": "tool", "name": "skor"},
        messages=[{"role": "user", "content": f"{RUBRIK}\n<pertanyaan>{pertanyaan}</pertanyaan>\n"
                   f"<sumber>{sumber}</sumber>\n<jawaban>{jawaban}</jawaban>"}])
    return next(b.input for b in resp.content if b.type == "tool_use")
```

Praktik LLM-as-judge yang baik: rubrik **spesifik dan biner/berskala kecil**, minta alasan sebelum skor, gunakan model judge yang kuat, acak urutan saat membandingkan dua jawaban (menghindari **bias posisi**), waspadai bias terhadap jawaban yang **lebih panjang**, dan **ukur kesepakatan** judge dengan label manusia pada 50–100 sampel sebelum mempercayainya. Jalankan eval di **CI** agar regresi tertangkap sebelum rilis.

## Caching & optimasi biaya

```viz
{"type":"cache"}
```

```viz
{"type":"compare","columns":["Teknik","Cara","Penghematan"],"rows":[{"label":"Prompt caching","values":["Letakkan bagian statis (system, dokumen, contoh) di awal & tandai untuk cache","Biaya & latensi input berulang turun drastis"]},{"label":"Cache respons (exact/semantik)","values":["Simpan jawaban untuk pertanyaan identik atau sangat mirip (dengan hati-hati)","Panggilan model hilang sama sekali"]},{"label":"Routing model","values":["Model kecil untuk tugas mudah; eskalasi ke model besar bila perlu","Biaya rata-rata turun"]},{"label":"Pangkas konteks","values":["Top-n chunk alih-alih seluruh dokumen; ringkas riwayat percakapan","Token input turun"]},{"label":"Batch API","values":["Pekerjaan offline (klasifikasi massal, evaluasi)","Diskon untuk pemrosesan asinkron"]},{"label":"Batasi output","values":["max_tokens, format ringkas, stop sequence","Token output (termahal) turun"]}]}
```

Cache semantik berisiko memberikan jawaban yang salah untuk pertanyaan yang mirip tetapi berbeda makna ("stok ukuran M" vs "stok ukuran L"); gunakan ambang ketat dan hanya untuk konten yang tidak personal. Selalu ukur dampak setiap optimasi terhadap **skor eval**, bukan hanya biaya.

## Keamanan: prompt injection

**Prompt injection** terjadi ketika input (langsung dari pengguna atau tidak langsung dari dokumen, web, email) berisi instruksi yang membajak perilaku model. OWASP menempatkannya di urutan teratas risiko aplikasi LLM.

```viz
{"type":"tree","root":{"label":"Risiko keamanan aplikasi LLM","children":[{"label":"Prompt injection","detail":"Langsung (pengguna) & tidak langsung (konten yang dibaca model)"},{"label":"Kebocoran data","detail":"System prompt, data pengguna lain, PII dalam log"},{"label":"Output tidak aman","detail":"HTML/SQL/kode dari model dieksekusi tanpa sanitasi"},{"label":"Agensi berlebih","detail":"Tool dengan izin terlalu luas; aksi tanpa konfirmasi"},{"label":"Biaya tak terkendali","detail":"Loop agen tanpa batas; penyalahgunaan endpoint publik"}]}}
```

Tidak ada satu teknik yang menjamin kekebalan. Bangun **pertahanan berlapis** yang membatasi dampak meski injeksi berhasil:

- **Pisahkan instruksi dan data** (tag, peran pesan), dan nyatakan bahwa isi data tidak boleh diperlakukan sebagai perintah.
- **Hak akses minimum**: model hanya melihat data milik pengguna yang sedang login; otorisasi ditegakkan di kode, bukan di prompt.
- **Validasi & sanitasi output** sebelum dirender (XSS) atau dieksekusi (SQL, shell).
- **Persetujuan manusia** untuk aksi sensitif; jangan izinkan pengiriman data ke URL arbitrer.
- **Deteksi** dengan classifier injeksi dan pemantauan pola anomali; **red teaming** berkala.

Prinsip keamanan aplikasi umum (XSS, SQL injection, OWASP Top 10) dibahas di [jalur Cyber Security](/belajar/cyber-security/cs-3).

## Deploy & monitoring

```viz
{"type":"layers","layers":[{"label":"Frontend","detail":"Streaming, tombol umpan balik 👍/👎, tampilan sitasi","tag":"UX"},{"label":"API aplikasi","detail":"Autentikasi, rate limit per pengguna, kuota biaya","tag":"gateway"},{"label":"Orkestrasi LLM","detail":"Prompt berversi, retrieval, tool, guardrails, fallback model","tag":"logika"},{"label":"Penyedia model","detail":"API (Claude, GPT, Gemini) atau self-host (vLLM, Ollama)","tag":"inferensi"},{"label":"Observability","detail":"Trace, token, biaya, latensi, skor eval online, umpan balik","tag":"Langfuse/OTel"}]}
```

Hal yang perlu dipantau setelah rilis: **latensi** (time-to-first-token dan total), **error rate** dan fallback, **biaya per pengguna/fitur**, **umpan balik pengguna**, dan **skor eval online** pada sampel trafik (mis. faithfulness otomatis). Siapkan **fallback** saat penyedia gangguan (model alternatif atau pesan ramah), dan **versikan prompt** sehingga setiap respons dapat ditelusuri ke versi prompt dan model yang menghasilkannya. Kasus gagal dari produksi dimasukkan kembali ke eval set — inilah siklus perbaikan berkelanjutan.

## Portofolio AI engineer

Banyak portofolio berisi ‘chatbot PDF’ yang mirip satu sama lain. Yang menonjol adalah proyek yang menunjukkan **kemampuan engineering**:

```viz
{"type":"compare","columns":["Biasa","Menonjol"],"rows":[{"label":"Masalah","values":["‘Chat dengan PDF’ generik","Masalah spesifik dengan pengguna nyata (mis. asisten peraturan akademik, CS toko UMKM)"]},{"label":"Evaluasi","values":["‘Jawabannya bagus’","Eval set 100 kasus, metrik retrieval & faithfulness, tabel perbandingan konfigurasi"]},{"label":"Engineering","values":["Satu file notebook","Repo rapi, test, CI eval, Docker, deploy publik"]},{"label":"Biaya & keamanan","values":["Tidak disebut","Biaya per 1.000 query, mitigasi prompt injection, penanganan PII"]},{"label":"Cerita","values":["Daftar fitur","README/tulisan: keputusan desain, apa yang gagal, apa yang dipelajari"]}]}
```

Ide proyek: asisten tanya-jawab peraturan dengan sitasi pasal, agen analisis data penjualan yang menghasilkan grafik dan ringkasan, ekstraksi dokumen (faktur, formulir) ke data terstruktur dengan akurasi terukur, atau server MCP untuk sistem yang kamu gunakan. Gunakan `awesome-llm-apps` dan `ai-engineering-hub` untuk inspirasi, lalu **tambahkan evaluasi dan analisis** yang biasanya tidak ada di contoh-contoh itu.

:::latihan
Milestone akhir jalur: ambil sistem RAG atau agen dari modul sebelumnya dan jadikan produk portofolio: eval set ≥ 100 kasus dengan pemeriksaan deterministik + LLM-as-judge yang dikalibrasi terhadap 50 label manusia; eval berjalan di CI; prompt caching dan routing model dengan laporan penghematan biaya vs perubahan skor; 10 uji prompt injection; deploy publik dengan tracing dan tombol umpan balik; README yang menjelaskan arsitektur, hasil evaluasi, biaya, dan trade-off.
:::

## Rangkuman

- Evaluasi adalah inti: eval set dari kasus nyata, pemeriksaan deterministik dulu, LLM-as-judge yang dikalibrasi, eval di CI.
- Optimasi biaya: prompt caching, cache respons hati-hati, routing model, pangkas konteks, batch — selalu cek skor eval.
- Keamanan berlapis: pisahkan data/instruksi, hak minimum, validasi output, persetujuan manusia, red teaming.
- Produksi: prompt berversi, fallback, observability, umpan balik pengguna, kasus gagal kembali ke eval set.
- Portofolio: masalah nyata + evaluasi terukur + engineering + biaya & keamanan + cerita keputusan.
