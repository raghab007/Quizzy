import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase
      .from("quizzes")
      .select("id, title, description, duration_minutes, passing_marks, is_published, allow_retake, show_answers_after_submission, available_from, available_until")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ quizzes: data });
  } catch {
    return NextResponse.json({ error: "Admin authorization required." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await requireAdmin();
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.id !== "string" || typeof body.title !== "string") {
      return NextResponse.json({ error: "Quiz id and title are required." }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("quizzes")
      .update({
        title: body.title.trim(),
        description: typeof body.description === "string" ? body.description.trim() : "",
        duration_minutes: Number(body.duration_minutes),
        passing_marks: body.passing_marks === null ? null : Number(body.passing_marks),
        is_published: Boolean(body.is_published),
        allow_retake: Boolean(body.allow_retake),
        show_answers_after_submission: Boolean(body.show_answers_after_submission),
      })
      .eq("id", body.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ quiz: data });
  } catch {
    return NextResponse.json({ error: "Unable to update quiz." }, { status: 400 });
  }
}
