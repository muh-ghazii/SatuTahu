---
title: Pola arsitektur game
minutes: 40
summary: Prototipe game bisa ditulis asal jalan, tetapi saat fitur bertambah, kode cepat menjadi kusut. Modul ini membahas lima pola yang paling sering menyelamatkan proyek game, yaitu state machine, observer/sinyal, component, object pooling, serta sistem save & load.
objectives:
  - Mengganti tumpukan boolean dengan state machine yang eksplisit
  - Memisahkan sistem dengan pola observer/sinyal
  - Menyusun perilaku dari komponen yang dapat dipakai ulang
  - Memakai object pooling dan membuat sistem save & load yang aman
sources:
  - repo: munificent/game-programming-patterns
    note: Bab State, Observer, Component, dan Object Pool (buku gratis dibaca online)
  - repo: UnityCommunity/UnityLibrary
    note: Padanan implementasi pola-pola tersebut di Unity/C#
quiz:
  - q: "Kode karakter berisi if is_jumping and not is_attacking and not is_dashing and ... yang semakin panjang. Pola yang tepat?"
    options: ["Singleton", "State machine", "Object pool", "Global variable"]
    answer: 1
    explain: "Setiap state (diam, lari, lompat, serang, dash) menjadi unit terpisah dengan transisi yang jelas."
  - q: "Ketika pemain mengambil koin, HUD, sistem suara, dan achievement perlu tahu. Pendekatan paling longgar ketergantungannya?"
    options: ["Koin memanggil HUD, audio, dan achievement satu per satu", "Koin memancarkan sinyal ‘diambil’ dan sistem lain mendengarkan", "HUD mengecek semua koin setiap frame", "Gabungkan semua ke satu script"]
    answer: 1
    explain: "Observer: pengirim tidak perlu tahu siapa saja pendengarnya, sehingga menambah sistem baru tidak mengubah kode koin."
  - q: "Object pooling bermanfaat terutama untuk…"
    options: ["Objek yang dibuat sekali seumur game", "Objek yang sangat sering dibuat dan dihancurkan, seperti peluru dan partikel", "Menyimpan game", "UI menu"]
    answer: 1
    explain: "Memakai ulang objek mengurangi biaya alokasi dan lonjakan garbage collection yang menyebabkan stutter."
  - q: "Format penyimpanan yang lebih aman dan mudah dimigrasikan daripada menyimpan seluruh objek mentah adalah…"
    options: ["Menyimpan node scene apa adanya", "Data terstruktur (mis. JSON/Resource) berisi field yang dibutuhkan + nomor versi", "Screenshot", "Tidak menyimpan apa pun"]
    answer: 1
    explain: "Simpan data, bukan objek, dan sertakan versi agar save lama tetap bisa dibaca setelah update game."
---

Kebanyakan game indie yang tidak selesai tidak gagal karena idenya buruk, tetapi karena kodenya menjadi terlalu sulit diubah. Pola arsitektur adalah solusi yang sudah teruji untuk masalah yang berulang. Kuncinya: gunakan saat masalahnya muncul, bukan dipaksakan sejak baris pertama.

## State machine

Tanda kamu butuh **state machine**: kumpulan boolean (`is_jumping`, `is_attacking`, `is_dashing`) dengan kombinasi yang seharusnya mustahil (menyerang sambil dash sambil jongkok) tetapi tetap bisa terjadi karena bug.

```viz
{"type":"fsm","title":"State machine karakter","caption":"Setiap state hanya mengurus perilakunya sendiri dan memutuskan kapan pindah. Kombinasi yang mustahil memang tidak bisa terjadi.","start":"Diam","states":[{"id":"Diam","detail":"Animasi idle. Bisa lari, lompat, atau serang."},{"id":"Lari","detail":"Gerak horizontal + animasi lari."},{"id":"Lompat","detail":"Kecepatan ke atas; kontrol udara terbatas."},{"id":"Jatuh","detail":"Gravitasi; menunggu menyentuh tanah."},{"id":"Serang","detail":"Hitbox aktif beberapa frame; tidak bisa bergerak."},{"id":"Terluka","detail":"Knockback + kebal sesaat."}],"transitions":[{"from":"Diam","to":"Lari","event":"input arah"},{"from":"Lari","to":"Diam","event":"input dilepas"},{"from":"Diam","to":"Lompat","event":"lompat"},{"from":"Lari","to":"Lompat","event":"lompat"},{"from":"Lompat","to":"Jatuh","event":"kecepatan y > 0"},{"from":"Jatuh","to":"Diam","event":"mendarat"},{"from":"Diam","to":"Serang","event":"serang"},{"from":"Serang","to":"Diam","event":"animasi selesai"},{"from":"Lari","to":"Terluka","event":"kena musuh"},{"from":"Terluka","to":"Diam","event":"0,5 detik berlalu"}]}
```

