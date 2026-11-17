import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await requireAdmin();
    const [{ count: studentCount }, { count: quizCount }, { data: attempts }] =
      await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("quizzes").select("id", { count: "exact", head: true }),
        supabase.from("quiz_attempts").select("id, score, total_marks, percentage, status, student_id, quiz_id, submitted_at"),
      ]);

    const submitted = (attempts ?? []).filter((attempt) => attempt.status === "submitted");
    const scores = submitted.map((attempt) => Number(attempt.score ?? 0));
    const percentages = submitted.map((attempt) => Number(attempt.percentage ?? 0));
    const average = percentages.length
      ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length
      : 0;

    const [studentsResult, groupsResult, quizzesResult] = await Promise.all([
      supabase.from("students").select("id, full_name, group_id, groups(name)"),
      supabase.from("groups").select("id, name").order("name"),
      supabase.from("quizzes").select("id, title").order("title"),
    ]);
    const { data: students, error: studentsError } = studentsResult;
    if (studentsError) throw studentsError;
    const { data: groups, error: groupsError } = groupsResult;
    if (groupsError) throw groupsError;
    const { data: quizzes, error: quizzesError } = quizzesResult;
    if (quizzesError) throw quizzesError;
    const studentInfo = new Map(
      (students ?? []).map((student) => [
        student.id,
        {
          name: student.full_name,
          groupId: student.group_id,
          group: (student.groups as { name: string }[] | null)?.[0]?.name ?? "Unknown",
        },
      ]),
    );
    const studentGroups = new Map(
      (students ?? []).map((student) => [
        student.id,
        (student.groups as { name: string }[] | null)?.[0]?.name ?? "Unknown",
      ]),
    );
    const { data: answerRows, error: answersError } = await supabase
      .from("student_answers")
      .select("attempt_id, is_correct, quiz_attempts!inner(student_id, status)")
      .eq("quiz_attempts.status", "submitted");
    if (answersError) throw answersError;
    const quizInfo = new Map((quizzes ?? []).map((quiz) => [quiz.id, quiz.title]));
    const attemptGroupById = new Map(
      submitted.map((attempt) => [
        attempt.student_id,
        studentGroups.get(attempt.student_id) ?? "Unknown",
      ]),
    );
    const answerStats = new Map<string, { right: number; wrong: number }>();
    const groupStats = new Map<string, {
      attempts: number;
      total: number;
      average: number;
      average_marks: number;
      right: number;
      wrong: number;
      highest: { name: string; marks: number } | null;
      lowest: { name: string; marks: number } | null;
    }>();
    for (const group of groups ?? []) {
      groupStats.set(group.name, {
        attempts: 0,
        total: 0,
        average: 0,
        average_marks: 0,
        right: 0,
        wrong: 0,
        highest: null,
        lowest: null,
      });
    }
    for (const attempt of submitted) {
      const group = studentGroups.get(attempt.student_id) ?? "Unknown";
      const current = groupStats.get(group) ?? {
        attempts: 0,
        total: 0,
        average: 0,
        average_marks: 0,
        right: 0,
        wrong: 0,
        highest: null,
        lowest: null,
      };
      const marks = Number(attempt.score ?? 0);
      const name = studentInfo.get(attempt.student_id)?.name ?? "Unknown student";
      current.attempts += 1;
      current.total += Number(attempt.percentage ?? 0);
      current.average = current.total / current.attempts;
      current.average_marks += marks;
      if (!current.highest || marks > current.highest.marks) current.highest = { name, marks };
      if (!current.lowest || marks < current.lowest.marks) current.lowest = { name, marks };
      groupStats.set(group, current);
    }
    for (const stats of groupStats.values()) {
      stats.average_marks = stats.attempts ? stats.average_marks / stats.attempts : 0;
    }
    for (const answer of answerRows ?? []) {
      const attemptInfo = (
        answer.quiz_attempts as Array<{ student_id: string; status: string }>
      )[0];
      if (!attemptInfo) continue;
      const attemptId = answer.attempt_id;
      const attemptAnswers = answerStats.get(attemptId) ?? { right: 0, wrong: 0 };
      if (answer.is_correct) attemptAnswers.right += 1;
      else attemptAnswers.wrong += 1;
      answerStats.set(attemptId, attemptAnswers);
      const group = attemptGroupById.get(attemptInfo.student_id);
      if (!group) continue;
      const current = groupStats.get(group);
      if (!current) continue;
      if (answer.is_correct) current.right += 1;
      else current.wrong += 1;
    }

    return NextResponse.json({
      students: studentCount ?? 0,
      quizzes: quizCount ?? 0,
      attempts: submitted.length,
      average_percentage: average,
      highest_score: scores.length ? Math.max(...scores) : 0,
      lowest_score: scores.length ? Math.min(...scores) : 0,
      highest_student: submitted.length
        ? studentInfo.get(submitted[scores.indexOf(Math.max(...scores))].student_id)?.name ?? "Unknown student"
        : "—",
      lowest_student: submitted.length
        ? studentInfo.get(submitted[scores.indexOf(Math.min(...scores))].student_id)?.name ?? "Unknown student"
        : "—",
      groups: [...groupStats.entries()].map(([name, stats]) => ({ name, ...stats })),
      group_options: (groups ?? []).map((group) => ({ id: group.id, name: group.name })),
      student_options: (students ?? []).map((student) => ({
        id: student.id,
        name: student.full_name,
        group_id: student.group_id,
      })),
      quiz_options: (quizzes ?? []).map((quiz) => ({ id: quiz.id, title: quiz.title })),
      records: submitted.map((attempt) => ({
        id: attempt.id,
        student_id: attempt.student_id,
        student_name: studentInfo.get(attempt.student_id)?.name ?? "Unknown student",
        group_id: studentInfo.get(attempt.student_id)?.groupId ?? "",
        group_name: studentInfo.get(attempt.student_id)?.group ?? "Unknown",
        quiz_id: attempt.quiz_id,
        quiz_title: quizInfo.get(attempt.quiz_id) ?? "Unknown quiz",
        score: Number(attempt.score ?? 0),
        total_marks: Number(attempt.total_marks ?? 0),
        percentage: Number(attempt.percentage ?? 0),
        right: answerStats.get(attempt.id)?.right ?? 0,
        wrong: answerStats.get(attempt.id)?.wrong ?? 0,
        submitted_at: attempt.submitted_at,
      })),
    });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: "Admin authorization required." }, { status });
  }
}
