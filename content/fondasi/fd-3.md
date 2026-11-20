---
title: Terminal, Git & GitHub
minutes: 35
summary: Terminal adalah cara tercepat berbicara dengan komputer, dan Git adalah ‘mesin waktu’ untuk kode. Keduanya dipakai di setiap bidang IT. Modul ini mengajarkan perintah terminal yang esensial, cara kerja Git dari dalam, dan alur kolaborasi lewat pull request.
objectives:
  - Bernavigasi dan mengelola file lewat terminal
  - Menggabungkan perintah dengan pipe dan redirect
  - Memahami working directory, staging area, dan repository
  - Membuat branch, melakukan merge, dan menyelesaikan konflik
sources:
  - repo: jlevy/the-art-of-command-line
    note: Pemilihan perintah terminal yang paling berguna
  - repo: pcottle/learnGitBranching
    note: Pendekatan visual untuk menjelaskan commit graph dan branch
  - repo: k88hudson/git-flight-rules
    note: Solusi situasi darurat Git (salah commit, salah branch)
  - repo: firstcontributions/first-contributions
    note: Alur fork → branch → pull request
quiz:
  - q: "Apa arti perintah: cat log.txt | grep ERROR | wc -l"
    options: ["Menghapus baris ERROR dari log", "Menghitung jumlah baris di log.txt yang mengandung ERROR", "Menyalin log ke file ERROR", "Menampilkan 10 baris pertama"]
    answer: 1
    explain: "Pipe (|) mengalirkan output satu perintah menjadi input perintah berikutnya: tampilkan file → saring baris berisi ERROR → hitung barisnya."
  - q: "Kamu mengubah tiga file tetapi hanya ingin commit dua di antaranya. Langkah yang benar?"
    options: ["git commit -a", "git add file1 file2 lalu git commit", "git push file1 file2", "git merge file1 file2"]
    answer: 1
    explain: "Staging area memungkinkan memilih perubahan mana yang masuk ke commit berikutnya. git commit -a justru memasukkan semua file yang terlacak."
  - q: "Apa sebenarnya ‘branch’ di Git?"
    options: ["Salinan lengkap seluruh folder proyek", "Penunjuk (pointer) ringan ke sebuah commit", "Server terpisah", "File konfigurasi"]
    answer: 1
    explain: "Branch hanyalah nama yang menunjuk ke satu commit, sehingga membuatnya sangat murah dan cepat."
  - q: "Saat merge muncul konflik dengan penanda <<<<<<< dan >>>>>>>. Apa yang harus dilakukan?"
    options: ["Hapus repository dan clone ulang", "Edit file, pilih/gabungkan isi yang benar, hapus penanda, lalu add & commit", "Jalankan git push --force", "Abaikan saja, Git akan memperbaikinya"]
    answer: 1
    explain: "Konflik terjadi karena dua perubahan menyentuh baris yang sama. Manusia yang memutuskan versi akhirnya, lalu menandai konflik selesai dengan git add."
---

Banyak pemula menghindari terminal karena tampak menakutkan. Padahal di dunia kerja, server tidak punya tampilan grafis, otomasi ditulis sebagai script, dan semua tim memakai Git. Kabar baiknya: kamu hanya perlu sekitar 20 perintah untuk 90% pekerjaan sehari-hari.

Pengguna Windows bisa memakai **Git Bash** (terpasang bersama Git) atau **WSL** agar perintahnya sama dengan Linux/macOS.

## Perintah dasar terminal

Terminal selalu berada ‘di dalam’ sebuah folder, yaitu *working directory*. Semua perintah dijalankan relatif terhadap folder itu.

```bash
pwd                     # print working directory: aku di mana?
ls -la                  # daftar isi folder, termasuk file tersembunyi
cd proyek/satutahu      # pindah folder (cd .. naik satu tingkat, cd ~ ke home)
mkdir -p data/mentah    # buat folder beserta induknya
touch catatan.md        # buat file kosong
cp a.txt b.txt          # salin
mv b.txt arsip/         # pindah atau ganti nama
rm a.txt                # hapus PERMANEN, tidak lewat Recycle Bin!
cat catatan.md          # tampilkan isi file
head -n 5 data.csv      # 5 baris pertama
```

