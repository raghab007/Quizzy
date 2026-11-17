"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Result = {
  id: string;
  score: number;
  total_marks: number;
  percentage: number;
  status: string;
  submitted_at: string | null;
  student?: { full_name: string; email: string; groups?: { name: string }[] | null };
  quiz?: { title: string };
};

export default function AdminResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadResults() {
    const response = await fetch("/api/admin/results");
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    setResults(body.results);
  }

  useEffect(() => {
    loadResults().catch((loadError: Error) => setError(loadError.message));
  }, []);

  async function deleteResult(id: string) {
    if (!window.confirm("Delete this attempt and its answers permanently?")) return;
    const response = await fetch(`/api/admin/results/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error);
      return;
    }
    setResults((current) => current.filter((result) => result.id !== id));
  }

  const visibleResults = results.filter((result) => {
    const search = filter.toLowerCase();
    return !search || [result.student?.full_name, result.student?.email, result.student?.groups?.[0]?.name, result.quiz?.title]
      .some((value) => value?.toLowerCase().includes(search));
  });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><Link href="/admin/dashboard" className="text-sm font-medium text-cyan-700">Back to dashboard</Link><h1 className="mt-3 text-4xl font-semibold text-slate-950">Student results</h1><p className="mt-2 text-slate-600">Search, review, and remove submitted quiz attempts.</p></div>
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search student, group, quiz..." className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 sm:w-80" />
        </div>
        {error && <p className="mt-6 rounded-lg bg-rose-50 p-4 text-rose-700">{error}</p>}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Student</th><th className="px-5 py-4">Group</th><th className="px-5 py-4">Quiz</th><th className="px-5 py-4">Score</th><th className="px-5 py-4">Percentage</th><th className="px-5 py-4">Submitted</th><th className="px-5 py-4">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {visibleResults.map((result) => <tr key={result.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-900">{result.student?.full_name ?? "Unknown"}</p><p className="text-slate-500">{result.student?.email}</p></td><td className="px-5 py-4 text-slate-700">{result.student?.groups?.[0]?.name ?? "—"}</td><td className="px-5 py-4 text-slate-700">{result.quiz?.title ?? "—"}</td><td className="px-5 py-4 font-semibold text-slate-900">{result.score}/{result.total_marks}</td><td className="px-5 py-4 font-semibold text-cyan-700">{Number(result.percentage).toFixed(1)}%</td><td className="px-5 py-4 text-slate-500">{result.submitted_at ? new Date(result.submitted_at).toLocaleString() : "—"}</td><td className="px-5 py-4"><button onClick={() => deleteResult(result.id)} className="font-medium text-rose-600 hover:text-rose-800">Delete</button></td></tr>)}
              {visibleResults.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">No results found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
