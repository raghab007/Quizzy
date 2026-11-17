"use client";

import { FormEvent, useEffect, useState } from "react";

type Group = { id: string; name: string };
type Option = { id: string; option_text: string; display_order: number };
type Question = {
  id: string;
  question_text: string;
  code_snippet: string | null;
  marks: number;
  question_options: Option[];
};
type QuizResponse = {
  quiz: {
    id: string;
    title: string;
    description: string;
    duration_minutes: number;
  };
  questions: Question[];
};
type Result = {
  total_questions: number;
  correct_answers: number;
  obtained_marks: number;
  total_marks: number;
  percentage: number;
  answers: {
    question_text: string;
    selected_answer: string;
    correct_answer?: string;
    explanation?: string;
    is_correct: boolean;
  }[];
};

function playQuizSound(kind: "next" | "complete") {
  if (typeof window === "undefined" || !window.AudioContext) return;

  try {
    const context = new AudioContext();
    const notes = kind === "complete" ? [523.25, 659.25, 783.99] : [659.25];
    const now = context.currentTime;

    notes.forEach((frequency, index) => {
      const start = now + index * 0.12;
      const oscillator = context.createOscillator();
      const volume = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      volume.gain.setValueAtTime(0.0001, start);
      volume.gain.exponentialRampToValueAtTime(0.12, start + 0.025);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      oscillator.connect(volume);
      volume.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.21);
    });

    window.setTimeout(() => void context.close(), kind === "complete" ? 650 : 300);
  } catch {
    // Audio is optional; quiz navigation should work if the browser blocks it.
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">{children}</div>
    </main>
  );
}

