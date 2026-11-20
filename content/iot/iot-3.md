---
title: Konektivitas & protokol IoT
minutes: 55
summary: Perangkat IoT baru berguna ketika datanya sampai ke tempat lain dan ia dapat menerima perintah. Modul ini membahas koneksi WiFi pada ESP32, perbandingan HTTP dan MQTT, pola publish/subscribe dan desain topic, format data JSON yang efisien, serta keamanan perangkat IoT dari kredensial hingga update firmware.
objectives:
  - Menghubungkan ESP32 ke WiFi dengan penanganan putus-sambung
  - Memilih HTTP atau MQTT sesuai kebutuhan
  - Merancang hierarki topic MQTT, QoS, retained message, dan last will
  - Menyusun payload JSON yang ringkas dan tervalidasi
  - Menerapkan praktik keamanan dasar pada perangkat dan broker
sources:
  - repo: eclipse-mosquitto/mosquitto
    note: Broker MQTT open source Eclipse Mosquitto
  - repo: microsoft/IoT-For-Beginners
    note: Pelajaran konektivitas & MQTT
  - repo: HQarroum/awesome-iot
    note: Kumpulan protokol, platform, dan alat IoT
quiz:
  - q: "Sensor mengirim data setiap 5 detik dan perangkat juga harus menerima perintah ‘nyalakan pompa’ seketika. Protokol yang lebih cocok…"
    options: ["HTTP polling setiap menit", "MQTT dengan koneksi persisten dan subscribe ke topic perintah", "FTP", "Email"]
    answer: 1
    explain: "MQTT ringan, dua arah, dan push dari broker tanpa polling."
  - q: "Dalam MQTT, topic ‘kebun/+/suhu’ cocok dengan…"
    options: ["kebun/suhu", "kebun/blok-a/suhu dan kebun/blok-b/suhu", "kebun/blok-a/sensor/suhu", "semua topic"]
    answer: 1
    explain: "+ mewakili tepat satu level; # mewakili sisa level di akhir."
  - q: "Fitur ‘Last Will and Testament’ MQTT berguna untuk…"
    options: ["Menyimpan firmware", "Broker memublikasikan pesan (mis. status=offline) bila perangkat terputus tanpa disconnect normal", "Mengenkripsi data", "Mempercepat WiFi"]
    answer: 1
    explain: "Dashboard dapat menampilkan status perangkat secara akurat."
  - q: "Praktik keamanan IoT yang paling dasar adalah…"
    options: ["Memakai password default broker", "Kredensial unik per perangkat, TLS, broker tidak terbuka anonim ke internet, dan firmware dapat diperbarui", "Menyembunyikan SSID", "Tidak memakai jaringan"]
    answer: 1
    explain: "Banyak botnet IoT berasal dari perangkat dengan kredensial default yang terpapar internet."
---

Mikrokontroler dari [modul sebelumnya](/belajar/iot/iot-2) sudah bisa membaca sensor. Sekarang datanya harus dikirim ke server atau dashboard, dan perangkat harus dapat menerima perintah dari jauh. Pilihan protokol dan desain pesan menentukan seberapa andal, hemat daya, dan aman sistem IoT-mu.

## WiFi pada ESP32

```cpp
#include <WiFi.h>
const char* SSID = WIFI_SSID;          // dari file secrets.h yang masuk .gitignore
const char* PASS = WIFI_PASS;

void hubungkanWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASS);
  Serial.print("Menghubungkan");
  unsigned long mulai = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - mulai < 15000) {
    delay(250); Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("\nTerhubung, IP %s, RSSI %d dBm\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
  else
    Serial.println("\nGagal, coba lagi nanti");
}

void loop() {
  static unsigned long cekTerakhir = 0;
  if (millis() - cekTerakhir > 10000) {              // periksa koneksi berkala tanpa memblokir
    cekTerakhir = millis();
    if (WiFi.status() != WL_CONNECTED) hubungkanWiFi();
  }
  // ... tugas lain ...
}
```

Hal praktis di lapangan:

- **Putus-sambung adalah hal normal**: program harus terus berjalan (membaca sensor, menyimpan sementara) dan menyambung ulang sendiri.
- **RSSI** (kekuatan sinyal): di bawah sekitar −80 dBm koneksi mulai tidak stabil; pertimbangkan posisi antena, repeater, atau papan dengan antena eksternal.
- ESP32 hanya mendukung **2,4 GHz**.
- Jangan menulis SSID/password langsung di kode yang di-commit; gunakan file rahasia terpisah atau portal konfigurasi (mis. WiFiManager) agar pengguna dapat mengisinya sendiri.
- Untuk lokasi tanpa WiFi (kebun, tambak), pertimbangkan **LoRa/LoRaWAN** (jarak jauh, data kecil, hemat daya) atau modul **seluler** (4G/LTE-M/NB-IoT).

## HTTP vs MQTT

