---
title: Pemrograman mikrokontroler (Arduino & ESP32)
minutes: 55
summary: Mikrokontroler adalah komputer kecil yang menjalankan satu program terus-menerus untuk membaca sensor dan mengendalikan aktuator. Modul ini membahas struktur sketch setup dan loop, GPIO input dan output, PWM untuk mengatur kecerahan dan kecepatan, ADC untuk membaca sensor analog, serta debugging dengan Serial Monitor.
objectives:
  - Menulis sketch dengan setup, loop, dan timing non-blocking
  - Membaca tombol dan mengendalikan output digital dengan benar (pull-up, debounce)
  - Memakai PWM untuk LED, motor, dan servo
  - Membaca dan mengolah nilai ADC menjadi besaran fisik
  - Men-debug program dengan Serial Monitor dan Serial Plotter
sources:
  - repo: arduino/Arduino
    note: Arduino IDE & ekosistem Arduino
  - repo: espressif/arduino-esp32
    note: Core Arduino untuk ESP32 dari Espressif
  - repo: platformio/platformio-core
    note: PlatformIO — build & manajemen pustaka untuk embedded
quiz:
  - q: "Kenapa delay(1000) di dalam loop() dapat menjadi masalah?"
    options: ["Membuat LED lebih terang", "Program berhenti total selama 1 detik sehingga tombol/sensor lain tidak terbaca", "Menghabiskan memori", "Tidak ada masalah"]
    answer: 1
    explain: "Gunakan pola millis() agar beberapa tugas berjalan ‘bersamaan’."
  - q: "PWM dengan duty cycle 25% pada 3,3 V membuat LED…"
    options: ["Mati", "Tampak redup karena rata-rata daya sekitar seperempat", "Rusak", "Berkedip lambat yang terlihat"]
    answer: 1
    explain: "Pin berganti HIGH/LOW sangat cepat; mata melihat rata-ratanya."
  - q: "pinMode(tombol, INPUT_PULLUP) berarti saat tombol ditekan (ke GND) digitalRead bernilai…"
    options: ["HIGH", "LOW", "Acak", "Error"]
    answer: 1
    explain: "Logika terbalik: tidak ditekan = HIGH (ditarik ke 3,3 V), ditekan = LOW."
  - q: "Nilai analogRead 2048 pada ADC 12-bit dengan referensi 3,3 V kira-kira setara…"
    options: ["0,8 V", "1,65 V", "3,3 V", "2,048 V"]
    answer: 1
    explain: "2048/4095 × 3,3 ≈ 1,65 V (ADC ESP32 tidak sepenuhnya linear; kalibrasi bila butuh akurasi)."
---

**Mikrokontroler** adalah chip berisi prosesor, memori, dan pin input/output dalam satu paket kecil dan hemat daya. Berbeda dengan komputer biasa, ia tidak menjalankan sistem operasi lengkap; ia menjalankan **satu program** yang berulang selamanya sejak dinyalakan. **Arduino** mempopulerkan cara pemrograman yang mudah dengan C++; **ESP32** dari Espressif menambahkan Wi-Fi dan Bluetooth dengan harga terjangkau sehingga menjadi pilihan utama proyek IoT.

```viz
{"type":"compare","columns":["Arduino Uno (ATmega328P)","ESP32"],"rows":[{"label":"CPU","values":["8-bit, 16 MHz","32-bit dual-core, hingga 240 MHz"]},{"label":"Memori","values":["2 KB RAM, 32 KB flash","±520 KB SRAM, flash 4 MB+"]},{"label":"Konektivitas","values":["Tidak ada","Wi-Fi + Bluetooth"]},{"label":"Level logika","values":["5 V","3,3 V (tidak toleran 5 V)"]},{"label":"ADC","values":["10-bit (0–1023)","12-bit (0–4095)"]}]}
```

Alat pengembangan: **Arduino IDE** (paling mudah dimulai) atau **PlatformIO** di VS Code (manajemen pustaka dan versi yang lebih baik untuk proyek serius). Tanpa perangkat, gunakan simulator **Wokwi**.

## Struktur sketch: setup & loop

```cpp
const int PIN_LED = 2;            // LED bawaan banyak papan ESP32 (cek papanmu)

void setup() {                    // sekali saat menyala/reset
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  Serial.println("Mulai!");
}

void loop() {                     // berulang selamanya
  digitalWrite(PIN_LED, HIGH);
  delay(500);
  digitalWrite(PIN_LED, LOW);
  delay(500);
}
```

`delay()` menghentikan seluruh program. Begitu proyek perlu melakukan beberapa hal sekaligus (membaca sensor setiap 2 detik, memeriksa tombol terus, mengedipkan LED), gunakan pola **non-blocking dengan `millis()`**:

