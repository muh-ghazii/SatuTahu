---
title: Orkestrasi dengan Kubernetes
minutes: 60
summary: Saat aplikasi berjalan sebagai puluhan container di banyak server, kamu butuh sistem yang menjadwalkan, menyembuhkan, dan menskalakannya secara otomatis. Modul ini membahas arsitektur cluster Kubernetes, Pod, Deployment, dan Service, ConfigMap dan Secret, scaling dan self-healing, serta Ingress untuk akses dari luar.
objectives:
  - Menjelaskan komponen control plane dan node serta model deklaratif Kubernetes
  - Men-deploy aplikasi dengan Deployment dan mengeksposnya dengan Service
  - Memisahkan konfigurasi dan rahasia dari image dengan ConfigMap dan Secret
  - Mengatur probe, resource, dan autoscaling
  - Membuka aplikasi ke luar cluster dengan Ingress
sources:
  - repo: techiescamp/kubernetes-learning-path
    note: Peta belajar Kubernetes lengkap
  - repo: kelseyhightower/kubernetes-the-hard-way
    note: Membangun cluster Kubernetes secara manual untuk memahami komponennya
  - repo: kubernetes/examples
    note: Contoh manifest resmi
  - repo: GoogleCloudPlatform/microservices-demo
    note: Aplikasi demo microservices (Online Boutique) untuk latihan
quiz:
  - q: "Model kerja Kubernetes disebut deklaratif karena…"
    options: ["Kamu mengetik perintah langkah demi langkah", "Kamu menyatakan keadaan yang diinginkan dan controller terus menyamakan keadaan aktual dengannya", "Semua ditulis di Bash", "Tidak ada konfigurasi"]
    answer: 1
    explain: "Reconciliation loop: desired state vs actual state."
  - q: "Pod aplikasi di-restart terus karena gagal health check saat start yang lambat. Probe yang perlu ditambahkan/disesuaikan adalah…"
    options: ["readinessProbe saja", "startupProbe (atau delay liveness yang cukup)", "Tidak ada probe", "ConfigMap"]
    answer: 1
    explain: "Liveness yang terlalu agresif membunuh aplikasi yang sebenarnya hanya lambat start."
  - q: "Secret Kubernetes secara default…"
    options: ["Terenkripsi kuat dan aman disimpan di Git", "Hanya di-encode base64 — perlu enkripsi at-rest, RBAC, dan jangan commit ke Git apa adanya", "Tidak bisa dibaca Pod", "Sama dengan ConfigMap terenkripsi"]
    answer: 1
    explain: "Gunakan enkripsi etcd, RBAC ketat, dan alat seperti Sealed Secrets/External Secrets."
  - q: "HorizontalPodAutoscaler menambah replika berdasarkan…"
    options: ["Jumlah commit", "Metrik seperti utilisasi CPU terhadap requests (atau metrik kustom)", "Ukuran image", "Jumlah namespace"]
    answer: 1
    explain: "Karena itu resource requests harus diatur dengan benar."
---

Docker Compose cukup untuk satu server. Ketika kamu punya banyak layanan, banyak server, dan kebutuhan agar aplikasi tetap hidup walau satu server mati, kamu butuh **orkestrator**. **Kubernetes** (K8s) adalah standar de facto: ia menjadwalkan container ke node, me-restart yang gagal, menskalakan sesuai beban, dan mengelola rilis bertahap.

:::tip[Apakah kamu butuh Kubernetes?]
Kubernetes membawa kompleksitas operasional yang besar. Untuk aplikasi kecil, PaaS (Railway, Render, Cloud Run, App Service) atau satu VM dengan Compose sering lebih masuk akal. Pelajari Kubernetes karena banyak perusahaan memakainya, tetapi pilih untuk proyekmu sendiri berdasarkan kebutuhan.
:::

Untuk latihan, jalankan cluster lokal dengan **kind**, **minikube**, atau **k3d**.

## Arsitektur cluster

