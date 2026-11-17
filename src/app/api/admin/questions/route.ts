import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

type QuestionInput = {
  id?: string;
  topic_id?: string;
  question_text?: string;
  difficulty?: "easy" | "medium" | "hard";
  marks?: number;
  explanation?: string;
  options?: { id?: string; option_text?: string; is_correct?: boolean }[];
};

function validateInput(input: QuestionInput) {
  if (
    !input.topic_id ||
    !input.question_text?.trim() ||
    !input.explanation?.trim() ||
    !input.options ||
    input.options.length !== 4 ||
    input.options.some((option) => !option.option_text?.trim()) ||
    input.options.filter((option) => option.is_correct).length !== 1
  ) {
    return "Provide a question, topic, explanation, and exactly four options with one correct answer.";
  }
  return null;
}

export async function GET() {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase
      .from("questions")
      .select("id, question_text, difficulty, question_type, marks, explanation, topics(id, name), question_options(id, option_text, is_correct, display_order)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ questions: data });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: "Admin authorization required." }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await requireAdmin();
    const input = (await request.json()) as QuestionInput;
    const validationError = validateInput(input);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        topic_id: input.topic_id,
        question_text: input.question_text!.trim(),
        difficulty: input.difficulty ?? "medium",
        question_type: "multiple_choice",
        marks: input.marks ?? 1,
        explanation: input.explanation!.trim(),
      })
      .select("id")
      .single();
    if (questionError) throw questionError;

    const { error: optionsError } = await supabase.from("question_options").insert(
      input.options!.map((option, index) => ({
        question_id: question.id,
        option_text: option.option_text!.trim(),
        is_correct: Boolean(option.is_correct),
        display_order: index + 1,
      })),
    );
    if (optionsError) throw optionsError;
    return NextResponse.json({ id: question.id }, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: status === 401 ? "Admin authorization required." : "Unable to save question." }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await requireAdmin();
    const input = (await request.json()) as QuestionInput;
    const validationError = validateInput(input);
    if (validationError || !input.id) {
      return NextResponse.json({ error: validationError ?? "Question id is required." }, { status: 400 });
    }

    const { error: questionError } = await supabase
      .from("questions")
      .update({
        topic_id: input.topic_id,
        question_text: input.question_text!.trim(),
        difficulty: input.difficulty ?? "medium",
        marks: input.marks ?? 1,
        explanation: input.explanation!.trim(),
      })
      .eq("id", input.id);
    if (questionError) throw questionError;

    for (const [index, option] of input.options!.entries()) {
      if (!option.id) throw new Error("Every existing option must have an id.");
      const { error: optionError } = await supabase
        .from("question_options")
        .update({
          option_text: option.option_text!.trim(),
          is_correct: Boolean(option.is_correct),
          display_order: index + 1,
        })
        .eq("id", option.id)
        .eq("question_id", input.id);
      if (optionError) throw optionError;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: status === 401 ? "Admin authorization required." : "Unable to update question." }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Question id is required." }, { status: 400 });

    const { count, error: usageError } = await supabase
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("question_id", id);
    if (usageError) throw usageError;
    if (count) {
      return NextResponse.json(
        { error: "This question is used by a quiz and cannot be deleted. Remove it from the quiz first." },
        { status: 409 },
      );
    }

    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: status === 401 ? "Admin authorization required." : "Unable to delete question." }, { status });
  }
}
