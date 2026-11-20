---
title: Prompt engineering & membangun dengan API
minutes: 55
summary: Prompt adalah antarmuka pemrograman untuk LLM, dan API adalah cara menghubungkannya ke aplikasimu. Modul ini membahas teknik prompting yang terbukti, structured output berformat JSON, tool atau function calling, streaming, serta mengelola biaya dan rate limit.
objectives:
  - Menulis prompt yang jelas, terstruktur, dan dapat diuji
  - Mendapatkan output JSON yang tervalidasi skema
  - Menghubungkan LLM dengan fungsi/tool aplikasi
  - Menampilkan respons secara streaming
  - Memperkirakan dan mengendalikan biaya serta menangani rate limit
sources:
  - repo: dair-ai/Prompt-Engineering-Guide
    note: Panduan teknik prompting & riset terkait
  - repo: microsoft/generative-ai-for-beginners
    note: Kurikulum membangun aplikasi generative AI
  - repo: anthropics/claude-cookbooks
    note: Contoh resmi pemakaian Claude API (tool use, JSON, RAG)
  - repo: openai/openai-cookbook
    note: Contoh resmi pemakaian OpenAI API
quiz:
  - q: "Cara paling andal mendapatkan output JSON yang sesuai skema adalah…"
    options: ["Meminta ‘tolong jawab JSON’ saja", "Memakai fitur structured output/tool dengan JSON Schema, lalu tetap memvalidasi di kode", "Menaikkan temperature", "Memotong teks dengan regex"]
    answer: 1
    explain: "Skema yang ditegakkan API + validasi Pydantic mencegah format rusak masuk ke sistem."
  - q: "Dalam tool calling, siapa yang menjalankan fungsi ‘cek_stok’?"
    options: ["LLM menjalankannya di server penyedia", "Aplikasimu — model hanya meminta pemanggilan dengan argumen, lalu kamu mengirim hasilnya kembali", "Browser pengguna", "Tidak ada yang menjalankan"]
    answer: 1
    explain: "Model memilih tool dan argumen; eksekusi dan otorisasi tetap di kodemu."
  - q: "Saat menerima HTTP 429 dari API, tindakan yang tepat…"
    options: ["Mengulang segera dalam loop", "Retry dengan exponential backoff + jitter dan mengikuti header retry-after", "Mengganti API key", "Menyerah"]
    answer: 1
    explain: "429 berarti rate limit; retry agresif hanya memperparah."
  - q: "Few-shot prompting berarti…"
    options: ["Memakai model kecil", "Memberi beberapa contoh input→output di prompt agar model meniru pola", "Membatasi output", "Memanggil API beberapa kali"]
    answer: 1
    explain: "Contoh yang beragam dan representatif sering lebih efektif daripada deskripsi panjang."
---

Membangun dengan LLM berbeda dari pemrograman biasa: ‘kode’-nya sebagian berupa bahasa alami, dan output-nya probabilistik. Modul ini membahas cara membuat bagian probabilistik itu **dapat diandalkan** dan terintegrasi dengan sistem nyata. Contoh kode memakai SDK Python Anthropic; pola yang sama berlaku untuk penyedia lain (OpenAI, Google, model open source via vLLM/Ollama).

```bash
pip install anthropic pydantic
export ANTHROPIC_API_KEY=...     # jangan pernah ditulis di kode atau di-commit
```

## Teknik prompting

Prompt yang baik mirip brief untuk rekan kerja baru yang cerdas tetapi tidak tahu konteksmu.

```viz
{"type":"layers","layers":[{"label":"Format output","detail":"Struktur, panjang, bahasa, tag XML/JSON","tag":"bagaimana"},{"label":"Contoh (few-shot)","detail":"2–5 contoh input→output yang beragam","tag":"pola"},{"label":"Data/dokumen","detail":"Dibungkus tag, mis. <dokumen>…</dokumen>","tag":"bahan"},{"label":"Instruksi tugas","detail":"Apa yang harus dilakukan, langkah, batasan, kriteria sukses","tag":"apa"},{"label":"System prompt","detail":"Peran, audiens, aturan umum, gaya","tag":"siapa"}]}
```

Teknik yang konsisten terbukti membantu:

