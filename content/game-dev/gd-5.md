---
title: Polish, rilis & portofolio
minutes: 35
summary: Banyak developer berhenti di prototipe. Modul ini membahas langkah terakhir yang membedakan ‘proyek’ dari ‘game’, yaitu audio dan UI yang rapi, performa yang stabil, playtesting yang jujur, rilis ke itch.io, dan menyusun portofolio game yang meyakinkan.
objectives:
  - Menambahkan audio dan UI yang mendukung gameplay
  - Menemukan dan memperbaiki masalah performa dengan profiler
  - Menjalankan playtesting dan menindaklanjuti temuannya
  - Mengekspor game, merilis di itch.io, dan menyusun portofolio
sources:
  - repo: ellisonleao/magictools
    note: Kurasi aset, audio, dan alat pendukung game dev
  - repo: Kavex/GameDev-Resources
    note: Sumber aset gratis, tutorial, dan komunitas game dev
  - repo: raysan5/raylib
    note: Pembanding untuk memahami game tanpa engine
quiz:
  - q: "Bus audio terpisah untuk Musik dan SFX berguna agar…"
    options: ["Game lebih kecil", "Pemain bisa mengatur volume musik dan efek secara terpisah", "Suara lebih keras", "Tidak perlu file audio"]
    answer: 1
    explain: "Pengaturan volume terpisah adalah fitur dasar yang diharapkan pemain; bus juga memudahkan efek seperti meredam musik saat pause."
  - q: "FPS turun drastis saat banyak musuh muncul. Langkah pertama yang benar?"
    options: ["Menebak lalu menulis ulang semua kode", "Buka profiler/monitor untuk melihat apa yang memakan waktu per frame", "Menurunkan resolusi gambar semua aset", "Menambah musuh lagi"]
    answer: 1
    explain: "Ukur dulu. Bottleneck sering di tempat yang tidak disangka (mis. pencarian node setiap frame, terlalu banyak fisika aktif)."
  - q: "Saat playtesting, peran developer sebaiknya…"
    options: ["Menjelaskan cara bermain di setiap langkah", "Diam, mengamati, dan mencatat tanpa membantu", "Memainkan sendiri", "Berdebat dengan penguji"]
    answer: 1
    explain: "Pemain sungguhan tidak akan punya developer di sebelahnya. Kebingungan penguji adalah data berharga."
  - q: "Untuk game web di itch.io hasil ekspor Godot, yang diunggah adalah…"
    options: ["File .tscn", "File ZIP berisi hasil ekspor HTML5 (index.html + .wasm + .pck)", "Folder proyek mentah", "Screenshot"]
    answer: 1
    explain: "Unggah ZIP ekspor Web dan tandai ‘This file will be played in the browser’."
---

‘80% terakhir’ dari sebuah game sering memakan waktu sebanyak ‘80% pertama’. Polish, bug kecil, menu, pengaturan, dan halaman rilis memang tidak seseru membuat mekanik baru, tetapi inilah yang membuat orang lain bisa menikmati karyamu. Dan game yang **dirilis**, sekecil apa pun, jauh lebih berharga untuk portofolio daripada proyek ambisius yang tidak pernah selesai.

## Audio & UI

**Audio** sering menyumbang separuh ‘rasa’ sebuah game. Musik menetapkan suasana; efek suara memberi umpan balik atas setiap aksi.

- Pisahkan **bus** audio: `Master`, `Musik`, `SFX`, `UI`. Sediakan pengaturan volume masing-masing.
- Variasikan **pitch** sedikit secara acak (±5–10%) untuk suara yang sering berulang (langkah, tembakan) agar tidak monoton.
- Atur **prioritas**: jangan memutar 30 suara ledakan sekaligus; batasi jumlah instance per jenis.
- Sumber gratis: Freesound, OpenGameArt, Kenney. Selalu periksa **lisensi** (CC0, CC-BY dengan atribusi, dll.) dan catat di halaman kredit.

