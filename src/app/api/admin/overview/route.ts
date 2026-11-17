import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await requireAdmin();
    const [{ count: studentCount }, { count: quizCount }, { data: attempts }] =
      await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("quizzes").select("id", { count: "exact", head: true }),
        supabase.from("quiz_attempts").select("score, percentage, status, student_id"),
      ]);

    const submitted = (attempts ?? []).filter((attempt) => attempt.status === "submitted");
    const scores = submitted.map((attempt) => Number(attempt.score ?? 0));
    const percentages = submitted.map((attempt) => Number(attempt.percentage ?? 0));
    const average = percentages.length
      ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length
      : 0;

    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("id, full_name, group_id, groups(name)");
    if (studentsError) throw studentsError;
    const { data: groups, error: groupsError } = await supabase
      .from("groups")
      .select("name")
      .order("name");
    if (groupsError) throw groupsError;
    const studentInfo = new Map(
      (students ?? []).map((student) => [
        student.id,
        {
          name: student.full_name,
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
    const attemptGroupById = new Map(
      submitted.map((attempt) => [
        attempt.student_id,
        studentGroups.get(attempt.student_id) ?? "Unknown",
      ]),
    );
    const groupStats = new Map<string, {
      attempts: number;
      total: number;
      average: number;
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
      if (!current.highest || marks > current.highest.marks) current.highest = { name, marks };
      if (!current.lowest || marks < current.lowest.marks) current.lowest = { name, marks };
      groupStats.set(group, current);
    }
    for (const answer of answerRows ?? []) {
      const attemptInfo = (
        answer.quiz_attempts as Array<{ student_id: string; status: string }>
      )[0];
      if (!attemptInfo) continue;
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
    });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: "Admin authorization required." }, { status });
  }
}
