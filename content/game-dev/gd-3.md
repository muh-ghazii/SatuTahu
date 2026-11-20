---
title: Fisika, collision & gameplay
minutes: 40
summary: Gerakan yang ‘enak’ adalah separuh kesenangan sebuah game. Modul ini membahas fisika sederhana (kecepatan, akselerasi, gravitasi), cara mendeteksi tabrakan, jenis physics body dan collision layer di Godot, teknik game feel yang membuat kontrol terasa responsif, dan dasar merancang level.
objectives:
  - Menerapkan kecepatan, akselerasi, gesekan, dan gravitasi
  - Menjelaskan dan mengimplementasikan deteksi tabrakan AABB
  - Memilih jenis physics body dan mengatur collision layer/mask
  - Meningkatkan game feel dan merancang level yang mengajarkan mekanik
sources:
  - repo: godotengine/godot-demo-projects
    note: Demo platformer dan physics sebagai rujukan implementasi
  - repo: phaserjs/phaser
    note: Pembanding sistem fisika arcade di game web
quiz:
  - q: "Dua kotak A (x 0–10) dan B (x 12–20) di sumbu x. Apakah mereka bertabrakan di sumbu x?"
    options: ["Ya", "Tidak, karena A.kanan (10) < B.kiri (12)", "Tergantung warna", "Selalu ya"]
    answer: 1
    explain: "AABB butuh tumpang tindih di KEDUA sumbu. Di sumbu x saja sudah ada celah, jadi tidak bertabrakan."
  - q: "Node Godot untuk area pemicu (mis. koin, zona checkpoint) yang mendeteksi masuknya objek tanpa menghalanginya adalah…"
    options: ["StaticBody2D", "Area2D", "RigidBody2D", "Sprite2D"]
    answer: 1
    explain: "Area2D memancarkan sinyal body_entered/area_entered tanpa memberi respons fisik."
  - q: "Coyote time adalah…"
    options: ["Musuh berbentuk coyote", "Jendela waktu singkat setelah meninggalkan pinggir platform saat pemain masih boleh melompat", "Mode lambat", "Bug fisika"]
    answer: 1
    explain: "Sekitar 0,1 detik toleransi membuat lompatan terasa adil, karena otak pemain ‘merasa’ masih di tepi."
  - q: "Collision layer vs mask: jika peluru pemain tidak boleh mengenai pemain sendiri, maka…"
    options: ["Hapus collider pemain", "Mask peluru tidak menyertakan layer pemain", "Layer dan mask harus sama", "Pakai Area2D di pemain"]
    answer: 1
    explain: "Layer = ‘aku berada di lapisan apa’; mask = ‘aku mendeteksi lapisan apa’."
---

Pemain jarang memuji fisika game secara langsung, tetapi mereka langsung merasakan bila ada yang salah: karakter licin seperti di atas es, lompatan yang ‘mengambang’, atau peluru yang menembus dinding. Modul ini membahas hal-hal yang membuat gameplay terasa solid.

## Kecepatan, akselerasi & gravitasi

Tiga besaran membentuk gerak:

- **Posisi** berubah karena **kecepatan**: `posisi += kecepatan × delta`
- **Kecepatan** berubah karena **akselerasi**: `kecepatan += akselerasi × delta`
- **Gravitasi** adalah akselerasi ke bawah yang konstan.

Karakter platformer yang terasa enak hampir tidak pernah langsung mencapai kecepatan penuh. Ia **berakselerasi** dan **melambat** dengan gesekan:

```gdscript
@export var kecepatan_maks := 220.0
@export var akselerasi := 1400.0
@export var gesekan := 1800.0

func _physics_process(delta: float) -> void:
    var arah := Input.get_axis("kiri", "kanan")
    if arah != 0.0:
        velocity.x = move_toward(velocity.x, arah * kecepatan_maks, akselerasi * delta)
    else:
        velocity.x = move_toward(velocity.x, 0.0, gesekan * delta)

    if not is_on_floor():
        # gravitasi lebih besar saat jatuh: lompatan terasa ‘berat’ dan tegas
        var g := gravitasi * (1.6 if velocity.y > 0.0 else 1.0)
        velocity.y = minf(velocity.y + g * delta, 900.0)     # batasi kecepatan jatuh
    move_and_slide()
```

```viz
{"type":"game-loop"}
```

Nilai seperti akselerasi, gesekan, dan pengali gravitasi saat jatuh adalah **parameter desain**. Jadikan `@export` agar bisa diatur dari Inspector sambil game berjalan, sampai terasa pas.

## Collision detection (AABB)

Cara paling sederhana dan cepat mendeteksi tabrakan adalah **AABB** (*Axis-Aligned Bounding Box*): bungkus setiap objek dengan kotak yang sisinya sejajar sumbu. Dua kotak bertabrakan jika dan hanya jika keduanya tumpang tindih di **sumbu x dan sumbu y sekaligus**.

```viz
{"type":"aabb"}
```

```gdscript
func aabb_tabrakan(a: Rect2, b: Rect2) -> bool:
    return a.position.x < b.end.x and a.end.x > b.position.x \
       and a.position.y < b.end.y and a.end.y > b.position.y
# Godot sudah menyediakannya: a.intersects(b)
```

Engine fisika menangani bentuk lain (lingkaran, kapsul, poligon) dan memakai pemeriksaan bertahap: **broad phase** (AABB murah untuk menyaring pasangan yang mungkin bertabrakan) lalu **narrow phase** (perhitungan presisi). Masalah klasik yang perlu diketahui adalah **tunneling**: objek sangat cepat ‘melompati’ dinding tipis di antara dua langkah fisika. Solusinya: batasi kecepatan, perbesar collider, atau aktifkan *continuous collision detection*.

## Physics body & layer

