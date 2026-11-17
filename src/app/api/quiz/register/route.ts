import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const quizId = typeof body.quizId === "string" ? body.quizId : "";
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const groupId = typeof body.groupId === "string" ? body.groupId : "";

    if (!quizId || fullName.length < 2 || !email.includes("@") || !groupId) {
      return NextResponse.json({ error: "Complete all registration fields." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, allow_retake")
      .eq("id", quizId)
      .eq("is_published", true)
      .single();
    if (quizError) throw quizError;

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .single();
    if (groupError || !group) {
      return NextResponse.json({ error: "Select a valid group." }, { status: 400 });
    }

    const { data: existingStudent, error: studentLookupError } = await supabase
      .from("students")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (studentLookupError) throw studentLookupError;

    let studentId = existingStudent?.id;
    if (studentId) {
      const { error: updateError } = await supabase
        .from("students")
        .update({ full_name: fullName, group_id: groupId })
        .eq("id", studentId);
      if (updateError) throw updateError;
    } else {
      const { data: student, error: insertError } = await supabase
        .from("students")
        .insert({ full_name: fullName, email, group_id: groupId })
        .select("id")
        .single();
      if (insertError) throw insertError;
      studentId = student.id;
    }

    if (!quiz.allow_retake) {
      const { data: previousAttempt, error: attemptLookupError } = await supabase
        .from("quiz_attempts")
        .select("id, status")
        .eq("student_id", studentId)
        .eq("quiz_id", quiz.id)
        .in("status", ["in_progress", "submitted"])
        .maybeSingle();
      if (attemptLookupError) throw attemptLookupError;
      if (previousAttempt) {
        return NextResponse.json(
          { error: previousAttempt.status === "submitted" ? "You have already submitted this quiz." : "You already have an active attempt." },
          { status: 409 },
        );
      }
    }

    const { data: quizQuestions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("marks")
      .eq("quiz_id", quiz.id);
    if (questionsError) throw questionsError;

    const totalMarks = quizQuestions.reduce((sum, question) => sum + Number(question.marks), 0);
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({ student_id: studentId, quiz_id: quiz.id, total_marks: totalMarks })
      .select("id")
      .single();
    if (attemptError) throw attemptError;

    return NextResponse.json({ attemptId: attempt.id });
  } catch (error) {
    console.error("Unable to register quiz student:", error);
    return NextResponse.json({ error: "Unable to start the quiz." }, { status: 500 });
  }
}
