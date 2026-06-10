import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-sm backdrop-blur md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Student Dropout Prediction</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Choose the dashboard role
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
            The frontend is organized into two separate folders inside the app router: one for the teacher view and one for the administrator view.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Link
              href="/teacher"
              className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-brand-500 to-indigo-700 p-6 text-white shadow-glow transition hover:-translate-y-0.5"
            >
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">Teacher Folder</div>
              <div className="mt-3 text-2xl font-semibold">Open teacher dashboard</div>
              <p className="mt-2 text-sm text-white/80">Class attendance, student overview, and weekly activity tracking.</p>
            </Link>

            <Link
              href="/administrator"
              className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-lg transition hover:-translate-y-0.5"
            >
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">Administrator Folder</div>
              <div className="mt-3 text-2xl font-semibold">Open administrator dashboard</div>
              <p className="mt-2 text-sm text-white/70">University-wide analytics, risk insights, and intervention actions.</p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
