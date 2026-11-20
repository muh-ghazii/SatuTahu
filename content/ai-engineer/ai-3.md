---
title: RAG & vector database
minutes: 60
summary: Retrieval-Augmented Generation (RAG) memberi LLM akses ke dokumenmu sendiri sehingga jawabannya berdasar sumber yang dapat diperiksa. Modul ini membahas chunking, embedding dan similarity, hybrid search dan reranking, cara mengevaluasi sistem RAG, serta menampilkan sitasi sumber.
objectives:
  - Merancang pipeline indexing dan query RAG
  - Memilih strategi chunking sesuai jenis dokumen
  - Menjelaskan embedding, cosine similarity, dan cara kerja vector database
  - Meningkatkan retrieval dengan hybrid search dan reranker
  - Mengevaluasi retrieval dan generasi secara terpisah, lalu menampilkan sitasi
sources:
  - repo: NirDiamant/RAG_Techniques
    note: Kumpulan teknik RAG lanjutan dengan notebook
  - repo: DataTalksClub/llm-zoomcamp
    note: Kursus gratis membangun RAG end-to-end
  - repo: langchain-ai/langchain
    note: Framework komponen LLM & RAG
quiz:
  - q: "Pengguna mencari ‘PMK-81/2024’ tetapi sistem RAG berbasis embedding saja gagal menemukan dokumennya. Solusi yang paling tepat…"
    options: ["Menaikkan temperature", "Hybrid search: gabungkan pencarian kata kunci (BM25) dengan vektor", "Memperbesar chunk", "Mengganti LLM"]
    answer: 1
    explain: "Kode, nomor, dan nama persis sering lebih baik ditangkap pencarian leksikal."
  - q: "Mengapa retrieval dan generasi sebaiknya dievaluasi terpisah?"
    options: ["Agar laporan lebih panjang", "Agar tahu apakah jawaban salah karena dokumen relevan tidak terambil atau karena LLM salah memakai konteks", "Karena wajib secara hukum", "Tidak perlu"]
    answer: 1
    explain: "Perbaikannya berbeda: chunking/embedding/reranking vs prompt/model."
  - q: "Reranker cross-encoder dipakai…"
    options: ["Sebelum embedding", "Setelah retrieval awal, untuk menilai ulang puluhan kandidat secara lebih akurat", "Untuk membuat chunk", "Menggantikan LLM"]
    answer: 1
    explain: "Cross-encoder membaca query dan dokumen bersama sehingga lebih akurat, tetapi terlalu mahal untuk seluruh korpus."
  - q: "Cosine similarity antara dua embedding mengukur…"
    options: ["Panjang teks", "Kemiripan arah vektor, yang mewakili kemiripan makna", "Jumlah kata yang sama persis", "Tanggal dokumen"]
    answer: 1
    explain: "Model embedding dilatih sehingga teks bermakna mirip memiliki vektor searah."
---

LLM tidak tahu isi SOP perusahaanmu, peraturan terbaru, atau katalog produkmu, dan memasukkan semua dokumen ke setiap prompt terlalu mahal. **RAG** mengambil potongan dokumen yang relevan untuk setiap pertanyaan dan memberikannya kepada LLM sebagai konteks. Hasilnya: jawaban yang **berdasar sumber**, **bisa diperbarui** tanpa melatih ulang model, dan **dapat diperiksa** lewat sitasi.

```viz
{"type":"flow","title":"Dua pipeline RAG","steps":[{"label":"Indexing (offline)","detail":"Muat dokumen → bersihkan → chunk → embedding → simpan ke vector DB + metadata."},{"label":"Query","detail":"Pertanyaan pengguna (opsional: tulis ulang/expand)."},{"label":"Retrieval","detail":"Hybrid search → top-k kandidat → rerank → top-n."},{"label":"Generation","detail":"Prompt: instruksi + potongan bernomor + pertanyaan → jawaban bersitasi."}]}
```

## Chunking

Dokumen dipotong menjadi **chunk** karena embedding satu dokumen 50 halaman terlalu ‘rata-rata’ untuk dicocokkan dengan pertanyaan spesifik, dan konteks LLM terbatas.

