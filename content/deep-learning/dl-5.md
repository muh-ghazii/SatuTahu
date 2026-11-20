---
title: Skala & deployment model deep learning
minutes: 50
summary: Model yang dilatih di notebook harus dibuat cukup cepat, kecil, dan murah untuk dipakai sungguhan. Modul ini membahas mixed precision untuk training lebih cepat, kuantisasi dan ekspor ONNX, pola serving model, dan experiment tracking untuk eksperimen skala besar.
objectives:
  - Mengaktifkan mixed precision (FP16/BF16) dengan aman
  - Mengurangi ukuran dan latensi model dengan kuantisasi dan ONNX
  - Memilih pola serving (batching, GPU/CPU, server khusus)
  - Mencatat dan membandingkan eksperimen secara sistematis
sources:
  - repo: microsoft/AI-For-Beginners
    note: Kurikulum AI 12 minggu (termasuk deployment)
  - repo: ChristosChristofidis/awesome-deep-learning
    note: Peta sumber deep learning
  - repo: aladdinpersson/Machine-Learning-Collection
    note: Implementasi & tutorial PyTorch praktis
quiz:
  - q: "Keunggulan BF16 dibanding FP16 untuk training adalah…"
    options: ["Presisi mantissa lebih tinggi", "Rentang eksponen sama dengan FP32 sehingga jarang overflow/underflow dan tidak butuh loss scaling", "Ukuran lebih kecil", "Bisa di semua CPU lama"]
    answer: 1
    explain: "BF16 mengorbankan presisi mantissa demi rentang; FP16 butuh GradScaler."
  - q: "Kuantisasi INT8 pasca-training pada umumnya…"
    options: ["Menambah akurasi", "Mengecilkan model ±4× dan mempercepat inferensi dengan sedikit penurunan akurasi", "Hanya untuk GPU", "Mengubah arsitektur"]
    answer: 1
    explain: "Bobot 32-bit diwakili 8-bit; perlu kalibrasi untuk aktivasi."
  - q: "Dynamic batching pada server inferensi bertujuan…"
    options: ["Mengurangi akurasi", "Menggabungkan beberapa request yang datang berdekatan menjadi satu batch untuk meningkatkan throughput GPU", "Membagi model ke banyak server", "Menyimpan cache"]
    answer: 1
    explain: "GPU efisien pada batch; trade-off-nya sedikit tambahan latensi."
  - q: "Kenapa ONNX berguna?"
    options: ["Melatih model lebih cepat", "Format model netral sehingga bisa dijalankan dengan runtime teroptimasi di berbagai platform", "Mengganti PyTorch", "Mengompresi dataset"]
    answer: 1
    explain: "ONNX Runtime, TensorRT, dan OpenVINO dapat membaca model ONNX."
---

Model dengan akurasi tertinggi tidak berguna jika butuh 3 detik per prediksi atau GPU seharga motor. Bagian ini membahas cara membuat training lebih cepat dan inferensi lebih efisien, serta menjaga eksperimen tetap terkendali saat jumlahnya ratusan.

## Mixed precision

Secara default, PyTorch memakai **FP32** (32-bit). GPU modern punya **Tensor Core** yang jauh lebih cepat untuk FP16/BF16. **Mixed precision** menjalankan sebagian besar operasi di 16-bit sambil menjaga operasi sensitif (akumulasi, softmax, loss) di FP32.

```viz
{"type":"compare","columns":["Format","Bit eksponen / mantissa","Catatan"],"rows":[{"label":"FP32","values":["8 / 23","Default, aman, lambat & boros memori"]},{"label":"FP16","values":["5 / 10","Rentang sempit → butuh loss scaling (GradScaler)"]},{"label":"BF16","values":["8 / 7","Rentang sama FP32; standar untuk GPU Ampere+ dan TPU"]},{"label":"FP8","values":["4–5 / 2–3","GPU terbaru (Hopper+); untuk training/inferensi skala besar"]}]}
```

```viz
{"type":"binary"}
```

```python
use_bf16 = torch.cuda.is_available() and torch.cuda.is_bf16_supported()
dtype = torch.bfloat16 if use_bf16 else torch.float16
scaler = torch.amp.GradScaler("cuda", enabled=not use_bf16)   # hanya perlu untuk FP16

for xb, yb in dl:
    opt.zero_grad(set_to_none=True)
    with torch.autocast(device_type="cuda", dtype=dtype):
        loss = loss_fn(model(xb.cuda()), yb.cuda())
    scaler.scale(loss).backward()
    scaler.step(opt); scaler.update()
```

Biasanya mixed precision mempercepat training 1,5–3× dan menghemat memori sehingga batch bisa lebih besar. Teknik hemat memori lain: **gradient accumulation** (batch efektif besar dari beberapa batch kecil), **gradient checkpointing** (hitung ulang aktivasi saat backward), dan `torch.compile` untuk menggabungkan kernel. Untuk banyak GPU: **DDP** (data parallel) dan **FSDP** (memecah parameter antar GPU).

## Kuantisasi & ONNX

**Kuantisasi** merepresentasikan bobot (dan aktivasi) dengan bit lebih sedikit, misalnya INT8: model ±4× lebih kecil dan lebih cepat di CPU/edge.

