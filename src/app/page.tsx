import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Quizzy
        </p>
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight sm:text-6xl">
          Java assessments, made simple.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
          A focused platform for running reliable Java quizzes and understanding
          student performance.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/quiz"
            className="rounded-full bg-cyan-300 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Take a quiz
          </Link>
          <Link
            href="/admin/login"
            className="rounded-full border border-slate-700 px-6 py-3 font-semibold text-white transition hover:border-slate-500"
          >
            Admin sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