```viz
{"type":"tree","root":{"label":"Cluster Kubernetes","children":[{"label":"Control plane","children":[{"label":"kube-apiserver","detail":"Pintu masuk semua operasi (kubectl, controller)"},{"label":"etcd","detail":"Database key-value: keadaan seluruh cluster"},{"label":"scheduler","detail":"Memilih node untuk Pod baru"},{"label":"controller-manager","detail":"Loop rekonsiliasi: Deployment, ReplicaSet, Node, dll."}]},{"label":"Worker node (banyak)","children":[{"label":"kubelet","detail":"Menjalankan Pod sesuai perintah, melaporkan status"},{"label":"container runtime","detail":"containerd / CRI-O"},{"label":"kube-proxy / CNI","detail":"Jaringan Pod & Service"}]}]}}
```

Inti Kubernetes adalah **model deklaratif**: kamu menulis manifest YAML yang menyatakan **keadaan yang diinginkan** ("3 replika image toko-api:1.4.0"), lalu **controller** terus membandingkan keadaan aktual dengan yang diinginkan dan memperbaikinya (*reconciliation loop*).

```bash
kubectl get nodes
kubectl apply -f k8s/                  # terapkan semua manifest di folder
kubectl get pods -o wide
kubectl describe pod <nama>            # event: kenapa Pod gagal?
kubectl logs -f deploy/toko-api
kubectl exec -it <pod> -- sh
```

## Pod, Deployment & Service

- **Pod**: unit terkecil, satu atau beberapa container yang berbagi jaringan dan volume. Pod bersifat **sementara**: bisa mati dan diganti dengan IP berbeda.
- **Deployment**: mengelola sekumpulan Pod identik (melalui ReplicaSet), termasuk **rolling update** dan rollback.
- **Service**: alamat dan nama DNS **stabil** untuk sekumpulan Pod yang dipilih dengan **label**.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: toko-api, labels: { app: toko-api } }
spec:
  replicas: 3
  selector: { matchLabels: { app: toko-api } }
  strategy: { rollingUpdate: { maxUnavailable: 0, maxSurge: 1 } }
  template:
    metadata: { labels: { app: toko-api } }
    spec:
      containers:
        - name: api
          image: ghcr.io/contoh/toko-api:3f2c1ab      # tag tidak berubah (SHA)
          ports: [{ containerPort: 8000 }]
---
apiVersion: v1
kind: Service
metadata: { name: toko-api }
spec:
  selector: { app: toko-api }
  ports: [{ port: 80, targetPort: 8000 }]
  type: ClusterIP
```

```bash
kubectl set image deploy/toko-api api=ghcr.io/contoh/toko-api:9a8b7c6   # rolling update
kubectl rollout status deploy/toko-api
kubectl rollout undo deploy/toko-api                                     # rollback
```

Di dalam cluster, aplikasi lain cukup memanggil `http://toko-api` (atau `toko-api.<namespace>.svc.cluster.local`). Cara jaringan Pod dan Service bekerja dibahas di [Cloud networking & SDN](/belajar/jaringan/net-6).

## ConfigMap & Secret

Image yang sama harus dapat berjalan di dev, staging, dan produksi dengan konfigurasi berbeda. Pisahkan konfigurasi dari image:

```yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: toko-config }
data:
  LOG_LEVEL: "info"
  FITUR_PROMO: "true"
---
apiVersion: v1
kind: Secret
metadata: { name: toko-secret }
type: Opaque
stringData:
  DATABASE_URL: "postgresql://toko:ganti-saya@postgres:5432/toko"
```

```yaml
# di spec container
          envFrom:
            - configMapRef: { name: toko-config }
            - secretRef: { name: toko-secret }
```

Penting: **Secret hanya di-encode base64**, bukan dienkripsi. Aktifkan enkripsi etcd, batasi akses dengan **RBAC**, dan jangan commit Secret mentah ke Git — gunakan **Sealed Secrets**, **SOPS**, atau **External Secrets Operator** yang mengambil nilai dari secret manager cloud/Vault. Untuk mengelola banyak manifest per lingkungan, gunakan **Kustomize** atau **Helm**, dan pertimbangkan **GitOps** (Argo CD/Flux) agar cluster selalu mengikuti isi repositori.

## Scaling & self-healing

Kubernetes menyembuhkan diri: Pod yang crash di-restart, node yang mati membuat Pod-nya dijadwalkan ulang di node lain. Agar ini bekerja dengan benar, beri tahu Kubernetes kondisi aplikasimu:

