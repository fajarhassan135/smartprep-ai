"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type GuardState = {
  user: User | null;
  /** "checking" until we know; "ready" only for a signed-in, verified user. */
  status: "checking" | "ready";
};

/**
 * The single gate every signed-in page uses. Anyone without a session goes to
 * login; anyone whose email is still unconfirmed goes to /verify-email, so an
 * account made with an address nobody owns can never reach the app.
 *
 * Pages must not render their content until status is "ready".
 */
export function useAuthGuard(): GuardState {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"checking" | "ready">("checking");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      if (!data.user.email_confirmed_at) {
        window.location.href = "/verify-email";
        return;
      }

      setUser(data.user);
      setStatus("ready");
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, status };
}
