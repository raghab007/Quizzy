if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env.local");
}

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secretKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY before running this script.",
  );
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const topics = [
  ["Introduction to Java", "Java fundamentals, syntax, and platform independence."],
  ["JDK, JRE, and JVM", "The Java development and runtime environment."],
  ["Variables and Data Types", "Variables, primitive types, and reference types."],
  ["Type Casting", "Implicit widening and explicit narrowing conversions."],
  ["Format Specifiers and Escape Sequences", "Formatted output and escaped characters."],
  ["Scanner Class", "Reading console input with java.util.Scanner."],
];

const questions = [
  {
    topic: "Introduction to Java",
    difficulty: "easy",
    question: "What is Java primarily known for?",
    explanation: "Java bytecode runs on a JVM, allowing the same compiled program to run on supported platforms.",
    options: [
      ["Platform independence", true],
      ["Being limited to one operating system", false],
      ["Requiring no compiler", false],
      ["Only supporting web browsers", false],
    ],
  },
  {
    topic: "Introduction to Java",
    difficulty: "easy",
    question: "What is the file extension produced by the Java compiler?",
    explanation: "The compiler converts Java source code into bytecode stored in a .class file.",
    options: [
      [".java", false],
      [".class", true],
      [".exe", false],
      [".jarx", false],
    ],
  },
  {
    topic: "Introduction to Java",
    difficulty: "medium",
    question: "Which method is the usual entry point of a standalone Java application?",
    explanation: "The JVM starts a standalone application by calling public static void main(String[] args).",
    options: [
      ["start()", false],
      ["run()", false],
      ["main()", true],
      ["execute()", false],
    ],
  },
  {
    topic: "JDK, JRE, and JVM",
    difficulty: "easy",
    question: "What does JVM stand for?",
    explanation: "JVM means Java Virtual Machine, which executes Java bytecode.",
    options: [
      ["Java Variable Method", false],
      ["Java Virtual Machine", true],
      ["Java Verified Module", false],
      ["Java Visual Manager", false],
    ],
  },
  {
    topic: "JDK, JRE, and JVM",
    difficulty: "easy",
    question: "Which component includes tools for developing Java programs?",
    explanation: "The JDK includes the JRE plus development tools such as javac.",
    options: [
      ["JDK", true],
      ["JRE only", false],
      ["JVM only", false],
      ["JAR only", false],
    ],
  },
  {
    topic: "JDK, JRE, and JVM",
    difficulty: "medium",
    question: "Which command compiles a Java source file?",
    explanation: "javac is the Java compiler included in the JDK.",
    options: [
      ["java", false],
      ["javac", true],
      ["javadoc-run", false],
      ["compilejava", false],
    ],
  },
  {
    topic: "JDK, JRE, and JVM",
    difficulty: "medium",
    question: "What is the relationship between the JDK and JRE?",
    explanation: "The JDK contains the JRE and adds tools needed to develop Java applications.",
    options: [
      ["The JRE contains the JDK", false],
      ["The JDK contains the JRE", true],
      ["They are unrelated", false],
      ["The JVM contains the JDK", false],
    ],
  },
  {
    topic: "Variables and Data Types",
    difficulty: "easy",
    question: "Which declaration creates an integer variable named age?",
    explanation: "int is Java's primitive integer type, and the declaration assigns 20 to age.",
    options: [
      ["integer age = 20;", false],
      ["int age = 20;", true],
      ["number age = 20;", false],
      ["age int = 20;", false],
    ],
  },
  {
    topic: "Variables and Data Types",
    difficulty: "easy",
    question: "Which keyword prevents a variable from being reassigned?",
    explanation: "A final variable can be assigned once and cannot be reassigned afterward.",
    options: [
      ["constant", false],
      ["fixed", false],
      ["final", true],
      ["static", false],
    ],
  },
  {
    topic: "Variables and Data Types",
    difficulty: "medium",
    question: "Which type stores a single UTF-16 character in Java?",
    explanation: "The char primitive stores one 16-bit UTF-16 code unit.",
    options: [
      ["String", false],
      ["character", false],
      ["char", true],
      ["text", false],
    ],
  },
  {
    topic: "Variables and Data Types",
    difficulty: "medium",
    question: "Which is a non-primitive data type?",
    explanation: "String is a class and therefore a reference, or non-primitive, type.",
    options: [
      ["int", false],
      ["double", false],
      ["boolean", false],
      ["String", true],
    ],
  },
  {
    topic: "Type Casting",
    difficulty: "easy",
    question: "What is implicit casting?",
    explanation: "Widening conversion from a smaller compatible numeric type to a larger one is automatic.",
    options: [
      ["Automatic conversion to a compatible wider type", true],
      ["Conversion using a cast operator only", false],
      ["Conversion from String to int", false],
      ["Conversion that always loses data", false],
    ],
  },
  {
    topic: "Type Casting",
    difficulty: "medium",
    question: "Which is an explicit cast from double to int?",
    explanation: "The cast operator (int) explicitly converts the double expression to int.",
    options: [
      ["int value = doubleValue;", false],
      ["int value = (int) doubleValue;", true],
      ["int value = cast doubleValue;", false],
      ["int value = doubleValue.toInt();", false],
    ],
  },
  {
    topic: "Type Casting",
    difficulty: "medium",
    question: "What can happen when a double is explicitly cast to an int?",
    explanation: "The fractional part is discarded during narrowing conversion.",
    options: [
      ["The value becomes a String", false],
      ["The fractional part is discarded", true],
      ["The value always rounds up", false],
      ["The program cannot compile", false],
    ],
  },
  {
    topic: "Format Specifiers and Escape Sequences",
    difficulty: "easy",
    question: "Which format specifier is commonly used for a decimal integer?",
    explanation: "%d formats an integral value such as int or long.",
    options: [
      ["%s", false],
      ["%f", false],
      ["%d", true],
      ["%c", false],
    ],
  },
  {
    topic: "Format Specifiers and Escape Sequences",
    difficulty: "easy",
    question: "What does the escape sequence \\n represent?",
    explanation: "\\n inserts a line-feed, moving output to a new line.",
    options: [
      ["A tab", false],
      ["A new line", true],
      ["A quotation mark", false],
      ["A backslash", false],
    ],
  },
  {
    topic: "Format Specifiers and Escape Sequences",
    difficulty: "medium",
    question: "Which escape sequence prints a double quotation mark?",
    explanation: "A backslash escapes the quotation mark so it is treated as text.",
    options: [
      ["\\'", false],
      ["\\\"", true],
      ["\\q", false],
      ["//", false],
    ],
  },
  {
    topic: "Scanner Class",
    difficulty: "easy",
    question: "Which import makes Scanner available in a Java program?",
    explanation: "Scanner is located in the java.util package.",
    options: [
      ["import java.io.Scanner;", false],
      ["import java.util.Scanner;", true],
      ["import java.lang.Scanner;", false],
      ["import scanner.Scanner;", false],
    ],
  },
  {
    topic: "Scanner Class",
    difficulty: "easy",
    question: "Which Scanner method reads an integer?",
    explanation: "nextInt() reads the next token and parses it as an int.",
    options: [
      ["readInt()", false],
      ["getInteger()", false],
      ["nextInt()", true],
      ["inputInt()", false],
    ],
  },
  {
    topic: "Scanner Class",
    difficulty: "medium",
    question: "Which statement correctly creates a Scanner for keyboard input?",
    explanation: "System.in represents standard input and is passed to the Scanner constructor.",
    options: [
      ["Scanner input = new Scanner(System.in);", true],
      ["Scanner input = Scanner(System.keyboard);", false],
      ["new Scanner input(System.in);", false],
      ["Scanner input = create(System.in);", false],
    ],
  },
];