export default function QuizPage() {
  const [data, setData] = useState<QuizResponse | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stage, setStage] = useState<"register" | "instructions" | "quiz">("register");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [navigationNotice, setNavigationNotice] = useState<string | null>(null);
  const [questionDirection, setQuestionDirection] = useState<"next" | "previous">("next");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/quiz"), fetch("/api/groups")])
      .then(async ([quizResponse, groupsResponse]) => {
        const quizBody = await quizResponse.json();
        const groupsBody = await groupsResponse.json();
        if (!quizResponse.ok) throw new Error(quizBody.error);
        if (!groupsResponse.ok) throw new Error(groupsBody.error);
        return { quiz: quizBody as QuizResponse, groups: groupsBody.groups as Group[] };
      })
      .then(({ quiz, groups: loadedGroups }) => {
        setData(quiz);
        setGroups(loadedGroups);
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, []);

  if (error) {
    return (
      <Shell>
        <section className="rounded-2xl border border-red-200 bg-white p-5 text-center shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold text-slate-950">Quiz unavailable</h1>
          <p className="mt-3 text-red-600">{error}</p>
        </section>
      </Shell>
    );
  }

  if (!data) {
    return <Shell><p className="text-center text-slate-600">Loading quiz...</p></Shell>;
  }

  if (result) {
    const wrongAnswers = result.total_questions - result.correct_answers;
    return (
      <Shell>
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-slate-950 px-5 py-7 text-white sm:px-8 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Assessment complete</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl font-semibold">Your quiz result</h1>
                <p className="mt-2 text-slate-300">Review your performance and answer explanations below.</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-6 py-4 text-center ring-1 ring-white/15">
                <p className="text-4xl font-bold text-cyan-300">{result.percentage.toFixed(0)}%</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-slate-300">Overall score</p>
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-700">Right answers</p>
                <p className="mt-2 text-3xl font-bold text-emerald-900">{result.correct_answers}</p>
                <p className="mt-1 text-sm text-emerald-700">of {result.total_questions} questions</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm font-medium text-rose-700">Wrong answers</p>
                <p className="mt-2 text-3xl font-bold text-rose-900">{wrongAnswers}</p>
                <p className="mt-1 text-sm text-rose-700">to review</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-600">Marks obtained</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{result.obtained_marks}</p>
                <p className="mt-1 text-sm text-slate-500">out of {result.total_marks}</p>
              </div>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
                <p className="text-sm font-medium text-cyan-700">Questions attempted</p>
                <p className="mt-2 text-3xl font-bold text-cyan-950">{result.total_questions}</p>
                <p className="mt-1 text-sm text-cyan-700">complete</p>
              </div>
            </div>
            <div className="mt-10 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Answer review</h2>
                <p className="mt-1 text-sm text-slate-500">See what you selected and learn from each answer.</p>
              </div>
              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 sm:inline">
                {result.correct_answers} correct · {wrongAnswers} wrong
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {result.answers.map((answer, index) => (
                <article
                  key={`${answer.question_text}-${index}`}
                  className={`rounded-2xl border p-5 ${
                    answer.is_correct
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-rose-200 bg-rose-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      answer.is_correct ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                    }`}>
                      {answer.is_correct ? "OK" : "!"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-950">{index + 1}. {answer.question_text}</p>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          answer.is_correct ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}>
                          {answer.is_correct ? "Correct" : "Incorrect"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-700"><span className="font-semibold">Your answer:</span> {answer.selected_answer}</p>
                      {!answer.is_correct && answer.correct_answer && (
                        <p className="mt-1 text-sm text-emerald-700"><span className="font-semibold">Correct answer:</span> {answer.correct_answer}</p>
                      )}
                      {answer.explanation && <p className="mt-3 border-t border-slate-200/80 pt-3 text-sm leading-6 text-slate-600">{answer.explanation}</p>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </Shell>
    );
  }

  if (stage === "register") {
    return (
      <Shell>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
            Student registration
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">{data.quiz.title}</h1>
          <p className="mt-3 text-slate-600">
            Enter your details before starting the assessment.
          </p>
          <form
            className="mt-8 space-y-5"
            onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              setRegistering(true);
              const form = new FormData(event.currentTarget);
              const response = await fetch("/api/quiz/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  quizId: data.quiz.id,
                  fullName: form.get("fullName"),
                  email: form.get("email"),
                  groupId: form.get("group"),
                }),
              });
              const body = await response.json();
              setRegistering(false);
              if (!response.ok) {
                setError(body.error);
                return;
              }
              setAttemptId(body.attemptId);
              setStage("instructions");
            }}
          >
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                name="fullName"
                required
                minLength={2}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none ring-cyan-500 focus:ring-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email address
              <input
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none ring-cyan-500 focus:ring-2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Group
              <select
                name="group"
                required
                defaultValue=""
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none ring-cyan-500 focus:ring-2"
              >
                <option value="" disabled>Select your group</option>
                {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </label>
            <button className="w-full rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800">
              {registering ? "Registering..." : "Continue to instructions"}
            </button>
          </form>
        </section>
      </Shell>
    );
  }

  if (stage === "instructions") {
    return (
      <Shell>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
            Quiz instructions
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">{data.quiz.title}</h1>
          <p className="mt-3 text-slate-600">{data.quiz.description}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4"><b>{data.questions.length}</b><span className="block text-sm text-slate-500">Questions</span></div>
            <div className="rounded-lg bg-slate-50 p-4"><b>{data.quiz.duration_minutes} min</b><span className="block text-sm text-slate-500">Duration</span></div>
            <div className="rounded-lg bg-slate-50 p-4"><b>MCQ</b><span className="block text-sm text-slate-500">Question type</span></div>
          </div>
          <ul className="mt-7 list-disc space-y-2 pl-5 text-slate-600">
            <li>Read each question carefully and select one answer.</li>
            <li>Select an answer before moving to the next question. You can revisit earlier questions before submitting.</li>
            <li>Your quiz will be submitted automatically when the timer expires.</li>
          </ul>
          <button
            onClick={() => setStage("quiz")}
            className="mt-8 w-full rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800"
          >
            Start quiz
          </button>
        </section>
      </Shell>
    );
  }

  const question = data.questions[current];
  return (
    <Shell>
      <header className="rounded-2xl bg-slate-950 p-5 text-white sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Java assessment</p>
        <h1 className="mt-3 text-3xl font-semibold">{data.quiz.title}</h1>
        <p className="mt-4 text-sm text-slate-400">{data.questions.length} questions · {data.quiz.duration_minutes} minutes</p>
      </header>
      <section key={question.id} className={`quiz-question-panel quiz-question-panel--${questionDirection} mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7`}>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Question {current + 1} of {data.questions.length}</span>
          <span>{question.marks} mark{question.marks === 1 ? "" : "s"}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-cyan-500 transition-[width] duration-500 ease-out" style={{ width: `${((current + 1) / data.questions.length) * 100}%` }} />
        </div>
        <h2 className="mt-8 text-xl font-semibold leading-8 text-slate-950">{question.question_text}</h2>
        {question.code_snippet && <pre className="mt-5 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-cyan-100"><code>{question.code_snippet}</code></pre>}
        <div className="mt-6 space-y-3">
          {question.question_options.map((option) => (
            <label key={option.id} className={`quiz-answer-option flex cursor-pointer gap-3 rounded-lg border p-4 text-slate-700 ${answers[question.id] === option.id ? "quiz-answer-option--selected border-cyan-400 bg-cyan-50 ring-2 ring-cyan-100" : "border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/60"}`}>
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={answers[question.id] === option.id}
                onChange={() => {
                  setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: option.id }));
                  setNavigationNotice(null);
                }}
              />
              <span>{option.option_text}</span>
            </label>
          ))}
        </div>
        {navigationNotice && <p role="status" className="mt-4 text-sm font-medium text-amber-700">{navigationNotice}</p>}
        {!answers[question.id] && current < data.questions.length - 1 && !navigationNotice && <p className="mt-4 text-sm text-slate-500">Choose an answer to continue.</p>}
        <div className="mt-8 flex justify-between">
          <button disabled={current === 0} onClick={() => { setQuestionDirection("previous"); setCurrent((value) => value - 1); }} className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition disabled:opacity-40">Previous</button>
          {current === data.questions.length - 1 ? (
            <button
              disabled={submitting || Object.keys(answers).length !== data.questions.length}
              onClick={async () => {
                setSubmitting(true);
                setSubmitError(null);
                try {
                  const response = await fetch("/api/quiz/submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      quizId: data.quiz.id,
                      attemptId,
                      answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })),
                    }),
                  });
                  const body = await response.json();
                  if (!response.ok) {
                    setSubmitError(body.error ?? "Unable to submit the quiz. Please try again.");
                    setSubmitting(false);
                    return;
                  }
                  playQuizSound("complete");
                  setResult(body as Result);
                } catch {
                  setSubmitError("Connection problem. Check your internet and try submitting again.");
                  setSubmitting(false);
                }
              }}
              className="rounded-lg bg-green-700 px-5 py-2.5 font-semibold text-white disabled:opacity-40"
            >
              {submitting ? "Submitting..." : "Submit quiz"}
            </button>
          ) : (
            <button
              disabled={!answers[question.id]}
              onClick={() => {
                if (!answers[question.id]) {
                  setNavigationNotice("Select an answer before moving to the next question.");
                  return;
                }
                playQuizSound("next");
                setNavigationNotice(null);
                setQuestionDirection("next");
                setCurrent((value) => value + 1);
              }}
              className="rounded-lg bg-slate-950 px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >Next</button>
          )}
        </div>
        {submitError && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{submitError}</p>}
      </section>
    </Shell>
  );
}