```viz
{"type":"compare","columns":["HTTP","MQTT"],"rows":[{"label":"Pola","values":["Request–response: perangkat bertanya, server menjawab","Publish/subscribe melalui broker; koneksi persisten"]},{"label":"Arah","values":["Perangkat → server mudah; server → perangkat butuh polling/webhook","Dua arah alami; perintah langsung didorong ke perangkat"]},{"label":"Overhead","values":["Header besar per permintaan","Header minimal (mulai 2 byte); hemat bandwidth & daya"]},{"label":"Cocok untuk","values":["Kirim data jarang, integrasi API web, upload file","Telemetri sering, kontrol real-time, banyak perangkat"]}]}
```

```viz
{"type":"sequence","actors":["Sensor ESP32","Broker MQTT","Dashboard","Aktuator ESP32"],"messages":[{"from":"Dashboard","to":"Broker MQTT","label":"SUBSCRIBE kebun/+/telemetri"},{"from":"Aktuator ESP32","to":"Broker MQTT","label":"SUBSCRIBE kebun/blok-a/pompa/set"},{"from":"Sensor ESP32","to":"Broker MQTT","label":"PUBLISH kebun/blok-a/telemetri {kelembapan: 31}"},{"from":"Broker MQTT","to":"Dashboard","label":"teruskan telemetri"},{"from":"Dashboard","to":"Broker MQTT","label":"PUBLISH kebun/blok-a/pompa/set ON"},{"from":"Broker MQTT","to":"Aktuator ESP32","label":"teruskan perintah","note":"pompa menyala"}]}
```

Pengirim dan penerima tidak perlu saling mengenal; mereka hanya mengenal **broker** dan **topic**. Ini membuat sistem mudah dikembangkan: menambah dashboard atau pencatat data tidak mengubah kode perangkat. Protokol lain yang perlu dikenal: **CoAP** (mirip HTTP di atas UDP untuk perangkat sangat terbatas) dan **WebSocket** (dua arah di browser; MQTT juga dapat berjalan di atas WebSocket).

## Publish/subscribe & topic

Topic adalah string hierarkis yang dipisahkan `/`. Rancang dengan konsisten sejak awal:

```viz
{"type":"tree","root":{"label":"kebun/","children":[{"label":"blok-a/","children":[{"label":"telemetri","detail":"JSON data sensor (publish oleh perangkat)"},{"label":"status","detail":"online/offline (retained + last will)"},{"label":"pompa/set","detail":"Perintah dari dashboard (subscribe oleh perangkat)"},{"label":"pompa/state","detail":"Keadaan aktual pompa (retained)"}]},{"label":"blok-b/","detail":"Struktur sama"}]}}
```

```viz
{"type":"compare","columns":["Fitur","Arti","Gunakan untuk"],"rows":[{"label":"Wildcard + dan #","values":["+ satu level, # semua level di akhir","Dashboard: kebun/+/telemetri, logger: kebun/#"]},{"label":"QoS 0","values":["Paling banyak sekali (bisa hilang)","Telemetri sering yang boleh hilang satu-dua"]},{"label":"QoS 1","values":["Paling sedikit sekali (bisa duplikat)","Perintah & alarm — penerima harus idempoten"]},{"label":"QoS 2","values":["Tepat sekali (lebih berat)","Jarang diperlukan"]},{"label":"Retained","values":["Broker menyimpan pesan terakhir untuk subscriber baru","Status & keadaan aktual"]},{"label":"Last Will","values":["Pesan otomatis bila perangkat putus tak wajar","status = offline"]}]}
```

```cpp
#include <PubSubClient.h>
WiFiClientSecure net;  PubSubClient mqtt(net);

void callback(char* topic, byte* payload, unsigned int len) {
  String msg((char*)payload, len);
  if (String(topic) == "kebun/blok-a/pompa/set") {
    bool on = (msg == "ON");
    digitalWrite(PIN_RELAY, on);
    mqtt.publish("kebun/blok-a/pompa/state", on ? "ON" : "OFF", true);   // retained
  }
}

void hubungkanMQTT() {
  mqtt.setServer(MQTT_HOST, 8883);
  mqtt.setCallback(callback);
  // client ID unik, kredensial per perangkat, last will: status offline (retained)
  if (mqtt.connect("esp32-blok-a", MQTT_USER, MQTT_PASS, "kebun/blok-a/status", 1, true, "offline")) {
    mqtt.publish("kebun/blok-a/status", "online", true);
    mqtt.subscribe("kebun/blok-a/pompa/set", 1);
  }
}
// di loop(): if (!mqtt.connected()) hubungkanMQTT(); mqtt.loop();
```

Uji dari laptop dengan klien Mosquitto:

```bash
mosquitto_sub -h localhost -t 'kebun/#' -v
mosquitto_pub -h localhost -t 'kebun/blok-a/pompa/set' -m ON -q 1
```

## Format data JSON

JSON mudah dibaca manusia dan didukung hampir semua platform. Rancang payload yang **ringkas**, **konsisten**, dan **dapat dikembangkan**:

