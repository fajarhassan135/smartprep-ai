import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { subject } = await req.json();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      messages: [
        { role: "system", content: "You always respond with valid JSON only. No markdown." },
        { role: "user", content: `Generate 5 flashcards for studying ${subject}. Return ONLY a JSON object: {"cards":[{"front":"question","back":"answer","subject":"${subject}"}]}` },
      ],
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleaned);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}