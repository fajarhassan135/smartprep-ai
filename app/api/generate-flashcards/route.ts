import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser } from "../../../lib/requireVerifiedUser";
import { rateLimit } from "../../../lib/rateLimit";
import { findLevel } from "../../../lib/curriculum";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MAX_CARDS = 10;

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

    const { subject, levelId, topic, count } = await req.json();

    if (!subject || typeof subject !== "string") {
      return NextResponse.json({ error: "Pick a subject first." }, { status: 400 });
    }

    const level = findLevel(String(levelId || ""));
    if (!level) {
      return NextResponse.json({ error: "Pick an exam level first." }, { status: 400 });
    }

    const topicName = typeof topic === "string" && topic.trim() ? topic.trim() : "";
    const cardCount = Math.min(Math.max(Number(count) || 5, 1), MAX_CARDS);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content:
            "You are a senior examiner writing revision material for a specific syllabus. " +
            "You write at full exam standard and never pad with trivia. " +
            "You always respond with valid JSON only. No markdown, no commentary.",
        },
        {
          role: "user",
          content: `Write exactly ${cardCount} revision flashcards for ${subject}.

Syllabus level: ${level.description}
${topicName ? `Topic: ${topicName}. Every card must sit inside this topic.` : "Spread the cards across the major topics of the syllabus."}

These cards are for a student sitting a real exam, so hold them to that standard:
- No card may be a definition of an acronym, or a "what does X stand for" question. Those are worthless at this level.
- No card may be answerable from general knowledge by someone who has not studied the syllabus.
- Each card must test something that actually carries marks: a method, a derivation, a distinction candidates routinely confuse, a condition or assumption, a required piece of terminology, or a worked calculation.
- Phrase the front the way the exam phrases a question, using its command words (state, explain, derive, calculate, evaluate, justify, compare).
- The back must be a full mark-scoring answer, not a hint: give the reasoning or the working steps, and name the key terms the mark scheme would expect. Two to four sentences, or the steps of the calculation.
- Use correct notation, units and subject terminology throughout.
- Prefer the parts of the syllabus students lose marks on.

Return ONLY this JSON:
{"cards":[{"front":"...","back":"...","topic":"the syllabus topic this card belongs to"}]}`,
        },
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
      ? rawCards
          .filter((c): c is { front: string; back: string; topic?: string } => {
            if (!c || typeof c !== "object") return false;
            const card = c as { front?: unknown; back?: unknown };
            return (
              typeof card.front === "string" &&
              card.front.trim().length > 0 &&
              typeof card.back === "string" &&
              card.back.trim().length > 0
            );
          })
          .map((c) => ({
            front: c.front.trim(),
            back: c.back.trim(),
            topic: (typeof c.topic === "string" && c.topic.trim()) || topicName || "General",
          }))
      : [];

    if (cards.length === 0) {
      return NextResponse.json(
        { error: "No usable cards came back. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Flashcard generation error:", error);
    return NextResponse.json({ error: "Failed to generate flashcards" }, { status: 500 });
  }
}