Beberapa kebiasaan yang membuat kerja jauh lebih cepat:

- Tekan **Tab** untuk melengkapi nama file/folder otomatis.
- Tekan **↑** untuk memanggil perintah sebelumnya, **Ctrl+R** untuk mencari riwayat.
- `man nama-perintah` atau `nama-perintah --help` menampilkan dokumentasi.
- **Ctrl+C** menghentikan perintah yang sedang berjalan.

:::warning
`rm -rf` menghapus folder beserta isinya tanpa konfirmasi. Biasakan menjalankan `ls` pada path yang sama dulu untuk memastikan apa yang akan terhapus.
:::

## Pipe & redirect

Filosofi Unix: buat banyak alat kecil yang masing-masing melakukan satu hal dengan baik, lalu sambungkan. Penyambungnya adalah **pipe** `|`, yang mengalirkan output satu perintah menjadi input perintah berikutnya.

```bash
# 5 kategori pengeluaran terbanyak dari CSV (kolom ke-2)
cut -d, -f2 pengeluaran.csv | sort | uniq -c | sort -rn | head -5

# hitung baris error di log
grep "ERROR" server.log | wc -l
```

```viz
{"type":"flow","title":"Data mengalir lewat pipeline","caption":"Setiap perintah hanya melihat aliran teks dari perintah sebelumnya. Inilah yang membuat pipe sangat fleksibel.","steps":[{"label":"cut -d, -f2","detail":"Ambil kolom ke-2 (kategori) dari setiap baris CSV."},{"label":"sort","detail":"Urutkan agar kategori yang sama berdekatan."},{"label":"uniq -c","detail":"Gabungkan baris identik yang berurutan sambil menghitung jumlahnya."},{"label":"sort -rn","detail":"Urutkan berdasarkan angka hitungan, dari terbesar."},{"label":"head -5","detail":"Ambil 5 baris teratas saja."}]}
```

**Redirect** mengarahkan output ke file:

| Simbol | Arti | Contoh |
|---|---|---|
| `>` | tulis ke file (menimpa) | `ls > daftar.txt` |
| `>>` | tambahkan di akhir file | `echo "baris baru" >> log.txt` |
| `<` | ambil input dari file | `sort < nama.txt` |
| `2>` | arahkan pesan error | `python app.py 2> error.log` |

## Commit, staging & repository

**Git** mencatat riwayat perubahan proyek sebagai serangkaian **commit**, yaitu snapshot lengkap proyek pada suatu waktu, lengkap dengan pesan, penulis, dan penunjuk ke commit sebelumnya.

Git punya tiga ‘tempat’ yang wajib kamu pahami:

```viz
{"type":"sequence","title":"Perjalanan sebuah perubahan di Git","actors":["Working dir","Staging area","Repo lokal","GitHub (remote)"],"messages":[{"from":0,"to":0,"label":"edit file","note":"Kamu mengubah file seperti biasa di editor. Git melihatnya sebagai ‘modified’."},{"from":0,"to":1,"label":"git add","note":"Pilih perubahan yang mau dimasukkan ke commit berikutnya."},{"from":1,"to":2,"label":"git commit","note":"Snapshot permanen disimpan di folder .git beserta pesannya."},{"from":2,"to":3,"label":"git push","note":"Kirim commit ke repository remote agar tersimpan aman dan bisa dilihat tim."},{"from":3,"to":2,"label":"git pull","note":"Ambil commit baru dari remote (hasil kerja anggota tim lain) dan gabungkan."}]}
```

```bash
git init                         # jadikan folder ini repository
git status                       # apa yang berubah? (perintah paling sering dipakai)
git add main.py                  # stage satu file  (git add . = semua)
git commit -m "Tambah fungsi ringkasan pengeluaran"
git log --oneline --graph        # lihat riwayat
git diff                         # lihat perubahan yang belum di-stage
```

