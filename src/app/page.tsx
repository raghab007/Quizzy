import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fc] px-4 text-slate-900 sm:px-6">
      <header className="mx-auto flex max-w-6xl items-center justify-between py-4 sm:py-6">
        <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#635bdb] text-white shadow-lg shadow-violet-200">Q</span>quizzy<span className="-ml-3 text-[#635bdb]">.</span></Link>
        <Link href="/admin/login" className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700">Admin sign in <span aria-hidden="true">↗</span></Link>
      </header>
      <div className="mx-auto grid min-h-[calc(100vh-88px)] max-w-6xl items-center gap-10 pb-16 pt-8 lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative z-10 py-10">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-violet-700 shadow-sm"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Assessment studio</p>
        <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-[-.055em] sm:text-6xl lg:text-7xl">Java assessments,<br/><span className="text-[#635bdb]">made simple.</span></h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">A focused platform for running reliable Java quizzes and understanding student performance.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/quiz"
            className="rounded-xl bg-[#635bdb] px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-[#554dc8]"
          >
            Start your assessment <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:grid-cols-3 sm:gap-8 sm:text-sm"><div><strong className="block text-lg text-slate-800 sm:text-xl">Focused</strong>distraction-free testing</div><div><strong className="block text-lg text-slate-800 sm:text-xl">Clear</strong>instant feedback</div><div className="col-span-2 sm:col-span-1"><strong className="block text-lg text-slate-800 sm:text-xl">Insightful</strong>performance reports</div></div>
        </div>
        <div className="relative mx-auto w-full max-w-[480px] py-10">
          <div className="absolute -inset-10 rounded-full bg-violet-100/70 blur-3xl" />
          <div className="relative rotate-0 rounded-[26px] border border-white bg-white p-5 shadow-[0_25px_90px_-35px_rgba(65,61,145,.32)] sm:rotate-1 sm:p-8">
            <div className="flex items-center justify-between"><div><span className="text-xs font-bold uppercase tracking-widest text-violet-600">Quick preview</span><h2 className="mt-2 text-xl font-bold">Java fundamentals</h2></div><span className="rounded-lg bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700">12 min</span></div>
            <div className="mt-7 flex items-center justify-between text-xs font-medium text-slate-400"><span>QUESTION 03 OF 12</span><span>25%</span></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full w-1/4 rounded-full bg-[#7168e5]" /></div>
            <p className="mt-7 text-lg font-semibold leading-7 text-slate-800">Which keyword is used to inherit a class in Java?</p>
            <div className="mt-5 space-y-3">{["implements", "extends", "inherits"].map((answer, index) => <div key={answer} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${index === 1 ? "border-violet-300 bg-violet-50 text-violet-800" : "border-slate-100 text-slate-500"}`}><span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${index === 1 ? "bg-[#635bdb] text-white" : "bg-slate-100 text-slate-500"}`}>{String.fromCharCode(65+index)}</span><span className="text-sm font-medium">{answer}</span>{index===1&&<span className="ml-auto text-violet-600">✓</span>}</div>)}</div>
            <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5"><span className="text-xs text-slate-400">Your progress is saved automatically</span><span className="rounded-lg bg-[#635bdb] px-4 py-2 text-sm font-semibold text-white">Continue →</span></div>
          </div>
          <div className="absolute -bottom-2 -left-5 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-xl"><span className="text-xs text-slate-400">Average score</span><strong className="ml-3 text-lg text-slate-800">86%</strong><span className="ml-2 text-xs text-emerald-600">↗ 12%</span></div>
        </div>
      </div>
    </main>
  );
}
