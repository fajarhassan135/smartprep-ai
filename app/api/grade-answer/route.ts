import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser } from "../../../lib/requireVerifiedUser";
import { rateLimit } from "../../../lib/rateLimit";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireVerifiedUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const limited = rateLimit(`grade:${auth.user.id}`, 120, 60_000);
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "You're going a bit fast. Try again in a moment." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }
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

    let parsed: { verdict?: unknown; feedback?: unknown; marks_hint?: unknown };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Could not read the marker's response." }, { status: 502 });
    }

    // Anything other than the three known verdicts must not silently award
    // marks, so an unrecognised value is treated as incorrect.
    const verdict =
      parsed.verdict === "correct" || parsed.verdict === "partial" ? parsed.verdict : "incorrect";

    return NextResponse.json({
      verdict,
      marks_hint: typeof parsed.marks_hint === "string" ? parsed.marks_hint : "",
      feedback:
        typeof parsed.feedback === "string" && parsed.feedback.trim()
          ? parsed.feedback
          : "No feedback was returned for this answer.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to grade answer" },
      { status: 500 }
    );
  }
}