"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type RecordRow = {
  id: string;
  student_id: string;
  student_name: string;
  group_id: string;
  group_name: string;
  quiz_id: string;
  quiz_title: string;
  score: number;
  total_marks: number;
  percentage: number;
  right: number;
  wrong: number;
  submitted_at: string | null;
};
type Overview = {
  students: number;
  quizzes: number;
  attempts: number;
  average_percentage: number;
  highest_score: number;
  lowest_score: number;
  highest_student: string;
  lowest_student: string;
  group_options: { id: string; name: string }[];
  student_options: { id: string; name: string; group_id: string }[];
  quiz_options: { id: string; title: string }[];
  records: RecordRow[];
};

function GroupSummary({ name, records }: { name: string; records: RecordRow[] }) {
  const average = records.reduce((sum, record) => sum + record.percentage, 0) / records.length;
  const averageMarks = records.reduce((sum, record) => sum + record.score, 0) / records.length;
  const highest = records.reduce((best, record) => record.score > best.score ? record : best);
  const lowest = records.reduce((worst, record) => record.score < worst.score ? record : worst);
  const right = records.reduce((sum, record) => sum + record.right, 0);
  const wrong = records.reduce((sum, record) => sum + record.wrong, 0);

  return (
    <article className="rounded-xl border border-slate-100 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-slate-800">{name}</p><p className="mt-1 text-xs text-slate-400">{records.length} submitted attempt{records.length === 1 ? "" : "s"}</p></div><div className="text-right"><p className="text-lg font-bold text-violet-700">{average.toFixed(1)}%</p><p className="text-xs text-slate-400">{averageMarks.toFixed(1)} average marks</p></div></div>
      <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" style={{ width: `${Math.min(Math.max(average, 0), 100)}%` }} /></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-emerald-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Highest marks</p><p className="mt-1 font-semibold text-emerald-900">{highest.student_name} · {highest.score}/{highest.total_marks}</p><p className="mt-1 truncate text-xs text-emerald-700">{highest.quiz_title}</p></div>
        <div className="rounded-lg bg-amber-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Lowest marks</p><p className="mt-1 font-semibold text-amber-900">{lowest.student_name} · {lowest.score}/{lowest.total_marks}</p><p className="mt-1 truncate text-xs text-amber-700">{lowest.quiz_title}</p></div>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-slate-400"><span><b className="text-emerald-600">{right}</b> correct</span><span><b className="text-rose-500">{wrong}</b> incorrect</span></div>
    </article>
  );
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [groupFilter, setGroupFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [quizFilter, setQuizFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const quizUrl = process.env.NEXT_PUBLIC_STUDENT_QUIZ_URL ?? "https://quizzy-tau-sage.vercel.app/quiz";

  useEffect(() => {
    fetch("/api/admin/overview").then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      return body as Overview;
    }).then(setOverview).catch((loadError: Error) => setError(loadError.message));
  }, []);

  const visibleRecords = useMemo(() => (overview?.records ?? []).filter((record) => {
    const date = record.submitted_at?.slice(0, 10) ?? "";
    return (!groupFilter || record.group_id === groupFilter)
      && (!studentFilter || record.student_id === studentFilter)
      && (!quizFilter || record.quiz_id === quizFilter)
      && (!fromDate || date >= fromDate)
      && (!toDate || date <= toDate);
  }), [overview, groupFilter, studentFilter, quizFilter, fromDate, toDate]);

  const groupSummaries = useMemo(() => {
    if (!overview) return [];
    const recordsByGroup = new Map<string, RecordRow[]>();
    for (const record of visibleRecords) {
      const list = recordsByGroup.get(record.group_name) ?? [];
      list.push(record);
      recordsByGroup.set(record.group_name, list);
    }
    return [...recordsByGroup.entries()].map(([name, records]) => ({ name, records }));
  }, [overview, visibleRecords]);

  const studentsCount = new Set(visibleRecords.map((record) => record.student_id)).size;
  const quizzesCount = new Set(visibleRecords.map((record) => record.quiz_id)).size;
  const averagePercentage = visibleRecords.length ? visibleRecords.reduce((sum, record) => sum + record.percentage, 0) / visibleRecords.length : 0;
  const highest = visibleRecords.reduce<RecordRow | null>((best, record) => !best || record.score > best.score ? record : best, null);
  const lowest = visibleRecords.reduce<RecordRow | null>((worst, record) => !worst || record.score < worst.score ? record : worst, null);

  async function copyQuizLink() {
    try {
      await navigator.clipboard.writeText(quizUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the link. Copy it from the address shown below the QR code.");
    }
  }

  function downloadQr() {
    const svg = document.getElementById("student-quiz-qr");
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quizzy-student-quiz-qr.svg";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-violet-600">OVERVIEW</p><h1 className="mt-2">Good to see you, Admin</h1><p className="mt-2 text-sm text-slate-500">Review student outcomes and share your assessment.</p></div><Link href="/admin/question-bank" className="rounded-lg bg-[#635bdb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200">＋ Add a question</Link></div>
        {error && <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

        <section className="mt-7 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-[#f1efff] via-white to-[#faf9ff] shadow-sm">
          <div className="grid items-center gap-7 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:gap-10 lg:p-9">
            <div className="order-2 lg:order-1"><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm"><span className="h-2 w-2 rounded-full bg-emerald-400" /> QUICK ACCESS FOR STUDENTS</span><h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Share your quiz in seconds</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Students can scan this code with their phone camera to open the quiz registration page. Keep this screen open while they join.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={copyQuizLink} className="rounded-lg bg-[#635bdb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#554dc8]">{copied ? "✓ Link copied" : "Copy quiz link"}</button><button onClick={downloadQr} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Download QR code</button><a href={quizUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Open quiz ↗</a></div><p className="mt-4 break-all rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-500">{quizUrl}</p></div>
            <div className="order-1 mx-auto rounded-[28px] bg-white p-4 shadow-[0_18px_50px_-20px_rgba(76,63,170,.38)] ring-1 ring-violet-100 sm:p-5 lg:order-2"><div className="rounded-2xl border border-dashed border-violet-200 bg-white p-3 sm:p-4"><QRCodeSVG id="student-quiz-qr" value={quizUrl} size={240} level="H" includeMargin className="h-auto w-[min(62vw,240px)]" /></div><p className="pt-3 text-center text-xs font-semibold text-slate-500">Scan to start the assessment</p></div>
          </div>
        </section>

        {!overview && !error ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white" />)}</div> : overview ? <>
          <section className="mt-7 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-bold text-slate-800">Dashboard filters</h2><p className="mt-1 text-xs text-slate-400">Filter score cards, group averages and student results.</p></div><button onClick={() => { setGroupFilter(""); setStudentFilter(""); setQuizFilter(""); setFromDate(""); setToDate(""); }} className="text-sm font-semibold text-violet-700">Reset filters</button></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><label className="text-xs font-semibold text-slate-500">Student group<select value={groupFilter} onChange={(event) => { setGroupFilter(event.target.value); setStudentFilter(""); }} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">All groups</option>{overview.group_options.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><label className="text-xs font-semibold text-slate-500">Student<select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">All students</option>{overview.student_options.filter((student) => !groupFilter || student.group_id === groupFilter).map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label><label className="text-xs font-semibold text-slate-500">Quiz<select value={quizFilter} onChange={(event) => setQuizFilter(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">All quizzes</option>{overview.quiz_options.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}</select></label><label className="text-xs font-semibold text-slate-500">From date<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="text-xs font-semibold text-slate-500">To date<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label></div></section>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Students in results", studentsCount, "◉", "#e9f7f2", "#319875"],["Quizzes in results", quizzesCount, "▤", "#efedff", "#655ddb"],["Submitted attempts", visibleRecords.length, "✓", "#fff4e8", "#d28a34"],["Average score", `${averagePercentage.toFixed(1)}%`, "↗", "#eaf3ff", "#4384c6"]].map(([label,value,icon,bg,color]) => <article key={label} className="rounded-2xl border border-slate-100 bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><span className="grid h-9 w-9 place-items-center rounded-xl text-base" style={{ background: bg as string, color: color as string }}>{icon}</span></div><p className="mt-4 text-3xl font-bold tracking-tight text-slate-800">{value}</p></article>)}</div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]"><section className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-800">Group performance</h2><p className="mt-1 text-sm text-slate-400">Average marks, score range and student names.</p></div><Link href="/admin/results" className="text-sm font-semibold text-violet-700">View all results →</Link></div><div className="mt-5 space-y-4">{groupSummaries.length ? groupSummaries.map((group) => <GroupSummary key={group.name} name={group.name} records={group.records} />) : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No submitted attempts match these filters.</p>}</div></section>
            <section className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6"><h2 className="text-lg font-bold text-slate-800">Score highlights</h2><p className="mt-1 text-sm text-slate-400">Top and lowest student in this selection.</p><div className="mt-5 space-y-3">{highest ? <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Highest marks</p><p className="mt-2 text-2xl font-bold text-emerald-900">{highest.score}<span className="text-sm font-medium">/{highest.total_marks}</span></p><p className="mt-1 font-semibold text-emerald-800">{highest.student_name}</p><p className="mt-1 text-xs text-emerald-700">{highest.group_name} · {highest.quiz_title}</p></div> : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No results match these filters.</p>}{lowest && <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4"><p className="text-xs font-bold uppercase tracking-wide text-amber-700">Lowest marks</p><p className="mt-2 text-2xl font-bold text-amber-900">{lowest.score}<span className="text-sm font-medium">/{lowest.total_marks}</span></p><p className="mt-1 font-semibold text-amber-800">{lowest.student_name}</p><p className="mt-1 text-xs text-amber-700">{lowest.group_name} · {lowest.quiz_title}</p></div>}</div></section></div>

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-100 bg-white"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-800">Student results</h2><p className="mt-1 text-xs text-slate-400">{visibleRecords.length} attempt{visibleRecords.length === 1 ? "" : "s"} match the current filters.</p></div><Link href="/admin/results" className="text-sm font-semibold text-violet-700">Manage results →</Link></div><div className="overflow-x-auto"><table className="min-w-[680px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Group</th><th className="px-5 py-3">Quiz</th><th className="px-5 py-3">Marks</th><th className="px-5 py-3">Score</th><th className="px-5 py-3">Submitted</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleRecords.slice(0, 12).map((record) => <tr key={record.id}><td className="px-5 py-3 font-semibold text-slate-800">{record.student_name}</td><td className="px-5 py-3 text-slate-500">{record.group_name}</td><td className="px-5 py-3 text-slate-500">{record.quiz_title}</td><td className="px-5 py-3 font-semibold text-slate-700">{record.score}/{record.total_marks}</td><td className="px-5 py-3 font-semibold text-violet-700">{record.percentage.toFixed(1)}%</td><td className="px-5 py-3 text-slate-500">{record.submitted_at ? new Date(record.submitted_at).toLocaleDateString() : "—"}</td></tr>)}{!visibleRecords.length && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No student results found.</td></tr>}</tbody></table></div></section>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Manage quizzes","Edit settings and availability","/admin/quizzes","→"],["Question bank","Build and organize questions","/admin/question-bank","＋"],["Student results","Review submitted attempts","/admin/results","↗"],["Student groups","Create and manage groups","/admin/groups","◎"]].map(([title,description,href,icon]) => <Link href={href} key={title} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"><span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-700">{icon}</span><span><b className="block text-sm text-slate-800">{title}</b><small className="mt-1 block text-xs text-slate-400">{description}</small></span><span className="ml-auto text-slate-300">→</span></Link>)}</div>
        </> : null}
      </div>
    </main>
  );
}
