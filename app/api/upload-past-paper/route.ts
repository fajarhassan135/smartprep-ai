import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { findLevel } from "../../../lib/curriculum";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

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
  if (!data.user.email_confirmed_at) {
    return { ok: false as const, status: 403, error: "Please verify your email address first." };
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

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const slug = (value: string) => value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");

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
    const levelId = String(form.get("levelId") || "").trim();
    const year = Number(form.get("year"));
    const session = String(form.get("session") || "Annual").trim();
    const paperLabel = String(form.get("paperLabel") || "").trim();
    const docType = String(form.get("docType") || "question_paper").trim();
    const externalUrl = String(form.get("externalUrl") || "").trim();

    const level = findLevel(levelId);
    if (!subject || !level || !Number.isInteger(year) || !paperLabel) {
      return NextResponse.json(
        { error: "Subject, level, year and paper label are all required." },
        { status: 400 }
      );
    }
    if (year < 2000 || year > 2100) {
      return NextResponse.json({ error: "That year looks wrong." }, { status: 400 });
    }
    if (docType !== "question_paper" && docType !== "mark_scheme") {
      return NextResponse.json({ error: "Unknown document type." }, { status: 400 });
    }

    const hasFile = file instanceof File && file.size > 0;
    if (hasFile === Boolean(externalUrl)) {
      return NextResponse.json(
        { error: "Give either a PDF to upload or a link to the official page, not both." },
        { status: 400 }
      );
    }

    let storagePath: string | null = null;

    if (hasFile) {
      const pdf = file as File;
      if (pdf.type !== "application/pdf") {
        return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
      }
      if (pdf.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "PDF must be smaller than 20MB." }, { status: 400 });
      }

      // Foldered by what it is, so the bucket stays navigable by hand.
      storagePath = [
        slug(level.board),
        slug(level.label),
        slug(subject),
        String(year),
        `${slug(session)}-${slug(paperLabel)}-${docType}-${Date.now()}.pdf`,
      ].join("/");

      const { error: uploadError } = await serviceClient()
        .storage.from("past-papers")
        .upload(storagePath, pdf, { contentType: "application/pdf" });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
    } else {
      let parsed: URL;
      try {
        parsed = new URL(externalUrl);
      } catch {
        return NextResponse.json({ error: "That link is not a valid URL." }, { status: 400 });
      }
      if (parsed.protocol !== "https:") {
        return NextResponse.json({ error: "Links must be https." }, { status: 400 });
      }
    }

    const { error: insertError } = await serviceClient()
      .from("past_papers")
      .insert({
        subject,
        board: level.board,
        level: level.label,
        year,
        session: session || "Annual",
        paper_label: paperLabel,
        doc_type: docType,
        storage_path: storagePath,
        external_url: storagePath ? null : externalUrl,
        uploaded_by: result.user.id,
      });

    if (insertError) {
      // Don't leave an orphan file in the bucket if the catalogue row failed.
      if (storagePath) {
        await serviceClient().storage.from("past-papers").remove([storagePath]);
      }
      const duplicate = insertError.code === "23505";
      return NextResponse.json(
        {
          error: duplicate
            ? "That exact paper is already in the catalogue."
            : insertError.message,
        },
        { status: duplicate ? 409 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Past paper upload error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