async function getTopicIds() {
  const topicIds = new Map();

  for (const [name, description] of topics) {
    const { data: existing, error: selectError } = await supabase
      .from("topics")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
      topicIds.set(name, existing.id);
      continue;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("topics")
      .insert({ name, description })
      .select("id")
      .single();

    if (insertError) throw insertError;
    topicIds.set(name, inserted.id);
  }

  return topicIds;
}

const topicIds = await getTopicIds();
const initialGroups = ["n2", "n3", "n4", "n5"];
for (const name of initialGroups) {
  const { error: groupError } = await supabase
    .from("groups")
    .upsert({ name }, { onConflict: "name", ignoreDuplicates: true });
  if (groupError) throw groupError;
}
const { data: oldGroups, error: oldGroupsError } = await supabase
  .from("groups")
  .select("id, name")
  .in("name", ["Group A", "Group B", "Group C", "Group D"]);
if (oldGroupsError) throw oldGroupsError;
for (const oldGroup of oldGroups) {
  const { count, error: studentCountError } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("group_id", oldGroup.id);
  if (studentCountError) throw studentCountError;
  if (count === 0) {
    const { error: deleteError } = await supabase
      .from("groups")
      .delete()
      .eq("id", oldGroup.id);
    if (deleteError) throw deleteError;
  } else {
    console.log(`Preserved ${oldGroup.name}; it is assigned to ${count} student(s).`);
  }
}

