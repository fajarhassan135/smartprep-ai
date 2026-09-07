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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const headCount = async (table: string) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      return error ? 0 : count ?? 0;
    };

    const [students, quizzes, papers, flashcards] = await Promise.all([
      supabase.auth.admin
        .listUsers({ perPage: 1000 })
        .then((r) => r.data?.users?.length ?? 0)
        .catch(() => 0),
      headCount("quiz_sessions"),
      headCount("past_papers"),
      headCount("flashcards"),
    ]);

    // Questions actually answered, rather than a number someone made up.
    const { data: sessions } = await supabase
      .from("quiz_sessions")
      .select("total_questions");
    const questions = (sessions || []).reduce(
      (sum, s: { total_questions: number | null }) => sum + (s.total_questions || 0),
      0
    );

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
