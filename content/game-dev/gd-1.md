---
title: Fondasi pemrograman game
minutes: 40
summary: Setiap game, dari Flappy Bird sampai game open-world, berdiri di atas beberapa konsep yang sama, yaitu loop yang berjalan puluhan kali per detik, waktu yang diukur dengan benar, posisi dan arah sebagai vektor, input pemain, dan state permainan. Modul ini membangun fondasi itu tanpa bergantung pada engine tertentu.
objectives:
  - Menjelaskan struktur game loop dan peran tiap tahapnya
  - Memakai delta time agar gerak konsisten di semua frame rate
  - Memakai vektor untuk posisi, kecepatan, arah, dan jarak
  - Menangani input dan mengelola state permainan
sources:
  - repo: munificent/game-programming-patterns
    note: Bab Game Loop dan Update Method (buku gratis dibaca online)
  - repo: miloyip/game-programmer
    note: Peta bacaan dasar untuk game programmer
quiz:
  - q: "Karakter bergerak 5 piksel per frame. Di komputer 144 FPS, ia bergerak lebih cepat daripada di 30 FPS. Solusinya?"
    options: ["Kunci semua game di 30 FPS", "Kalikan kecepatan (piksel/detik) dengan delta time", "Gunakan engine lain", "Tambah RAM"]
    answer: 1
    explain: "posisi += kecepatan × delta. Kecepatan dinyatakan per detik, bukan per frame, sehingga hasilnya sama di semua FPS."
  - q: "Vektor (3, 4) memiliki panjang (magnitude)…"
    options: ["7", "5", "12", "1"]
    answer: 1
    explain: "√(3² + 4²) = √25 = 5. Menormalisasi vektor berarti membaginya dengan panjangnya sehingga panjangnya menjadi 1."
  - q: "Kenapa gerak diagonal tanpa normalisasi terasa lebih cepat?"
    options: ["Karena layar persegi panjang", "Vektor (1,1) panjangnya √2 ≈ 1,41, bukan 1", "Karena bug engine", "Karena gravitasi"]
    answer: 1
    explain: "Normalisasi arah input dulu, baru kalikan dengan kecepatan."
  - q: "Di layar menu pause, update gameplay sebaiknya…"
    options: ["Tetap berjalan seperti biasa", "Dihentikan/dilewati sesuai state permainan, sementara UI menu tetap merespons", "Menghapus semua objek", "Mengulang level"]
    answer: 1
    explain: "State permainan (menu, bermain, pause, game over) menentukan sistem mana yang aktif."
---

Ketika kamu bermain game, layar tampak ‘hidup’ terus-menerus. Di baliknya ada program yang mengulang langkah yang sama 60 kali per detik atau lebih: baca input, perbarui dunia, gambar ke layar. Memahami loop ini adalah kunci semua hal lain dalam pemrograman game.

## Game loop

Program biasa menunggu input lalu merespons. Game berbeda: dunia tetap berjalan walau pemain diam. Musuh bergerak, waktu berkurang, animasi berputar. Karena itu game memakai **game loop**:

```text
selama game berjalan:
    proses_input()       # tombol, sentuhan, gamepad
    update(delta)        # gerakkan objek, AI, fisika, aturan
    render()             # gambar semua ke layar
```

```viz
{"type":"flow","title":"Satu iterasi game loop","caption":"Pada 60 FPS, seluruh siklus ini harus selesai dalam ±16,7 ms. Jika lebih lama, frame terlewat dan game terasa patah-patah.","loop":true,"steps":[{"label":"Input","detail":"Kumpulkan event: tombol ditekan/dilepas, posisi sentuhan."},{"label":"Update","detail":"Setiap objek memperbarui dirinya: posisi, timer, keputusan AI."},{"label":"Fisika & collision","detail":"Terapkan gravitasi, deteksi tabrakan, selesaikan tumpang tindih."},{"label":"Render","detail":"Gambar background, objek, partikel, lalu UI."},{"label":"Tunggu / vsync","detail":"Sinkronkan dengan refresh layar, lalu ulangi."}]}
```

Engine seperti Godot, Unity, dan Phaser sudah menjalankan loop ini untukmu. Yang kamu tulis adalah isi fungsi update-nya: `_process(delta)` di Godot, `Update()` di Unity, `update(time, delta)` di Phaser. Tetapi memahami loop di baliknya menjelaskan banyak bug yang membingungkan.

## Delta time & frame rate

Frame rate tidak pernah konstan: berbeda antar perangkat, dan turun saat ada banyak objek. Jika gerak dihitung **per frame**, kecepatan game ikut berubah. **Delta time** adalah waktu yang berlalu sejak frame sebelumnya, dalam detik. Gerak yang benar dihitung **per detik**:

```text
# ❌ bergantung FPS
posisi.x += 5                       # 5 px/frame → 300 px/detik di 60 FPS, 720 di 144 FPS

# ✅ independen FPS
kecepatan = 300                     # px per DETIK
posisi.x += kecepatan * delta       # delta ≈ 0.0167 di 60 FPS, 0.0069 di 144 FPS
```

```viz
{"type":"game-loop"}
```

Coba simulasi di atas: turunkan FPS dengan delta time OFF dan bola melambat; nyalakan delta time dan kecepatannya tetap, hanya gerakannya yang terlihat kurang mulus.

