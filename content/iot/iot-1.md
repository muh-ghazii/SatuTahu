---
title: Elektronika dasar untuk IoT
minutes: 45
summary: Sebelum memprogram mikrokontroler, kamu perlu memahami listrik yang mengalir di rangkaiannya. Modul ini membahas tegangan, arus, dan hukum Ohm, cara merakit rangkaian di breadboard, perbedaan sinyal digital dan analog, jenis sensor dan aktuator, serta keselamatan komponen agar tidak ada yang terbakar.
objectives:
  - Menghitung tegangan, arus, resistansi, dan daya dengan hukum Ohm
  - Merakit rangkaian sederhana di breadboard dan membaca skema
  - Membedakan sinyal digital dan analog serta level logika 3,3 V dan 5 V
  - Memilih sensor dan aktuator serta cara menghubungkannya
  - Mencegah kerusakan komponen dan bekerja dengan aman
sources:
  - repo: microsoft/IoT-For-Beginners
    note: Kurikulum IoT 24 pelajaran dari Microsoft
  - repo: phodal/awesome-iot
    note: Kumpulan sumber, platform, dan proyek IoT
quiz:
  - q: "LED merah (Vf ≈ 2 V, arus target 10 mA) dari pin 5 V membutuhkan resistor sekitar…"
    options: ["30 Ω", "300 Ω", "3 kΩ", "Tanpa resistor"]
    answer: 1
    explain: "R = (5 − 2) V / 0,01 A = 300 Ω; pakai nilai standar terdekat seperti 330 Ω."
  - q: "Sensor 5 V mengirim sinyal langsung ke pin ESP32 (3,3 V). Risikonya…"
    options: ["Tidak ada", "Pin ESP32 bisa rusak karena melebihi tegangan maksimumnya; gunakan pembagi tegangan atau level shifter", "Sensor menjadi lebih akurat", "WiFi mati"]
    answer: 1
    explain: "Pin ESP32 tidak toleran 5 V."
  - q: "Motor DC tidak boleh langsung dihubungkan ke pin mikrokontroler karena…"
    options: ["Motor terlalu kecil", "Arusnya jauh melebihi kemampuan pin dan menimbulkan lonjakan tegangan balik; gunakan driver/transistor dengan dioda", "Motor butuh WiFi", "Pin hanya untuk sensor"]
    answer: 1
    explain: "Pin GPIO hanya mampu memberi belasan miliampere."
  - q: "Lubang-lubang di satu baris pendek (5 lubang) pada sisi breadboard…"
    options: ["Tidak terhubung", "Terhubung satu sama lain secara listrik", "Terhubung ke semua baris", "Hanya untuk ground"]
    answer: 1
    explain: "Rel panjang di tepi biasanya untuk catu daya (+/−)."
---

**Internet of Things (IoT)** adalah perangkat fisik yang membaca dunia (suhu, kelembapan, gerakan) dan/atau mengubahnya (menyalakan pompa, membuka kunci), lalu terhubung ke jaringan. Bagian ‘things’ berarti kamu bekerja dengan **listrik dan komponen nyata**: kesalahan kecil bisa membuat komponen rusak. Modul ini memberi fondasi yang cukup untuk merakit proyek IoT dengan aman.

Perlengkapan awal yang disarankan: papan **ESP32** (atau Arduino Uno), breadboard, kabel jumper, LED, resistor (220 Ω, 1 kΩ, 10 kΩ), push button, potensiometer, sensor suhu-kelembapan, dan **multimeter**. Jika belum memiliki perangkat, simulator **Wokwi** (berbasis browser) dapat menjalankan rangkaian ESP32/Arduino secara virtual.

## Tegangan, arus & hukum Ohm

Analogi air membantu memahami tiga besaran dasar:

```viz
{"type":"compare","columns":["Besaran","Satuan","Analogi air","Contoh"],"rows":[{"label":"Tegangan (V)","values":["volt (V)","Tekanan air","Baterai 3,7 V, USB 5 V, logika ESP32 3,3 V"]},{"label":"Arus (I)","values":["ampere (A), mA","Debit aliran","LED ±10–20 mA, pin GPIO maks. belasan mA"]},{"label":"Resistansi (R)","values":["ohm (Ω)","Penyempitan pipa","Resistor 330 Ω membatasi arus LED"]},{"label":"Daya (P)","values":["watt (W)","Kerja per waktu","P = V × I; menentukan panas"]}]}
```

