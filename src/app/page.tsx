import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckCheck, Code2, Compass, FileCode2, FolderGit2, Gamepad2, X, Check } from "lucide-react";
import { foundations, globalStats, tracks as allTracks } from "@/data";
import { Hero } from "@/components/Hero";
import { TrackExplorer } from "@/components/TrackExplorer";
import { RoadmapShowcase } from "@/components/RoadmapShowcase";
import { PathFinderQuiz } from "@/components/PathFinderQuiz";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { RepoCard } from "@/components/RepoCard";
import { Faq } from "@/components/Faq";
import { GitHubMark } from "@/components/icons";

const owners = ["microsoft", "DataTalksClub", "huggingface", "freeCodeCamp", "ossu", "karpathy", "fastai", "d2l-ai", "android", "flutter", "OWASP", "ultralytics", "opencv", "TheOdinProject", "mdn", "rasbt", "roboflow", "docker", "vercel", "modelcontextprotocol"];

const steps = [
  { icon: Compass, title: "Pilih jalur", desc: `${allTracks.length} jalur, dari Fondasi IT, Frontend, dan Mobile sampai AI Engineer, DevOps, Cyber Security, dan IoT. Setiap jalur punya level, durasi, dan peran kerja yang dituju.` },
  { icon: FolderGit2, title: "Baca modul di sini", desc: "Setiap tahap adalah satu modul berbahasa Indonesia, ditulis ulang dari materi GitHub terbaik. Tidak perlu lompat-lompat ke situs lain." },
  { icon: BookOpenCheck, title: "Pahami lewat visual", desc: "Simulasi interaktif — dari algoritme sorting, subnetting, sampai attention — membuat konsep abstrak bisa dicoba langsung." },
  { icon: CheckCheck, title: "Kuis, centang & proyek", desc: "Uji pemahaman dengan kuis, tandai topik yang dikuasai, lalu buktikan lewat milestone proyek di akhir setiap modul." },
];

const faqs = [
  { q: "Apakah SatuTahu benar-benar gratis?", a: "Ya. Seluruh modul dapat dibaca gratis tanpa akun. Materinya ditulis ulang dalam Bahasa Indonesia dari repo GitHub publik, dan setiap modul mencantumkan sumber aslinya di bagian ‘Sumber & kredit’. Sebagian kecil repo rujukan adalah kode pendamping buku; kodenya gratis, tetapi bukunya mungkin berbayar. Ini kami tandai di katalog." },
  { q: "Kenapa materinya ditulis ulang, bukan disalin dari GitHub?", a: "Banyak repo memakai lisensi yang melarang penyalinan ulang atau penggunaan tertentu (mis. NonCommercial atau NoDerivatives). Karena itu kami menulis penjelasan sendiri dalam Bahasa Indonesia, membuat contoh dan visualisasi baru, lalu memberi kredit dan tautan ke sumber aslinya. Hasilnya bukan terjemahan kata per kata, melainkan modul yang disusun agar runtut untuk pemula." },
  { q: "Bagaimana sumber materi dipilih?", a: "Setiap repo dicek keberadaannya, jumlah bintang, dan relevansinya dengan tahap belajar. Bintang bukan satu-satunya ukuran: repo resmi (mis. dokumentasi OWASP, sampel Android/Flutter) dan kurikulum universitas diprioritaskan meski bintangnya lebih sedikit. Dari situ kami memilih bagian yang paling lengkap untuk dijadikan modul." },
  { q: "Apakah modul di sini cukup, atau saya tetap perlu membaca repo aslinya?", a: "Modul dirancang cukup untuk memahami konsep inti dan mengerjakan milestone setiap tahap. Untuk pendalaman — latihan tambahan, kode lengkap, atau topik lanjutan — repo rujukan (kebanyakan berbahasa Inggris) tetap tersedia di katalog dan di bagian kredit setiap modul. Anggap modul sebagai peta dan penjelasan, dan repo sebagai perpustakaan." },
  { q: "Apakah progres saya tersimpan?", a: "Progres disimpan di browser kamu (localStorage), tanpa akun dan tanpa server. Artinya privat, tetapi progres tidak berpindah otomatis ke perangkat lain dan akan hilang jika data browser dihapus." },
  { q: "Apakah selesai satu jalur berarti siap kerja?", a: "Tidak otomatis. Jalur ini memberi urutan dan sumber, tetapi kesiapan kerja datang dari proyek yang kamu bangun sendiri, umpan balik dari orang lain, dan konsistensi. Karena itu setiap tahap diakhiri milestone, bukan sekadar ‘sudah baca’." },
  { q: "Durasi jalurnya realistis?", a: "Estimasi mengasumsikan sekitar 10–15 jam belajar per minggu bagi pemula. Jika kamu sudah punya dasar, banyak tahap bisa dipercepat. Anggap angka itu sebagai panduan kasar, bukan target." },
];

