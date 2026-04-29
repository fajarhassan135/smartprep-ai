import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { subject, board, count } = await req.json();

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
          content: `Generate exactly ${count} exam questions for ${board} students studying ${subject}. Mix 60% MCQ and 40% short answer. Return ONLY a valid JSON array. For MCQ use: {"type":"mcq","question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A","explanation":"..."} For short answer use: {"type":"short","question":"...","model_answer":"...","keywords":["...","...","..."]} The answer field for MCQ must be just one letter A B C or D. Make questions exam appropriate for ${board} curriculum.`,
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