**Hukum Ohm**: **V = I × R**. Geser nilainya dan perhatikan hubungannya:

```viz
{"type":"ohm"}
```

Contoh paling sering: **resistor pembatas LED**. LED punya tegangan maju (Vf) sekitar 2 V (merah) hingga 3 V (biru/putih). Dari sumber 3,3 V dengan target 10 mA: R = (3,3 − 2) / 0,01 = 130 Ω → gunakan 150 Ω. Daya resistor: P = I²R = 0,01² × 150 = 0,015 W, jauh di bawah rating resistor ¼ W.

Rangkaian **seri** menjumlahkan resistansi; rangkaian **paralel** membagi arus. **Pembagi tegangan** (dua resistor seri) menghasilkan tegangan lebih kecil: Vout = Vin × R2 / (R1 + R2). Ini juga cara membaca banyak sensor resistif (LDR, termistor) dan menurunkan sinyal 5 V menjadi ±3,3 V.

## Breadboard & rangkaian

**Breadboard** memungkinkan merakit rangkaian tanpa menyolder.

```viz
{"type":"tree","root":{"label":"Breadboard","children":[{"label":"Rel daya (tepi)","detail":"Dua jalur panjang: + (merah) dan − (biru/hitam), terhubung sepanjang papan"},{"label":"Baris terminal","detail":"Setiap 5 lubang dalam satu baris pendek terhubung"},{"label":"Celah tengah","detail":"Memisahkan dua sisi; tempat IC/modul agar kaki kiri & kanan tidak terhubung"}]}}
```

Kebiasaan yang mencegah kesalahan:

- **Ground bersama**: semua bagian rangkaian (mikrokontroler, sensor, catu daya eksternal) harus berbagi GND.
- **Warna kabel konsisten**: merah untuk +, hitam untuk GND, warna lain untuk sinyal.
- **Rakit dalam keadaan tanpa daya**, periksa ulang, baru hubungkan USB.
- **Baca skema**, bukan hanya foto: simbol resistor, LED (perhatikan kaki panjang = anoda +), kapasitor elektrolit (berpolaritas), dan ground.
- Gunakan **multimeter** untuk memeriksa tegangan dan kontinuitas saat rangkaian tidak bekerja.

Saat proyek sudah stabil, pindahkan ke PCB berlubang atau PCB kustom (KiCad) agar koneksi tidak mudah lepas.

## Sinyal digital vs analog

```viz
{"type":"compare","columns":["Digital","Analog"],"rows":[{"label":"Nilai","values":["Dua keadaan: HIGH/LOW (1/0)","Kontinu dalam rentang, mis. 0–3,3 V"]},{"label":"Contoh","values":["Tombol, sensor gerak PIR, relay, LED nyala/mati","Potensiometer, LDR, sensor kelembapan tanah, mikrofon"]},{"label":"Dibaca dengan","values":["Pin GPIO (digitalRead)","ADC (analogRead) → angka diskret, mis. 0–4095 pada ADC 12-bit"]}]}
```

Mikrokontroler hanya memahami angka, sehingga sinyal analog dikonversi oleh **ADC**. Resolusi 12-bit berarti 2¹² = 4.096 tingkat:

```viz
{"type":"binary"}
```

**Level logika** penting: ESP32 dan kebanyakan papan modern bekerja di **3,3 V**, sedangkan Arduino Uno di **5 V**. Menghubungkan output 5 V ke input 3,3 V dapat merusak pin; gunakan **level shifter** atau pembagi tegangan. Input digital yang tidak terhubung ke apa pun (**floating**) akan membaca nilai acak; gunakan resistor **pull-up/pull-down** (atau pull-up internal) untuk tombol. Untuk komunikasi antar komponen, sinyal digital juga dipakai dalam protokol seperti **I²C**, **SPI**, dan **UART**.

## Sensor & aktuator