Implementasi sederhana dengan `enum` + `match` sudah cukup untuk banyak game:

```gdscript
enum State { DIAM, LARI, LOMPAT, JATUH, SERANG }
var state := State.DIAM

func _physics_process(delta: float) -> void:
    match state:
        State.DIAM:
            if Input.is_action_just_pressed("lompat"): ganti(State.LOMPAT)
            elif Input.get_axis("kiri", "kanan") != 0.0: ganti(State.LARI)
        State.LARI:
            gerak_horizontal(delta)
            if Input.get_axis("kiri", "kanan") == 0.0: ganti(State.DIAM)
        State.LOMPAT, State.JATUH:
            gerak_udara(delta)
            if is_on_floor(): ganti(State.DIAM)
    move_and_slide()

func ganti(baru: State) -> void:
    # tempat terpusat untuk efek masuk/keluar state: animasi, suara, partikel
    state = baru
    $AnimatedSprite2D.play(State.keys()[baru].to_lower())
```

Untuk karakter yang kompleks, setiap state bisa menjadi node/kelas tersendiri dengan `masuk()`, `update()`, `keluar()`. Pola yang sama juga dipakai untuk AI musuh dan alur game (menu → bermain → pause).

## Observer & signal

**Observer**: objek memancarkan peristiwa (‘aku diambil’, ‘nyawaku berubah’) dan objek lain yang tertarik **berlangganan**. Pengirim tidak tahu, dan tidak perlu tahu, siapa pendengarnya. Di Godot ini adalah **sinyal**.

```viz
{"type":"sequence","title":"Satu sinyal, banyak pendengar","caption":"Menambah fitur baru (mis. statistik) cukup dengan berlangganan sinyal yang sama. Kode koin tidak berubah sama sekali.","actors":["Koin","HUD","Audio","Achievement"],"messages":[{"from":0,"to":0,"label":"pemain menyentuh","note":"Area2D koin mendeteksi pemain."},{"from":0,"to":1,"label":"diambil(nilai=10)","note":"HUD menambah skor di layar."},{"from":0,"to":2,"label":"diambil(nilai=10)","note":"Audio memutar suara ‘cling’."},{"from":0,"to":3,"label":"diambil(nilai=10)","note":"Achievement menghitung: 100 koin → buka lencana."}]}
```

```gdscript
# koin.gd
signal diambil(nilai: int)
func _on_body_entered(body: Node2D) -> void:
    if body is Pemain:
        diambil.emit(10)
        queue_free()

# Untuk peristiwa global, banyak proyek memakai ‘event bus’: autoload berisi sinyal bersama.
# EventBus.gd (Autoload):  signal koin_diambil(nilai: int)
# koin:   EventBus.koin_diambil.emit(10)
# HUD:    EventBus.koin_diambil.connect(_tambah_skor)
```

Aturan praktis Godot: **panggil ke bawah, sinyal ke atas**. Induk boleh memanggil fungsi anaknya; anak memberi tahu induk lewat sinyal.

## Component pattern

Pewarisan dalam (`Musuh → MusuhTerbang → MusuhTerbangMenembak`) cepat menemui jalan buntu: bagaimana jika butuh musuh darat yang menembak? **Component pattern** menyusun perilaku dari bagian kecil yang dapat dipakai ulang.

```viz
{"type":"tree","title":"Entitas dari komponen","caption":"Di Godot, komponen bisa berupa node anak dengan script sendiri. Musuh baru = kombinasi komponen yang berbeda, tanpa kelas baru.","root":{"label":"Entitas","detail":"Node induk sederhana: hanya merangkai komponen.","children":[{"label":"Pemain","detail":"Health + Hurtbox + Gerak (input) + Penembak.","children":[{"label":"HealthComponent","detail":"nyawa, kena_damage(), sinyal mati & berubah."},{"label":"HurtboxComponent (Area2D)","detail":"Menerima serangan, meneruskan ke HealthComponent."},{"label":"InputMoveComponent","detail":"Gerak dari input pemain."}]},{"label":"Slime","detail":"Health + Hurtbox + Hitbox + PatroliComponent."},{"label":"Turret","detail":"Health + Hurtbox + PenembakComponent (tanpa gerak)."},{"label":"Peti","detail":"Health + Hurtbox + DropItemComponent saat hancur."}]}}
```

