---
title: Cara kerja LLM
minutes: 55
summary: Untuk membangun aplikasi yang andal di atas Large Language Model, kamu perlu tahu apa yang sebenarnya terjadi di dalamnya. Modul ini membahas tokenisasi, attention dan Transformer, perbedaan pretraining dan fine-tuning, strategi sampling seperti temperature dan top-p, serta keterbatasan LLM termasuk halusinasi.
objectives:
  - Menjelaskan tokenisasi dan dampaknya pada biaya, panjang konteks, dan bahasa Indonesia
  - Menjelaskan alur Transformer decoder dari token ke prediksi token berikutnya
  - Membedakan pretraining, instruction tuning, dan preference tuning
  - Mengatur parameter sampling sesuai tugas
  - Mengenali penyebab halusinasi dan cara memitigasinya
sources:
  - repo: mlabonne/llm-course
    note: Kursus LLM (dasar, ilmuwan LLM, engineer LLM)
  - repo: rohitg00/ai-engineering-from-scratch
    note: Kurikulum terbuka 542 pelajaran AI Engineering dari fondasi model hingga produksi
  - repo: rasbt/LLMs-from-scratch
    note: Membangun LLM mirip GPT dari nol (Sebastian Raschka)
  - repo: huggingface/course
    note: Kursus Hugging Face (tokenizer, Transformers)
quiz:
  - q: "Teks bahasa Indonesia sering memakai lebih banyak token daripada teks bahasa Inggris yang setara karena…"
    options: ["Bahasa Indonesia lebih panjang secara makna", "Tokenizer dilatih dominan pada data bahasa Inggris sehingga kata Indonesia lebih sering dipecah menjadi subkata", "LLM tidak mendukung bahasa Indonesia", "Spasi dihitung dua kali"]
    answer: 1
    explain: "Kosakata BPE mencerminkan frekuensi data latihnya; ini memengaruhi biaya dan panjang konteks."
  - q: "Temperature 0 (atau mendekati 0) membuat model…"
    options: ["Lebih kreatif", "Hampir selalu memilih token dengan peluang tertinggi (lebih deterministik)", "Berhenti menjawab", "Lebih cepat dilatih"]
    answer: 1
    explain: "Temperature membagi logits; nilai kecil menajamkan distribusi."
  - q: "Kemampuan model mengikuti instruksi percakapan terutama berasal dari…"
    options: ["Pretraining pada teks internet saja", "Instruction tuning (SFT) dan preference tuning (RLHF/DPO) setelah pretraining", "Tokenizer", "Temperature"]
    answer: 1
    explain: "Model dasar hanya melanjutkan teks; tuning tambahan membentuknya menjadi asisten."
  - q: "Cara paling efektif mengurangi halusinasi fakta spesifik perusahaan adalah…"
    options: ["Menaikkan temperature", "Memberikan sumber relevan di konteks (RAG) dan meminta model mengutip serta mengakui jika tidak tahu", "Memakai prompt lebih pendek", "Mengulang pertanyaan"]
    answer: 1
    explain: "Model tidak mengetahui data privat; grounding memberinya bukti yang bisa diperiksa."
---

Large Language Model (LLM) seperti Claude, GPT, Gemini, dan Llama tampak seperti ‘memahami’ bahasa. Secara mekanis, mereka melakukan satu hal berulang-ulang: **memprediksi token berikutnya**. Memahami mekanisme ini menjelaskan banyak perilaku yang kamu temui saat membangun aplikasi: kenapa biaya dihitung per token, kenapa jawaban bisa berubah-ubah, dan kenapa model bisa mengarang dengan percaya diri.

## Tokenisasi

LLM tidak membaca huruf atau kata, melainkan **token**: potongan teks dari kosakata tetap (biasanya puluhan hingga ratusan ribu entri). Kosakata dibangun dengan algoritme seperti **Byte Pair Encoding (BPE)**: mulai dari byte, gabungkan pasangan yang paling sering muncul secara berulang. Ketik teks di bawah dan lihat bagaimana ia dipecah:

```viz
{"type":"tokenizer"}
```

Konsekuensi praktis:

- **Biaya dan batas konteks dihitung dalam token**, bukan kata. Sebagai patokan kasar, bahasa Inggris sekitar 0,75 kata per token; bahasa Indonesia biasanya butuh lebih banyak token per kata karena kata seperti ‘mempertanggungjawabkan’ dipecah menjadi banyak subkata.
- Model sering lemah dalam **mengeja, menghitung huruf, atau aritmetika digit panjang**, karena ia melihat potongan, bukan karakter.
- Spasi, huruf kapital, dan angka memengaruhi tokenisasi; ‘ 2026’ dan ‘2026’ bisa menjadi token berbeda.