export default function Home() {
  const stats = globalStats();
  return (
    <>
      <Hero stats={stats} />

      {/* Marquee sumber */}
      <section aria-label="Sumber materi" className="border-y-2 border-ink bg-ink py-4 text-paper">
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex shrink-0 animate-marquee items-center gap-3 pr-3">
            {[...owners, ...owners].map((o, i) => (
              <span key={i} className="flex items-center gap-2 rounded-full border border-paper/20 px-4 py-1.5 text-sm font-semibold whitespace-nowrap text-paper/85">
                <GitHubMark className="size-4 text-sun-400" /> {o}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Fitur Praktik Interaktif: Game Coding, Playground, Cheatsheet */}
      <section className="container-page pt-16 sm:pt-20">
        <Reveal>
          <SectionHeading
            eyebrow="Belajar aktif & menyenangkan"
            title={<>Bukan cuma baca. <span className="bg-sun-300 px-2">Main &amp; praktik langsung.</span></>}
            desc="Bangun insting ngoding lewat 4 mode game interaktif, uji kode HTML/CSS/JS langsung di browser, dan hafalkan konsep penting lewat cheatsheet & flashcard."
          />
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Reveal>
            <Link href="/game" className="group card card-hover flex h-full flex-col bg-sun-100 p-6">
              <span className="grid size-12 place-items-center rounded-xl border-2 border-ink bg-sun-400 shadow-hard-sm">
                <Gamepad2 className="size-6" />
              </span>
              <h3 className="mt-4 text-xl font-extrabold">Arena Game Coding</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-2">
                4 mode seru ramah HP: Tahu Bot (logika grid), Susun Kode (Parsons), Bug Hunter Arcade, dan SQL/Git/CSS Flexbox Quest. Raih XP &amp; lencana!
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold">Mainkan sekarang <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          </Reveal>
          <Reveal delay={0.06}>
            <Link href="/playground" className="group card card-hover flex h-full flex-col bg-paper p-6">
              <span className="grid size-12 place-items-center rounded-xl border-2 border-ink bg-[#dff5e7] shadow-hard-sm">
                <Code2 className="size-6" />
              </span>
              <h3 className="mt-4 text-xl font-extrabold">Coding Playground Live</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-2">
                Tulis &amp; jalankan HTML, CSS, dan JavaScript langsung di browser lengkap dengan preview layar HP/desktop, console, dan tantangan berpenilai otomatis.
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold">Buka Playground <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          </Reveal>
          <Reveal delay={0.12}>
            <Link href="/cheatsheet" className="group card card-hover flex h-full flex-col bg-paper p-6">
              <span className="grid size-12 place-items-center rounded-xl border-2 border-ink bg-[#cfe3ff] shadow-hard-sm">
                <FileCode2 className="size-6" />
              </span>
              <h3 className="mt-4 text-xl font-extrabold">Cheatsheet &amp; Flashcard</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-2">
                Contekan perintah &amp; pola kode siap salin, daftar kesalahan umum pemula, plus 114 kartu flashcard interaktif untuk seluruh 19 jalur.
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold">Buka Cheatsheet <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-10">
          <PathFinderQuiz />
        </Reveal>
      </section>

      {/* Jalur */}
      <section id="jalur" className="container-page scroll-mt-24 pt-20 sm:pt-24">
        <Reveal>
          <SectionHeading eyebrow="Jalur belajar" title={<>Mau jadi apa? <span className="bg-sun-300 px-2">Pilih jalurnya.</span></>} desc="Setiap jalur adalah kurikulum bertahap berisi modul berbahasa Indonesia yang disusun dari repo GitHub terbaik di bidangnya, bukan sekadar daftar link." />
        </Reveal>
        <div className="mt-10">
          <TrackExplorer />
        </div>
      </section>

      {/* Cara belajar */}
      <section id="cara-belajar" className="container-page scroll-mt-24 pt-28">
        <Reveal>
          <SectionHeading eyebrow="Cara belajar" title="Dari bingung mulai dari mana, ke tahu langkah berikutnya" />
        </Reveal>
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.08} className="card relative h-full p-6">
                <span className="absolute -top-4 right-5 rounded-lg border-2 border-ink bg-sun-400 px-2.5 py-0.5 font-mono text-sm font-bold">0{i + 1}</span>
                <span className="grid size-12 place-items-center rounded-xl border-2 border-ink bg-cream">
                  <s.icon className="size-6" />
                </span>
                <h3 className="mt-5 text-lg font-extrabold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Roadmap showcase */}
      <section className="relative mt-28 border-y-2 border-ink bg-sun-300 py-24">
        <div className="bg-grid-ink absolute inset-0 opacity-60" />
        <div className="container-page relative">
          <Reveal>
            <SectionHeading eyebrow="Roadmap interaktif" title="Lihat seluruh perjalanan sebelum melangkah" desc="Klik setiap stasiun untuk melihat tujuan, topik, dan milestone-nya. Di halaman jalur, stasiun akan terisi sesuai progresmu." />
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <RoadmapShowcase />
          </Reveal>
        </div>
      </section>

      {/* Kenapa dikurasi */}
      <section className="container-page pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="Kenapa SatuTahu"
              title="Materi gratis itu melimpah. Yang langka adalah urutannya."
              desc="Satu pencarian ‘awesome machine learning’ menghasilkan ratusan repo. Masalahnya bukan kurang materi, tapi tidak tahu mana yang dibaca dulu, mana yang cukup dilewati, dan kapan harus berhenti membaca lalu mulai membangun."
            />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-dashed border-ink/40 bg-paper/60 p-5">
                <p className="text-sm font-extrabold text-muted">Belajar sendiri dari GitHub</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {["Bookmark menumpuk, tidak tahu mulai dari mana", "Lompat-lompat antar tutorial", "Tidak tahu sudah cukup atau belum", "Repo usang atau pindah tanpa disadari"].map((x) => (
                    <li key={x} className="flex gap-2.5 text-muted"><X className="mt-0.5 size-4 shrink-0 text-[#d9534f]" />{x}</li>
                  ))}
                </ul>
              </div>
              <div className="card bg-paper p-5">
                <p className="text-sm font-extrabold">Dengan SatuTahu</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {["Satu jalur bertahap dengan tujuan jelas", "Modul berbahasa Indonesia, dibaca di satu tempat", "Visualisasi interaktif, kuis & milestone", "Sumber asli tetap dikreditkan & dapat ditelusuri"].map((x) => (
                    <li key={x} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 rounded-full bg-sun-400 p-0.5" strokeWidth={3} />{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Fondasi */}
      <section className="container-page pt-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <SectionHeading align="left" eyebrow="Untuk semua jalur" title="Repo fondasi yang layak kamu simpan" desc="Apa pun jalurmu, sumber-sumber ini akan terus terpakai." />
          </Reveal>
          <Link href="/katalog" className="btn btn-ghost">Lihat semua {stats.repos} repo <ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {foundations.slice(0, 6).map((r, i) => (
            <Reveal key={r.repo} delay={i * 0.05}>
              <RepoCard r={r} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-page scroll-mt-24 pt-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <SectionHeading align="left" eyebrow="FAQ" title="Pertanyaan yang sering muncul" desc="Kami lebih suka jujur soal batasan SatuTahu daripada menjanjikan hal yang tidak bisa ditepati." />
          </Reveal>
          <Reveal delay={0.1}>
            <Faq items={faqs} />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pt-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border-2 border-ink bg-sun-400 px-6 py-14 text-center shadow-hard-lg sm:px-12">
            <div className="bg-grid-ink absolute inset-0" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl">Satu tahap hari ini lebih baik daripada seratus bookmark.</h2>
              <p className="mx-auto mt-4 max-w-lg text-ink-2">Pilih satu jalur, selesaikan tahap pertamanya, lalu kembali ke sini untuk mencentangnya.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/jalur" className="btn btn-dark !px-6 !py-3.5 !text-base">Mulai sekarang <ArrowRight className="size-5" /></Link>
                <Link href="/katalog" className="btn btn-ghost !px-6 !py-3.5 !text-base">Cari repo</Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