```gdscript
# health_component.gd: dipakai pemain, musuh, peti, apa saja
class_name HealthComponent extends Node
signal berubah(sisa: int)
signal habis
@export var maks := 3
@onready var sisa := maks
func kena(dmg: int) -> void:
    sisa = maxi(sisa - dmg, 0)
    berubah.emit(sisa)
    if sisa == 0: habis.emit()
```

## Object pooling

Membuat dan menghancurkan ratusan peluru atau partikel per detik memicu alokasi memori dan *garbage collection* yang bisa menyebabkan **stutter**. **Object pool** membuat objek di awal lalu **memakainya ulang**.

```viz
{"type":"flow","title":"Siklus objek dalam pool","loop":true,"steps":[{"label":"Siapkan","detail":"Saat level dimuat, buat 50 peluru tidak aktif (tersembunyi, fisika mati)."},{"label":"Ambil","detail":"Saat menembak, ambil peluru tidak aktif dari pool, atur posisi & arah, aktifkan."},{"label":"Pakai","detail":"Peluru bergerak dan mengenai sesuatu atau keluar layar."},{"label":"Kembalikan","detail":"Alih-alih queue_free(), nonaktifkan dan kembalikan ke pool."}]}
```

```gdscript
class_name PoolPeluru extends Node
@export var scene_peluru: PackedScene
var _bebas: Array[Peluru] = []

func _ready() -> void:
    for i in 50:
        var p: Peluru = scene_peluru.instantiate()
        p.selesai.connect(_kembalikan.bind(p))
        _kembalikan(p)
        add_child(p)

func ambil() -> Peluru:
    return _bebas.pop_back() if not _bebas.is_empty() else null   # atau buat baru jika habis

func _kembalikan(p: Peluru) -> void:
    p.hide(); p.set_physics_process(false)
    _bebas.append(p)
```

:::info
Jangan melakukan pooling untuk semuanya. Untuk objek yang jarang dibuat, `instantiate()` biasa sudah cukup. Ukur dengan profiler dulu: pooling menambah kompleksitas (lupa me-reset state objek adalah bug klasik).
:::

## Save & load

Simpan **data**, bukan objek. Kumpulkan informasi yang dibutuhkan (level, posisi checkpoint, nyawa, koin, item, pengaturan) ke struktur sederhana, sertakan **versi**, lalu tulis ke `user://` (folder data pengguna yang disediakan Godot di setiap platform).

```gdscript
const PATH := "user://save.json"
const VERSI := 2

func simpan(data: Dictionary) -> void:
    data["versi"] = VERSI
    var tmp := PATH + ".tmp"
    var f := FileAccess.open(tmp, FileAccess.WRITE)
    f.store_string(JSON.stringify(data))
    f.close()
    DirAccess.rename_absolute(tmp, PATH)       # tulis ke file sementara lalu ganti: save tidak rusak jika crash di tengah

func muat() -> Dictionary:
    if not FileAccess.file_exists(PATH):
        return {}
    var data = JSON.parse_string(FileAccess.get_file_as_string(PATH))
    if typeof(data) != TYPE_DICTIONARY:
        return {}                              # file rusak: jangan crash
    if data.get("versi", 1) < VERSI:
        data = migrasi(data)                   # save dari versi lama tetap bisa dibaca
    return data
```

Hal yang sering terlupa: **migrasi versi** (update game mengubah format save), **penulisan atomik** (crash saat menyimpan tidak boleh merusak save lama), dan **slot** ganda. Untuk game offline, enkripsi save biasanya tidak sepadan, karena pemain yang ingin ‘curang’ di game single-player-nya sendiri tidak merugikan siapa pun.

:::latihan
Milestone: refactor platformer dari modul sebelumnya. (1) State machine untuk pemain & musuh. (2) Event bus untuk koin, kematian, dan checkpoint, sehingga HUD/audio tidak memanggil langsung. (3) HealthComponent dipakai pemain, musuh, dan peti. (4) Pool untuk peluru/partikel. (5) Save/load checkpoint + koin dengan versi dan penulisan atomik. Catat berapa banyak kode yang berkurang atau menjadi lebih sederhana.
:::

## Rangkuman

- State machine menggantikan tumpukan boolean; berlaku untuk karakter, AI, dan alur game.
- Observer/sinyal: ‘panggil ke bawah, sinyal ke atas’; event bus untuk peristiwa global.
- Component: susun perilaku dari bagian kecil, bukan pewarisan dalam.
- Object pooling untuk objek yang sering dibuat-hancur; ukur dulu, dan reset state saat dipakai ulang.
- Save data + versi + penulisan atomik + migrasi.