```python
from transformers import AutoTokenizer
tok = AutoTokenizer.from_pretrained("gpt2")
for teks in ["Saya belajar machine learning", "mempertanggungjawabkan"]:
    ids = tok.encode(teks)
    print(len(ids), [tok.decode([i]) for i in ids])
```

## Attention & Transformer

Setelah tokenisasi, setiap token diubah menjadi **embedding** (vektor), ditambah informasi posisi, lalu melewati puluhan **blok Transformer**. Di setiap blok, **self-attention** memungkinkan token mengumpulkan informasi dari token sebelumnya yang relevan, lalu **MLP** mengolahnya.

```viz
{"type":"attention"}
```

```viz
{"type":"flow","title":"Dari prompt ke token berikutnya","steps":[{"label":"Tokenisasi","detail":"‘Ibu kota Kalimantan Selatan adalah’ → ID token."},{"label":"Embedding + posisi","detail":"Setiap token menjadi vektor."},{"label":"N blok Transformer","detail":"Causal self-attention + MLP + residual + norm."},{"label":"Logits","detail":"Skor untuk setiap token dalam kosakata."},{"label":"Sampling","detail":"Pilih satu token (‘ Banjarbaru’), tambahkan ke input, ulangi."}]}
```

Karena generasi berlangsung token demi token, panjang output menentukan latensi. Untuk mempercepat, server inferensi menyimpan **KV cache** (key dan value token sebelumnya) sehingga tidak dihitung ulang. Mekanisme attention dibahas lebih rinci di [Arsitektur: CNN, RNN, Attention](/belajar/deep-learning/dl-3), dan membangun GPT kecil dari nol di [Membaca & mengimplementasikan paper](/belajar/deep-learning/dl-4).

**Context window** adalah jumlah token maksimum (prompt + output) yang dapat diproses sekaligus. Jendela besar memungkinkan memasukkan dokumen panjang, tetapi informasi di tengah konteks yang sangat panjang kadang kurang diperhatikan, dan biaya naik seiring jumlah token.

## Pretraining vs fine-tuning

```viz
{"type":"layers","layers":[{"label":"Preference tuning","detail":"RLHF / DPO / Constitutional AI: menyelaraskan jawaban dengan preferensi — membantu, jujur, aman.","tag":"perilaku"},{"label":"Instruction tuning (SFT)","detail":"Contoh percakapan instruksi → jawaban berkualitas; model belajar format asisten.","tag":"format"},{"label":"Pretraining","detail":"Prediksi token berikutnya pada triliunan token teks & kode; pengetahuan dan kemampuan bahasa umum.","tag":"pengetahuan"}]}
```

- **Model dasar (base)** hasil pretraining hanya melanjutkan teks; jika diberi pertanyaan, ia bisa saja melanjutkan dengan pertanyaan lain.
- **Model instruct/chat** sudah dituning untuk mengikuti instruksi dan bercakap.
- Sebagai pengembang aplikasi, kamu jarang perlu fine-tuning. Urutan yang disarankan: **prompting yang baik → RAG untuk pengetahuan → fine-tuning** hanya untuk gaya/format konsisten, tugas sempit bervolume tinggi, atau model kecil yang harus meniru model besar. Fine-tuning efisien seperti **LoRA/QLoRA** melatih sebagian kecil parameter tambahan.

**Knowledge cutoff**: model hanya ‘tahu’ data sampai tanggal pengumpulan data latihnya. Informasi setelahnya harus diberikan lewat konteks (pencarian web, RAG, atau tool).

## Sampling (temperature, top-p)

Model mengeluarkan distribusi peluang atas seluruh kosakata. Cara memilih token dari distribusi itu sangat memengaruhi output. Geser temperature dan amati distribusinya:

```viz
{"type":"temperature"}
```

```viz
{"type":"compare","columns":["Parameter","Efek","Saran"],"rows":[{"label":"Temperature","values":["Logits dibagi T; T kecil → tajam/deterministik, T besar → datar/variatif","Rendah untuk ekstraksi & kode; sedang untuk tulisan kreatif"]},{"label":"Top-p (nucleus)","values":["Ambil token teratas hingga kumulatif peluang p, buang sisanya","Umumnya ubah temperature ATAU top-p, bukan keduanya"]},{"label":"Top-k","values":["Hanya k token teratas yang boleh dipilih","Memotong ekor yang aneh"]},{"label":"Max tokens / stop","values":["Batas panjang & penanda berhenti","Wajib diatur untuk mengontrol biaya"]}]}
```

Bahkan dengan temperature 0, output tidak selalu identik di setiap panggilan karena detail implementasi server. Jangan bergantung pada determinisme penuh; untuk keandalan, gunakan **validasi output** dan **evaluasi** (dibahas di [modul evaluasi](/belajar/ai-engineer/ai-5)).

