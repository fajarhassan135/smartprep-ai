import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Resolves the caller from their access token and says whether they are an
// admin. Fails closed: no token, no ADMIN_EMAILS, or an unlisted email all
// come back as not an admin.
async function resolveAdmin(accessToken: string | null) {
  if (!accessToken) return { ok: false as const, status: 401, error: "Not signed in" };

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabaseAuth.auth.getUser(accessToken);
  if (error || !data.user) {
    return { ok: false as const, status: 401, error: "Session expired. Please log in again." };
  }

  const allowed = adminEmails();
  if (allowed.length === 0) {
    return {
      ok: false as const,
      status: 403,
      error: "No admins are configured. Set ADMIN_EMAILS in the environment.",
    };
  }

  const email = (data.user.email || "").toLowerCase();
  if (!allowed.includes(email)) {
    return { ok: false as const, status: 403, error: "You do not have admin access." };
  }

  return { ok: true as const, user: data.user };
}

function tokenFrom(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

// The admin page calls this on load to decide whether to show the upload form.
export async function GET(req: NextRequest) {
  const result = await resolveAdmin(tokenFrom(req));
  if (!result.ok) {
    return NextResponse.json({ isAdmin: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ isAdmin: true });
}

export async function POST(req: NextRequest) {
  try {
    const result = await resolveAdmin(tokenFrom(req));
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const form = await req.formData();
    const file = form.get("file");
    const subject = String(form.get("subject") || "").trim();
    const board = String(form.get("board") || "").trim();
    const year = String(form.get("year") || "").trim();
    const paper = String(form.get("paper") || "").trim();

    if (!(file instanceof File) || !subject || !board || !year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "PDF must be smaller than 10MB." }, { status: 400 });
    }

    const slug = (value: string) => value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
    const fileName = `${slug(board)}-${slug(subject)}-${slug(year)}-${slug(paper) || "paper"}-${Date.now()}.pdf`;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: uploadError } = await supabaseAdmin.storage
      .from("past-papers")
      .upload(fileName, file, { contentType: "application/pdf" });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, fileName });
  } catch (error) {
    console.error("Past paper upload error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