```json
{"v": 1, "id": "esp32-blok-a", "ts": 1763690400, "suhu": 29.4, "rh": 78, "soil": 31, "bat": 3.92}
```

- Sertakan **versi skema** (`v`) agar format dapat berubah tanpa merusak penerima lama.
- **Satuan konsisten** dan terdokumentasi (°C, %, volt).
- **Timestamp** dari perangkat (sinkronkan waktu dengan NTP) atau biarkan server memberi waktu terima.
- Kirim angka sebagai angka, bukan string; hindari kunci yang terlalu panjang bila bandwidth terbatas.

```cpp
#include <ArduinoJson.h>
JsonDocument doc;                       // ArduinoJson v7
doc["v"] = 1;  doc["id"] = "esp32-blok-a";  doc["ts"] = time(nullptr);
doc["suhu"] = suhu;  doc["rh"] = rh;  doc["soil"] = soil;
char buf[160];
size_t n = serializeJson(doc, buf);
mqtt.publish("kebun/blok-a/telemetri", (uint8_t*)buf, n, false);
```

Di sisi penerima, **validasi** payload (rentang wajar, field wajib) sebelum menyimpan; sensor yang rusak sering mengirim nilai mustahil seperti −127 °C atau `NaN`. Untuk perangkat yang sangat terbatas atau jaringan berbiaya per byte, format biner seperti **CBOR** atau **Protocol Buffers** lebih efisien.

## Keamanan perangkat IoT

Perangkat IoT sering dipasang lalu dilupakan, padahal terhubung ke jaringan selama bertahun-tahun. Botnet besar seperti Mirai tumbuh dari perangkat dengan **kredensial default** yang terpapar internet.

```viz
{"type":"layers","layers":[{"label":"Siklus hidup","detail":"Update firmware OTA yang ditandatangani, rencana akhir dukungan","tag":"OTA"},{"label":"Aplikasi","detail":"Validasi perintah, batasi aksi berbahaya, rate limit","tag":""},{"label":"Broker/server","detail":"Tanpa akses anonim, ACL per perangkat (hanya topic miliknya), tidak dibuka langsung ke internet tanpa TLS","tag":"ACL"},{"label":"Komunikasi","detail":"TLS (port 8883), verifikasi sertifikat server","tag":"TLS"},{"label":"Identitas","detail":"Kredensial/sertifikat unik per perangkat, dapat dicabut","tag":"unik"},{"label":"Fisik","detail":"Nonaktifkan debug di produksi; flash encryption & secure boot ESP32 untuk perangkat sensitif","tag":"perangkat"}]}
```

Praktik minimum:

- **Kredensial unik per perangkat**, bukan satu password untuk semua; dapat dicabut bila perangkat hilang.
- **TLS** untuk MQTT/HTTP, dengan verifikasi sertifikat CA (jangan `setInsecure()` di produksi).
- **ACL broker**: perangkat blok A hanya boleh publish/subscribe topic `kebun/blok-a/...`.
- **Jaringan terpisah** (VLAN/SSID khusus IoT) agar perangkat yang dibobol tidak dapat menjangkau laptop dan server lain (lihat [Keamanan jaringan & sistem](/belajar/cyber-security/cs-4)).
- **Update OTA** yang aman sehingga celah dapat diperbaiki tanpa mengambil perangkat satu per satu.
- Pertimbangkan **keselamatan fisik**: perintah untuk aktuator (pompa, pemanas, kunci pintu) perlu batas aman di perangkat itu sendiri, misalnya pompa otomatis mati setelah 10 menit walaupun perintah OFF tidak pernah datang.

:::latihan
Milestone: (1) jalankan broker Mosquitto (Docker) dengan autentikasi, ACL per perangkat, dan TLS; (2) program ESP32 sensor yang mengirim telemetri JSON setiap 10 detik dengan QoS 0, status online/offline melalui last will, dan penyambungan ulang otomatis WiFi + MQTT; (3) program ESP32 aktuator (relay/LED) yang subscribe topic perintah dengan QoS 1, melaporkan state retained, dan memiliki batas waktu aman; (4) uji dengan mosquitto_pub/sub dan dokumentasikan desain topic serta skema payload.
:::

## Rangkuman

- WiFi ESP32: mode STA, sambung ulang non-blocking, perhatikan RSSI dan 2,4 GHz; rahasia di luar kode; LoRa/seluler untuk lokasi jauh.
- HTTP untuk request–response jarang; MQTT untuk telemetri sering dan perintah dua arah melalui broker.
- Topic hierarkis yang konsisten; wildcard +/#; QoS 0/1/2; retained untuk status; last will untuk deteksi offline.
- JSON ringkas dengan versi, satuan, timestamp; validasi di penerima; CBOR/Protobuf bila perlu efisiensi.
- Keamanan: kredensial unik, TLS terverifikasi, ACL, jaringan IoT terpisah, OTA aman, batas keselamatan aktuator.
