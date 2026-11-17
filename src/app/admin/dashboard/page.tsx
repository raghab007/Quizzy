"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Overview = {
  students: number; quizzes: number; attempts: number; average_percentage: number;
  highest_score: number; lowest_score: number; highest_student: string; lowest_student: string;
  groups: { name: string; attempts: number; average: number; right: number; wrong: number; highest: { name: string; marks: number } | null; lowest: { name: string; marks: number } | null }[];
};

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const quizUrl = process.env.NEXT_PUBLIC_STUDENT_QUIZ_URL ?? "https://quizzy-tau-sage.vercel.app/quiz";

  useEffect(() => {
    fetch("/api/admin/overview").then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      return body as Overview;
    }).then(setOverview).catch((loadError: Error) => setError(loadError.message));
  }, []);

  return (
    <main>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-violet-600">OVERVIEW</p><h1 className="mt-2">Good to see you, Admin</h1><p className="mt-2 text-sm text-slate-500">Here’s how your assessments are performing.</p></div>
          <Link href="/admin/question-bank" className="rounded-lg bg-[#635bdb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200">＋ Add a question</Link>
        </div>
        {error && <p className="mt-7 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</p>}
        {!overview && !error ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white" />)}</div> : overview ? <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[["Total students", overview.students, "◉", "#e9f7f2", "#319875"],["Active quizzes", overview.quizzes, "▤", "#efedff", "#655ddb"],["Completed attempts", overview.attempts, "✓", "#fff4e8", "#d28a34"],["Average score", `${overview.average_percentage.toFixed(1)}%`, "↗", "#eaf3ff", "#4384c6"]].map(([label,value,icon,bg,color]) => <article key={label} className="rounded-2xl border border-slate-100 bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className="grid h-9 w-9 place-items-center rounded-xl text-base" style={{background:bg as string,color:color as string}}>{icon}</span></div><p className="mt-4 text-3xl font-bold tracking-tight text-slate-800">{value}</p></article>)}
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
            <section className="rounded-2xl border border-slate-100 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-800">Group performance</h2><p className="mt-1 text-sm text-slate-400">A snapshot of scores across your student groups.</p></div><Link href="/admin/results" className="text-sm font-semibold text-violet-700 hover:text-violet-900">View all results →</Link></div>
              <div className="mt-6 space-y-5">{overview.groups.length === 0 ? <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No submitted attempts yet. Results will appear here once a quiz is complete.</p> : overview.groups.map((group) => <div key={group.name} className="rounded-xl border border-slate-100 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-800">{group.name}</p><p className="mt-1 text-xs text-slate-400">{group.attempts} submitted attempt{group.attempts===1?"":"s"}</p></div><span className="text-sm font-bold text-violet-700">{group.average.toFixed(1)}%</span></div><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" style={{width:`${Math.min(Math.max(group.average,0),100)}%`}} /></div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"><span><b className="text-emerald-600">{group.right}</b> correct</span><span><b className="text-rose-500">{group.wrong}</b> incorrect</span>{group.highest&&<span>Top score: <b className="text-slate-600">{group.highest.name}</b></span>}</div></div>)}</div>
            </section>
            <section className="rounded-2xl border border-slate-100 bg-white p-6"><h2 className="text-lg font-bold text-slate-800">Score highlights</h2><p className="mt-1 text-sm text-slate-400">Highest and lowest submitted results.</p><div className="mt-6 space-y-3"><div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-emerald-700">Highest score</span><span className="text-xl text-emerald-600">↗</span></div><p className="mt-2 text-3xl font-bold text-emerald-900">{overview.highest_score}</p><p className="mt-1 text-sm text-emerald-800">{overview.highest_student}</p></div><div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-amber-700">Lowest score</span><span className="text-xl text-amber-600">↘</span></div><p className="mt-2 text-3xl font-bold text-amber-900">{overview.lowest_score}</p><p className="mt-1 text-sm text-amber-800">{overview.lowest_student}</p></div></div><Link href="/admin/results" className="mt-5 block rounded-lg border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Explore detailed results <span className="ml-1">→</span></Link></section>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Manage quizzes","Edit settings and availability","/admin/quizzes","→"],["Question bank","Build and organize questions","/admin/question-bank","＋"],["Student results","Review submitted attempts","/admin/results","↗"],["Student groups","Create and manage groups","/admin/groups","◎"]].map(([title,description,href,icon])=><Link href={href} key={title} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"><span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-700">{icon}</span><span><b className="block text-sm text-slate-800">{title}</b><small className="mt-1 block text-xs text-slate-400">{description}</small></span><span className="ml-auto text-slate-300">→</span></Link>)}</div>
          <section className="mt-6 flex flex-col gap-6 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-6 sm:flex-row sm:items-center">
            <div className="rounded-xl bg-white p-3 shadow-sm">
              <QRCodeSVG value={quizUrl} size={150} level="M" includeMargin />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Share with students</p>
              <h2 className="mt-2 text-xl font-bold text-slate-800">Open the student quiz</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Students can scan this QR code to open the assessment registration page on their phones.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={async () => { await navigator.clipboard.writeText(quizUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="rounded-lg bg-[#635bdb] px-4 py-2 text-sm font-semibold text-white">{copied ? "Link copied" : "Copy quiz link"}</button>
                <a href={quizUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Open quiz</a>
              </div>
              <p className="mt-3 break-all text-xs text-slate-400">{quizUrl}</p>
            </div>
          </section>
        </> : null}
      </div>
    </main>
  );
}
