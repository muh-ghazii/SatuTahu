---
title: Platform & proyek IoT utuh
minutes: 55
summary: Sistem IoT yang berguna menggabungkan perangkat, jaringan, penyimpanan, dashboard, dan otomasi menjadi satu kesatuan yang andal. Modul ini membahas penyimpanan dan dashboard data deret waktu, home automation dengan ESPHome dan Home Assistant, edge versus cloud computing, manajemen daya untuk perangkat baterai, dan cara merancang proyek akhir dari kebutuhan hingga uji lapangan.
objectives:
  - Menyimpan telemetri di basis data deret waktu dan membuat dashboard
  - Membangun perangkat dengan ESPHome dan mengotomasinya di Home Assistant
  - Memutuskan pemrosesan di edge atau di cloud
  - Memperkirakan konsumsi daya dan memperpanjang umur baterai dengan deep sleep
  - Merancang, membangun, dan menguji proyek IoT end-to-end
sources:
  - repo: esphome/esphome
    note: ESPHome — firmware ESP32/ESP8266 dari konfigurasi YAML
  - repo: microsoft/IoT-For-Beginners
    note: Proyek IoT end-to-end (pertanian, transportasi, manufaktur, ritel)
quiz:
  - q: "Basis data yang paling cocok untuk menyimpan pembacaan sensor setiap 10 detik dari banyak perangkat adalah…"
    options: ["Spreadsheet", "Basis data deret waktu (mis. InfluxDB, TimescaleDB) dengan retensi & downsampling", "File teks di ESP32", "Email"]
    answer: 1
    explain: "Dioptimalkan untuk penulisan berurutan waktu, agregasi per interval, dan penghapusan data lama."
  - q: "Keputusan menutup katup saat sensor mendeteksi kebocoran sebaiknya dilakukan…"
    options: ["Di cloud saja", "Di edge (perangkat/gateway lokal) agar tetap bekerja saat internet putus dan latensinya rendah", "Manual oleh pengguna", "Menunggu laporan harian"]
    answer: 1
    explain: "Fungsi kritis keselamatan tidak boleh bergantung pada koneksi internet."
  - q: "ESP32 menyala 2 detik (±120 mA) setiap 10 menit dan deep sleep (±10 µA) sisanya. Arus rata-rata kira-kira…"
    options: ["120 mA", "±0,4 mA", "10 µA", "60 mA"]
    answer: 1
    explain: "(120 × 2 + 0,01 × 598) / 600 ≈ 0,41 mA; baterai 2.000 mAh secara teori bertahan ±200 hari (praktiknya lebih singkat)."
  - q: "Langkah pertama yang tepat saat merancang proyek IoT akhir adalah…"
    options: ["Membeli semua sensor yang tersedia", "Merumuskan masalah, pengguna, dan kriteria keberhasilan yang terukur", "Langsung menulis kode", "Mendesain casing"]
    answer: 1
    explain: "Kebutuhan menentukan pilihan sensor, konektivitas, daya, dan platform."
---

Modul-modul sebelumnya membahas komponen satu per satu: elektronika, mikrokontroler, dan protokol. Sekarang kita menyatukannya menjadi **sistem utuh** yang dapat dipakai orang sungguhan: data tersimpan dan tervisualisasi, otomasi berjalan, perangkat hemat daya, dan semuanya tetap bekerja saat ada gangguan.

```viz
{"type":"flow","title":"Arsitektur IoT end-to-end","steps":[{"label":"Perangkat","detail":"Sensor & aktuator di ESP32."},{"label":"Konektivitas","detail":"WiFi/LoRa/seluler → MQTT/HTTP."},{"label":"Gateway/edge","detail":"Broker lokal, Home Assistant, Node-RED; aturan lokal."},{"label":"Penyimpanan","detail":"Basis data deret waktu."},{"label":"Aplikasi","detail":"Dashboard, notifikasi, otomasi, analitik."}]}
```

## Penyimpanan & dashboard data

Data sensor adalah **deret waktu**: nilai yang terus bertambah dengan stempel waktu. Basis data khusus deret waktu menanganinya dengan efisien:

