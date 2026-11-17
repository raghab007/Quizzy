import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

type SubmittedAnswer = { questionId: string; optionId: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      quizId?: unknown;
      attemptId?: unknown;
      answers?: unknown;
    };
    if (
      typeof body.quizId !== "string" ||
      typeof body.attemptId !== "string" ||
      !Array.isArray(body.answers)
    ) {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    const answers = body.answers as SubmittedAnswer[];
    const supabase = createServiceClient();
    // These lookups do not depend on each other, so run them together instead
    // of making students wait for two separate database round trips.
    const [quizResult, attemptResult] = await Promise.all([
      supabase
        .from("quizzes")
        .select("id, show_answers_after_submission")
        .eq("id", body.quizId)
        .eq("is_published", true)
        .single(),
      supabase
        .from("quiz_attempts")
        .select("id, quiz_id, status")
        .eq("id", body.attemptId)
        .eq("quiz_id", body.quizId)
        .single(),
    ]);
    const { data: quiz, error: quizError } = quizResult;
    if (quizError) throw quizError;
    const { data: attempt, error: attemptError } = attemptResult;
    if (attemptError) throw attemptError;
    if (attempt.status !== "in_progress") {
      return NextResponse.json({ error: "This attempt has already been submitted." }, { status: 409 });
    }

    const { data: quizQuestions, error: quizQuestionsError } = await supabase
      .from("quiz_questions")
      .select("question_id, marks, questions!inner(id, question_text, explanation, question_options(id, option_text, is_correct))")
      .eq("quiz_id", quiz.id)
      .order("display_order", { ascending: true });
    if (quizQuestionsError) throw quizQuestionsError;

    const questionIds = quizQuestions.map(({ question_id }) => question_id);
    const submittedByQuestion = new Map(
      answers.map(({ questionId, optionId }) => [questionId, optionId]),
    );
    if (
      submittedByQuestion.size !== questionIds.length ||
      questionIds.some((questionId) => !submittedByQuestion.has(questionId))
    ) {
      return NextResponse.json(
        { error: "Answer every question before submitting." },
        { status: 400 },
      );
    }

    const questionById = new Map(
      quizQuestions.map((quizQuestion) => [
        quizQuestion.question_id,
        quizQuestion.questions[0],
      ]),
    );
    const marksByQuestion = new Map(
      quizQuestions.map(({ question_id, marks }) => [question_id, Number(marks)]),
    );

    let obtainedMarks = 0;
    let correctAnswers = 0;
    const results = questionIds.map((questionId) => {
      const question = questionById.get(questionId);
      if (!question) throw new Error("A quiz question could not be loaded.");
      const selectedOptionId = submittedByQuestion.get(question.id)!;
      const selectedOption = question.question_options.find(
        (option) => option.id === selectedOptionId,
      );
      if (!selectedOption) {
        throw new Error("A submitted option does not belong to its question.");
      }
      const correctOption = question.question_options.find((option) => option.is_correct);
      const isCorrect = Boolean(selectedOption.is_correct);
      const marks = marksByQuestion.get(question.id) ?? 0;
      if (isCorrect) {
        obtainedMarks += marks;
        correctAnswers += 1;
      }
      return {
        question_id: question.id,
        question_text: question.question_text,
        selected_answer: selectedOption.option_text,
        correct_answer: quiz.show_answers_after_submission ? correctOption?.option_text : undefined,
        explanation: quiz.show_answers_after_submission ? question.explanation : undefined,
        is_correct: isCorrect,
      };
    });

    const totalMarks = quizQuestions.reduce((sum, question) => sum + Number(question.marks), 0);
    const answerRows = results.map((answer) => ({
      attempt_id: attempt.id,
      question_id: answer.question_id,
      selected_option_id: submittedByQuestion.get(answer.question_id),
      is_correct: answer.is_correct,
      marks_obtained: answer.is_correct ? marksByQuestion.get(answer.question_id) ?? 0 : 0,
    }));
    const { error: answersError } = await supabase.from("student_answers").insert(answerRows);
    if (answersError) throw answersError;
    const { error: updateError } = await supabase
      .from("quiz_attempts")
      .update({
        score: obtainedMarks,
        percentage: totalMarks ? (obtainedMarks / totalMarks) * 100 : 0,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", attempt.id)
      .eq("status", "in_progress");
    if (updateError) throw updateError;

    return NextResponse.json({
      attempt_id: attempt.id,
      total_questions: questionIds.length,
      correct_answers: correctAnswers,
      obtained_marks: obtainedMarks,
      total_marks: totalMarks,
      percentage: totalMarks ? (obtainedMarks / totalMarks) * 100 : 0,
      answers: results,
    });
  } catch (error) {
    console.error("Unable to submit quiz:", error);
    return NextResponse.json({ error: "Unable to submit the quiz." }, { status: 500 });
  }
}
