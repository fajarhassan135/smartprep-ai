import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser } from "../../../lib/requireVerifiedUser";
import { rateLimit } from "../../../lib/rateLimit";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const auth = await requireVerifiedUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const limited = rateLimit(`flashcards:${auth.user.id}`, 30, 60_000);
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "You're going a bit fast. Try again in a moment." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }
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

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Could not read the generated cards." }, { status: 502 });
    }

    const rawCards = (parsed as { cards?: unknown })?.cards;
    const cards = Array.isArray(rawCards)
      ? rawCards.filter((c): c is { front: string; back: string } => {
          if (!c || typeof c !== "object") return false;
          const card = c as { front?: unknown; back?: unknown };
          return typeof card.front === "string" && card.front.trim().length > 0
            && typeof card.back === "string" && card.back.trim().length > 0;
        })
      : [];

    if (cards.length === 0) {
      return NextResponse.json({ error: "No usable cards came back. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ cards });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}