```viz
{"type":"compare","columns":["Pilihan","Ciri","Cocok untuk"],"rows":[{"label":"InfluxDB","values":["Basis data deret waktu populer; retensi & downsampling","Telemetri banyak sensor"]},{"label":"TimescaleDB","values":["Ekstensi PostgreSQL — SQL biasa + fitur deret waktu","Tim yang sudah memakai Postgres; join dengan data bisnis"]},{"label":"Prometheus","values":["Pull metrics; lebih untuk metrik sistem","Memantau server/gateway"]},{"label":"Platform IoT (ThingsBoard, Node-RED + DB)","values":["Paket lengkap: perangkat, dashboard, aturan","Prototipe cepat"]}]}
```

Alur umum: **MQTT → konektor (Telegraf/Node-RED/skrip Python) → basis data → Grafana**.

```python
# Skrip penghubung sederhana: MQTT → TimescaleDB
import json, psycopg, paho.mqtt.client as mqtt

db = psycopg.connect("postgresql://iot:rahasia@localhost/iot", autocommit=True)
# CREATE TABLE telemetri (ts timestamptz, device text, suhu real, rh real, soil real);
# SELECT create_hypertable('telemetri', 'ts');

def on_message(client, userdata, msg):
    d = json.loads(msg.payload)
    if not (-20 <= d.get("suhu", 0) <= 70):          # validasi nilai mustahil
        return
    db.execute("INSERT INTO telemetri VALUES (to_timestamp(%s), %s, %s, %s, %s)",
               (d["ts"], d["id"], d["suhu"], d["rh"], d["soil"]))

c = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
c.on_message = on_message
c.username_pw_set("logger", "rahasia"); c.connect("localhost", 1883)
c.subscribe("kebun/+/telemetri", qos=0); c.loop_forever()
```

```sql
-- rata-rata per 15 menit untuk dashboard
SELECT time_bucket('15 minutes', ts) AS waktu, device, avg(soil) AS kelembapan
FROM telemetri WHERE ts > now() - interval '24 hours'
GROUP BY 1, 2 ORDER BY 1;
```

Prinsip dashboard dari [Visualisasi & dashboard](/belajar/data-analyst/da-4) tetap berlaku: tampilkan nilai terkini dengan konteks (ambang aman), tren, status perangkat (online/offline, baterai, RSSI), dan **alert** saat nilai di luar batas atau perangkat diam terlalu lama. Atur **retensi**: data mentah 30 hari, agregat per jam disimpan bertahun-tahun.

## Home automation (ESPHome & Home Assistant)

**ESPHome** membuat firmware ESP32 dari file YAML tanpa menulis C++, dan **Home Assistant** adalah platform otomasi rumah open source yang berjalan lokal (Raspberry Pi, mini PC, atau VM).

```yaml
# kebun-blok-a.yaml (ESPHome)
esphome:
  name: kebun-blok-a
esp32:
  board: esp32dev
wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
api:                      # koneksi terenkripsi ke Home Assistant
  encryption:
    key: !secret api_key
ota:
  - platform: esphome
    password: !secret ota_password
logger:

sensor:
  - platform: dht
    pin: GPIO4
    model: DHT22
    temperature: { name: "Suhu Blok A" }
    humidity: { name: "Kelembapan Udara Blok A" }
    update_interval: 30s
  - platform: adc
    pin: GPIO34
    name: "Kelembapan Tanah Blok A"
    attenuation: 12db
    unit_of_measurement: "%"
    filters:
      - median: { window_size: 5 }
      - calibrate_linear: [ 2.60 -> 0.0, 1.15 -> 100.0 ]     # volt kering/basah hasil kalibrasi

switch:
  - platform: gpio
    pin: GPIO26
    id: pompa
    name: "Pompa Blok A"
    on_turn_on:
      - delay: 10min                 # batas aman di perangkat: mati sendiri
      - switch.turn_off: pompa
```

```bash
pip install esphome
esphome run kebun-blok-a.yaml        # kompilasi, flash via USB pertama kali, berikutnya via OTA
```

