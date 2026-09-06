import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

type Result =
  | { ok: true; user: User }
  | { ok: false; status: number; error: string };

/**
 * Server-side half of the auth gate. The client guard controls what renders;
 * this controls what the API will actually do, so a page that skips the guard
 * (or a request made outside the app entirely) still gets nothing.
 */
export async function requireVerifiedUser(req: NextRequest): Promise<Result> {
  const header = req.headers.get("authorization") || "";
  const accessToken = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!accessToken) {
    return { ok: false, status: 401, error: "Not signed in" };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return { ok: false, status: 401, error: "Session expired. Please log in again." };
  }
  if (!data.user.email_confirmed_at) {
    return { ok: false, status: 403, error: "Please verify your email address first." };
  }

  return { ok: true, user: data.user };
}