## Keterbatasan & halusinasi

**Halusinasi** adalah output yang terdengar meyakinkan tetapi salah atau tidak didukung sumber. Penyebabnya berakar pada cara kerja model: ia dilatih menghasilkan teks yang **masuk akal**, bukan teks yang **terverifikasi benar**.

```viz
{"type":"tree","root":{"label":"Keterbatasan LLM","children":[{"label":"Halusinasi","detail":"Mengarang rujukan, angka, API yang tidak ada"},{"label":"Pengetahuan terbatas","detail":"Knowledge cutoff; tidak tahu data privat"},{"label":"Penalaran rapuh","detail":"Aritmetika panjang, logika banyak langkah tanpa alat"},{"label":"Sensitif terhadap prompt","detail":"Perubahan kecil kata → jawaban berbeda"},{"label":"Bias & keamanan","detail":"Mencerminkan bias data; rentan prompt injection"}]}}
```

Mitigasi yang terbukti efektif:

- **Grounding**: berikan dokumen sumber di konteks (RAG) dan minta jawaban hanya berdasarkan sumber itu, disertai kutipan.
- **Izinkan ‘tidak tahu’**: instruksikan model menyatakan ketidakpastian bila sumber tidak memadai.
- **Gunakan alat**: kalkulator, eksekusi kode, atau query database untuk fakta dan perhitungan.
- **Validasi**: periksa output terstruktur dengan skema, cocokkan kutipan dengan sumber, dan libatkan manusia untuk keputusan berisiko tinggi.

:::warning
Jangan pernah mengutip referensi, pasal hukum, atau angka dari LLM tanpa memeriksa sumber aslinya, terutama untuk karya ilmiah, laporan, dan keputusan penting.
:::

:::kasus[Menghitung biaya nyata chatbot berbahasa Indonesia]
Misal chatbot UMKM menerima 1.000 pertanyaan/hari. Rata-rata prompt + konteks dokumen RAG = 1.800 token input (teks Indonesia umumnya ~1,3–1,8× lebih banyak token dari Inggris!) dan 300 token output. Total bulanan = 54 juta token input + 9 juta token output. Dengan memahami tokenisasi, kamu bisa: (1) memangkas konteks yang tak relevan, (2) memakai prompt caching untuk instruksi sistem yang berulang, dan (3) memakai model ringan (mini/flash) untuk klasifikasi intent sebelum memanggil model besar.
:::

:::jebakan[Mengira Temperature 0 membuat LLM tidak berhalusinasi]
`temperature = 0` hanya membuat model selalu memilih token dengan probabilitas tertinggi (**lebih konsisten**), bukan membuatnya **lebih jujur**. Jika informasi tidak ada di konteks atau data latihnya, model tetap bisa mengarang jawaban yang sama secara konsisten! Solusinya tetap grounding (RAG), izin berkata "tidak tahu", dan verifikasi.
:::

:::latihan
Milestone: (1) bandingkan jumlah token 5 paragraf bahasa Indonesia vs terjemahan Inggrisnya pada dua tokenizer dan hitung implikasi biayanya; (2) kerjakan bab 2–4 `LLMs-from-scratch` (tokenisasi, attention, GPT kecil); (3) buat eksperimen sampling: satu prompt dijalankan 10× pada tiga temperature dan catat variasinya; (4) susun 10 pertanyaan yang memancing halusinasi (fakta lokal yang jarang), uji ke model, lalu ulangi dengan dokumen sumber di konteks dan bandingkan.
:::

:::solusi[Tips menjalankan eksperimen tanpa biaya API]
Kamu bisa menguji eksperimen sampling dan grounding secara **100% gratis di laptop** memakai [Ollama](https://github.com/ollama/ollama) (mis. `ollama run qwen2.5:7b` atau `llama3.2:3b`). Catat perbedaan akurasi sebelum vs sesudah dokumen sumber dimasukkan ke prompt dalam tabel sederhana — ini langsung jadi bahan studi kasus portofolio AI Engineering pertamamu!
:::

## Rangkuman

- Token adalah satuan biaya dan konteks; bahasa Indonesia cenderung butuh lebih banyak token.
- Transformer decoder memprediksi token berikutnya berulang kali; KV cache mempercepat generasi.
- Pretraining memberi pengetahuan; SFT dan preference tuning membentuk perilaku asisten; prioritaskan prompting & RAG sebelum fine-tuning.
- Temperature/top-p mengatur variasi; tetap validasi output.
- Halusinasi melekat pada model; mitigasi dengan grounding, alat, izin ‘tidak tahu’, dan validasi.