Di Home Assistant, perangkat muncul otomatis, dan otomasi dibuat lewat UI atau YAML:

```yaml
alias: Siram saat tanah kering pagi hari
trigger:
  - platform: numeric_state
    entity_id: sensor.kelembapan_tanah_blok_a
    below: 30
condition:
  - condition: time
    after: "05:30:00"
    before: "08:00:00"
action:
  - service: switch.turn_on
    target: { entity_id: switch.pompa_blok_a }
  - delay: "00:05:00"
  - service: switch.turn_off
    target: { entity_id: switch.pompa_blok_a }
  - service: notify.mobile_app
    data: { message: "Blok A disiram 5 menit (tanah {{ states('sensor.kelembapan_tanah_blok_a') }}%)" }
```

Kelebihan pendekatan ini: **berjalan lokal** (tetap bekerja saat internet mati), privasi terjaga, dan mendukung ribuan integrasi perangkat komersial.

## Edge vs cloud computing

```viz
{"type":"compare","columns":["Edge (perangkat/gateway lokal)","Cloud"],"rows":[{"label":"Latensi","values":["Milidetik","Ratusan milidetik hingga detik"]},{"label":"Saat internet putus","values":["Tetap bekerja","Berhenti"]},{"label":"Daya komputasi","values":["Terbatas","Hampir tak terbatas"]},{"label":"Data & privasi","values":["Data mentah tetap lokal","Data dikirim keluar"]},{"label":"Cocok untuk","values":["Kontrol & keselamatan, filter/agregasi, inferensi ML ringan","Penyimpanan jangka panjang, analitik lintas lokasi, pelatihan model, akses jarak jauh"]}]}
```

Arsitektur yang sehat biasanya **hibrida**: keputusan kritis dan cepat di edge, data teragregasi dan analitik di cloud. Contoh: gateway menghitung rata-rata per menit dan hanya mengirim ringkasan (hemat bandwidth); deteksi anomali sederhana atau model ML kecil (**TinyML**, mis. mendeteksi suara mesin tidak normal) berjalan di perangkat; dashboard lintas kebun dan model prediksi panen ada di cloud. Teknik kuantisasi dan ekspor model untuk perangkat kecil dibahas di [Deployment & edge](/belajar/computer-vision/cv-5).

## Manajemen daya

Perangkat bertenaga baterai atau surya harus hemat energi. Hitung **arus rata-rata** dari profil kerjanya:

```viz
{"type":"layers","layers":[{"label":"WiFi mengirim","detail":"±120–250 mA (puncak lebih tinggi)","tag":"singkat"},{"label":"CPU aktif tanpa WiFi","detail":"±20–50 mA","tag":""},{"label":"Light sleep","detail":"±1 mA orde","tag":""},{"label":"Deep sleep","detail":"±10 µA pada chip (papan pengembangan sering jauh lebih boros karena regulator & LED)","tag":"sebagian besar waktu"}]}
```

```cpp
#define MENIT_TIDUR 10
RTC_DATA_ATTR int hitungBangun = 0;     // tetap tersimpan selama deep sleep

void setup() {
  hitungBangun++;
  bacaSensor();
  if (hubungkanWiFiCepat(5000)) kirimData();     // batasi waktu mencoba
  esp_sleep_enable_timer_wakeup((uint64_t)MENIT_TIDUR * 60 * 1000000ULL);
  esp_deep_sleep_start();                         // loop() tidak pernah dijalankan
}
void loop() {}
```

Strategi hemat daya:

- **Deep sleep** di antara pengukuran; bangun dengan timer atau pin eksternal (tombol, sensor gerak).
- **Persingkat waktu aktif**: IP statis, kirim data secara batch (mis. kumpulkan 6 pembacaan, kirim sekali per jam), MQTT QoS 0.
- **Matikan sensor** saat tidak dipakai (beri daya lewat pin GPIO atau transistor).
- **Pilih papan yang tepat**: regulator dengan arus diam rendah, tanpa LED daya yang selalu menyala.
- Untuk tenaga surya, hitung energi harian yang dibutuhkan, tambahkan margin untuk hari mendung, dan gunakan modul pengisian baterai yang sesuai.