```viz
{"type":"tree","root":{"label":"Komponen IoT umum","children":[{"label":"Sensor (input)","children":[{"label":"Lingkungan","detail":"DHT22/SHT31 suhu-kelembapan, BME280 tekanan, sensor kelembapan tanah kapasitif"},{"label":"Gerak & jarak","detail":"PIR, ultrasonik HC-SR04, akselerometer MPU6050"},{"label":"Cahaya & gas","detail":"LDR, BH1750, MQ-series (gas)"},{"label":"Listrik","detail":"INA219 arus/tegangan, PZEM-004T daya AC"}]},{"label":"Aktuator (output)","children":[{"label":"Indikator","detail":"LED, buzzer, layar OLED/LCD"},{"label":"Gerak","detail":"Servo, motor DC (dengan driver L298N/TB6612), motor stepper"},{"label":"Saklar beban","detail":"Relay atau MOSFET untuk pompa, lampu, kipas"}]}]}}
```

Saat memilih sensor, baca **datasheet**: tegangan kerja, antarmuka (analog/digital/I²C), akurasi, rentang, dan konsumsi daya. Contoh pilihan yang sering salah: sensor kelembapan tanah **resistif** murah cepat berkarat; versi **kapasitif** jauh lebih awet. Untuk aktuator berdaya besar, mikrokontroler hanya **memberi sinyal**; daya disediakan oleh catu daya terpisah melalui **driver**, **transistor/MOSFET**, atau **relay**.

## Keselamatan komponen

```viz
{"type":"flow","title":"Checklist sebelum menyalakan rangkaian","steps":[{"label":"Polaritas","detail":"LED, kapasitor elektrolit, catu daya — tidak terbalik."},{"label":"Tegangan","detail":"Sesuai spesifikasi komponen & level logika (3,3 V vs 5 V)."},{"label":"Arus","detail":"Resistor pembatas LED; beban besar lewat driver, bukan pin."},{"label":"Hubung singkat","detail":"Tidak ada jalur langsung + ke GND (cek kontinuitas)."},{"label":"Beban induktif","detail":"Motor/relay dengan dioda flyback."}]}
```

Aturan keselamatan penting:

- **Pin GPIO punya batas arus** (belasan mA per pin); jangan menyalakan motor, pompa, atau banyak LED langsung dari pin.
- **Beban induktif** (motor, relay, solenoid) menghasilkan lonjakan tegangan balik saat dimatikan; pasang **dioda flyback** (modul relay biasanya sudah memilikinya).
- **Listrik AC 220 V berbahaya bagi jiwa.** Jangan menyentuh, merakit, atau menguji rangkaian 220 V tanpa pengetahuan dan pengawasan yang memadai; gunakan modul relay tertutup dan kotak isolasi, atau lebih aman, perangkat siap pakai bersertifikat.
- **Baterai lithium** (18650, LiPo) dapat terbakar jika hubung singkat, diisi tanpa modul pengisi yang tepat, atau rusak secara fisik.
- **ESD** (listrik statis) dapat merusak chip; sentuh benda logam ter-ground sebelum memegang komponen sensitif.

:::latihan
Milestone: (1) hitung dan rakit rangkaian LED dengan resistor dari 3,3 V, lalu ukur tegangan dan arusnya dengan multimeter dan bandingkan dengan perhitungan; (2) rakit pembagi tegangan dengan LDR dan ukur tegangannya saat terang dan gelap; (3) buat tabel 5 sensor dan 3 aktuator yang ingin kamu pakai untuk proyek (mis. monitoring kebun atau gudang): tegangan kerja, antarmuka, arus, dan cara menghubungkannya dengan aman. Gunakan Wokwi bila belum memiliki perangkat.
:::

## Rangkuman

- V = I × R dan P = V × I; resistor pembatas LED R = (Vsumber − Vf) / I; pembagi tegangan untuk sensor & penurun level.
- Breadboard: rel daya di tepi, baris 5 lubang terhubung; ground bersama, rakit tanpa daya, gunakan multimeter.
- Digital (HIGH/LOW) vs analog (dibaca ADC); level 3,3 V vs 5 V; pull-up/pull-down untuk input.
- Pilih sensor dari datasheet; aktuator berdaya besar lewat driver/transistor/relay dengan catu terpisah.
- Keselamatan: batas arus pin, dioda flyback, hindari 220 V tanpa keahlian, hati-hati baterai lithium dan ESD.
