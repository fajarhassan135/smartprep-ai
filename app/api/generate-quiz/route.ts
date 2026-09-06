import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser } from "../../../lib/requireVerifiedUser";
import { rateLimit } from "../../../lib/rateLimit";
import { findLevel } from "../../../lib/curriculum";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const difficultyInstructions: Record<string, string> = {
  easy: "Keep questions straightforward, testing recall and basic understanding of core concepts. Avoid multi-step reasoning or tricky wording.",
  medium: "Questions should require applying concepts to a scenario, not just recalling facts. Include some multi-step problems where appropriate for the subject.",
  hard: "Questions should be challenging, requiring deeper analysis, multi-step reasoning, or synthesis of multiple concepts. Use the kind of difficulty expected in the hardest past-paper questions for this board and subject.",
};

type LooseQuestion = {
  type?: unknown;
  question?: unknown;
  options?: unknown;
  answer?: unknown;
  model_answer?: unknown;
};

/** An MCQ needs four options and a letter answer; a short answer needs a model answer. */
function isUsableQuestion(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const q = value as LooseQuestion;
  if (typeof q.question !== "string" || !q.question.trim()) return false;

  if (q.type === "mcq") {
    return (
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.options.every((o) => typeof o === "string") &&
      typeof q.answer === "string" &&
      ["A", "B", "C", "D"].includes(q.answer.trim().toUpperCase())
    );
  }
  if (q.type === "short") {
    return typeof q.model_answer === "string" && q.model_answer.trim().length > 0;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireVerifiedUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const limited = rateLimit(`quiz:${auth.user.id}`, 20, 60_000);
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "You're going a bit fast. Try again in a moment." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }
    const { subject, levelId, count, difficulty } = await req.json();

    const level = findLevel(String(levelId || ""));
    if (!subject || !level) {
      return NextResponse.json({ error: "Pick a subject and exam level first." }, { status: 400 });
    }

    const difficultyKey = (difficulty || "medium").toLowerCase();
    const difficultyInstruction =
      difficultyInstructions[difficultyKey] || difficultyInstructions.medium;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: "You are a senior examiner writing questions for a specific syllabus and level. You write at full exam standard. You always respond with valid JSON arrays only. No markdown, no explanation, just the JSON array.",
        },
        {
          role: "user",
          content: `Generate exactly ${count} exam questions for ${subject}.

Syllabus level: ${level.description}
Difficulty within that level: ${difficultyKey}. ${difficultyInstruction}

Write at the standard of the real paper: use the board's command words, correct notation and units, and test method and understanding rather than recall of definitions. Do not write questions answerable from general knowledge alone.

Mix 60% MCQ and 40% short answer. Return ONLY a valid JSON array. For MCQ use: {"type":"mcq","question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A","explanation":"..."} For short answer use: {"type":"short","question":"...","model_answer":"...","keywords":["...","...","..."]} The answer field for MCQ must be just one letter A B C or D.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "[]";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    // The model is asked for JSON but is not guaranteed to give it, so parse
    // defensively and keep only questions the quiz screen can actually render.
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "The question generator returned something unreadable. Please try again." },
        { status: 502 }
      );
    }

    const questions = Array.isArray(parsed) ? parsed.filter(isUsableQuestion) : [];

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No usable questions came back. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}