```cpp
unsigned long terakhirKedip = 0, terakhirBaca = 0;
bool ledNyala = false;

void loop() {
  unsigned long sekarang = millis();
  if (sekarang - terakhirKedip >= 500) {          // tugas 1: kedip setiap 500 ms
    terakhirKedip = sekarang;
    ledNyala = !ledNyala;
    digitalWrite(PIN_LED, ledNyala);
  }
  if (sekarang - terakhirBaca >= 2000) {          // tugas 2: baca sensor setiap 2 detik
    terakhirBaca = sekarang;
    bacaSensor();
  }
  periksaTombol();                                 // tugas 3: selalu responsif
}
```

Pola ini adalah bentuk sederhana dari **state machine** dan penjadwalan kooperatif. Untuk kebutuhan lebih kompleks, ESP32 mendukung **FreeRTOS** (beberapa task sungguhan).

```viz
{"type":"fsm","states":[{"id":"Idle","detail":"Menunggu"},{"id":"Membaca","detail":"Ambil data sensor"},{"id":"Mengirim","detail":"Kirim ke server"},{"id":"Error","detail":"Indikasi & coba lagi"}],"start":"Idle","transitions":[{"from":"Idle","to":"Membaca","event":"interval tercapai"},{"from":"Membaca","to":"Mengirim","event":"data valid"},{"from":"Membaca","to":"Error","event":"sensor gagal"},{"from":"Mengirim","to":"Idle","event":"sukses"},{"from":"Mengirim","to":"Error","event":"jaringan gagal"},{"from":"Error","to":"Idle","event":"tunggu & ulangi"}]}
```

## GPIO input & output

**GPIO** (*General Purpose Input/Output*) dapat dikonfigurasi sebagai input atau output.

```cpp
const int PIN_TOMBOL = 4, PIN_RELAY = 26;

void setup() {
  pinMode(PIN_TOMBOL, INPUT_PULLUP);   // tidak ditekan = HIGH, ditekan (ke GND) = LOW
  pinMode(PIN_RELAY, OUTPUT);
}

// Debounce: tombol mekanis ‘memantul’ beberapa milidetik saat ditekan
int statusStabil = HIGH, bacaanTerakhir = HIGH;
unsigned long waktuBerubah = 0;
bool relayNyala = false;

void periksaTombol() {
  int baca = digitalRead(PIN_TOMBOL);
  if (baca != bacaanTerakhir) waktuBerubah = millis();
  if (millis() - waktuBerubah > 30 && baca != statusStabil) {
    statusStabil = baca;
    if (statusStabil == LOW) {                  // baru saja ditekan
      relayNyala = !relayNyala;
      digitalWrite(PIN_RELAY, relayNyala);
    }
  }
  bacaanTerakhir = baca;
}
```

Hal yang perlu diperhatikan: tidak semua pin ESP32 sama — beberapa hanya input, beberapa memengaruhi proses boot (*strapping pins*), dan beberapa ADC tidak dapat dipakai saat Wi-Fi aktif (ADC2). Selalu cek **pinout** papanmu. Untuk kejadian yang sangat cepat (encoder, sensor aliran), gunakan **interrupt** (`attachInterrupt`) dengan rutin interupsi yang singkat.

## PWM

Pin digital hanya dapat HIGH atau LOW. **PWM** (*Pulse Width Modulation*) mensimulasikan nilai di antaranya dengan menyalakan dan mematikan pin sangat cepat; **duty cycle** (persentase waktu HIGH) menentukan daya rata-rata. Ubah duty cycle dan frekuensi di bawah:

```viz
{"type":"pwm"}
```

```cpp
const int PIN_LED_PWM = 25;

void setup() {
  // API LEDC ESP32 (core Arduino-ESP32 v3): pin, frekuensi Hz, resolusi bit
  ledcAttach(PIN_LED_PWM, 5000, 8);         // 8-bit → duty 0–255
}

void loop() {
  for (int d = 0; d <= 255; d++) { ledcWrite(PIN_LED_PWM, d); delay(5); }   // perlahan terang
  for (int d = 255; d >= 0; d--) { ledcWrite(PIN_LED_PWM, d); delay(5); }   // perlahan redup
}
// Pada Arduino Uno: analogWrite(pin, 0..255) di pin bertanda ~
```

Kegunaan PWM: kecerahan LED, **kecepatan motor DC** (melalui driver), posisi **servo** (servo membaca lebar pulsa sekitar 1–2 ms pada 50 Hz; pustaka `ESP32Servo` mengurusnya), dan nada buzzer. Catatan: API PWM ESP32 berubah antara core versi 2 (`ledcSetup` + `ledcAttachPin`) dan versi 3 (`ledcAttach`); sesuaikan dengan versi core yang terpasang.

