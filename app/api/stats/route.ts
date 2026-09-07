import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;

/**
 * Live counts for the landing page.
 *
 * The landing page is public and the underlying tables are locked to their own
 * user by RLS, so the numbers are counted here with the service role and
 * returned as bare totals. Nothing identifying leaves this route: only how many
 * rows exist, never who they belong to.
 *
 * Cached for five minutes -- these are marketing figures, not a dashboard.
 */
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Missing configuration used to throw inside createClient and surface as an
    // empty object, which looked identical to "no data yet". Say so instead.
    if (!url || !key) {
      console.error("Stats: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not set");
      return NextResponse.json({ error: "not_configured" }, { status: 200 });
    }

    const supabase = createClient(url, key);

    // One row, however large the tables get. See migration 0007.
    const { data, error } = await supabase.from("app_stats").select("*").single();

    if (error || !data) {
      console.error("Stats: app_stats view unavailable —", error?.message);
      return NextResponse.json({ error: "unavailable" }, { status: 200 });
    }

    const { students, quizzes, questions, papers, flashcards } = data as {
      students: number; quizzes: number; questions: number; papers: number; flashcards: number;
    };

    return NextResponse.json(
      { students, quizzes, questions, papers, flashcards },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Stats error:", error);
    // The landing page falls back to facts about the product if this fails.
    return NextResponse.json({}, { status: 200 });
  }
}