Rumus perkiraan: umur baterai (jam) ≈ kapasitas (mAh) × efisiensi (mis. 0,7) ÷ arus rata-rata (mA). Selalu ukur konsumsi nyata dengan alat seperti INA219 atau power profiler, karena perkiraan di atas kertas biasanya terlalu optimistis.

## Merancang proyek akhir

```viz
{"type":"flow","title":"Tahapan proyek IoT","steps":[{"label":"Masalah & pengguna","detail":"Siapa, masalah apa, bagaimana sekarang dilakukan? Kriteria sukses terukur."},{"label":"Kebutuhan","detail":"Besaran yang diukur & akurasinya, frekuensi data, lokasi, daya, konektivitas, biaya, lingkungan (air, panas)."},{"label":"Arsitektur","detail":"Perangkat, protokol, edge/cloud, penyimpanan, dashboard, otomasi, keamanan."},{"label":"Prototipe","detail":"Breadboard → firmware → pipeline data → dashboard; satu jalur end-to-end dulu."},{"label":"Uji lapangan","detail":"Minimal 1–2 minggu di kondisi nyata; catat kegagalan."},{"label":"Iterasi & dokumentasi","detail":"Casing, PCB, perbaikan; README, skema, BOM, panduan pengguna."}]}
```

Ide proyek yang relevan dengan lingkungan sekitar: **monitoring kebun/sawah** (kelembapan tanah, suhu, penyiraman otomatis), **monitoring kolam/tambak** (suhu air, pH, oksigen terlarut, aerator otomatis), **gudang/toko** (suhu-kelembapan untuk bahan kain atau makanan, pintu terbuka di luar jam kerja, stok berbasis berat), **energi** (konsumsi listrik per peralatan), dan **kualitas udara ruang kelas** (CO₂, PM2.5).

Checklist kualitas sebelum dianggap selesai:

- Bekerja **saat internet putus** (fungsi lokal dan data tersimpan sementara).
- **Status perangkat** terlihat (online, baterai, kekuatan sinyal, waktu data terakhir).
- **Alert** untuk kondisi penting dan untuk perangkat yang diam.
- **Keamanan** dasar dari [modul konektivitas](/belajar/iot/iot-3) diterapkan.
- **Casing** sesuai lingkungan (rating IP untuk luar ruangan), kabel rapi, dan sensor terlindungi.
- **Dokumentasi**: diagram arsitektur, skema rangkaian, daftar komponen dan biaya (BOM), konfigurasi, dan panduan pemakaian.

:::latihan
Milestone akhir jalur: bangun proyek IoT utuh untuk satu masalah nyata di sekitarmu. Minimal: 2 sensor dan 1 aktuator, firmware (Arduino/PlatformIO atau ESPHome), MQTT dengan TLS dan ACL, penyimpanan deret waktu, dashboard Grafana atau Home Assistant, satu otomasi dengan batas aman di perangkat, alert perangkat offline, perkiraan dan pengukuran konsumsi daya, serta uji lapangan minimal satu minggu. Tulis laporan berisi kebutuhan, arsitektur, hasil uji, kendala, dan rencana perbaikan.
:::

## Rangkuman

- Telemetri ke basis data deret waktu (InfluxDB/TimescaleDB) via MQTT, validasi, retensi & downsampling; dashboard dengan status perangkat dan alert.
- ESPHome membuat firmware dari YAML; Home Assistant menjalankan otomasi lokal dengan ribuan integrasi.
- Edge untuk keputusan cepat & kritis serta saat offline; cloud untuk penyimpanan jangka panjang dan analitik — umumnya hibrida.
- Daya: hitung arus rata-rata, deep sleep, persingkat waktu aktif, pilih papan hemat, ukur konsumsi nyata.
- Proyek: masalah & kriteria sukses → kebutuhan → arsitektur → prototipe end-to-end → uji lapangan → dokumentasi.