```viz
{"type":"compare","columns":["Strategi","Cara","Cocok untuk"],"rows":[{"label":"Fixed-size + overlap","values":["Mis. 500 token dengan overlap 50–100","Baseline cepat; teks seragam"]},{"label":"Rekursif berbasis struktur","values":["Pisah per judul → paragraf → kalimat","Dokumentasi, artikel, Markdown"]},{"label":"Berbasis struktur dokumen","values":["Per pasal/ayat, per bagian, per baris tabel","Peraturan, kontrak, manual"]},{"label":"Semantik","values":["Pisah saat makna berubah (jarak embedding antar kalimat)","Teks panjang tanpa struktur"]},{"label":"Parent-child","values":["Cari dengan chunk kecil, kirim chunk induk yang lebih besar ke LLM","Butuh presisi pencarian + konteks lengkap"]}]}
```

Tips penting:

- Sertakan **metadata** di setiap chunk: judul dokumen, bagian, nomor halaman, tanggal, URL. Metadata dipakai untuk filter dan sitasi.
- Tambahkan **konteks judul** ke teks chunk ("Peraturan X > Bab III > Pasal 12: …") agar chunk tidak kehilangan makna saat berdiri sendiri. Teknik *contextual retrieval* melangkah lebih jauh dengan meminta LLM menulis ringkasan konteks singkat untuk setiap chunk sebelum di-embed.
- **Parsing** PDF dan tabel adalah sumber masalah terbesar; periksa hasil ekstraksi teks secara manual sebelum menyalahkan model.

## Embedding & similarity

**Model embedding** mengubah teks menjadi vektor (ratusan hingga ribuan dimensi) sehingga teks bermakna mirip berdekatan. Kedekatan diukur dengan **cosine similarity**.

```viz
{"type":"embedding"}
```

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("intfloat/multilingual-e5-small")      # mendukung bahasa Indonesia
docs = ["passage: Seragam BKMT tersedia ukuran S sampai XXL.",
        "passage: Pengiriman ke Kotabaru memakan waktu 2–3 hari.",
        "passage: Pembayaran dapat melalui transfer bank atau QRIS."]
q = "query: berapa lama barang sampai ke Kotabaru?"
D = model.encode(docs, normalize_embeddings=True)
v = model.encode(q, normalize_embeddings=True)
skor = D @ v                                   # cosine (karena sudah dinormalisasi)
print(docs[int(skor.argmax())], skor.round(3))
```

Pilih model embedding yang **mendukung bahasa dokumenmu** (model multibahasa untuk bahasa Indonesia), periksa papan peringkat seperti MTEB sebagai titik awal, lalu **uji pada datamu sendiri**. Perhatikan instruksi khusus model (seperti awalan `query:`/`passage:` pada keluarga E5).

**Vector database** menyimpan vektor dan menemukan tetangga terdekat dengan cepat memakai indeks **ANN** (approximate nearest neighbor) seperti HNSW. Pilihan: **pgvector** (ekstensi Postgres — cocok jika sudah memakai Postgres), **Qdrant**, **Weaviate**, **Milvus**, **Chroma** (prototipe), atau **FAISS** (pustaka). Untuk puluhan ribu chunk, hampir semua pilihan cukup; tentukan berdasarkan operasional yang paling sederhana bagimu.

```sql
-- pgvector
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE chunks (id bigserial PRIMARY KEY, doc text, bagian text, isi text, emb vector(384));
CREATE INDEX ON chunks USING hnsw (emb vector_cosine_ops);
SELECT id, doc, bagian, 1 - (emb <=> $1) AS skor FROM chunks ORDER BY emb <=> $1 LIMIT 20;
```

## Hybrid search & reranking

Pencarian vektor unggul untuk **parafrasa** ("barang belum datang" ≈ "keterlambatan pengiriman"), tetapi lemah untuk **istilah persis**: kode produk, nomor peraturan, nama orang, singkatan. Pencarian leksikal **BM25** unggul sebaliknya. **Hybrid search** menggabungkan keduanya, misalnya dengan **Reciprocal Rank Fusion (RRF)**:

```python
def rrf(daftar_peringkat: list[list[str]], k: int = 60) -> list[str]:
    skor = {}
    for peringkat in daftar_peringkat:
        for posisi, doc_id in enumerate(peringkat):
            skor[doc_id] = skor.get(doc_id, 0) + 1 / (k + posisi + 1)
    return sorted(skor, key=skor.get, reverse=True)

