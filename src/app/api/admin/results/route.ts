import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await requireAdmin();
    const { data: attempts, error } = await supabase
      .from("quiz_attempts")
      .select("id, student_id, quiz_id, score, total_marks, percentage, status, submitted_at")
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false });
    if (error) throw error;

    const studentIds = [...new Set(attempts.map((attempt) => attempt.student_id))];
    const quizIds = [...new Set(attempts.map((attempt) => attempt.quiz_id))];
    const [{ data: students, error: studentsError }, { data: quizzes, error: quizzesError }] =
      await Promise.all([
        supabase.from("students").select("id, full_name, email, group_id, groups(name)").in("id", studentIds),
        supabase.from("quizzes").select("id, title").in("id", quizIds),
      ]);
    if (studentsError) throw studentsError;
    if (quizzesError) throw quizzesError;

    const studentById = new Map(students.map((student) => [student.id, student]));
    const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
    return NextResponse.json({
      results: attempts.map((attempt) => ({
        ...attempt,
        student: studentById.get(attempt.student_id),
        quiz: quizById.get(attempt.quiz_id),
      })),
    });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: "Admin authorization required." }, { status });
  }
}