Pesan commit yang baik menjelaskan **apa dan kenapa**, dalam kalimat perintah singkat: `Perbaiki perhitungan IPK saat SKS nol`, bukan `update` atau `fix`. Buat juga file `.gitignore` agar file yang tidak perlu (mis. `.venv/`, `__pycache__/`, `.env` berisi password) tidak ikut tercatat.

:::tip[Commit kecil, sering]
Satu commit = satu perubahan logis. Commit kecil mudah dibaca, mudah dibatalkan (`git revert`), dan memudahkan mencari kapan bug muncul.
:::

## Branch & merge

**Branch** memungkinkan kamu mengerjakan fitur baru tanpa mengganggu kode utama yang stabil. Secara teknis branch hanyalah penunjuk ke sebuah commit, sehingga membuatnya instan.

```viz
{"type":"git-graph"}
```

```bash
git switch -c fitur-login        # buat branch baru dan pindah ke sana
# ... edit, add, commit beberapa kali ...
git switch main                  # kembali ke main
git merge fitur-login            # gabungkan hasil kerja fitur ke main
git branch -d fitur-login        # hapus penunjuk branch yang sudah selesai
```

Ada dua bentuk merge. Jika `main` tidak berubah sejak branch dibuat, Git cukup memajukan penunjuk `main` (**fast-forward**). Jika keduanya sudah bercabang, Git membuat **merge commit** dengan dua induk, seperti yang terlihat di simulasi di atas.

## Kolaborasi: pull request & konflik

Di tim, perubahan jarang langsung di-merge ke `main`. Alurnya:

1. Buat branch → commit → `git push -u origin fitur-login`.
2. Buka **pull request (PR)** di GitHub: ajakan untuk meninjau dan menggabungkan branch-mu.
3. Rekan tim memberi review; CI menjalankan test otomatis.
4. Setelah disetujui, PR di-merge.

Untuk proyek open source yang bukan milikmu, langkah pertamanya adalah **fork** (salin repo ke akunmu), lalu PR diajukan dari fork ke repo asli.

**Konflik** terjadi saat dua branch mengubah baris yang sama. Git tidak menebak; ia berhenti dan menandai filenya:

```text
<<<<<<< HEAD
batas_sks = 24
=======
batas_sks = 22
>>>>>>> fitur-aturan-baru
```

Cara menyelesaikannya: buka file, putuskan isi yang benar (bisa salah satu atau gabungan), **hapus ketiga penanda**, lalu `git add` file tersebut dan `git commit`. Konflik bukan kesalahan. Itu tanda dua orang bekerja di area yang sama, dan cara mencegahnya adalah sering `pull` dan menjaga PR tetap kecil.

:::latihan
Bersama satu teman: (1) buat repo berisi `README.md`. (2) Masing-masing buat branch dan ubah **baris yang sama** di README. (3) Merge satu branch, lalu coba merge branch kedua dan selesaikan konfliknya. (4) Ulangi lewat pull request di GitHub.
:::

:::info[Salah commit? Jangan panik]
`git commit --amend` memperbaiki pesan commit terakhir yang belum di-push. `git restore file` membuang perubahan yang belum di-stage. `git revert <id>` membatalkan commit dengan membuat commit kebalikan, aman dipakai untuk commit yang sudah di-push.
:::

## Rangkuman

- Kuasai navigasi (`pwd`, `ls`, `cd`), manipulasi file, dan kebiasaan Tab/↑/Ctrl+R.
- Pipe menyambungkan alat kecil; redirect menyimpan output ke file.
- Git: working dir → `add` → staging → `commit` → repo lokal → `push` → remote.
- Branch adalah penunjuk murah; merge menggabungkan riwayat; konflik diselesaikan manusia.
- Kolaborasi lewat PR yang kecil dan sering.
