import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const supabase = await requireAdmin();
    const { attemptId } = await params;
    const { error: answersError } = await supabase
      .from("student_answers")
      .delete()
      .eq("attempt_id", attemptId);
    if (answersError) throw answersError;
    const { error: snapshotsError } = await supabase
      .from("attempt_question_snapshots")
      .delete()
      .eq("attempt_id", attemptId);
    if (snapshotsError) throw snapshotsError;
    const { error } = await supabase.from("quiz_attempts").delete().eq("id", attemptId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: "Unable to delete this result." }, { status });
  }
}