let insertedCount = 0;
let skippedCount = 0;
const questionIds = [];

for (const item of questions) {
  const { data: existing, error: existingError } = await supabase
    .from("questions")
    .select("id")
    .eq("question_text", item.question)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    questionIds.push(existing.id);
    skippedCount += 1;
    continue;
  }

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({
      topic_id: topicIds.get(item.topic),
      question_text: item.question,
      difficulty: item.difficulty,
      question_type: "multiple_choice",
      marks: 1,
      explanation: item.explanation,
    })
    .select("id")
    .single();

  if (questionError) throw questionError;

  const { error: optionsError } = await supabase.from("question_options").insert(
    item.options.map(([optionText, isCorrect], index) => ({
      question_id: question.id,
      option_text: optionText,
      is_correct: isCorrect,
      display_order: index + 1,
    })),
  );

  if (optionsError) throw optionsError;
  questionIds.push(question.id);
  insertedCount += 1;
}

const initialQuizTitle = "Java Fundamentals — Initial Assessment";
const { data: existingQuiz, error: existingQuizError } = await supabase
  .from("quizzes")
  .select("id")
  .eq("title", initialQuizTitle)
  .maybeSingle();

if (existingQuizError) throw existingQuizError;

let quizId = existingQuiz?.id;
if (!quizId) {
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      title: initialQuizTitle,
      description: "An introductory assessment covering core Java fundamentals.",
      duration_minutes: 30,
      passing_marks: 10,
      is_published: true,
      allow_retake: false,
      show_answers_after_submission: false,
    })
    .select("id")
    .single();

  if (quizError) throw quizError;
  quizId = quiz.id;
}
else {
  const { error: quizUpdateError } = await supabase
    .from("quizzes")
    .update({ show_answers_after_submission: true })
    .eq("id", quizId);
  if (quizUpdateError) throw quizUpdateError;
}

const { data: existingQuizQuestions, error: quizQuestionsError } = await supabase
  .from("quiz_questions")
  .select("question_id")
  .eq("quiz_id", quizId);

if (quizQuestionsError) throw quizQuestionsError;

const linkedQuestionIds = new Set(
  existingQuizQuestions.map(({ question_id }) => question_id),
);
const missingQuizQuestions = questionIds
  .map((questionId, index) => ({
    quiz_id: quizId,
    question_id: questionId,
    display_order: index + 1,
    marks: 1,
  }))
  .filter(({ question_id }) => !linkedQuestionIds.has(question_id));

if (missingQuizQuestions.length > 0) {
  const { error: linkError } = await supabase
    .from("quiz_questions")
    .insert(missingQuizQuestions);
  if (linkError) throw linkError;
}

console.log(`Question bank seeded: ${insertedCount} inserted, ${skippedCount} skipped.`);
console.log(`Initial quiz ready: ${initialQuizTitle}`);