- **Jelas dan spesifik**: sebutkan audiens, tujuan, panjang, dan definisi ‘bagus’.
- **Pisahkan instruksi dari data** dengan tag XML agar model tidak bingung (dan lebih tahan injeksi).
- **Few-shot**: contoh yang beragam lebih efektif daripada aturan panjang.
- **Biarkan model berpikir** untuk tugas kompleks: minta analisis langkah demi langkah sebelum jawaban akhir, atau gunakan fitur *extended thinking* jika tersedia.
- **Pecah tugas besar** menjadi rantai prompt (ekstrak → analisis → tulis) yang masing-masing dapat diuji.
- **Beri jalan keluar**: "Jika informasi tidak ada di dokumen, jawab ‘tidak ditemukan’."

```python
import anthropic
client = anthropic.Anthropic()
MODEL = "claude-sonnet-5-5"            # cek nama model terbaru di dokumentasi penyedia

resp = client.messages.create(
    model=MODEL, max_tokens=800, temperature=0.2,
    system="Kamu analis customer service toko seragam. Jawab dalam Bahasa Indonesia yang ringkas.",
    messages=[{"role": "user", "content": f"""Klasifikasikan keluhan berikut ke salah satu kategori:
pengiriman, ukuran, kualitas_bahan, pembayaran, lainnya.

<contoh>
Keluhan: Barang sudah 10 hari belum sampai → pengiriman
Keluhan: Jahitan lengan lepas setelah dicuci → kualitas_bahan
</contoh>

<keluhan>{teks_keluhan}</keluhan>

Jawab hanya dengan nama kategori."""}],
)
print(resp.content[0].text, resp.usage.input_tokens, resp.usage.output_tokens)
```

Perlakukan prompt seperti kode: simpan di file/versi, dan uji dengan kumpulan contoh setiap kali diubah.

## Structured output (JSON)

Aplikasi butuh data terstruktur, bukan paragraf. Cara paling andal: definisikan **JSON Schema** dan minta model mengisinya melalui fitur structured output atau tool, lalu **validasi** di kode.

```python
from pydantic import BaseModel, Field
from typing import Literal

class Pesanan(BaseModel):
    nama_pelanggan: str
    produk: Literal["gamis", "jilbab", "seragam_bkmt", "lainnya"]
    jumlah: int = Field(ge=1)
    ukuran: list[str]
    tanggal_butuh: str | None = Field(description="YYYY-MM-DD atau null")

resp = client.messages.create(
    model=MODEL, max_tokens=500,
    tools=[{"name": "simpan_pesanan", "description": "Simpan pesanan hasil ekstraksi chat",
            "input_schema": Pesanan.model_json_schema()}],
    tool_choice={"type": "tool", "name": "simpan_pesanan"},        # paksa mengisi skema
    messages=[{"role": "user", "content": f"Ekstrak pesanan dari chat WhatsApp ini:\n<chat>{chat}</chat>"}],
)
data = next(b.input for b in resp.content if b.type == "tool_use")
pesanan = Pesanan.model_validate(data)        # gagal → tangani: retry dengan pesan error, atau eskalasi
```

Beberapa penyedia juga menawarkan mode *structured outputs* yang menjamin kepatuhan skema secara langsung. Apa pun mekanismenya, **validasi tetap wajib**: skema menjamin bentuk, bukan kebenaran isi.

## Tool/function calling

**Tool calling** memungkinkan model meminta aplikasimu menjalankan fungsi: cek stok, query database, kirim email. Model **tidak** menjalankan apa pun sendiri.

```viz
{"type":"sequence","actors":["Pengguna","Aplikasi","LLM","Database"],"messages":[{"from":"Pengguna","to":"Aplikasi","label":"‘Seragam ukuran L masih ada?’"},{"from":"Aplikasi","to":"LLM","label":"pesan + definisi tool cek_stok"},{"from":"LLM","to":"Aplikasi","label":"tool_use: cek_stok(produk='seragam', ukuran='L')"},{"from":"Aplikasi","to":"Database","label":"SELECT stok … (dengan otorisasi)"},{"from":"Database","to":"Aplikasi","label":"12"},{"from":"Aplikasi","to":"LLM","label":"tool_result: 12"},{"from":"LLM","to":"Aplikasi","label":"‘Masih ada 12 potong ukuran L.’"},{"from":"Aplikasi","to":"Pengguna","label":"jawaban akhir"}]}
```

