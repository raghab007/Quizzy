"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Overview = {
  students: number;
  quizzes: number;
  attempts: number;
  average_percentage: number;
  highest_score: number;
  lowest_score: number;
  highest_student: string;
  lowest_student: string;
  groups: {
    name: string;
    attempts: number;
    average: number;
    right: number;
    wrong: number;
    highest: { name: string; marks: number } | null;
    lowest: { name: string; marks: number } | null;
  }[];
};

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        return body as Overview;
      })
      .then(setOverview)
      .catch((loadError: Error) => setError(loadError.message));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Admin workspace</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Assessment overview</h1>
            <p className="mt-3 text-slate-400">Track student performance across quizzes and groups.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/results" className="rounded-lg bg-cyan-300 px-4 py-2.5 font-semibold text-slate-950">View results</Link>
            <Link href="/admin/question-bank" className="rounded-lg border border-slate-700 px-4 py-2.5 font-semibold text-white">Question bank</Link>
            <Link href="/admin/quizzes" className="rounded-lg border border-slate-700 px-4 py-2.5 font-semibold text-white">Quizzes</Link>
          </div>
        </div>
        {error && <p className="mt-8 rounded-xl bg-rose-950/60 p-4 text-rose-200">{error}</p>}
        {!overview && !error ? (
          <p className="mt-10 text-slate-400">Loading dashboard...</p>
        ) : overview ? (
          <>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Students", overview.students],
                ["Quizzes", overview.quizzes],
                ["Submitted attempts", overview.attempts],
                ["Average percentage", `${overview.average_percentage.toFixed(1)}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Group performance</h2>
                    <p className="mt-1 text-sm text-slate-400">Average MCQ score by student group.</p>
                  </div>
                  <span className="text-sm text-slate-500">Percentage</span>
                </div>
                <div className="mt-7 space-y-5">
                  {overview.groups.length === 0 ? <p className="text-slate-400">No submitted attempts yet.</p> : overview.groups.map((group) => (
                    <div key={group.name} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="mb-3 flex justify-between text-sm">
                        <span className="font-semibold text-slate-200">{group.name}</span>
                        <span className="font-semibold text-cyan-300">{group.average.toFixed(1)}% average</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-800">
                        <div className="h-3 rounded-full bg-cyan-400" style={{ width: `${Math.min(group.average, 100)}%` }} />
                      </div>
                      <div className="mt-3 flex gap-4 text-xs text-slate-400">
                        <span>{group.attempts} attempt{group.attempts === 1 ? "" : "s"}</span>
                        <span className="text-emerald-300">{group.right} right</span>
                        <span className="text-rose-300">{group.wrong} wrong</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-emerald-950/50 px-3 py-2 text-emerald-200">
                          <span className="block text-emerald-400">Highest</span>
                          {group.highest ? `${group.highest.name} · ${group.highest.marks} marks` : "No results"}
                        </div>
                        <div className="rounded-lg bg-amber-950/50 px-3 py-2 text-amber-200">
                          <span className="block text-amber-400">Lowest</span>
                          {group.lowest ? `${group.lowest.name} · ${group.lowest.marks} marks` : "No results"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold text-white">Score range</h2>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-emerald-950/60 p-5"><p className="text-sm text-emerald-300">Highest marks</p><p className="mt-2 text-3xl font-bold text-emerald-100">{overview.highest_score}</p><p className="mt-1 text-sm text-emerald-200">{overview.highest_student}</p></div>
                  <div className="rounded-xl bg-amber-950/60 p-5"><p className="text-sm text-amber-300">Lowest marks</p><p className="mt-2 text-3xl font-bold text-amber-100">{overview.lowest_score}</p><p className="mt-1 text-sm text-amber-200">{overview.lowest_student}</p></div>
                </div>
                <Link href="/admin/results" className="mt-6 block rounded-lg border border-slate-700 px-4 py-3 text-center font-medium text-slate-200 hover:bg-slate-800">Open detailed results</Link>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