```yaml
          resources:
            requests: { cpu: "250m", memory: "256Mi" }   # jaminan; dipakai scheduler & HPA
            limits:   { memory: "512Mi" }                 # melewati batas memori → OOMKilled
          startupProbe:
            httpGet: { path: /health, port: 8000 }
            failureThreshold: 30
            periodSeconds: 2
          readinessProbe:                                 # siap menerima trafik?
            httpGet: { path: /ready, port: 8000 }
            periodSeconds: 5
          livenessProbe:                                  # macet? restart
            httpGet: { path: /health, port: 8000 }
            periodSeconds: 10
```

```viz
{"type":"compare","columns":["Probe","Pertanyaan","Jika gagal"],"rows":[{"label":"startupProbe","values":["Sudah selesai start?","Probe lain ditunda; terus gagal → restart"]},{"label":"readinessProbe","values":["Siap melayani trafik?","Dikeluarkan dari Service (tidak di-restart)"]},{"label":"livenessProbe","values":["Masih hidup / tidak macet?","Container di-restart"]}]}
```

**HorizontalPodAutoscaler** menambah/mengurangi replika berdasarkan metrik:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: toko-api }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: toko-api }
  minReplicas: 3
  maxReplicas: 15
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
```

Tambahkan **PodDisruptionBudget** agar pemeliharaan node tidak mematikan terlalu banyak replika sekaligus, dan **Cluster Autoscaler/Karpenter** untuk menambah node saat Pod tidak muat.

## Ingress & akses dari luar

Service `ClusterIP` hanya dapat dijangkau dari dalam cluster. Pilihan untuk akses dari luar:

```viz
{"type":"compare","columns":["Cara","Penjelasan","Kapan"],"rows":[{"label":"NodePort","values":["Port tinggi di setiap node","Uji coba"]},{"label":"LoadBalancer","values":["Load balancer cloud per Service","Layanan non-HTTP atau sedikit layanan"]},{"label":"Ingress","values":["Satu titik masuk HTTP(S); routing per host & path; TLS","Banyak layanan web"]},{"label":"Gateway API","values":["Penerus Ingress yang lebih ekspresif & berperan jelas","Cluster baru, kebutuhan routing lanjut"]}]}
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: toko
  annotations: { cert-manager.io/cluster-issuer: letsencrypt }
spec:
  ingressClassName: nginx
  tls: [{ hosts: [toko.contoh.id], secretName: toko-tls }]
  rules:
    - host: toko.contoh.id
      http:
        paths:
          - { path: /api, pathType: Prefix, backend: { service: { name: toko-api, port: { number: 80 } } } }
          - { path: /, pathType: Prefix, backend: { service: { name: toko-web, port: { number: 80 } } } }
```

Ingress membutuhkan **Ingress controller** (ingress-nginx, Traefik, atau controller milik cloud), dan **cert-manager** dapat menerbitkan sertifikat TLS Let's Encrypt secara otomatis.

```viz
{"type":"flow","title":"Perjalanan permintaan","steps":[{"label":"DNS","detail":"toko.contoh.id → IP load balancer"},{"label":"Ingress controller","detail":"TLS & routing /api atau /"},{"label":"Service","detail":"Memilih Pod yang ready"},{"label":"Pod","detail":"Container aplikasi"}]}
```

:::latihan
Milestone: di cluster lokal (kind/minikube), deploy aplikasi dari modul Docker: Deployment 3 replika dengan probe dan resource, Service, ConfigMap, Secret (dibuat dengan Sealed Secrets atau SOPS), Ingress dengan host lokal, dan HPA. Uji: (1) hapus satu Pod dan amati penggantinya; (2) rolling update ke image baru lalu rollback; (3) beri beban dengan `hey`/`k6` dan amati HPA menambah replika. Bonus: deploy `microservices-demo` dan petakan arsitekturnya.
:::

## Rangkuman

- Control plane (apiserver, etcd, scheduler, controller) + node (kubelet, runtime, proxy/CNI); model deklaratif dengan rekonsiliasi.
- Pod sementara; Deployment untuk replika & rolling update; Service untuk alamat stabil via label.
- ConfigMap untuk konfigurasi, Secret untuk rahasia (base64 — perlu enkripsi, RBAC, Sealed Secrets/External Secrets); Helm/Kustomize/GitOps.
- Self-healing butuh probe & resource yang benar; HPA, PDB, dan autoscaler node untuk skala.
- Ingress/Gateway API + controller + cert-manager untuk HTTP(S) dari luar.
