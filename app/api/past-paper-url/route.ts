import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireVerifiedUser } from "../../../lib/requireVerifiedUser";
import { rateLimit } from "../../../lib/rateLimit";

const SIGNED_URL_SECONDS = 60 * 10;

/**
 * Mints a short-lived signed URL for one paper in the private past-papers
 * bucket. The bucket is not public, so this is the only way to read a file, and
 * it requires a signed-in, verified student. The link expires in ten minutes,
 * which is long enough to read a paper and short enough to be useless if it
 * leaks.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireVerifiedUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const limited = rateLimit(`paper-url:${auth.user.id}`, 60, 60_000);
    if (!limited.allowed) {
      return NextResponse.json(
        { error: "You're going a bit fast. Try again in a moment." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }

    const { paperId } = await req.json();
    if (!paperId || typeof paperId !== "string") {
      return NextResponse.json({ error: "Which paper?" }, { status: 400 });
    }

    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: paper, error: lookupError } = await service
      .from("past_papers")
      .select("storage_path, external_url")
      .eq("id", paperId)
      .single();

    if (lookupError || !paper) {
      return NextResponse.json({ error: "That paper is not in the catalogue." }, { status: 404 });
    }

    // Catalogued as a link rather than a file: hand back the official page.
    if (paper.external_url) {
      return NextResponse.json({ url: paper.external_url, external: true });
    }

    const { data: signed, error: signError } = await service.storage
      .from("past-papers")
      .createSignedUrl(paper.storage_path!, SIGNED_URL_SECONDS);

    if (signError || !signed) {
      return NextResponse.json(
        { error: signError?.message || "Could not open that paper." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signed.signedUrl, external: false });
  } catch (error) {
    console.error("Past paper URL error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
