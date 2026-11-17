"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Quiz = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  passing_marks: number | null;
  is_published: boolean;
  allow_retake: boolean;
  show_answers_after_submission: boolean;
};

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/quizzes")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        return body.quizzes as Quiz[];
      })
      .then(setQuizzes)
      .catch((loadError: Error) => setError(loadError.message));
  }, []);

  function updateQuiz(id: string, changes: Partial<Quiz>) {
    setQuizzes((current) => current.map((quiz) => quiz.id === id ? { ...quiz, ...changes } : quiz));
  }

  async function saveQuiz(quiz: Quiz) {
    setSaving(quiz.id);
    const response = await fetch("/api/admin/quizzes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quiz),
    });
    const body = await response.json();
    setSaving(null);
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setQuizzes((current) => current.map((item) => item.id === quiz.id ? body.quiz : item));
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/dashboard" className="text-sm font-medium text-cyan-700">Back to dashboard</Link>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950">Quiz management</h1>
        <p className="mt-2 text-slate-600">Modify availability, timing, retakes, and answer-review settings.</p>
        {error && <p className="mt-6 rounded-lg bg-rose-50 p-4 text-rose-700">{error}</p>}
        <div className="mt-8 space-y-5">
          {quizzes.map((quiz) => (
            <section key={quiz.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Title<input value={quiz.title} onChange={(event) => updateQuiz(quiz.id, { title: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
                <label className="text-sm font-medium text-slate-700">Description<input value={quiz.description} onChange={(event) => updateQuiz(quiz.id, { description: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
                <label className="text-sm font-medium text-slate-700">Duration (minutes)<input type="number" min={1} max={600} value={quiz.duration_minutes} onChange={(event) => updateQuiz(quiz.id, { duration_minutes: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
                <label className="text-sm font-medium text-slate-700">Passing marks<input type="number" min={0} value={quiz.passing_marks ?? ""} onChange={(event) => updateQuiz(quiz.id, { passing_marks: event.target.value === "" ? null : Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
              </div>
              <div className="mt-5 flex flex-wrap gap-5 text-sm text-slate-700">
                <label className="flex items-center gap-2"><input type="checkbox" checked={quiz.is_published} onChange={(event) => updateQuiz(quiz.id, { is_published: event.target.checked })} /> Published</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={quiz.allow_retake} onChange={(event) => updateQuiz(quiz.id, { allow_retake: event.target.checked })} /> Allow retakes</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={quiz.show_answers_after_submission} onChange={(event) => updateQuiz(quiz.id, { show_answers_after_submission: event.target.checked })} /> Show answers after submission</label>
              </div>
              <button onClick={() => saveQuiz(quiz)} disabled={saving === quiz.id} className="mt-6 rounded-lg bg-slate-950 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{saving === quiz.id ? "Saving..." : "Save quiz changes"}</button>
            </section>
          ))}
          {quizzes.length === 0 && !error && <p className="text-slate-500">No quizzes found.</p>}
        </div>
      </div>
    </main>
  );
}