:::info[Fixed timestep untuk fisika]
Delta yang berubah-ubah bisa membuat fisika tidak stabil (objek cepat menembus dinding saat frame lambat). Karena itu engine menjalankan fisika dengan **langkah tetap** (Godot `_physics_process` default 60 kali/detik, Unity `FixedUpdate`), terpisah dari frame render.
:::

## Koordinat & vektor

Dunia game 2D adalah bidang koordinat. Perhatikan: di kebanyakan engine 2D (termasuk Godot dan layar komputer pada umumnya), **sumbu y positif mengarah ke bawah**.

**Vektor** adalah pasangan angka `(x, y)` yang menyatakan posisi, arah, atau kecepatan. Operasi yang paling sering dipakai:

| Operasi | Rumus | Kegunaan |
|---|---|---|
| Penjumlahan | `(a.x+b.x, a.y+b.y)` | posisi + kecepatan |
| Pengurangan | `target − posisi` | arah menuju target |
| Perkalian skalar | `v × 3` | mempercepat |
| Panjang | `√(x² + y²)` | jarak |
| Normalisasi | `v / panjang(v)` | arah murni (panjang 1) |
| Dot product | `a.x·b.x + a.y·b.y` | apakah dua arah searah? (sudut pandang musuh) |

```gdscript
# GDScript (Godot): musuh mengejar pemain
var arah := (pemain.global_position - global_position).normalized()
velocity = arah * 120.0                          # 120 px/detik
if global_position.distance_to(pemain.global_position) < 24:
    serang()
```

:::warning[Gerak diagonal yang ‘curang’]
Jika input kanan + bawah menghasilkan vektor `(1, 1)`, panjangnya √2 ≈ 1,41, sehingga karakter bergerak 41% lebih cepat secara diagonal. Normalisasi arah input sebelum dikalikan kecepatan.
:::

## Menangani input

Dua cara membaca input:

- **Polling**: setiap frame, tanyakan ‘apakah tombol X sedang ditekan?’, cocok untuk gerakan kontinu.
- **Event**: sistem memberi tahu saat tombol baru ditekan/dilepas, cocok untuk aksi sekali seperti lompat atau tembak.

```gdscript
func _physics_process(delta: float) -> void:
    # polling: arah gerak dari aksi yang dipetakan di Input Map
    var arah := Input.get_vector("kiri", "kanan", "atas", "bawah")   # sudah ternormalisasi
    velocity = arah * kecepatan
    move_and_slide()

func _unhandled_input(event: InputEvent) -> void:
    # event: aksi sekali tekan
    if event.is_action_pressed("lompat") and is_on_floor():
        velocity.y = -400.0
```

Gunakan **action mapping** (‘lompat’, ‘tembak’), bukan kode tombol langsung, sehingga keyboard, gamepad, dan kontrol sentuh bisa dipetakan ke aksi yang sama, dan pemain bisa mengubah kontrolnya sendiri.

## State permainan

Game hampir selalu punya beberapa **state** dengan aturan berbeda: menu utama, bermain, pause, game over. Mengelolanya dengan tumpukan `if` boolean (`if not paused and not dead and started...`) cepat menjadi kusut. Modelkan sebagai state yang eksplisit:

```viz
{"type":"fsm","title":"State permainan","caption":"Setiap state menentukan sistem apa yang aktif: di Pause, update gameplay berhenti tetapi UI tetap responsif.","start":"Menu","states":[{"id":"Menu","detail":"Tampilkan judul & tombol mulai. Gameplay belum berjalan."},{"id":"Bermain","detail":"Input pemain, update musuh, fisika, skor aktif."},{"id":"Pause","detail":"Gameplay dibekukan; menu pause aktif."},{"id":"GameOver","detail":"Tampilkan skor akhir; simpan high score."}],"transitions":[{"from":"Menu","to":"Bermain","event":"mulai"},{"from":"Bermain","to":"Pause","event":"tekan Esc"},{"from":"Pause","to":"Bermain","event":"lanjutkan"},{"from":"Pause","to":"Menu","event":"keluar"},{"from":"Bermain","to":"GameOver","event":"nyawa habis"},{"from":"GameOver","to":"Bermain","event":"main lagi"},{"from":"GameOver","to":"Menu","event":"menu utama"}]}
```

Pola yang sama dipakai untuk karakter (diam, lari, lompat, jatuh) dan musuh (patroli, mengejar, menyerang). Pembahasannya ada di modul Pola arsitektur game.

:::latihan
Milestone: buat bola memantul di dalam layar (di Godot, Phaser, atau JavaScript canvas murni) dengan gravitasi, pantulan berkurang 10% setiap kali menyentuh lantai, dan kontrol kiri/kanan. Tampilkan FPS. Batasi FPS ke 30 lalu ke 144 (atau gunakan pengaturan vsync) dan pastikan kecepatan bola tetap sama. Tambahkan state Pause dengan tombol Esc.
:::

## Rangkuman

- Game loop: input → update → fisika → render, puluhan kali per detik.
- Nyatakan kecepatan per detik dan kalikan dengan delta time; fisika memakai fixed timestep.
- Vektor untuk posisi, arah, kecepatan; normalisasi arah input; ingat y ke bawah di 2D.
- Polling untuk gerak kontinu, event untuk aksi sekali; gunakan action mapping.
- State permainan eksplisit (menu, bermain, pause, game over) menggantikan tumpukan boolean.