kandidat = rrf([hasil_bm25_ids, hasil_vektor_ids])[:30]
```

Lalu **rerank**: model **cross-encoder** membaca pertanyaan dan setiap kandidat bersama-sama dan memberi skor relevansi yang jauh lebih akurat daripada perbandingan vektor, tetapi terlalu mahal untuk seluruh korpus. Pola umum: ambil 30–50 kandidat, rerank, kirim 5–8 teratas ke LLM.

```python
from sentence_transformers import CrossEncoder
reranker = CrossEncoder("BAAI/bge-reranker-v2-m3")          # multibahasa
skor = reranker.predict([(pertanyaan, teks[i]) for i in kandidat])
teratas = [kandidat[i] for i in np.argsort(-skor)[:6]]
```

Teknik tambahan: **query rewriting** (ubah pertanyaan percakapan menjadi query mandiri), **filter metadata** (hanya dokumen tahun 2026 atau kategori tertentu), dan **multi-query** (beberapa variasi pertanyaan).

## Evaluasi RAG

Tanpa evaluasi, setiap perubahan (ukuran chunk, model embedding, prompt) hanyalah tebakan. Evaluasi **dua bagian secara terpisah**:

```viz
{"type":"compare","columns":["Bagian","Metrik","Cara mengukur"],"rows":[{"label":"Retrieval","values":["Recall@k, MRR, nDCG","Set pertanyaan + ID chunk yang seharusnya terambil"]},{"label":"Generation — faithfulness","values":["Apakah setiap klaim didukung konteks?","LLM-as-judge atau penilaian manusia"]},{"label":"Generation — relevance","values":["Apakah menjawab pertanyaan?","LLM-as-judge dengan rubrik"]},{"label":"Generation — correctness","values":["Cocok dengan jawaban referensi?","Perbandingan dengan kunci jawaban"]},{"label":"Operasional","values":["Latensi, biaya per jawaban","Log produksi"]}]}
```

Langkah praktis: buat **golden set** 50–200 pertanyaan nyata (dari pengguna atau ahli domain) beserta dokumen/chunk sumber dan jawaban referensinya. Sertakan pertanyaan yang **tidak bisa dijawab** dari dokumen untuk menguji apakah sistem berani berkata "tidak ditemukan". Alat seperti **Ragas** dan **DeepEval** menyediakan metrik siap pakai; detail LLM-as-judge dibahas di [modul evaluasi](/belajar/ai-engineer/ai-5).

## Sitasi sumber

Sitasi membuat jawaban **dapat diverifikasi** dan membangun kepercayaan pengguna.

```python
konteks = "\n\n".join(
    f'<sumber id="{i+1}" dokumen="{c.doc}" bagian="{c.bagian}">\n{c.isi}\n</sumber>'
    for i, c in enumerate(chunk_teratas))

prompt = f"""Jawab pertanyaan HANYA berdasarkan sumber di bawah.
Setiap kalimat yang memuat fakta diakhiri nomor sumber, misalnya [1] atau [2][3].
Jika sumber tidak memuat jawabannya, katakan bahwa informasi tidak ditemukan dalam dokumen.

{konteks}

<pertanyaan>{pertanyaan}</pertanyaan>"""
```

Di sisi aplikasi: **petakan nomor sitasi ke dokumen** dan tampilkan judul, bagian, serta tautan; **validasi** bahwa nomor yang disebut benar-benar ada; dan bila memungkinkan tampilkan **kutipan persis** yang mendukung setiap klaim. Beberapa API (termasuk Claude) menyediakan fitur *citations* bawaan yang mengembalikan rentang teks sumber secara terstruktur.

:::latihan
Milestone: bangun RAG untuk kumpulan dokumen nyata berbahasa Indonesia (mis. peraturan akademik kampus, SOP usaha, atau dokumentasi produk). Implementasikan dua strategi chunking, pgvector atau Qdrant, hybrid search + RRF + reranker, dan prompt dengan sitasi. Buat golden set 50 pertanyaan (termasuk 10 yang tidak dapat dijawab), ukur recall@5 untuk setiap konfigurasi retrieval dan faithfulness jawaban, lalu tulis tabel perbandingan dan konfigurasi pilihanmu.
:::

## Rangkuman

- RAG = indexing (chunk → embedding → simpan) + query (retrieve → rerank → generate dengan sitasi).
- Chunking mengikuti struktur dokumen; sertakan metadata dan konteks judul; periksa hasil parsing.
- Embedding multibahasa + cosine similarity; vector DB dengan indeks ANN (pgvector cukup untuk banyak kasus).
- Hybrid search (BM25 + vektor, RRF) + reranker cross-encoder meningkatkan relevansi.
- Evaluasi retrieval dan generasi terpisah dengan golden set; tampilkan dan validasi sitasi.