Godot menyediakan beberapa jenis node fisika dengan perilaku berbeda:

```viz
{"type":"compare","title":"Jenis physics body di Godot 2D","columns":["StaticBody2D","CharacterBody2D","RigidBody2D","Area2D"],"rows":[{"label":"Digerakkan oleh","values":["Tidak bergerak (atau digerakkan animasi)","Kode kamu (move_and_slide)","Simulasi fisika (gaya, massa)","Tidak menghalangi, hanya mendeteksi"]},{"label":"Contoh","values":["Lantai, dinding, platform","Pemain, musuh","Peti yang bisa didorong, bola, puing","Koin, zona jebakan, checkpoint, hitbox serangan"]},{"label":"Sinyal/cara pakai","values":["Cukup ada CollisionShape","is_on_floor(), get_slide_collision()","apply_impulse(), body_entered","body_entered / area_entered"]}]}
```

**Collision layer & mask** mengatur siapa bertabrakan dengan siapa:

- **Layer**: ‘aku berada di lapisan apa’.
- **Mask**: ‘aku mendeteksi/bertabrakan dengan lapisan apa’.

| Objek | Layer | Mask |
|---|---|---|
| Dunia (tilemap) | 1 | — |
| Pemain | 2 | 1 (dunia), 3 (musuh), 5 (pickup) |
| Musuh | 3 | 1, 2 |
| Peluru pemain | 4 | 1 (dunia), 3 (musuh) dan **bukan** 2 (pemain) |
| Pickup (Area2D) | 5 | 2 (hanya pemain yang bisa mengambil) |

Beri nama setiap layer di Project Settings → Layer Names agar tidak menghafal angka.

## Game feel

**Game feel** (*juice*) adalah kumpulan detail kecil yang membuat aksi terasa responsif dan memuaskan. Banyak di antaranya ‘curang’ demi pemain:

- **Coyote time**: masih boleh melompat ±0,1 detik setelah keluar dari tepi platform.
- **Jump buffering**: tombol lompat yang ditekan sedikit sebelum mendarat tetap diingat dan dieksekusi saat mendarat.
- **Variable jump height**: lepas tombol lebih awal → lompatan lebih rendah (potong kecepatan naik).
- **Umpan balik**: partikel debu saat mendarat, *hit stop* (jeda 2–4 frame saat serangan mengenai), screen shake kecil, suara, kedipan saat terkena.

```gdscript
var coyote := 0.0
var buffer := 0.0

func _physics_process(delta: float) -> void:
    coyote = 0.1 if is_on_floor() else maxf(coyote - delta, 0.0)
    buffer = 0.12 if Input.is_action_just_pressed("lompat") else maxf(buffer - delta, 0.0)
    if buffer > 0.0 and coyote > 0.0:
        velocity.y = -lompatan
        buffer = 0.0; coyote = 0.0
    if Input.is_action_just_released("lompat") and velocity.y < 0.0:
        velocity.y *= 0.5                     # variable jump height
```

:::tip
Bandingkan game dengan dan tanpa ‘juice’ menggunakan tombol debug. Perbedaannya sering mengejutkan, padahal mekaniknya sama persis.
:::

## Level design dasar

Level yang baik **mengajar tanpa tutorial teks**. Prinsip yang dipakai banyak game klasik:

```viz
{"type":"flow","title":"Memperkenalkan mekanik baru dalam satu level","caption":"Pola ‘perkenalkan → kembangkan → putar balik → kuasai’ (mirip struktur kishōtenketsu) membuat pemain belajar lewat bermain.","steps":[{"label":"Perkenalkan dengan aman","detail":"Mekanik baru (mis. platform yang runtuh) muncul pertama kali di tempat yang aman: jika gagal, pemain tidak mati."},{"label":"Kembangkan","detail":"Gunakan mekanik itu dengan sedikit tekanan: celah lebih lebar, waktu lebih singkat."},{"label":"Putar balik","detail":"Kombinasikan dengan mekanik lain atau balik ekspektasi (platform runtuh di atas jurang + musuh)."},{"label":"Uji penguasaan","detail":"Tantangan akhir yang menuntut pemahaman penuh; berikan hadiah yang memuaskan."}]}
```

Panduan praktis:

- **Ritme**: selingi bagian tegang dengan area istirahat (checkpoint, koleksi).
- **Keterbacaan**: pemain harus bisa membaca apa yang berbahaya (warna, bentuk konsisten); bahaya yang tidak terlihat terasa tidak adil.
- **Jalur & rahasia**: jalur utama jelas, jalur opsional memberi hadiah bagi yang penasaran.
- **Greybox dulu**: bangun level dengan kotak abu-abu, mainkan, lalu baru percantik dengan seni.

:::latihan
Milestone: platformer 3 level dengan akselerasi/gesekan, gravitasi jatuh lebih berat, coyote time, jump buffering, variable jump height, musuh patroli (CharacterBody2D), koin (Area2D), dan checkpoint. Atur collision layer dengan nama. Setiap level memperkenalkan satu mekanik baru mengikuti pola di atas. Minta 3 teman memainkannya tanpa penjelasan dan amati di mana mereka gagal.
:::

## Rangkuman

- Posisi ← kecepatan ← akselerasi; gunakan move_toward untuk akselerasi/gesekan; gravitasi jatuh lebih berat.
- AABB: tumpang tindih di x **dan** y; engine memakai broad phase + narrow phase; waspadai tunneling.
- StaticBody untuk dunia, CharacterBody untuk karakter, RigidBody untuk simulasi, Area untuk pemicu; atur layer & mask.
- Game feel: coyote time, jump buffering, variable jump, dan umpan balik visual/suara.
- Level mengajar lewat struktur: perkenalkan → kembangkan → putar balik → kuasai; greybox dulu.