```viz
{"type":"compare","columns":["Metode","Cara","Kapan"],"rows":[{"label":"Dynamic (PTQ)","values":["Bobot INT8, aktivasi dikuantisasi saat runtime","Paling mudah; bagus untuk Linear/LSTM di CPU"]},{"label":"Static (PTQ)","values":["Kalibrasi aktivasi dengan ratusan sampel","CNN di CPU/edge"]},{"label":"QAT","values":["Simulasi kuantisasi saat training","Saat PTQ menurunkan akurasi terlalu banyak"]},{"label":"Weight-only 4/8-bit","values":["GPTQ, AWQ, bitsandbytes untuk LLM","Menjalankan LLM di GPU kecil"]}]}
```

```python
import torch.ao.quantization as tq
model_q = tq.quantize_dynamic(model.eval(), {torch.nn.Linear}, dtype=torch.qint8)

# Ekspor ke ONNX (format netral) lalu jalankan dengan ONNX Runtime
dummy = torch.randn(1, 3, 224, 224)
torch.onnx.export(model.eval(), dummy, "model.onnx", input_names=["input"], output_names=["logits"],
                  dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}}, opset_version=17)

import onnxruntime as ort, numpy as np
sess = ort.InferenceSession("model.onnx", providers=["CPUExecutionProvider"])
logits = sess.run(None, {"input": dummy.numpy().astype(np.float32)})[0]
```

**ONNX** dapat dijalankan oleh **ONNX Runtime** (CPU/GPU), dikonversi ke **TensorRT** (GPU NVIDIA), **OpenVINO** (Intel), atau **TFLite/Core ML** untuk mobile. Selalu **ukur ulang akurasi** setelah konversi dan kuantisasi pada set validasi; jangan berasumsi. Teknik kompresi lain: **pruning** dan **knowledge distillation** (model kecil belajar meniru model besar).

## Serving model

```viz
{"type":"layers","layers":[{"label":"Klien","detail":"Aplikasi web/mobile memanggil API","tag":"HTTP/gRPC"},{"label":"API gateway","detail":"Autentikasi, rate limit, routing versi","tag":""},{"label":"Server inferensi","detail":"FastAPI (sederhana), TorchServe, NVIDIA Triton, BentoML, Ray Serve; untuk LLM: vLLM, TGI","tag":"dynamic batching"},{"label":"Runtime","detail":"PyTorch, ONNX Runtime, TensorRT","tag":"GPU/CPU"},{"label":"Observability","detail":"Latensi p50/p95/p99, throughput, utilisasi GPU, error","tag":"Prometheus"}]}
```

Keputusan penting:

- **Batch vs online**: jika prediksi tidak harus real-time (mis. rekomendasi harian), batch jauh lebih sederhana dan murah.
- **CPU vs GPU**: model kecil yang dikuantisasi sering cukup di CPU; GPU unggul untuk model besar dan throughput tinggi.
- **Dynamic batching**: gabungkan request yang datang dalam beberapa milidetik menjadi satu batch untuk memaksimalkan throughput GPU.
- **Warm-up & cold start**: muat model sekali saat start; jalankan beberapa inferensi pemanasan.
- **Versi & rollback**: setiap respons membawa versi model; rilis bertahap (canary). Praktik MLOps lengkap ada di [MLOps: dari notebook ke produksi](/belajar/machine-learning/ml-4).

## Eksperimen tracking

Dengan puluhan konfigurasi dan run berjam-jam, ingatan dan nama file seperti `model_final_v3_fix.pt` tidak cukup.

```python
import wandb   # atau mlflow
wandb.init(project="daun-padi", config={"arch": "resnet18", "lr": 3e-4, "bs": 64, "aug": "randaug", "seed": 0})
for epoch in range(epochs):
    ...
    wandb.log({"train/loss": tr, "val/loss": vl, "val/acc": acc, "lr": sched.get_last_lr()[0]})
wandb.log_artifact("best.pt", type="model")
```

Yang wajib dicatat: **konfigurasi lengkap** (termasuk seed dan versi data), **commit Git**, **metrik per langkah**, **artefak** (checkpoint terbaik), dan **lingkungan** (versi library, GPU). Gunakan **sweep** (grid/random/Bayesian) untuk pencarian hiperparameter yang terorganisir, dan kelola konfigurasi dengan file (Hydra/YAML) agar eksperimen dapat diulang hanya dengan menunjuk konfigurasinya.

:::latihan
Milestone akhir jalur: ambil model CNN dari modul sebelumnya; (1) latih ulang dengan mixed precision dan bandingkan waktu per epoch serta memori; (2) catat semua run di W&B atau MLflow dan jalankan sweep kecil; (3) ekspor ke ONNX, kuantisasi INT8, lalu ukur ukuran file, latensi CPU (p50/p95), dan akurasi untuk FP32 vs INT8; (4) sajikan dengan FastAPI dan uji beban sederhana (mis. `locust`). Tulis tabel trade-off hasilnya.
:::

## Rangkuman

- Mixed precision (BF16 lebih aman, FP16 + GradScaler) mempercepat training dan menghemat memori.
- Kuantisasi (dynamic/static/QAT) dan ONNX membuat inferensi kecil, cepat, dan portabel — ukur ulang akurasinya.
- Serving: batch vs online, CPU vs GPU, dynamic batching, versi & rollback, observability.
- Tracking: konfigurasi, commit, metrik, artefak, lingkungan; sweep untuk tuning.
