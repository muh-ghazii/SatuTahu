---
title: Engine, scene & GDScript
minutes: 40
summary: Engine game menyediakan loop, rendering, fisika, audio, dan editor sehingga kamu bisa fokus pada gameplay. Modul ini membandingkan engine populer, lalu masuk ke Godot, yaitu cara berpikir dengan node dan scene, membuat sprite beranimasi, mengatur kamera, dan menulis GDScript.
objectives:
  - Memilih engine sesuai tujuan proyek
  - Menyusun game dari node dan scene yang dapat dipakai ulang
  - Membuat sprite beranimasi dan mengatur kamera yang nyaman
  - Menulis GDScript dengan tipe statis, sinyal, dan fungsi siklus hidup
sources:
  - repo: GDQuest/learn-gdscript
    note: Urutan konsep dasar GDScript untuk pemula
  - repo: godotengine/godot-demo-projects
    note: Contoh resmi scene, animasi, dan kamera
  - repo: godotengine/godot
    note: Engine dan dokumentasi node yang dirujuk
quiz:
  - q: "Di Godot, ‘scene’ adalah…"
    options: ["Satu level saja", "Pohon node yang disimpan dan bisa dipakai ulang/diinstansiasi (karakter, peluru, level, UI)", "File gambar", "Script"]
    answer: 1
    explain: "Scene bisa sekecil satu peluru atau sebesar satu level. Scene bisa berisi instance scene lain."
  - q: "Fungsi GDScript yang dipanggil sekali saat node masuk ke scene tree adalah…"
    options: ["_process", "_ready", "_input", "_draw"]
    answer: 1
    explain: "_ready untuk inisialisasi; _process(delta) setiap frame; _physics_process(delta) setiap langkah fisika."
  - q: "Untuk sprite sheet berisi 8 frame animasi berjalan, node yang paling praktis adalah…"
    options: ["Label", "AnimatedSprite2D dengan SpriteFrames", "Camera2D", "Timer"]
    answer: 1
    explain: "AnimatedSprite2D memutar kumpulan frame dengan kecepatan tertentu; untuk animasi properti yang lebih kompleks gunakan AnimationPlayer."
  - q: "Kamera yang langsung menempel ke posisi pemain setiap frame sering terasa kaku. Perbaikan yang umum?"
    options: ["Menghapus kamera", "Position smoothing dan/atau dead zone (drag margin)", "Memperbesar sprite", "Menurunkan FPS"]
    answer: 1
    explain: "Smoothing membuat kamera mengikuti dengan lembut; dead zone membiarkan pemain bergerak sedikit tanpa menggeser kamera."
---

Membuat game tanpa engine adalah latihan yang bagus untuk memahami dasar-dasarnya, tetapi untuk menyelesaikan game, engine menghemat ribuan jam. Jalur ini memakai **Godot**: gratis, open source (lisensi MIT), ringan dijalankan di laptop biasa, dan bahasanya, GDScript, mirip Python.

## Memilih engine

```viz
{"type":"compare","title":"Engine populer untuk pemula–menengah","columns":["Godot","Unity","Phaser","Unreal"],"rows":[{"label":"Bahasa","values":["GDScript (mirip Python), C#","C#","JavaScript/TypeScript","C++ & Blueprint (visual)"]},{"label":"Kekuatan","values":["Ringan, open source, 2D sangat baik, 3D berkembang","Ekosistem & aset terbesar, mobile kuat","Langsung jalan di browser, cocok game web/HTML5","Grafis 3D kelas atas"]},{"label":"Biaya/lisensi","values":["Gratis (MIT), tanpa royalti","Gratis dengan syarat pendapatan; cek ketentuan terbaru","Gratis (MIT)","Gratis, royalti di atas ambang pendapatan"]},{"label":"Kebutuhan laptop","values":["Rendah","Sedang","Sangat rendah","Tinggi"]},{"label":"Cocok untuk","values":["Indie 2D/3D, belajar","Mobile, industri game","Game jam web, game edukasi","Game 3D realistis"]}]}
```

Tidak ada engine ‘terbaik’. Konsep di jalur ini (game loop, vektor, collision, state machine, pooling) berlaku di semua engine; yang berbeda hanya nama API-nya. Pilih yang paling cepat membuatmu **menyelesaikan** game pertama.

## Node & scene tree

Di Godot, semua adalah **node**: sprite, collider, kamera, suara, timer, tombol UI. Node disusun menjadi pohon, dan pohon itu disimpan sebagai **scene** yang bisa dipakai ulang di mana saja.

```viz
{"type":"tree","title":"Scene ‘Pemain’ dan scene ‘Level’","caption":"Scene Pemain dibuat sekali lalu diinstansiasi di setiap level. Ubah scene Pemain, semua level ikut berubah.","root":{"label":"Level1 (Node2D)","detail":"Scene level: berisi tilemap, pemain, musuh, kamera, dan UI.","children":[{"label":"TileMapLayer","detail":"Dunia dari ubin (tile): tanah, dinding, platform beserta collision-nya."},{"label":"Pemain (instance Pemain.tscn)","detail":"Scene terpisah yang diinstansiasi.","children":[{"label":"CharacterBody2D (root)","detail":"Body fisika yang dikendalikan kode (move_and_slide)."},{"label":"AnimatedSprite2D","detail":"Gambar & animasi: diam, lari, lompat."},{"label":"CollisionShape2D","detail":"Bentuk tabrakan (kapsul/persegi)."},{"label":"Camera2D","detail":"Mengikuti pemain."}]},{"label":"Musuh (instance ×3)","detail":"Scene musuh yang sama dipakai berulang."},{"label":"CanvasLayer → HUD","detail":"UI skor & nyawa; tidak ikut bergerak dengan kamera."}]}}
```

