export type CheatItem = {
  title: string;
  code: string;
  note: string;
};

export type MistakeItem = {
  wrong: string;
  fix: string;
};

export type FlashcardItem = {
  q: string;
  a: string;
};

export type TrackGuide = {
  slug: string;
  /** Penjelasan super ramah pemula pakai analogi kehidupan nyata */
  analogy: string;
  /** Panduan belajar: mana yang wajib dikuasai duluan */
  focusTip: string;
  /** Cheatsheet syntax/perintah/pola siap salin */
  cheats: CheatItem[];
  /** Kesalahan umum pemula & cara memperbaikinya */
  mistakes: MistakeItem[];
  /** Flashcard interaktif untuk menguji hafalan & intuisi */
  flashcards: FlashcardItem[];
};

export const trackGuides: Record<string, TrackGuide> = {
  fondasi: {
    slug: "fondasi",
    analogy:
      "Belajar fondasi CS ibarat belajar membaca resep dan mengenali alat dapur sebelum jadi koki. Bahasa pemrograman hanyalah pisau; algoritma & struktur data adalah cara kamu memasak dengan rapi dan cepat.",
    focusTip:
      "Jangan hafal sintaks di luar kepala. Latih memecah masalah jadi langkah kecil (pseudocode), jalankan kode sesering mungkin, dan biasakan membaca pesan error dari baris paling bawah.",
    cheats: [
      { title: "Perulangan & Comprehensions (Python)", code: "kuadrat = [x * x for x in range(1, 6) if x % 2 == 1]\n# [1, 9, 25]", note: "Ringkas untuk filter & transformasi list." },
      { title: "Kompleksitas Big-O Inti", code: "O(1)      → akses array / dict key\nO(log n)  → binary search\nO(n)      → loop 1x seluruh data\nO(n log n)→ merge/timsort\nO(n²)     → nested loop", note: "Cek selalu sebelum menulis loop bersarang pada data besar." },
      { title: "Alur Git Harian", code: "git status\ngit add .\ngit commit -m \"feat: tambah kalkulator\"\ngit pull --rebase origin main\ngit push", note: "Commit kecil dan sering jauh lebih aman daripada 1 commit raksasa." },
      { title: "SQL CRUD Minimal", code: "SELECT nama, nilai FROM siswa WHERE nilai >= 80 ORDER BY nilai DESC LIMIT 5;", note: "Urutan tulis: SELECT → FROM → WHERE → ORDER BY → LIMIT." },
    ],
    mistakes: [
      { wrong: "Langsung loncat ke framework besar sebelum paham variabel, loop, fungsi, dan struktur data.", fix: "Selesaikan dulu fd-1 s.d. fd-4; 4 minggu fondasi menghemat berbulan-bulan kebingungan." },
      { wrong: "Menyalin kode dari tutorial tanpa mengetik ulang atau mengubah parameternya.", fix: "Setelah kode jalan, sengaja ubah atau rusak 1 baris lalu amati error-nya agar benar-benar paham." },
      { wrong: "Panik melihat pesan error merah panjang di terminal.", fix: "Baca baris terakhir dulu (jenis error & pesan), lalu lihat nomor baris file milikmu." },
    ],
    flashcards: [
      { q: "Bedanya RAM dan SSD?", a: "RAM adalah memori kerja super cepat tapi volatile (hilang saat listrik mati). SSD menyimpan file secara permanen (non-volatile)." },
      { q: "Kapan pakai Hash Table (dict) vs Array (list)?", a: "Pakai dict saat butuh pencarian cepat O(1) berdasar kunci unik; pakai list saat urutan & indeks penting." },
      { q: "Syarat wajib Binary Search?", a: "Data harus sudah terurut (sorted). Setiap langkah membuang separuh pencarian → O(log n)." },
      { q: "Apa bedanya Stack dan Queue?", a: "Stack = LIFO (tumpukan piring, terakhir masuk pertama keluar). Queue = FIFO (antrean kasir, pertama masuk pertama keluar)." },
      { q: "Apa itu rekursi dan syarat berhentinya?", a: "Fungsi yang memanggil dirinya sendiri. Wajib punya base case agar tidak infinite recursion." },
      { q: "Bedanya Process dan Thread?", a: "Process punya ruang memori sendiri (terisolasi). Thread berbagi memori di dalam satu process sehingga komunikasi lebih cepat tapi rawan race condition." },
    ],
  },

  frontend: {
    slug: "frontend",
    analogy:
      "HTML adalah kerangka bangunan dan maknanya, CSS adalah cat, tata ruang, dan dekorasinya, sedangkan JavaScript adalah listrik, sakelar, dan pintu otomatis yang merespons penghuni.",
    focusTip:
      "Kuasai Flexbox, Grid, dan JavaScript murni (DOM, Promise, array method) sebelum menyentuh React. 80% masalah React sebenarnya masalah JavaScript atau CSS.",
    cheats: [
      { title: "Grid Responsif Tanpa Media Query", code: ".grid-kartu {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));\n  gap: 1rem;\n}", note: "Otomatis 1 kolom di HP, 2 di tablet, 3+ di desktop." },
      { title: "Pusatkan Elemen 2 Baris", code: ".center {\n  display: grid;\n  place-items: center;\n}", note: "Cara termudah memusatkan konten horizontal & vertikal." },
      { title: "Fetch + Async/Await Aman", code: "const res = await fetch('/api/produk');\nif (!res.ok) throw new Error(`HTTP ${res.status}`);\nconst data = await res.json();", note: "fetch() tidak melempar error untuk HTTP 404/500 — cek res.ok!" },
      { title: "Array Transformasi Wajib (JS)", code: "const total = items\n  .filter(x => x.aktif)\n  .map(x => x.harga)\n  .reduce((acc, h) => acc + h, 0);", note: "Pola immutable ini dipakai setiap hari di React." },
    ],
    mistakes: [
      { wrong: "Memakai <div onClick={...}> untuk tombol atau link.", fix: "Selalu pakai <button> untuk aksi dan <a> untuk navigasi agar bisa diakses keyboard & screen reader." },
      { wrong: "Memutasi state React langsung (arr.push(item); setArr(arr)).", fix: "Buat salinan baru: setArr(prev => [...prev, item]) agar React mendeteksi perubahan." },
      { wrong: "Menaruh efek fetch tanpa cleanup atau dependency yang benar di useEffect.", fix: "Pakai AbortController untuk membatalkan request lama atau gunakan library data fetching." },
    ],
    flashcards: [
      { q: "Bedanya box-sizing: border-box vs content-box?", a: "border-box memasukkan padding dan border ke dalam width/height sehingga ukuran kotak jauh lebih mudah diprediksi." },
      { q: "Kapan pakai Flexbox vs CSS Grid?", a: "Flexbox untuk tata letak 1 dimensi (baris ATAU kolom). Grid untuk 2 dimensi (baris DAN kolom sekaligus)." },
      { q: "Apa itu Closure di JavaScript?", a: "Fungsi yang tetap mengingat variabel dari lingkup (scope) luarnya meski fungsi luar tersebut sudah selesai dieksekusi." },
      { q: "Apa itu Event Loop?", a: "Mekanisme JS menjalankan kode async: call stack dikosongkan dulu, lalu microtask (Promise), baru macrotask (setTimeout)." },
      { q: "Kenapa prop key penting saat me-render list di React?", a: "Agar React bisa melacak elemen mana yang berubah, ditambah, atau dihapus tanpa merender ulang seluruh daftar." },
      { q: "Apa arti pendekatan mobile-first di CSS?", a: "Tulis style dasar untuk layar HP kecil dulu, lalu tambahkan @media (min-width: ...) untuk layar lebih lebar." },
    ],
  },

  backend: {
    slug: "backend",
    analogy:
      "Jika frontend adalah ruang makan restoran yang dilihat tamu, backend adalah dapur, gudang bahan (database), dan sistem pesanan (API) yang menjaga makanan keluar cepat, benar, dan aman meski restoran sedang penuh.",
    focusTip:
      "Pilih SATU bahasa saja (Node.js/TypeScript, Go, atau Python) dan dalami bersama PostgreSQL + REST API + Docker. Jangan gonta-ganti bahasa tiap bulan.",
    cheats: [
      { title: "Status Code HTTP Wajib Hafal", code: "200 OK · 201 Created · 204 No Content\n400 Bad Request · 401 Unauthorized · 403 Forbidden · 404 Not Found\n409 Conflict · 429 Too Many Requests\n500 Internal Error · 503 Unavailable", note: "4xx salah dari klien, 5xx salah dari server." },
      { title: "Parameterized Query (Anti SQLi)", code: "// AMAN — data dipisah dari query\nawait db.query('SELECT * FROM users WHERE email = $1', [email]);", note: "Jangan pernah menyambung string input user ke SQL!" },
      { title: "Cek Performa Query PostgreSQL", code: "EXPLAIN ANALYZE\nSELECT * FROM orders WHERE user_id = 42 AND status = 'paid';", note: "Cari 'Seq Scan' pada tabel besar — tandanya butuh INDEX." },
      { title: "Docker Compose Minimal", code: "services:\n  db:\n    image: postgres:16-alpine\n    environment: { POSTGRES_PASSWORD: dev }\n    ports: ['5432:5432']", note: "Jalankan database lokal bersih tanpa mengotori laptop." },
    ],
    mistakes: [
      { wrong: "Menyimpan password plain text atau pakai MD5/SHA-256 biasa.", fix: "Selalu hash dengan Argon2id atau bcrypt (ada salt & lambat secara sengaja)." },
      { wrong: "N+1 Query Problem: query database di dalam loop for.", fix: "Gunakan JOIN atau WHERE id IN (...) agar hanya 1–2 query saja." },
      { wrong: "Mempercayai data dari client (harga, role, user_id dari body).", fix: "Selalu validasi input di server dan ambil identitas user dari token/session yang terverifikasi." },
    ],
    flashcards: [
      { q: "Apa itu ACID pada transaksi database?", a: "Atomicity (semua sukses/batal), Consistency (aturan terjaga), Isolation (transaksi paralel tak saling rusak), Durability (permanen)." },
      { q: "Bedanya 401 Unauthorized dan 403 Forbidden?", a: "401 = belum login / token tidak valid. 403 = sudah login tapi tidak punya izin mengakses resource itu." },
      { q: "Apa fungsi Index di database?", a: "Mempercepat pembacaan (SELECT) seperti daftar isi buku, dengan sedikit biaya tambahan saat INSERT/UPDATE dan ruang disk." },
      { q: "Bedanya Scaling Vertikal vs Horizontal?", a: "Vertikal = perbesar CPU/RAM 1 server. Horizontal = tambah jumlah server di belakang load balancer." },
      { q: "Apa arti idempotent pada method HTTP?", a: "Dipanggil 1x atau 5x hasilnya sama (GET, PUT, DELETE). POST biasanya tidak idempotent." },
      { q: "Kapan memakai Redis/Cache?", a: "Untuk data yang sering dibaca tapi jarang berubah, session, atau rate limiting — jangan lupa tentukan TTL!" },
    ],
  },

  web: {
    slug: "web",
    analogy:
      "Fullstack developer seperti arsitek sekaligus kontraktor rumah kecil: ia tahu bagaimana pondasi database, pipa API, dan desain interior UI saling menyambung jadi satu produk utuh.",
    focusTip:
      "Bangun proyek kecil end-to-end sedini mungkin (mis. CRUD catatan + login + deploy). Pengalaman menghubungkan frontend, API, DB, dan deploy sekali jauh lebih berharga dari 10 tutorial terpisah.",
    cheats: [
      { title: "Kontrak API JSON Konsisten", code: "// Sukses: { data: { id: 1, nama: 'Tahu' } }\n// Error:  { error: { code: 'NOT_FOUND', message: 'Produk tidak ada' } }", note: "Format seragam memudahkan penanganan error di frontend." },
      { title: "Env Variable di Next.js", code: "DATABASE_URL=postgres://...          # server only\nNEXT_PUBLIC_APP_URL=https://...      # boleh dibaca browser", note: "Jangan pernah beri awalan NEXT_PUBLIC_ pada secret key!" },
      { title: "Checklist Sebelum Deploy", code: "1. Env production terisi\n2. Migrasi DB sudah jalan\n3. Validasi input di server\n4. Error & 404 page rapi\n5. Uji di layar HP 375px", note: "Cek 5 hal ini setiap sebelum merilis ke publik." },
    ],
    mistakes: [
      { wrong: "Menaruh secret API key di kode frontend / komponen 'use client'.", fix: "Panggil API pihak ketiga yang butuh secret lewat Route Handler / Server Action." },
      { wrong: "Hanya validasi form di frontend (HTML/React) tanpa validasi ulang di backend.", fix: "Validasi frontend untuk UX cepat; validasi backend untuk keamanan wajib." },
      { wrong: "Mengerjakan fitur terlalu besar tanpa pernah men-deploy versi pertama.", fix: "Deploy MVP kecil di minggu pertama, lalu iterasi fitur satu per satu." },
    ],
    flashcards: [
      { q: "Bedanya SSR, SSG, dan CSR?", a: "SSG dirender saat build; SSR dirender di server tiap request; CSR dirender di browser pakai JS." },
      { q: "Apa itu CORS dan kenapa muncul di browser?", a: "Kebijakan keamanan browser yang memblokir request lintas domain kecuali server tujuan mengirim header Access-Control-Allow-Origin." },
      { q: "Kenapa cookie HttpOnly lebih aman daripada localStorage untuk session?", a: "Cookie HttpOnly tidak bisa dibaca JavaScript, sehingga lebih terlindungi dari pencurian token lewat serangan XSS." },
      { q: "Apa fungsi ORM seperti Prisma/Drizzle?", a: "Menghubungkan kode TypeScript ke database dengan type-safety, migrasi skema, dan query yang aman dari SQLi." },
      { q: "Kapan sebaiknya pakai Server Component vs Client Component?", a: "Default Server Component untuk fetch data & konten statis; Client Component hanya saat butuh state, event klik, atau API browser." },
      { q: "Apa arti CI/CD dalam deployment web?", a: "Continuous Integration (tes & build otomatis tiap push) & Continuous Deployment (rilis otomatis jika lulus cek)." },
    ],
  },

  mobile: {
    slug: "mobile",
    analogy:
      "Aplikasi mobile seperti toko mungil di saku pengguna: layarnya sempit, jempol yang menavigasi, sinyal bisa putus kapan saja, dan baterai terbatas — jadi responsivitas & offline-first adalah raja.",
    focusTip:
      "Pilih satu jalur dulu: Flutter (cross-platform cepat) atau Kotlin/Compose (native Android). Selalu uji aplikasimu di HP fisik, bukan hanya emulator!",
    cheats: [
      { title: "Widget Layout Dasar Flutter", code: "Column(\n  crossAxisAlignment: CrossAxisAlignment.start,\n  children: [Text('Halo'), SizedBox(height: 8), ElevatedButton(...)],\n)", note: "Row untuk horizontal, Column untuk vertikal, Expanded agar mengisi sisa ruang." },
      { title: "Jetpack Compose State", code: "var count by rememberSaveable { mutableStateOf(0) }\nButton(onClick = { count++ }) { Text(\"Klik: $count\") }", note: "rememberSaveable menjaga state tetap hidup saat layar diputar." },
      { title: "Daftar Panjang Tanpa Lag", code: "// Flutter: ListView.builder(...)\n// Compose: LazyColumn { items(list) { ... } }\n// RN:      FlatList", note: "Selalu pakai lazy list agar hanya merender item yang terlihat di layar." },
    ],
    mistakes: [
      { wrong: "Melakukan proses berat/network di Main (UI) Thread sehingga aplikasi freeze/ANR.", fix: "Gunakan async/await, Coroutines (Dispatchers.IO), atau Isolate di Flutter." },
      { wrong: "Merender ribuan item dengan Column/ScrollView biasa.", fix: "Gunakan ListView.builder / LazyColumn / FlatList." },
      { wrong: "Tidak menangani kondisi tanpa internet atau loading state.", fix: "Sediakan skeleton loading, cache lokal (SQLite/Hive/Room), dan tombol Coba Lagi." },
    ],
    flashcards: [
      { q: "Kenapa ukuran tombol sentuh di HP minimal ~44–48dp?", a: "Agar nyaman ditekan ujung jempol tanpa salah pencet (Fitts's Law & pedoman Apple/Google)." },
      { q: "Apa itu Offline-First di aplikasi mobile?", a: "Aplikasi membaca & menyimpan data ke database lokal dulu agar tetap cepat/jalan tanpa sinyal, lalu sinkron ke server saat online." },
      { q: "Apa itu Widget Tree di Flutter?", a: "Struktur hierarki immutable yang mendeskripsikan UI; setiap perubahan state membangun ulang bagian tree yang terdampak secara efisien." },
      { q: "Apa penyebab utama jank (frame drop) di HP?", a: "Pekerjaan berat >16ms di UI thread (untuk 60fps), gambar terlalu besar tanpa resize, atau rebuild komponen berlebihan." },
      { q: "Apa itu Deep Linking?", a: "Tautan URL yang langsung membuka halaman spesifik di dalam aplikasi mobile, bukan sekadar layar beranda." },
      { q: "Kenapa API key tidak boleh ditanam polos di APK/IPA?", a: "File APK mudah di-decompile. Taruh secret di backend proxy, bukan di aplikasi klien." },
    ],
  },

  uiux: {
    slug: "uiux",
    analogy:
      "UI adalah bentuk, warna, dan pegangan sebuah pintu; UX adalah apakah tamu langsung tahu pintu itu harus didorong atau ditarik tanpa perlu ditempeli tulisan besar 'DORONG'.",
    focusTip:
      "Desain yang bagus tidak diukur dari seberapa ramai warnanya, tapi dari seberapa cepat pengguna menyelesaikan tujuannya. Mulai dari wireframe hitam-putih sebelum memilih warna!",
    cheats: [
      { title: "Skala Spasi 8pt Grid", code: "4px · 8px · 12px · 16px · 24px · 32px · 48px · 64px", note: "Konsistensi jarak membuat tampilan langsung terlihat profesional." },
      { title: "Aturan Warna 60-30-10", code: "60% → Warna latar netral (krem/putih)\n30% → Warna sekunder / permukaan / teks\n10% → Warna aksen utama (tombol CTA)", note: "Menjaga fokus mata tetap ke tombol aksi utama." },
      { title: "Kontras Aksesibilitas WCAG AA", code: "Teks normal (<18px): rasio kontras minimal 4.5 : 1\nTeks besar (≥24px): rasio kontras minimal 3.0 : 1", note: "Uji selalu teks di atas tombol kuning/terang — pakai teks gelap!" },
    ],
    mistakes: [
      { wrong: "Langsung membuat desain high-fidelity penuh warna tanpa riset & wireframe.", fix: "Sketsa alur pengguna (user flow) dan wireframe kasar dulu; revisi di tahap ini 10x lebih cepat." },
      { wrong: "Terlalu banyak variasi ukuran font dan warna dalam satu layar.", fix: "Batasi 1–2 keluarga font dan definisikan skala tipografi (H1, H2, Body, Caption) sebagai token." },
      { wrong: "Mengandalkan warna saja untuk menandai status (mis. merah = error).", fix: "Tambahkan ikon dan teks penjelas agar pengguna buta warna tetap paham." },
    ],
    flashcards: [
      { q: "Apa isi Hick's Law?", a: "Semakin banyak pilihan yang ditampilkan sekaligus, semakin lama pengguna mengambil keputusan. Kelompokkan atau sederhanakan opsi." },
      { q: "Apa isi Fitts's Law?", a: "Semakin besar dan dekat target (tombol), semakin cepat pengguna menekannya. Penting untuk zona jempol di HP." },
      { q: "Bedanya Wireframe, Mockup, dan Prototype?", a: "Wireframe = kerangka struktur kasar; Mockup = visual detail statis; Prototype = bisa diklik & diuji alurnya." },
      { q: "Berapa peserta minimal untuk Usability Testing kualitatif?", a: "Sekitar 5 pengguna per segmen biasanya sudah mengungkap ~80% masalah kegunaan utama (Nielsen)." },
      { q: "Apa itu Design System?", a: "Kumpulan token desain (warna, spasi, font), komponen UI siap pakai, dan pedoman penggunaan agar tim konsisten." },
      { q: "Apa itu Prinsip Proximity (Gestalt)?", a: "Elemen yang letaknya berdekatan dipersepsikan saling berhubungan — gunakan jarak rapat dalam grup dan jarak lega antargrup." },
    ],
  },

  "qa-testing": {
    slug: "qa-testing",
    analogy:
      "QA bukan 'polisi pemburu salah programmer', melainkan navigator dan inspektur keselamatan pesawat: memastikan sayap, rem, dan skenario darurat aman SEBELUM penumpang naik.",
    focusTip:
      "Pelajari teknik desain test case (Equivalence Partitioning & Boundary Value) dulu sebelum sibuk menulis script automation — skrip cepat tidak berguna kalau kasus ujinya salah.",
    cheats: [
      { title: "Pola AAA dalam Unit Test", code: "test('hitung diskon 10%', () => {\n  // Arrange\n  const harga = 100_000;\n  // Act\n  const hasil = applyDiscount(harga, 10);\n  // Assert\n  expect(hasil).toBe(90_000);\n});", note: "Arrange-Act-Assert membuat setiap test mudah dibaca." },
      { title: "Locator Tangguh di Playwright", code: "await page.getByRole('button', { name: 'Simpan' }).click();\nawait expect(page.getByText('Tersimpan')).toBeVisible();", note: "Prioritaskan getByRole/getByLabel, hindari selector CSS rapuh." },
      { title: "Struktur Laporan Bug Ideal", code: "Judul: [Checkout] Total salah saat kupon dipakai 2x\nLangkah reproduksi: 1... 2... 3...\nHasil aktual vs Hasil diharapkan\nLingkungan: Chrome 130 / Android 14 + Screenshot/Log", note: "Bug yang jelas diperbaiki 5x lebih cepat." },
    ],
    mistakes: [
      { wrong: "Memakai sleep(5000) di test E2E sehingga test lambat dan flaky.", fix: "Gunakan auto-waiting / assertion eksplisit seperti expect(locator).toBeVisible()." },
      { wrong: "Hanya menguji 'happy path' (input benar semua).", fix: "Uji nilai batas (0, -1, kosong, panjang maksimum, karakter spesial, koneksi putus)." },
      { wrong: "Mengetes detail implementasi internal, bukan perilaku pengguna.", fix: "Uji input → output / apa yang dilihat pengguna agar refactor tidak merusak test." },
    ],
    flashcards: [
      { q: "Apa itu Boundary Value Analysis (BVA)?", a: "Teknik menguji tepat di nilai batas valid/invalid (mis. umur 17, 18, 19 untuk syarat minimal 18) karena bug paling sering sembunyi di tepi." },
      { q: "Bedanya Smoke Test dan Regression Test?", a: "Smoke test = cek cepat fitur paling vital pasca-build; Regression test = memastikan perubahan baru tidak merusak fitur lama." },
      { q: "Apa itu Flaky Test?", a: "Test yang kadang lulus kadang gagal tanpa perubahan kode (biasanya karena timing, jaringan, atau urutan data)." },
      { q: "Bedanya Load Testing dan Stress Testing?", a: "Load test mengukur performa pada beban normal/target; Stress test mendorong sistem melampaui batas untuk melihat titik rusaknya." },
      { q: "Apa arti p95 latency 250ms?", a: "95% dari seluruh permintaan selesai dalam ≤250ms; 5% sisanya lebih lambat. Lebih jujur daripada sekadar rata-rata." },
      { q: "Mengapa Piramida Testing menyarankan banyak Unit Test dan sedikit E2E?", a: "Unit test super cepat (milidetik) dan stabil; E2E lambat dan mahal perawatannya, jadi fokuskan E2E untuk alur kritis bisnis." },
    ],
  },

  "game-dev": {
    slug: "game-dev",
    analogy:
      "Sebuah game adalah film interaktif yang digambar ulang 60 kali setiap detik: di setiap frame, engine membaca tombolmu, menghitung fisika, lalu melukis ulang dunia di layar.",
    focusTip:
      "Jangan langsung membuat MMORPG open-world! Buat 3 game sangat kecil yang SELESAI (mis. Flappy Bird, Pong, Platformer 1 level) — menyelesaikan game adalah skill tersendiri.",
    cheats: [
      { title: "Gerak Independen FPS (GDScript)", code: "func _physics_process(delta: float) -> void:\n    var dir := Input.get_axis('ui_left', 'ui_right')\n    velocity.x = dir * SPEED\n    move_and_slide()", note: "Selalu kalikan kecepatan gerak dengan delta agar konsisten di 60Hz & 144Hz." },
      { title: "Signal untuk Komunikasi Bersih", code: "signal health_changed(new_hp: int)\n# Saat terkena hit:\nhp -= damage\nhealth_changed.emit(hp)", note: "Pakai Signal (Observer pattern) agar UI & Player tidak saling mengikat erat." },
      { title: "Normalisasi Vektor Diagonal", code: "var dir = Input.get_vector('left', 'right', 'up', 'down')\n# dir otomatis panjang ≤ 1 agar jalan miring tidak 1.41x lebih cepat!", note: "Jebakan klasik game top-down jika tidak menormalisasi vektor." },
    ],
    mistakes: [
      { wrong: "Lupa mengalikan pergerakan dengan delta time.", fix: "Tanpa delta, game berjalan 2x lebih cepat di monitor 120Hz dibanding 60Hz." },
      { wrong: "Menaruh semua logika karakter (jalan, lompat, serang, mati) dalam puluhan if-else bertumpuk.", fix: "Gunakan Finite State Machine (Idle, Run, Jump, Attack) agar transisi rapi." },
      { wrong: "Scope creep: terus menambah fitur baru sebelum gameplay inti terasa seru.", fix: "Uji 'core loop' pakai kotak warna polos dulu; jika belum seru, grafis bagus tidak akan menyelamatkannya." },
    ],
    flashcards: [
      { q: "Apa itu Game Loop?", a: "Siklus berulang tiap frame: baca Input → Update logika & fisika → Render grafis ke layar." },
      { q: "Kenapa di Godot ada _process(delta) dan _physics_process(delta)?", a: "_process jalan tiap frame render (variabel FPS), sedangkan _physics_process jalan di interval tetap (mis. 60Hz) agar fisika stabil." },
      { q: "Apa fungsi Object Pooling?", a: "Menggunakan ulang objek yang sering muncul-hilang (seperti peluru) daripada terus membuat/menghapus memori agar tidak lag." },
      { q: "Apa itu Hitbox vs Hurtbox?", a: "Hitbox = area yang memberikan serangan; Hurtbox = area tubuh karakter yang bisa menerima kerusakan." },
      { q: "Apa itu Coyote Time di game platformer?", a: "Toleransi ~0.1 detik di mana pemain masih bisa melompat sesaat setelah kakinya melewati tepi platform — bikin kontrol terasa responsif." },
      { q: "Apa peran AABB dalam deteksi tabrakan?", a: "Axis-Aligned Bounding Box: cek tumpang tindih dua persegi panjang sejajar sumbu, super cepat untuk deteksi tabrakan tahap awal." },
    ],
  },

  "data-analyst": {
    slug: "data-analyst",
    analogy:
      "Data Analyst adalah detektif bisnis: bukannya menebak 'kayaknya penjualan turun karena hujan', ia memeriksa bukti di database, membersihkan catatan ganda, lalu menyajikan kesimpulan yang bisa langsung dieksekusi.",
    focusTip:
      "SQL + pemikiran bisnis menyumbang >70% nilai Data Analyst sehari-hari. Kuasai GROUP BY, JOIN, CTE, dan Window Function sebelum sibuk mempercantik warna grafik.",
    cheats: [
      { title: "SQL CTE + Window Function", code: "WITH bulanan AS (\n  SELECT DATE_TRUNC('month', tgl) AS bln, SUM(total) AS omzet\n  FROM penjualan GROUP BY 1\n)\nSELECT bln, omzet,\n       LAG(omzet) OVER (ORDER BY bln) AS omzet_lalu\nFROM bulanan;", note: "Pola wajib untuk menghitung pertumbuhan MoM (Month-over-Month)." },
      { title: "Pandas Groupby & Ringkas", code: "df.groupby('kategori').agg(\n    transaksi=('id', 'count'),\n    omzet=('total', 'sum'),\n    rata2=('total', 'mean')\n).sort_values('omzet', ascending=False)", note: "Named aggregation membuat kolom hasil langsung bersih." },
      { title: "Panduan Memilih Grafik", code: "Tren waktu     → Line chart\nPerbandingan   → Bar chart (mulai dari 0!)\nSebaran data   → Histogram / Boxplot\nHubungan 2 var → Scatter plot", note: "Hindari pie chart jika kategori > 4." },
    ],
    mistakes: [
      { wrong: "Menggunakan rata-rata (mean) pada data yang punya outlier ekstrem (seperti gaji/harga rumah).", fix: "Selalu bandingkan mean dengan median dan lihat distribusinya dulu." },
      { wrong: "Menyimpulkan korelasi = sebab-akibat (kausalitas).", fix: "Cek faktor perancu (confounding variable) atau lakukan eksperimen A/B." },
      { wrong: "Memotong sumbu Y pada bar chart sehingga selisih kecil terlihat dramatis.", fix: "Bar chart wajib mulai dari 0 agar perbandingan panjang batang jujur." },
    ],
    flashcards: [
      { q: "Bedanya INNER JOIN dan LEFT JOIN?", a: "INNER JOIN hanya mengambil baris yang cocok di kedua tabel. LEFT JOIN mempertahankan semua baris tabel kiri walau tak punya pasangan di kanan (NULL)." },
      { q: "Bedanya WHERE dan HAVING di SQL?", a: "WHERE menyaring baris SEBELUM GROUP BY; HAVING menyaring hasil agregasi SETELAH GROUP BY." },
      { q: "Apa fungsi Window Function (OVER)?", a: "Menghitung agregasi/ranking lintas baris (mis. running total, RANK, LAG) TANPA menciutkan jumlah baris seperti GROUP BY." },
      { q: "Apa itu Cohort Analysis?", a: "Mengelompokkan pengguna berdasarkan waktu bergabung (mis. bulan daftar) untuk melihat pola retensi mereka dari waktu ke waktu." },
      { q: "Kapan harus pakai Median daripada Mean?", a: "Saat data miring (skewed) atau memiliki outlier besar yang menarik nilai rata-rata." },
      { q: "Apa prinsip Data-Ink Ratio (Edward Tufte)?", a: "Maksimalkan tinta yang membawa informasi data, buang hiasan tak perlu (grid berat, efek 3D, border berlebihan)." },
    ],
  },

  "data-scientist": {
    slug: "data-scientist",
    analogy:
      "Jika Data Analyst meneropong kaca spion (apa yang sudah terjadi), Data Scientist memasang radar & eksperimen untuk menjawab 'kenapa terjadi' dan 'apa yang mungkin terjadi jika kita ubah sesuatu'.",
    focusTip:
      "Model paling canggih pun gagal jika evaluasi dan datanya bocor. Utamakan validasi yang jujur, baseline sederhana, dan pemahaman statistik eksperimen.",
    cheats: [
      { title: "Pipeline Anti Data Leakage", code: "from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\n\npipe = make_pipeline(StandardScaler(), LogisticRegression())\npipe.fit(X_train, y_train)", note: "Scaler hanya di-fit pada data latih, tidak pernah mengintip data uji." },
      { title: "Uji Hipotesis t-test (SciPy)", code: "from scipy import stats\nt_stat, p_val = stats.ttest_ind(grup_a, grup_b, equal_var=False)\nprint(f'p-value = {p_val:.4f}')", note: "Welch's t-test (equal_var=False) lebih aman bila varians berbeda." },
      { title: "Metrik Klasifikasi Tak Seimbang", code: "Precision = TP / (TP + FP)  # seberapa akurat tebakan positif\nRecall    = TP / (TP + FN)  # seberapa banyak kasus positif tertangkap\nF1        = 2 * P * R / (P + R)", note: "Jangan pakai Accuracy saja bila kasus positif hanya 1% (fraud/penyakit)." },
    ],
    mistakes: [
      { wrong: "Melakukan scaling/imputasi sebelum train-test split (data leakage).", fix: "Split data dulu (atau pakai Pipeline di dalam cross-validation)." },
      { wrong: "Mengintip p-value setiap hari saat A/B test lalu berhenti begitu p < 0.05 (peeking).", fix: "Tentukan ukuran sampel & durasi eksperimen di awal sebelum tes berjalan." },
      { wrong: "Melaporkan akurasi 99% pada dataset fraud yang 99% transaksinya normal.", fix: "Gunakan PR-AUC, F1, Precision/Recall, dan confusion matrix." },
    ],
    flashcards: [
      { q: "Apa arti p-value = 0.03?", a: "Jika hipotesis nol benar (tidak ada efek), peluang mendapatkan hasil seekstrem ini atau lebih ekstrem hanya 3%. BUKAN peluang hipotesis nol benar." },
      { q: "Apa itu Bias-Variance Tradeoff?", a: "Bias tinggi = underfitting (model terlalu sederhana); Variance tinggi = overfitting (menghafal noise data latih)." },
      { q: "Kenapa Feature Engineering sering mengalahkan ganti algoritma?", a: "Representasi data yang kaya makna domain memudahkan model sederhana sekalipun menemukan pola." },
      { q: "Apa itu Simpson's Paradox?", a: "Tren yang muncul di beberapa kelompok data berbalik arah ketika semua kelompok digabung — penting memeriksa segmentasi!" },
      { q: "Kapan pakai TimeSeriesSplit daripada KFold acak?", a: "Pada data deret waktu! Data masa depan tidak boleh ikut melatih model untuk memprediksi masa lalu." },
      { q: "Apa bedanya Statistical Significance vs Practical Significance?", a: "Perbedaan 0.01% bisa signifikan secara statistik jika sampel jutaan, tapi belum tentu bernilai secara bisnis." },
    ],
  },

  "data-engineering": {
    slug: "data-engineering",
    analogy:
      "Data Engineer adalah insinyur sistem air kota (PDAM): mereka membangun pipa, tangki penyimpanan, dan penyaring agar air (data) mengalir bersih, tepat waktu, dan tidak bocor ke seluruh rumah (dashboard & model AI).",
    focusTip:
      "Fokus pada SQL tingkat lanjut, pemodelan data (Star Schema), format kolumnar (Parquet), idempotensi pipeline, dan Docker sebelum mengejar 10 tool cloud sekaligus.",
    cheats: [
      { title: "Query Parquet Lokal dengan DuckDB", code: "SELECT kota, COUNT(*) AS n, SUM(nilai) AS total\nFROM 'data/transaksi_*.parquet'\nGROUP BY kota ORDER BY total DESC;", note: "DuckDB membaca jutaan baris Parquet di laptop dalam hitungan detik." },
      { title: "Pola dbt Model Bertingkat", code: "sources (raw) → staging (stg_*, bersihkan tipe & nama)\n              → intermediate (int_*, join logika)\n              → marts (fct_*, dim_*, siap dashboard)", note: "Struktur lapis ini menjaga SQL tetap modular & mudah diuji." },
      { title: "Prinsip Idempotensi Pipeline", code: "-- Hapus partisi tanggal target lalu muat ulang\nDELETE FROM fct_orders WHERE order_date = '{{ ds }}';\nINSERT INTO fct_orders SELECT ... WHERE order_date = '{{ ds }}';", note: "Jalankan ulang pipeline untuk tanggal sama → hasil tetap identik tanpa duplikat." },
    ],
    mistakes: [
      { wrong: "Pipeline yang menghasilkan baris duplikat jika dijalankan ulang (tidak idempoten).", fix: "Gunakan pola MERGE/UPSERT atau delete-write per partisi tanggal." },
      { wrong: "Menyimpan data analitik miliaran baris dalam format CSV/JSON polos.", fix: "Konversi ke Parquet (kolumnar + terkompresi) agar baca 10–50x lebih cepat dan hemat." },
      { wrong: "Tidak punya data quality check (null, duplikat primary key, anomali volume).", fix: "Pasang test otomatis (mis. dbt test: unique, not_null, accepted_values) di setiap run." },
    ],
    flashcards: [
      { q: "Bedanya OLTP dan OLAP?", a: "OLTP (PostgreSQL/MySQL) untuk transaksi cepat per baris (aplikasi); OLAP (BigQuery/Snowflake/ClickHouse) untuk agregasi analitik jutaan baris." },
      { q: "Bedanya ETL dan ELT?", a: "ETL mentransformasi data sebelum masuk warehouse; ELT memuat data mentah dulu ke warehouse lalu mentransformasinya di sana (mis. pakai dbt)." },
      { q: "Apa itu Star Schema (Fact & Dimension)?", a: "Tabel Fact berisi kejadian/angka terukur (penjualan), dikelilingi tabel Dimension berisi konteks (pelanggan, produk, waktu)." },
      { q: "Kenapa format Parquet cepat untuk analitik?", a: "Karena menyimpan data per kolom (columnar), sehingga query hanya membaca kolom yang diminta dan kompresinya jauh lebih efisien." },
      { q: "Apa itu CDC (Change Data Capture)?", a: "Menangkap perubahan INSERT/UPDATE/DELETE langsung dari log transaksi database secara real-time (mis. Debezium)." },
      { q: "Apa itu DAG di Airflow?", a: "Directed Acyclic Graph: grafik dependensi tugas berarah tanpa siklus yang menentukan urutan eksekusi pipeline." },
    ],
  },

  "machine-learning": {
    slug: "machine-learning",
    analogy:
      "Pemrograman biasa seperti memberi aturan eksplisit ('jika suhu > 38 maka demam'). Machine Learning seperti menunjukkan 10.000 contoh lalu membiarkan mesin menemukan polanya sendiri.",
    focusTip:
      "Mulai setiap proyek ML dari baseline super sederhana (mis. Logistic Regression / Random Forest). Baru naik ke model kompleks jika baseline benar-benar sudah diukur.",
    cheats: [
      { title: "Alur Lengkap scikit-learn", code: "X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y)\nmodel = HistGradientBoostingClassifier(random_state=42)\nmodel.fit(X_tr, y_tr)\nprint(classification_report(y_te, model.predict(X_te)))", note: "stratify=y menjaga proporsi kelas tetap sama di train & test." },
      { title: "Kapan Pilih Algoritma Klasik?", code: "Data tabular → LightGBM / XGBoost / CatBoost (raja tabular!)\nBaseline cepat & interpretasi → Linear / Logistic Regression\nTanpa label (segmentasi) → K-Means / HDBSCAN", note: "Untuk data tabel, Gradient Boosting sering mengalahkan Deep Learning." },
      { title: "FastAPI Serving Model Ringkas", code: "@app.post('/predict')\ndef predict(req: FiturInput):\n    prob = float(model.predict_proba([req.to_vector()])[0, 1])\n    return {'probabilitas': round(prob, 4)}", note: "Validasi input otomatis lewat Pydantic sebelum masuk model." },
    ],
    mistakes: [
      { wrong: "Langsung memakai Deep Learning untuk tabel 5.000 baris.", fix: "Untuk data tabular, XGBoost/LightGBM/CatBoost hampir selalu lebih akurat, cepat, dan murah." },
      { wrong: "Tuning hyperparameter pada test set sehingga skor evaluasi menipu.", fix: "Gunakan validation set / cross-validation untuk tuning; test set hanya disentuh sekali di akhir." },
      { wrong: "Melupakan monitoring setelah model di-deploy.", fix: "Pantau data drift & performa berkala — dunia nyata berubah, model ikut menua." },
    ],
    flashcards: [
      { q: "Bedanya Supervised, Unsupervised, dan Reinforcement Learning?", a: "Supervised punya label (prediksi); Unsupervised tanpa label (clustering/reduksi dimensi); RL belajar lewat reward dari lingkungan." },
      { q: "Apa fungsi Regularisasi (L1/Lasso & L2/Ridge)?", a: "Menghukum bobot model yang terlalu besar untuk mencegah overfitting. L1 bisa membuat fitur tak penting jadi 0 (seleksi fitur)." },
      { q: "Kenapa Gradient Boosting (XGBoost/LightGBM) sangat kuat di data tabular?", a: "Ia membangun pohon keputusan secara berurutan, di mana setiap pohon baru memperbaiki kesalahan prediksi pohon sebelumnya." },
      { q: "Apa itu Data Drift vs Concept Drift?", a: "Data drift = distribusi fitur input berubah; Concept drift = hubungan antara input dan target berubah (mis. perilaku belanja berubah saat pandemi)." },
      { q: "Apa fungsi Feature Scaling dan model mana yang membutuhkannya?", a: "Menyamakan skala fitur; wajib untuk model berbasis jarak/gradien (KNN, SVM, Regresi, NN), tapi tidak wajib untuk model pohon (Tree/XGBoost)." },
      { q: "Apa tujuan MLflow / Experiment Tracking?", a: "Mencatat parameter, metrik, versi data, dan artefak model setiap eksperimen agar hasil bisa direproduksi." },
    ],
  },

  "deep-learning": {
    slug: "deep-learning",
    analogy:
      "Jaringan saraf tiruan seperti pabrik berlapis: lapisan pertama mengenali tepi & garis, lapisan tengah mengenali mata & telinga, lapisan akhir menyimpulkan 'ini kucing' — semuanya dipelajari otomatis dari kesalahan (loss).",
    focusTip:
      "Tulis satu training loop PyTorch dari nol dan sengaja uji overfit pada 1 batch kecil dulu. Jika model tidak bisa menghafal 1 batch, pasti ada bug di kode/loss/learning rate!",
    cheats: [
      { title: "5 Baris Inti Training Loop PyTorch", code: "optimizer.zero_grad()          # 1. nolkan gradien lama\npred = model(x)                # 2. forward pass\nloss = loss_fn(pred, y)        # 3. hitung error\nloss.backward()                # 4. backpropagation\noptimizer.step()               # 5. perbarui bobot", note: "Lupa zero_grad() membuat gradien menumpuk dari batch sebelumnya!" },
      { title: "Mode Evaluasi & Hemat Memori", code: "model.eval()\nwith torch.inference_mode():\n    preds = model(x_val)", note: "model.eval() mematikan Dropout & membekukan BatchNorm." },
      { title: "Debugging Cepat Bentuk Tensor", code: "print(x.shape, x.dtype, x.device)  # mis. torch.Size([32, 3, 224, 224])", note: "90% bug PyTorch berasal dari mismatch shape atau CPU vs CUDA." },
    ],
    mistakes: [
      { wrong: "Lupa memanggil optimizer.zero_grad() atau model.eval() saat validasi.", fix: "Jadikan keduanya checklist otomatis di fungsi train_step & eval_step." },
      { wrong: "Melatih model besar dari nol dengan dataset kecil (ratusan data).", fix: "Gunakan Transfer Learning (pretrained weights) lalu fine-tune." },
      { wrong: "Learning rate terlalu besar → loss menjadi NaN atau melonjak liar.", fix: "Turunkan LR (mis. 3e-4 untuk AdamW), aktifkan gradient clipping, dan pakai warmup." },
    ],
    flashcards: [
      { q: "Kenapa jaringan saraf butuh fungsi aktivasi non-linear (ReLU/GELU)?", a: "Tanpa non-linearitas, tumpukan 100 lapisan linear secara matematis setara dengan 1 lapisan linear saja." },
      { q: "Apa peran Residual Connection (skip connection) di ResNet & Transformer?", a: "Membuat jalur pintas bagi gradien agar mengalir lancar saat backpropagation sehingga jaringan sangat dalam tetap bisa dilatih." },
      { q: "Apa fungsi Dropout?", a: "Mematikan sebagian neuron secara acak saat training agar jaringan tidak bergantung pada satu jalur saja (mengurangi overfitting)." },
      { q: "Bagaimana Self-Attention bekerja secara singkat?", a: "Setiap token menghitung skor relevansi (Query·Key) terhadap semua token lain lalu mengambil rata-rata berbobot dari Value-nya." },
      { q: "Apa manfaat Mixed Precision (FP16/BF16)?", a: "Menghemat memori GPU hampir 2x dan mempercepat training tanpa mengorbankan akurasi secara signifikan." },
      { q: "Apa itu Kuantisasi (Quantization) saat deployment?", a: "Mengubah bobot dari 32-bit float ke 8-bit/4-bit integer agar model jauh lebih kecil dan cepat di inferensi." },
    ],
  },

  "computer-vision": {
    slug: "computer-vision",
    analogy:
      "Di mata komputer, foto bukanlah pemandangan — melainkan tabel raksasa berisi angka 0–255 untuk kanal warna Merah, Hijau, dan Biru. Computer Vision adalah seni mengubah tabel angka itu menjadi pemahaman visual.",
    focusTip:
      "Kualitas dataset & anotasi (bounding box rapi, pencahayaan beragam, sudut kamera nyata) hampir selalu berdampak jauh lebih besar daripada sekadar mengganti versi YOLO.",
    cheats: [
      { title: "Hati-hati Urutan Warna OpenCV (BGR!)", code: "import cv2\nimg_bgr = cv2.imread('foto.jpg')\nimg_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)", note: "OpenCV membaca gambar sebagai BGR, sedangkan Matplotlib/PyTorch memakai RGB." },
      { title: "Inferensi & Train Cepat YOLO", code: "from ultralytics import YOLO\nmodel = YOLO('yolo11n.pt')\nresults = model.predict('jalan.jpg', conf=0.35)", note: "Mulai dari varian nano ('n') dulu untuk tes cepat & edge device." },
      { title: "Rumus IoU (Intersection over Union)", code: "IoU = Luas_Irisan(pred, gt) / Luas_Gabungan(pred, gt)\n# IoU ≥ 0.50 umumnya dihitung deteksi benar (mAP@50)", note: "Mengukur seberapa tepat kotak prediksi menempel ke objek asli." },
    ],
    mistakes: [
      { wrong: "Melatih model pada foto studio terang lalu dipakai di CCTV malam yang buram.", fix: "Kumpulkan data dari kondisi kamera & pencahayaan target + gunakan augmentasi realistis." },
      { wrong: "Lupa perbedaan BGR (OpenCV) vs RGB sehingga warna kulit jadi biru.", fix: "Konversi dengan cv2.cvtColor(..., cv2.COLOR_BGR2RGB) sebelum visualisasi/model." },
      { wrong: "Dataset berisi gambar hampir identik dari video yang sama tersebar di train & val.", fix: "Split dataset berdasarkan sumber video/lokasi, bukan frame acak." },
    ],
    flashcards: [
      { q: "Bedanya Classification, Object Detection, dan Segmentation?", a: "Classification = 1 label per gambar; Detection = label + kotak (bounding box); Segmentation = label per piksel." },
      { q: "Apa fungsi Non-Maximum Suppression (NMS)?", a: "Menghapus kotak deteksi ganda yang saling tumpang tindih pada objek yang sama dan hanya menyisakan yang skornya tertinggi." },
      { q: "Apa arti mAP@50?", a: "Mean Average Precision pada ambang IoU 0.50, dirata-ratakan di seluruh kelas objek — metrik standar deteksi objek." },
      { q: "Kenapa Data Augmentation penting di CV?", a: "Memperkaya variasi rotasi, pencahayaan, dan skala secara sintetis agar model lebih tangguh & tidak overfitting." },
      { q: "Apa keuntungan mengekspor model ke ONNX / TensorRT?", a: "Inferensi jauh lebih cepat dan hemat memori di produksi atau perangkat edge (Jetson, Raspberry Pi, HP)." },
      { q: "Apa keunggulan model fondasi seperti SAM (Segment Anything)?", a: "Bisa melakukan segmentasi objek apa pun secara zero-shot (dengan prompt titik/kotak) tanpa harus melatih ulang dari nol." },
    ],
  },

  "ai-engineer": {
    slug: "ai-engineer",
    analogy:
      "AI Engineer bukan pembuat mesin mobil dari bijih besi (itu riset pretraining), melainkan perancang mobil utuh: menghubungkan mesin LLM dengan peta dokumen (RAG), alat bantu (Tools/MCP), sabuk pengaman (Guardrails), dan speedometer (Evaluasi).",
    focusTip:
      "Selalu ikuti tangga prioritas: Prompting + contoh (few-shot) → RAG + sitasi → Evaluasi otomatis → baru pertimbangkan Fine-tuning bila benar-benar perlu.",
    cheats: [
      { title: "Struktur Prompt Andal", code: "1. Peran & tujuan jelas\n2. Konteks / dokumen sumber\n3. Aturan: 'Jawab HANYA dari konteks; jika tidak ada, katakan tidak tahu'\n4. Format output (JSON schema / bullet)\n5. 1–2 contoh (few-shot)", note: "Instruksi eksplisit mengurangi halusinasi secara drastis." },
      { title: "Checklist Pipeline RAG Produksi", code: "Chunking (overlap) → Embedding → Hybrid Search (BM25 + Vector)\n→ Reranker → Prompt + Sitasi → Eval (Faithfulness & Relevance)", note: "Hybrid search jauh lebih baik dari vector search murni untuk kode/nama unik." },
      { title: "Coba LLM Lokal Gratis (Ollama)", code: "ollama run qwen2.5:7b\n# API lokal otomatis tersedia di http://localhost:11434/v1", note: "Cocok untuk eksperimen & belajar tanpa kartu kredit." },
    ],
    mistakes: [
      { wrong: "Menilai kualitas aplikasi AI hanya dari 'kayaknya jawabannya bagus' (vibe check).", fix: "Buat minimal 30–50 kasus uji (eval set) dan ukur skor setiap kali mengubah prompt/model." },
      { wrong: "Memasukkan input user langsung tanpa memisahkan instruksi sistem & data (Prompt Injection).", fix: "Beri batas jelas, validasi output dengan skema, dan terapkan prinsip least privilege pada tools." },
      { wrong: "Langsung memakai kerangka multi-agent rumit untuk tugas yang cukup selesai dengan 1 prompt + 1 workflow.", fix: "Mulai dari workflow deterministik paling sederhana; tambah otonomi agent hanya bila diperlukan." },
    ],
    flashcards: [
      { q: "Kenapa teks Bahasa Indonesia sering memakan lebih banyak token daripada Bahasa Inggris?", a: "Tokenizer BPE dilatih dominan pada data Inggris sehingga kata Indonesia lebih sering dipecah menjadi subkata — berdampak ke biaya & konteks." },
      { q: "Kapan memakai RAG vs Fine-Tuning?", a: "RAG untuk menambah pengetahuan faktual/privat yang sering berubah; Fine-tuning untuk gaya bahasa, format khusus, atau distilasi ke model kecil." },
      { q: "Apa itu Temperature saat sampling LLM?", a: "Parameter pengatur keacakan: mendekati 0 lebih deterministik (cocok untuk kode/ekstraksi JSON), lebih tinggi lebih variatif/kreatif." },
      { q: "Apa fungsi Model Context Protocol (MCP)?", a: "Standar terbuka untuk menghubungkan LLM/Agent ke sumber data dan tools eksternal (DB, API, file) secara seragam dan aman." },
      { q: "Apa itu Hybrid Search di RAG?", a: "Menggabungkan pencarian kata kunci eksak (BM25) dan pencarian makna semantik (vector) lalu digabung/diranking ulang (rerank)." },
      { q: "Apa itu Prompt Injection?", a: "Serangan di mana input pengguna atau dokumen luar menyisipkan instruksi licik untuk membajak perilaku LLM atau membocorkan data." },
    ],
  },

  jaringan: {
    slug: "jaringan",
    analogy:
      "Jaringan komputer seperti sistem pos global: alamat MAC adalah nama penghuni di satu rumah (LAN), alamat IP adalah alamat jalan & kota (Internet), dan nomor Port adalah nomor pintu ruangan di gedung itu.",
    focusTip:
      "Biasakan troubleshooting berurutan dari bawah ke atas (atau sebaliknya): cek kabel/interface (L1/L2) → ping gateway/IP (L3) → cek DNS & port (L4/L7).",
    cheats: [
      { title: "Perintah Diagnosis Wajib Linux", code: "ip a                 # lihat IP & interface\nping -c 4 1.1.1.1    # cek konektivitas IP\ndig satutahu.id      # cek resolusi DNS\nss -tulpn            # cek port yang sedang listening\ntraceroute 1.1.1.1   # lacak hop router", note: "5 perintah ini menyelesaikan 80% investigasi jaringan harian." },
      { title: "Tabel Cepat Subnetting IPv4", code: "/24 → 255.255.255.0   → 254 host\n/25 → 255.255.255.128 → 126 host\n/26 → 255.255.255.192 → 62 host\n/28 → 255.255.255.240 → 14 host\n/30 → 255.255.255.252 → 2 host (link router)", note: "Jumlah host usable = 2^(32 - prefix) - 2." },
      { title: "Port Standar Wajib Tahu", code: "22 SSH · 53 DNS · 80 HTTP · 443 HTTPS\n5432 PostgreSQL · 3306 MySQL · 6379 Redis", note: "Berguna saat membaca Wireshark dan mengatur aturan firewall." },
    ],
    mistakes: [
      { wrong: "Menyimpulkan 'internet mati' padahal hanya DNS yang bermasalah.", fix: "Uji ping 1.1.1.1 dulu; jika jalan tapi ping domain gagal, masalahnya di DNS." },
      { wrong: "Mengubah konfigurasi router produksi tanpa backup & tanpa jadwal rollback.", fix: "Backup konfigurasi ke Git dan pakai lab simulasi (GNS3/containerlab) sebelum eksekusi." },
      { wrong: "Membuka port database (5432/3306) ke 0.0.0.0/0 di server publik.", fix: "Batasi akses lewat subnet privat/VPN/SSH tunnel dan firewall default-deny." },
    ],
    flashcards: [
      { q: "Apa urutan TCP 3-Way Handshake?", a: "Client kirim SYN → Server balas SYN-ACK → Client kirim ACK. Setelah itu koneksi siap bertukar data." },
      { q: "Bedanya TCP dan UDP?", a: "TCP andal, berurutan, ada pengecekan paket hilang (web, email). UDP cepat tanpa handshake (streaming, game online, DNS)." },
      { q: "Apa fungsi ARP (Address Resolution Protocol)?", a: "Mencari alamat MAC (L2) yang sesuai dengan alamat IP (L3) di dalam satu jaringan lokal." },
      { q: "Apa bedanya Switch dan Router?", a: "Switch meneruskan frame dalam 1 LAN berdasar MAC address (L2). Router meneruskan paket antar-jaringan berbeda berdasar IP (L3)." },
      { q: "Apa fungsi VLAN?", a: "Memisahkan satu switch fisik menjadi beberapa jaringan logis terisolasi (mis. VLAN Tamu terpisah dari VLAN Kantor)." },
      { q: "Apa fungsi NAT di router rumah?", a: "Menerjemahkan banyak IP privat lokal (192.168.x.x) agar bisa berbagi satu IP publik saat mengakses internet." },
    ],
  },

  "devops-cloud": {
    slug: "devops-cloud",
    analogy:
      "Jika developer merancang dan membuat barang, DevOps adalah jalur perakitan pabrik otomatis, kontainer pengiriman (Docker), dan ruang kontrol CCTV (Monitoring) agar barang sampai ke pengguna tanpa downtime.",
    focusTip:
      "Kuasai Linux + Docker + GitHub Actions dulu sampai lancar men-deploy 1 aplikasi nyata. Baru melangkah ke Kubernetes dan Terraform ketika kamu paham masalah apa yang mereka pecahkan.",
    cheats: [
      { title: "Dockerfile Multi-Stage Ringan", code: "FROM node:22-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:22-alpine\nUSER node\nCOPY --from=builder /app/dist ./dist\nCMD [\"node\", \"dist/index.js\"]", note: "Image produksi jauh lebih kecil dan tidak jalan sebagai root." },
      { title: "Perintah Kubectl Sehari-hari", code: "kubectl get pods -A\nkubectl describe pod <nama>\nkubectl logs -f <nama> --tail=100\nkubectl rollout undo deployment/<nama>", note: "describe & logs adalah sahabat utama saat pod CrashLoopBackOff." },
      { title: "3 Pilar Observability", code: "Logs    → catatan kejadian detail\nMetrics → angka tren (CPU, latency, error rate)\nTraces  → jejak 1 request lintas layanan", note: "Ketiganya saling melengkapi saat investigasi insiden." },
    ],
    mistakes: [
      { wrong: "Menjalankan container sebagai root dan menyertakan file .env / secret ke dalam image.", fix: "Tambahkan USER non-root, pakai .dockerignore, dan injeksi secret saat runtime." },
      { wrong: "Mengubah konfigurasi server manual lewat SSH tanpa dicatat (configuration drift).", fix: "Gunakan Infrastructure as Code (Terraform/Ansible) yang tersimpan di Git." },
      { wrong: "Memasang Kubernetes untuk 1 aplikasi kecil yang cukup dijalankan 1 VPS + Docker Compose.", fix: "Pilih infrastruktur sesuai skala beban dan kapasitas tim." },
    ],
    flashcards: [
      { q: "Bedanya Virtual Machine dan Container (Docker)?", a: "VM membawa seluruh OS tamu sendiri (berat, GB). Container berbagi kernel OS host sehingga jauh lebih ringan (MB) dan nyala dalam detik." },
      { q: "Apa itu Infrastructure as Code (IaC)?", a: "Mendefinisikan server, jaringan, dan database lewat file deklaratif (mis. Terraform) yang bisa di-review dan di-versioning di Git." },
      { q: "Bedanya SLI, SLO, dan SLA?", a: "SLI = metrik terukur (uptime 99.95%); SLO = target internal tim (99.9%); SLA = kontrak bisnis dengan pelanggan beserta kompensasinya." },
      { q: "Apa itu Blue-Green Deployment?", a: "Menjalankan versi baru (Green) berdampingan dengan versi lama (Blue), lalu memindahkan trafik sekaligus agar rollback instan." },
      { q: "Apa fungsi Reverse Proxy (Nginx/Caddy)?", a: "Menerima trafik luar, mengurus HTTPS/TLS, load balancing, dan meneruskannya ke layanan internal." },
      { q: "Apa itu Blameless Postmortem?", a: "Evaluasi pasca-insiden yang fokus memperbaiki kelemahan sistem & proses, bukan menyalahkan individu." },
    ],
  },

  "cyber-security": {
    slug: "cyber-security",
    analogy:
      "Keamanan siber bukan memasang 1 gembok super tebal lalu selesai, melainkan pertahanan berlapis (Defense in Depth): pagar, kunci pintu, CCTV, alarm, dan latihan evakuasi jika pencuri tetap berhasil masuk.",
    focusTip:
      "Selalu berlatih HANYA di lingkungan legal (OWASP Juice Shop, DVWA, PortSwigger Academy, picoCTF, atau server milikmu sendiri). Pahami cara membangun aplikasi yang aman dulu!",
    cheats: [
      { title: "CIA Triad — 3 Pilar Keamanan", code: "Confidentiality → hanya pihak berhak bisa membaca (Enkripsi, Auth)\nIntegrity       → data tak diubah diam-diam (Hash, Signature)\nAvailability    → sistem tetap bisa diakses (Backup, Anti-DDoS)", note: "Setiap insiden keamanan melanggar minimal satu pilar ini." },
      { title: "Header Keamanan HTTP Dasar", code: "Strict-Transport-Security: max-age=31536000\nX-Content-Type-Options: nosniff\nX-Frame-Options: DENY\nContent-Security-Policy: default-src 'self'", note: "Mengurangi risiko clickjacking, MIME sniffing, dan XSS." },
      { title: "Cegah IDOR (Broken Access Control)", code: "// SELALU cek kepemilikan data di server!\nSELECT * FROM invoices WHERE id = $1 AND user_id = $2;", note: "Jangan cuma cek 'sudah login', pastikan ia pemilik resource itu!" },
    ],
    mistakes: [
      { wrong: "Mencoba memindai atau mengeksploitasi situs orang lain tanpa izin tertulis.", fix: "Ilegal dan melanggar UU ITE. Gunakan lab khusus seperti Juice Shop, DVWA, atau program Bug Bounty resmi." },
      { wrong: "Membuat algoritma enkripsi sendiri ('roll your own crypto').", fix: "Selalu gunakan standar teruji: AES-GCM, ChaCha20-Poly1305, TLS 1.3, dan Argon2id." },
      { wrong: "Mengira HTTPS melindungi dari SQL Injection atau XSS.", fix: "HTTPS hanya mengenkripsi data di perjalanan; celah di kode aplikasi tetap bisa dieksploitasi." },
    ],
    flashcards: [
      { q: "Bedanya Hashing dan Enkripsi?", a: "Hashing satu arah (tidak bisa dikembalikan ke asli, untuk password/integritas). Enkripsi dua arah (bisa didekripsi dengan kunci)." },
      { q: "Apa itu SQL Injection dan obat utamanya?", a: "Input pengguna disisipkan menjadi perintah SQL. Obatnya: Parameterized Query / Prepared Statement." },
      { q: "Apa itu XSS (Cross-Site Scripting)?", a: "Penyerang menyuntikkan skrip JS ke halaman web yang berjalan di browser korban. Obatnya: output encoding, hindari innerHTML mentah, dan CSP." },
      { q: "Apa itu IDOR?", a: "Insecure Direct Object Reference: pengguna A bisa melihat data pengguna B hanya dengan mengganti /invoice/101 jadi /invoice/102." },
      { q: "Apa prinsip Least Privilege?", a: "Berikan setiap user, layanan, atau proses hanya izin paling minimal yang dibutuhkan untuk menjalankan tugasnya." },
      { q: "Urutan siklus Incident Response (NIST)?", a: "Preparation → Detection & Analysis → Containment, Eradication & Recovery → Post-Incident Activity." },
    ],
  },

  iot: {
    slug: "iot",
    analogy:
      "IoT seperti memberi mata (sensor), otak mini (ESP32/Arduino), tangan (aktuator/relay), dan mulut (Wi-Fi/MQTT) pada benda sehari-hari agar bisa melapor dan bertindak otomatis.",
    focusTip:
      "Tidak punya hardware dulu? Jangan berhenti! Gunakan simulator gratis Wokwi di browser untuk merangkai ESP32, LED, sensor DHT22, dan MQTT sebelum membeli komponen fisik.",
    cheats: [
      { title: "Hukum Ohm & Resistor LED", code: "V = I × R\nContoh LED (Vs=5V, Vf=2V, I=15mA=0.015A):\nR = (5 - 2) / 0.015 = 200 Ω → pakai resistor 220 Ω!", note: "Selalu pasang resistor seri pada LED agar tidak terbakar." },
      { title: "Anti-Blocking Blink (Tanpa delay)", code: "unsigned long prev = 0;\nif (millis() - prev >= 1000) {\n  prev = millis();\n  digitalWrite(LED_PIN, !digitalRead(LED_PIN));\n}", note: "delay() membekukan seluruh MCU; pakai millis() agar sensor & Wi-Fi tetap responsif." },
      { title: "Pola Topik MQTT Rapi", code: "rumah/ruang-tamu/suhu     → publish: {\"c\": 28.4}\nrumah/ruang-tamu/lampu/set → subscribe: ON / OFF", note: "MQTT super ringan untuk jaringan tak stabil & baterai hemat." },
    ],
    mistakes: [
      { wrong: "Menyambungkan sensor 3.3V langsung ke pin 5V atau menyalakan LED tanpa resistor.", fix: "Selalu cek datasheet tegangan (ESP32 logika 3.3V!) dan hitung nilai resistor dulu." },
      { wrong: "Memakai delay(10000) di loop() sehingga tombol tidak merespons dan MQTT disconnect.", fix: "Gunakan timer non-blocking berbasis millis()." },
      { wrong: "Mengirim kredensial Wi-Fi/MQTT tanpa enkripsi & memakai password default di perangkat produksi.", fix: "Gunakan MQTT over TLS (port 8883), autentikasi broker, dan simpan kredensial aman." },
    ],
    flashcards: [
      { q: "Apa isi Hukum Ohm?", a: "V = I × R (Tegangan = Arus × Hambatan). Dasar menghitung resistor dan daya rangkaian." },
      { q: "Apa itu PWM (Pulse Width Modulation)?", a: "Menyalakan-mematikan sinyal digital sangat cepat dengan rasio (duty cycle) tertentu untuk mengatur kecerahan LED atau kecepatan motor." },
      { q: "Bedanya UART, I2C, dan SPI?", a: "UART 2 kabel (TX/RX, 1-ke-1); I2C 2 kabel (SDA/SCL, banyak sensor pakai alamat); SPI 4 kabel (paling cepat, mis. layar/SD card)." },
      { q: "Apa fungsi Resistor Pull-Up pada tombol?", a: "Mencegah pin input 'mengambang' (floating) dengan nilai acak saat tombol belum ditekan." },
      { q: "Bagaimana pola kerja protokol MQTT?", a: "Publish/Subscribe lewat Broker: perangkat mengirim pesan ke topik tertentu, perangkat lain yang berlangganan topik itu otomatis menerimanya." },
      { q: "Apa itu Deep Sleep pada ESP32?", a: "Mode tidur super hemat daya (mikroampere) sehingga sensor bertenaga baterai bisa bertahan berminggu-minggu hingga berbulan-bulan." },
    ],
  },
};

export function getTrackGuide(slug: string): TrackGuide | undefined {
  return trackGuides[slug];
}