## ADC: membaca sensor analog

**ADC** mengubah tegangan analog menjadi angka. Pada ESP32 (12-bit), 0 V ≈ 0 dan 3,3 V ≈ 4095.

```cpp
const int PIN_SOIL = 34;                      // pin ADC1 (tetap bisa dipakai saat Wi-Fi aktif)
const int KERING = 3200, BASAH = 1400;        // hasil kalibrasi sendiri: di udara & di air

int bacaRataRata(int pin, int n = 16) {       // rata-rata beberapa sampel untuk mengurangi noise
  long total = 0;
  for (int i = 0; i < n; i++) { total += analogRead(pin); delay(2); }
  return total / n;
}

void bacaSensor() {
  int raw = bacaRataRata(PIN_SOIL);
  int persen = constrain(map(raw, KERING, BASAH, 0, 100), 0, 100);
  int mv = analogReadMilliVolts(PIN_SOIL);    // ESP32: konversi ke mV dengan kalibrasi pabrik
  Serial.printf("raw=%d  mV=%d  kelembapan=%d%%\n", raw, mv, persen);
}
```

Pelajaran penting tentang data sensor:

- **Kalibrasi** dengan titik acuan nyata (kering/basah, suhu acuan), karena nilai mentah berbeda antar sensor dan lingkungan.
- **Noise**: rata-rata beberapa sampel, median filter, atau moving average.
- ADC ESP32 **tidak sepenuhnya linear** di dekat 0 V dan 3,3 V; untuk akurasi tinggi, gunakan ADC eksternal (ADS1115) atau sensor digital (I²C).
- Sensor digital (DHT22, BME280, SHT31) sering lebih mudah karena mengirim nilai yang sudah dikalibrasi lewat pustaka.

## Serial monitor & debugging

**Serial Monitor** adalah jendela utama untuk melihat apa yang dilakukan program.

```cpp
#define DEBUG 1
#if DEBUG
  #define LOG(...) Serial.printf(__VA_ARGS__)
#else
  #define LOG(...)
#endif

void setup() {
  Serial.begin(115200);                       // baud rate harus sama dengan di Serial Monitor
  delay(200);
  LOG("Reset reason: %d, free heap: %u\n", esp_reset_reason(), ESP.getFreeHeap());
}
```

```viz
{"type":"flow","title":"Debugging perangkat keras + perangkat lunak","steps":[{"label":"Daya & koneksi","detail":"Papan menyala? GND bersama? Kabel di pin yang benar? (multimeter)"},{"label":"Program minimal","detail":"Uji satu komponen dengan contoh pustaka sebelum digabung."},{"label":"Log Serial","detail":"Cetak nilai mentah, status, dan alasan reset."},{"label":"Serial Plotter","detail":"Lihat grafik nilai sensor untuk melihat noise & tren."},{"label":"Isolasi","detail":"Tambahkan komponen satu per satu sampai masalah muncul."}]}
```

Masalah umum dan penyebabnya: tulisan acak di Serial Monitor (baud rate berbeda), ESP32 **reset berulang** (catu daya USB/kabel kurang kuat saat Wi-Fi atau motor aktif, atau *watchdog* karena loop terblokir), port tidak terdeteksi (kabel USB hanya untuk daya, driver CH340/CP210x belum terpasang), dan gagal upload (tahan tombol BOOT saat upload pada sebagian papan).

:::latihan
Milestone: dengan ESP32 (atau Wokwi), buat ‘stasiun mini’: (1) tombol dengan pull-up internal dan debounce yang menyalakan/mematikan mode; (2) LED PWM yang kecerahannya mengikuti nilai potensiometer; (3) sensor kelembapan tanah atau LDR yang dikalibrasi dan dirata-rata, dicetak ke Serial Plotter; (4) semuanya berjalan non-blocking dengan millis() sebagai state machine, dan (5) relay/LED peringatan menyala bila nilai sensor melewati ambang. Simpan proyek di PlatformIO dengan README berisi diagram pin.
:::

## Rangkuman

- Sketch: setup() sekali, loop() selamanya; ganti delay() dengan pola millis() / state machine; FreeRTOS untuk tugas kompleks.
- GPIO: INPUT_PULLUP (logika terbalik), debounce, perhatikan pin khusus ESP32, interrupt untuk sinyal cepat.
- PWM: duty cycle mengatur daya rata-rata untuk LED, motor (lewat driver), servo; API LEDC ESP32 bergantung versi core.
- ADC: kalibrasi, rata-rata, pin ADC1 saat Wi-Fi aktif; sensor digital untuk akurasi lebih baik.
- Debug: Serial Monitor/Plotter dengan baud rate sama, uji komponen satu per satu, periksa daya dan reset reason.
