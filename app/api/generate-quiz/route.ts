import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const difficultyInstructions: Record<string, string> = {
  easy: "Keep questions straightforward, testing recall and basic understanding of core concepts. Avoid multi-step reasoning or tricky wording.",
  medium: "Questions should require applying concepts to a scenario, not just recalling facts. Include some multi-step problems where appropriate for the subject.",
  hard: "Questions should be challenging, requiring deeper analysis, multi-step reasoning, or synthesis of multiple concepts. Use the kind of difficulty expected in the hardest past-paper questions for this board and subject.",
};

export async function POST(req: NextRequest) {
  try {
    const { subject, board, count, difficulty } = await req.json();

    const difficultyKey = (difficulty || "medium").toLowerCase();
    const difficultyInstruction =
      difficultyInstructions[difficultyKey] || difficultyInstructions.medium;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: "You are an expert exam question generator. You always respond with valid JSON arrays only. No markdown, no explanation, just the JSON array.",
        },
        {
          role: "user",
          content: `Generate exactly ${count} exam questions for ${board} students studying ${subject}, at a ${difficultyKey} difficulty level. ${difficultyInstruction} Mix 60% MCQ and 40% short answer. Return ONLY a valid JSON array. For MCQ use: {"type":"mcq","question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A","explanation":"..."} For short answer use: {"type":"short","question":"...","model_answer":"...","keywords":["...","...","..."]} The answer field for MCQ must be just one letter A B C or D. Make questions exam appropriate for ${board} curriculum.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "[]";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(cleaned);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}