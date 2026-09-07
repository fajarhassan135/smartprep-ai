import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser } from "../../../lib/requireVerifiedUser";
import { GROQ_MODEL } from "../../../lib/groqModel";
import { rateLimit } from "../../../lib/rateLimit";
import { findLevel } from "../../../lib/curriculum";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * A nudge for a student stuck on a question in practice mode.
 *
 * The whole point is that it must not answer the question. The prompt pushes
 * towards the method or the idea being tested, and the response is capped short
 * so there is no room to work the answer out in full.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireVerifiedUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const limited = rateLimit(`hint:${auth.user.id}`, 60, 60_000);
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "You're going a bit fast. Try again in a moment." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }

    const { question, options, subject, levelId } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "No question to hint at." }, { status: 400 });
    }

    const level = findLevel(String(levelId || ""));
    const optionList = Array.isArray(options) && options.length
      ? `\nThe options are:\n${options.join("\n")}`
      : "";

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "You are a patient tutor helping a student who is stuck mid-practice. " +
            "You never give the answer, name the correct option, or complete the working. " +
            "You point at the idea being tested, the formula or definition to reach for, " +
            "or the first step. Two sentences at most. Plain text, no markdown.",
        },
        {
          role: "user",
          content: `A ${level ? level.label : "secondary"} ${subject || ""} student is stuck on this question:

${question}${optionList}

Give one short hint that gets them moving without giving the answer away.`,
        },
      ],
    });

    const hint = (completion.choices[0]?.message?.content || "").trim();

    if (!hint) {
      return NextResponse.json({ error: "Could not think of a hint. Try again." }, { status: 502 });
    }

    return NextResponse.json({ hint });
  } catch (error) {
    console.error("Hint error:", error);
    return NextResponse.json({ error: "Failed to get a hint" }, { status: 500 });
  }
}