Prinsip desain scene: **satu scene, satu tanggung jawab**, dan komunikasi ‘ke atas’ lewat **sinyal** (dibahas di bawah dan di modul arsitektur), bukan dengan mencari node lain lewat path panjang seperti `get_node("../../UI/Skor")`.

## Sprite & animasi

**Sprite** adalah gambar 2D. Animasi frame-by-frame memakai **sprite sheet** (banyak frame dalam satu gambar). Di Godot:

- **AnimatedSprite2D** + resource **SpriteFrames**: daftar animasi bernama (`diam`, `lari`, `lompat`), masing-masing berisi frame dan kecepatan FPS.
- **AnimationPlayer**: menganimasikan **properti apa pun** di sepanjang timeline (posisi, warna, memanggil fungsi pada frame tertentu), cocok untuk efek dan cutscene.

```gdscript
@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D

func _update_animasi() -> void:
    if not is_on_floor():
        sprite.play("lompat")
    elif absf(velocity.x) > 10.0:
        sprite.play("lari")
    else:
        sprite.play("diam")
    if velocity.x != 0.0:
        sprite.flip_h = velocity.x < 0.0     # hadap kiri/kanan
```

Untuk pixel art, aktifkan filter **Nearest** (Project Settings → Rendering → Textures) agar gambar tidak buram saat diperbesar. Aset gratis untuk latihan bisa ditemukan lewat kurasi `ellisonleao/magictools` (perhatikan lisensi setiap aset).

## Kamera

**Camera2D** menentukan bagian dunia yang terlihat. Kamera yang baik terasa ‘tidak ada’, sedangkan yang buruk membuat pemain pusing.

```gdscript
# pengaturan bisa lewat Inspector; padanannya di kode:
camera.position_smoothing_enabled = true
camera.position_smoothing_speed = 6.0
camera.drag_horizontal_enabled = true      # dead zone: pemain bebas bergerak sedikit
camera.limit_left = 0                       # jangan tampilkan area di luar level
camera.limit_right = 3200
```

Teknik tambahan yang sering dipakai: **look-ahead** (kamera sedikit mendahului arah gerak agar pemain melihat yang akan datang) dan **screen shake** singkat saat terkena serangan. Gunakan secukupnya dan sediakan opsi untuk mematikannya.

## GDScript dasar

GDScript adalah bahasa berindentasi seperti Python, dirancang khusus untuk Godot. Gunakan **tipe statis** (opsional, tetapi sangat disarankan) untuk performa dan deteksi kesalahan lebih awal.

```gdscript
extends CharacterBody2D
class_name Pemain

signal nyawa_berubah(sisa: int)          # sinyal: memberi tahu ‘ada yang terjadi’
signal mati

@export var kecepatan: float = 200.0     # @export: bisa diatur dari Inspector
@export var lompatan: float = 420.0
var nyawa: int = 3
var gravitasi: float = ProjectSettings.get_setting("physics/2d/default_gravity")

func _ready() -> void:
    print("Pemain siap di ", global_position)

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity.y += gravitasi * delta
    if Input.is_action_just_pressed("lompat") and is_on_floor():
        velocity.y = -lompatan
    velocity.x = Input.get_axis("kiri", "kanan") * kecepatan
    move_and_slide()

func kena_serang(dmg: int = 1) -> void:
    nyawa -= dmg
    nyawa_berubah.emit(nyawa)
    if nyawa <= 0:
        mati.emit()
```

```viz
{"type":"flow","title":"Siklus hidup node di Godot","steps":[{"label":"_init()","detail":"Objek dibuat (konstruktor). Node belum ada di tree."},{"label":"_enter_tree()","detail":"Node dimasukkan ke scene tree."},{"label":"_ready()","detail":"Node dan semua anaknya siap. Tempat inisialisasi & mengambil referensi @onready."},{"label":"_process(delta)","detail":"Setiap frame render: animasi, UI, logika non-fisika."},{"label":"_physics_process(delta)","detail":"Setiap langkah fisika (fixed): gerak, collision."},{"label":"_exit_tree()","detail":"Node dikeluarkan (mis. queue_free()). Bersihkan koneksi jika perlu."}]}
```

HUD cukup **mendengarkan** sinyal pemain: `pemain.nyawa_berubah.connect(_on_nyawa_berubah)`. Pemain tidak perlu tahu HUD itu ada. Inilah pola Observer yang dibahas lebih lanjut di modul 4.

:::latihan
Milestone: di Godot, buat scene `Pemain` (CharacterBody2D + AnimatedSprite2D dengan animasi diam/lari/lompat + CollisionShape2D + Camera2D dengan smoothing & limit), level kecil dengan TileMapLayer, dan HUD yang menampilkan nyawa lewat sinyal. Gunakan tipe statis di semua script. Pelajari dulu dasar GDScript lewat aplikasi Learn GDScript dari GDQuest bila belum pernah memakai Python.
:::

## Rangkuman

- Pilih engine yang membuatmu menyelesaikan game; konsepnya bisa dipindahkan.
- Godot: semua adalah node; scene = pohon node yang bisa dipakai ulang.
- AnimatedSprite2D untuk animasi frame, AnimationPlayer untuk animasi properti; filter Nearest untuk pixel art.
- Kamera dengan smoothing, dead zone, dan limit level.
- GDScript dengan tipe statis, @export, sinyal, dan fungsi siklus hidup (_ready, _process, _physics_process).
