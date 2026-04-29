import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { question, modelAnswer, keywords, studentAnswer, subject, board } =
      await req.json();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: "You are an exam marker. You always respond with valid JSON only. No markdown, no explanation, just JSON.",
        },
        {
          role: "user",
          content: `Mark this ${board} ${subject} answer. Question: ${question} Model answer: ${modelAnswer} Key concepts: ${keywords?.join(", ")} Student answer: ${studentAnswer} Return ONLY this JSON: {"verdict":"correct" or "partial" or "incorrect","marks_hint":"e.g. 2/3 marks","feedback":"2-3 sentences about what was good what was missing and what the ideal answer includes"}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to grade answer" },
      { status: 500 }
    );
  }
}