```gdscript
# AudioStreamPlayer dengan variasi pitch
func mainkan_sfx(player: AudioStreamPlayer) -> void:
    player.pitch_scale = randf_range(0.92, 1.08)
    player.play()

# pengaturan volume (slider 0..1) ke bus
func set_volume(bus: String, nilai: float) -> void:
    AudioServer.set_bus_volume_db(AudioServer.get_bus_index(bus), linear_to_db(nilai))
```

**UI** game yang baik: informasi penting terbaca sekilas (nyawa, skor, amunisi), menu bisa dinavigasi dengan keyboard/gamepad (fokus tombol!), teks cukup besar di layar kecil, dan ada **pengaturan** dasar: volume, layar penuh, remap kontrol, opsi kurangi screen shake.

```viz
{"type":"layers","title":"Lapisan tampilan game","caption":"Di Godot, HUD dan menu diletakkan di CanvasLayer agar tidak ikut bergerak bersama kamera dunia.","layers":[{"label":"Menu & dialog","tag":"CanvasLayer 10","detail":"Pause, pengaturan, konfirmasi. Saat aktif, gameplay di-pause (get_tree().paused) kecuali node menu (process_mode = Always)."},{"label":"HUD","tag":"CanvasLayer 1","detail":"Nyawa, skor, minimap. Selalu di posisi layar yang sama."},{"label":"Efek layar","tag":"post-process","detail":"Flash saat terkena, transisi antar level."},{"label":"Dunia game","tag":"Camera2D","detail":"Tilemap, karakter, partikel, yang bergerak mengikuti kamera."},{"label":"Latar","tag":"Parallax","detail":"Background berlapis yang bergerak lebih lambat untuk ilusi kedalaman."}]}
```

## Optimasi performa

Aturan pertama optimasi: **ukur dulu**. Godot menyediakan **Debugger → Profiler** (waktu per fungsi), **Monitors** (FPS, jumlah objek, draw call, memori), dan **Visual Profiler**.

```viz
{"type":"compare","title":"Penyebab umum game lambat & perbaikannya","columns":["Gejala","Penyebab umum","Perbaikan"],"rows":[{"label":"CPU","values":["FPS turun saat banyak musuh","Logika berat di _process setiap frame; get_node/find berulang","Cache referensi (@onready), jalankan AI lebih jarang (timer), matikan objek di luar layar (VisibleOnScreenNotifier2D)"]},{"label":"Fisika","values":["Lag saat banyak objek bertabrakan","Terlalu banyak body aktif & bentuk kompleks","Bentuk collider sederhana, layer/mask yang tepat, sleeping untuk RigidBody"]},{"label":"Render","values":["Lambat di HP/web","Banyak draw call, tekstur besar, shader berat","Atlas tekstur, ukuran gambar sesuai tampilan, kurangi partikel"]},{"label":"Stutter berkala","values":["Patah sesaat saat menembak/spawn","Alokasi & instantiate berulang","Object pooling, preload scene"]}]}
```

Target realistis: **60 FPS stabil** di perangkat yang dituju (terutama untuk ekspor web/HP), dengan frame time yang konsisten. Lonjakan sesekali lebih terasa daripada FPS rata-rata yang sedikit lebih rendah.

## Playtesting

Kamu sudah memainkan gamemu ratusan kali, sehingga kamu **tidak bisa** lagi merasakannya seperti pemain baru. Playtesting memberimu mata yang segar.

```viz
{"type":"flow","title":"Sesi playtesting yang berguna","caption":"Satu sesi dengan 3–5 orang biasanya sudah mengungkap masalah terbesar. Perbaiki, lalu uji lagi dengan orang baru.","steps":[{"label":"Tujuan","detail":"Apa yang ingin diketahui? ‘Apakah level 1 mengajarkan lompatan ganda tanpa teks?’"},{"label":"Siapkan build","detail":"Versi stabil, mulai dari awal seperti pemain baru; aktifkan pencatatan (waktu per level, posisi mati)."},{"label":"Amati diam-diam","detail":"Jangan menjelaskan atau membantu. Catat di mana mereka bingung, mati berulang, atau bosan."},{"label":"Tanya di akhir","detail":"Bagian paling seru? paling membuat frustrasi? apa yang ingin dimainkan lagi?"},{"label":"Prioritaskan","detail":"Masalah yang dialami banyak penguji > pendapat satu orang. Perhatikan perilaku, bukan hanya ucapan."}]}
```