```python
tools = [{"name": "cek_stok", "description": "Cek stok produk berdasarkan nama dan ukuran.",
          "input_schema": {"type": "object", "properties": {
              "produk": {"type": "string"}, "ukuran": {"type": "string", "enum": ["S", "M", "L", "XL"]}},
              "required": ["produk", "ukuran"]}}]

messages = [{"role": "user", "content": "Seragam ukuran L masih ada?"}]
while True:
    resp = client.messages.create(model=MODEL, max_tokens=500, tools=tools, messages=messages)
    messages.append({"role": "assistant", "content": resp.content})
    if resp.stop_reason != "tool_use":
        break
    hasil = []
    for b in resp.content:
        if b.type == "tool_use":
            out = FUNGSI[b.name](**b.input)                      # jalankan di kodemu
            hasil.append({"type": "tool_result", "tool_use_id": b.id, "content": str(out)})
    messages.append({"role": "user", "content": hasil})
print(resp.content[-1].text)
```

Prinsip keamanan: **validasi argumen**, terapkan **otorisasi** pengguna di sisi aplikasi, dan minta **konfirmasi manusia** untuk aksi berisiko (transfer uang, hapus data, kirim email). Loop ini adalah inti dari **agen**, yang dibahas di [AI agents & MCP](/belajar/ai-engineer/ai-4).

## Streaming

Generasi panjang bisa memakan belasan detik. **Streaming** menampilkan token segera setelah dihasilkan sehingga aplikasi terasa responsif (*time to first token* rendah).

```python
with client.messages.stream(model=MODEL, max_tokens=1000,
                            messages=[{"role": "user", "content": "Jelaskan cara merawat kain katun."}]) as stream:
    for teks in stream.text_stream:
        print(teks, end="", flush=True)
    final = stream.get_final_message()          # usage token tetap tersedia di akhir
```

Di aplikasi web, teruskan stream ke browser dengan **Server-Sent Events** (SSE) atau fitur streaming framework (mis. Route Handler Next.js yang mengembalikan `ReadableStream`). Tangani **pembatalan** (pengguna menutup halaman) agar tidak membayar token yang tidak dibaca.

## Biaya & rate limit

Biaya = token input × harga input + token output × harga output (output biasanya beberapa kali lebih mahal). Cara mengendalikannya:

```viz
{"type":"compare","columns":["Strategi","Dampak"],"rows":[{"label":"Pilih model sesuai tugas","values":["Model kecil/cepat untuk klasifikasi & ekstraksi sederhana; model besar untuk penalaran sulit"]},{"label":"Batasi max_tokens & minta jawaban ringkas","values":["Memotong biaya output"]},{"label":"Prompt caching","values":["Bagian prompt yang sama (system, dokumen panjang) di-cache → lebih murah & cepat"]},{"label":"Batch API","values":["Pekerjaan tidak mendesak diproses asinkron dengan diskon"]},{"label":"Cache respons","values":["Pertanyaan identik tidak perlu memanggil model lagi"]},{"label":"Pangkas konteks","values":["Kirim hanya potongan dokumen relevan (RAG) alih-alih seluruh dokumen"]}]}
```

**Rate limit** membatasi request dan token per menit. Tangani error **429** (dan 529/overloaded) dengan **retry + exponential backoff + jitter**; SDK resmi biasanya sudah melakukan retry dasar (`max_retries`). Untuk volume tinggi, gunakan **antrean** dan batasi konkurensi. Selalu catat `usage` dari setiap respons agar kamu bisa memantau biaya per fitur dan per pengguna.

:::latihan
Milestone: bangun asisten pemesanan sederhana untuk sebuah usaha: (1) prompt klasifikasi pesan masuk dengan 30 contoh uji dan ukur akurasinya; (2) ekstraksi pesanan dari chat ke Pydantic model melalui tool dengan validasi dan retry; (3) tool `cek_stok` dan `hitung_ongkir` dengan loop tool calling; (4) antarmuka web dengan streaming; (5) logging token dan estimasi biaya per 1.000 percakapan untuk dua model berbeda.
:::

## Rangkuman

- Prompt = brief yang jelas: peran, tugas, data bertag, contoh, format; versi & uji seperti kode.
- Structured output: JSON Schema via structured output/tool + validasi Pydantic.
- Tool calling: model meminta, aplikasi mengeksekusi dengan validasi, otorisasi, dan konfirmasi.
- Streaming menurunkan time-to-first-token; tangani pembatalan.
- Biaya per token: pilih model tepat, batasi output, caching, batch; tangani 429 dengan backoff.
