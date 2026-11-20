/** Kerangka halaman yang tampil seketika saat berpindah halaman, sebelum konten dari server tiba. */
function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-ink/10 ${className}`} />;
}

export function LessonSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat modul">
      <header className="relative overflow-hidden border-b-2 border-ink bg-sun-100">
        <div className="container-page py-8 sm:py-10">
          <Bar className="h-4 w-48" />
          <Bar className="mt-5 h-12 w-full max-w-2xl" />
          <Bar className="mt-3 h-12 w-2/3 max-w-xl" />
          <Bar className="mt-6 h-5 w-full max-w-3xl" />
          <Bar className="mt-2 h-5 w-5/6 max-w-2xl" />
          <div className="mt-6 flex gap-2">{[0, 1, 2, 3].map((i) => <Bar key={i} className="h-7 w-24 rounded-full" />)}</div>
        </div>
      </header>
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[240px_1fr_200px]">
        <div className="hidden space-y-3 lg:block">{[0, 1, 2, 3, 4].map((i) => <Bar key={i} className="h-9" />)}</div>
        <div className="space-y-4">
          <Bar className="h-40 rounded-2xl" />
          {[0, 1, 2, 3, 4, 5].map((i) => <Bar key={i} className="h-4" />)}
          <Bar className="h-64 rounded-2xl" />
        </div>
        <div className="hidden space-y-2 lg:block">{[0, 1, 2, 3, 4].map((i) => <Bar key={i} className="h-4" />)}</div>
      </div>
    </div>
  );
}

export function TrackSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat jalur">
      <section className="border-b-2 border-ink bg-sun-300">
        <div className="container-page grid gap-10 pt-8 pb-12 lg:grid-cols-[1.5fr_1fr] lg:pb-16">
          <div>
            <Bar className="h-4 w-28" />
            <Bar className="mt-6 h-14 w-full max-w-xl" />
            <Bar className="mt-5 h-5 w-full max-w-lg" />
            <Bar className="mt-2 h-5 w-4/5 max-w-md" />
          </div>
          <Bar className="h-72 rounded-2xl" />
        </div>
      </section>
      <div className="container-page space-y-6 py-12">
        <Bar className="h-48 rounded-2xl" />
        <Bar className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