Data sederhana yang sangat berguna: **peta lokasi kematian** (heatmap) per level. Jika 80% penguji mati di lompatan yang sama, itu masalah desain, bukan ‘pemainnya kurang jago’.

## Build & publish ke itch.io

**itch.io** adalah platform paling ramah untuk rilis pertama: gratis, mendukung game web yang bisa langsung dimainkan di browser, dan menjadi rumah bagi banyak game jam.

Langkah dari Godot:

1. **Project → Export**: pasang *export templates* yang sesuai versi Godot-mu.
2. Tambahkan preset **Web** (HTML5), dan opsional Windows/Linux/Android.
3. Ekspor Web ke folder, lalu kompres isinya menjadi **ZIP** dengan `index.html` di akar ZIP.
4. Di itch.io: *Upload new project* → Kind: **HTML** → unggah ZIP → centang **This file will be played in the browser** → atur ukuran viewport sesuai resolusi game.
5. Lengkapi halaman: judul, deskripsi singkat yang menjual, **cover image** (630×500), 3–5 screenshot/GIF, kontrol permainan, kredit aset & lisensi.
6. Tulis **devlog** pertama: apa yang kamu buat, apa yang dipelajari.

:::info
Ekspor Web Godot 4 bekerja paling mulus pada build **tanpa thread** (*Thread Support* dimatikan di preset ekspor Web), karena dukungan *SharedArrayBuffer* membutuhkan header khusus yang tidak selalu tersedia. Uji di beberapa browser dan di HP sebelum rilis.
:::

Ikut **game jam** (mis. di itch.io atau komunitas game dev Indonesia) adalah cara terbaik melatih menyelesaikan game: tema dan batas waktu 48–72 jam memaksa ruang lingkup tetap kecil.

## Portofolio game

Perekrut studio dan juri lomba ingin melihat **game yang bisa dimainkan** dan **kontribusimu yang jelas**.

- **Kualitas di atas kuantitas**: 2–3 game kecil yang selesai dan rapi > 10 prototipe setengah jadi.
- Setiap proyek: link yang bisa dimainkan (itch.io), **GIF 5–10 detik** gameplay inti, peranmu (programmer gameplay? semua?), teknologi, dan satu tantangan teknis yang kamu pecahkan (mis. ‘state machine untuk 6 jenis musuh’, ‘pooling 500 peluru tetap 60 FPS di web’).
- Kode di GitHub dengan README yang menjelaskan arsitektur; ini penting untuk posisi programmer.
- **Devlog/post-mortem**: apa yang berjalan baik, apa yang tidak, apa yang akan dilakukan berbeda.

:::latihan
Milestone: rilis game dari modul sebelumnya ke itch.io sebagai game web: dengan menu utama, pengaturan volume (bus Musik/SFX), pause, layar game over, kredit aset berlisensi, 60 FPS stabil di laptop dan HP (cek dengan monitor). Lakukan playtest dengan 5 orang, perbaiki 3 masalah terbesar, lalu tulis devlog berisi perubahan berdasarkan playtest.
:::

## Rangkuman

- Audio dengan bus terpisah dan variasi pitch; UI yang terbaca, bisa dinavigasi keyboard/gamepad, dan punya pengaturan.
- Optimasi dimulai dari profiler; masalah umum: logika per frame, fisika berlebih, draw call, alokasi berulang.
- Playtesting: tujuan jelas, amati tanpa membantu, prioritaskan pola dari banyak penguji.
- itch.io: ekspor Web → ZIP → halaman lengkap + devlog; ikuti game jam untuk melatih menyelesaikan.
- Portofolio: sedikit game selesai, GIF gameplay, peran jelas, tantangan teknis, kode & devlog.
