"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Topic = { id: string; name: string };
type Option = { id?: string; option_text: string; is_correct: boolean; display_order: number };
type Question = {
  id: string;
  question_text: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  explanation: string;
  topics?: Topic[] | null;
  question_options: Option[];
};
type Draft = {
  id?: string;
  topic_id: string;
  question_text: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  explanation: string;
  options: { id?: string; option_text: string; is_correct: boolean }[];
};

const emptyDraft: Draft = {
  topic_id: "",
  question_text: "",
  difficulty: "medium",
  marks: 1,
  explanation: "",
  options: [
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ],
};

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    const [questionsResponse, topicsResponse] = await Promise.all([
      fetch("/api/admin/questions"),
      fetch("/api/admin/topics"),
    ]);
    const questionsBody = await questionsResponse.json();
    const topicsBody = await topicsResponse.json();
    if (!questionsResponse.ok) throw new Error(questionsBody.error);
    if (!topicsResponse.ok) throw new Error(topicsBody.error);
    setQuestions(questionsBody.questions);
    setTopics(topicsBody.topics);
  }

  useEffect(() => {
    loadData().catch((loadError: Error) => setError(loadError.message));
  }, []);

  function editQuestion(question: Question) {
    setDraft({
      id: question.id,
      topic_id: question.topics?.[0]?.id ?? "",
      question_text: question.question_text,
      difficulty: question.difficulty,
      marks: Number(question.marks),
      explanation: question.explanation,
      options: question.question_options
        .sort((a, b) => a.display_order - b.display_order)
        .map(({ id, option_text, is_correct }) => ({ id, option_text, is_correct })),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    const response = await fetch("/api/admin/questions", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setDraft(null);
    await loadData();
  }

  async function deleteQuestion(id: string) {
    if (!window.confirm("Delete this question permanently?")) return;
    const response = await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setQuestions((current) => current.filter((question) => question.id !== id));
  }

  const visible = questions.filter((question) =>
    [question.question_text, question.topics?.[0]?.name]
      .some((value) => value?.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/dashboard" className="text-sm font-medium text-cyan-700">Back to dashboard</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Content management</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-950">Question bank</h1>
            <p className="mt-2 text-slate-600">Create, edit, review, and organize the questions used by your quizzes.</p>
          </div>
          <button onClick={() => setDraft(emptyDraft)} className="rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">+ New question</button>
        </div>
        {error && <div className="mt-6 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700"><span>{error}</span><button onClick={() => setError(null)} className="font-bold">Dismiss</button></div>}

        {draft && (
          <form onSubmit={saveQuestion} className="mt-8 rounded-2xl border border-cyan-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-slate-950">{draft.id ? "Edit question" : "Create question"}</h2><p className="mt-1 text-sm text-slate-500">All four options and exactly one correct answer are required.</p></div><button type="button" onClick={() => setDraft(null)} className="text-slate-500 hover:text-slate-900">Cancel</button></div>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <label className="text-sm font-medium text-slate-700 md:col-span-2">Question text<textarea required value={draft.question_text} onChange={(event) => setDraft({ ...draft, question_text: event.target.value })} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
              <div className="space-y-5">
                <label className="block text-sm font-medium text-slate-700">Topic<select required value={draft.topic_id} onChange={(event) => setDraft({ ...draft, topic_id: event.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"><option value="">Select topic</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label>
                <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-slate-700">Difficulty<select value={draft.difficulty} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value as Draft["difficulty"] })} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label><label className="text-sm font-medium text-slate-700">Marks<input required type="number" min={0.5} step={0.5} value={draft.marks} onChange={(event) => setDraft({ ...draft, marks: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label></div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">{draft.options.map((option, index) => <div key={index} className="flex items-center gap-3"><input type="radio" name="correct-option" checked={option.is_correct} onChange={() => setDraft({ ...draft, options: draft.options.map((item, itemIndex) => ({ ...item, is_correct: itemIndex === index })) })} /><input required value={option.option_text} placeholder={`Option ${String.fromCharCode(65 + index)}`} onChange={(event) => setDraft({ ...draft, options: draft.options.map((item, itemIndex) => itemIndex === index ? { ...item, option_text: event.target.value } : item) })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" /></div>)}</div>
            <label className="mt-5 block text-sm font-medium text-slate-700">Explanation<textarea required value={draft.explanation} onChange={(event) => setDraft({ ...draft, explanation: event.target.value })} rows={2} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
            <button disabled={saving} className="mt-6 rounded-lg bg-cyan-600 px-5 py-3 font-semibold text-white hover:bg-cyan-700 disabled:opacity-50">{saving ? "Saving..." : "Save question"}</button>
          </form>
        )}

        <div className="mt-8 flex items-center justify-between gap-4"><p className="text-sm text-slate-500">{visible.length} of {questions.length} questions</p><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search questions or topics..." className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 sm:w-80" /></div>
        <div className="mt-5 space-y-4">{visible.map((question, index) => <article key={question.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{question.topics?.[0]?.name ?? "Uncategorized"} · {question.difficulty} · {question.marks} mark{question.marks === 1 ? "" : "s"}</p><h2 className="mt-2 text-lg font-semibold text-slate-950">{index + 1}. {question.question_text}</h2></div><div className="flex gap-2"><button onClick={() => editQuestion(question)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Edit</button><button onClick={() => deleteQuestion(question.id)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">Delete</button></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{question.question_options.sort((a, b) => a.display_order - b.display_order).map((option) => <div key={option.display_order} className={`rounded-lg border px-3 py-2 text-sm ${option.is_correct ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-700"}`}>{String.fromCharCode(65 + option.display_order - 1)}. {option.option_text}{option.is_correct && <span className="ml-2 text-xs font-bold uppercase">Correct</span>}</div>)}</div><p className="mt-4 text-sm leading-6 text-slate-500">{question.explanation}</p></article>)}</div>
      </div>
    </main>
  );
}
