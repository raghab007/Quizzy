import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const now = new Date().toISOString();
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, title, description, duration_minutes, passing_marks")
      .eq("is_published", true)
      .or(`available_from.is.null,available_from.lte.${now}`)
      .or(`available_until.is.null,available_until.gte.${now}`)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (quizError) throw quizError;
    if (!quiz) {
      return NextResponse.json(
        { error: "No published quizzes are currently available." },
        { status: 404 },
      );
    }

    const { data: quizQuestions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("question_id, display_order, marks")
      .eq("quiz_id", quiz.id)
      .order("display_order");

    if (questionsError) throw questionsError;

    const questionIds = quizQuestions.map(({ question_id }) => question_id);
    const { data: questions, error: questionError } = await supabase
      .from("questions")
      .select(
        "id, question_text, code_snippet, difficulty, question_type, question_options(id, option_text, display_order)",
      )
      .in("id", questionIds);

    if (questionError) throw questionError;

    const questionById = new Map(questions.map((question) => [question.id, question]));
    return NextResponse.json({
      quiz,
      questions: quizQuestions
        .map((quizQuestion) => {
          const question = questionById.get(quizQuestion.question_id);
          if (!question) return null;
          return {
            ...question,
            marks: quizQuestion.marks,
            question_options: question.question_options.sort(
              (a, b) => a.display_order - b.display_order,
            ),
          };
        })
        .filter(Boolean),
    });
  } catch (error) {
    console.error("Unable to load quiz:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "PGRST205"
    ) {
      return NextResponse.json(
        {
          error:
            "The database schema is not initialized. Apply the Supabase migration first.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Unable to load the quiz right now." },
      { status: 500 },
    );
  }
}
