"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const C = {
  snow: "#F5F4ED", kite: "#351E1C", garnet: "#733635",
  garnetLight: "#a07070", orange: "#FF6037",
};

type State = "checking" | "verified" | "failed";

/**
 * Where the confirmation link in the signup email lands. Supabase can send the
 * user here in a few shapes depending on the project's email template, so all
 * three are handled: a PKCE `code`, a `token_hash` to verify, or a session that
 * the link already established.
 */
export default function VerifiedPage() {
  const [state, setState] = useState<State>("checking");
  const [message, setMessage] = useState("");

  const bg = "var(--bg)";
  const text = "var(--text)";
  const sub = "var(--sub)";

  useEffect(() => {
    async function confirm() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const errorDescription = params.get("error_description");

      if (errorDescription) {
        setMessage(errorDescription);
        setState("failed");
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          setState("failed");
          return;
        }
      } else if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
        if (error) {
          setMessage(error.message);
          setState("failed");
          return;
        }
      }

      const { data } = await supabase.auth.getUser();
      if (data.user?.email_confirmed_at) {
        setState("verified");
      } else {
        setMessage("This confirmation link is invalid or has already expired.");
        setState("failed");
      }
    }
    confirm();
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        {state === "checking" && (
          <div style={{ fontSize: 14, color: sub }}>Confirming your email...</div>
        )}

        {state === "verified" && (
          <>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Email confirmed</p>
            <h1 style={{ fontSize: "clamp(24px, 5.5vw, 30px)", fontWeight: 500, color: text, marginBottom: 14, letterSpacing: "-0.03em" }}>You&apos;re all set</h1>
            <p style={{ fontSize: 14, color: sub, lineHeight: 1.7, marginBottom: 28 }}>
              Your email address is verified. You can close this tab and go back to
              the page you were on — it will let you straight through now. Or carry
              on from here.
            </p>
            <a href="/dashboard" style={{ display: "inline-block", padding: "13px 30px", backgroundColor: C.orange, color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
              Go to dashboard →
            </a>
          </>
        )}

        {state === "failed" && (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 500, color: text, marginBottom: 12, letterSpacing: "-0.03em" }}>We couldn&apos;t confirm that link</h1>
            <p style={{ fontSize: 14, color: sub, lineHeight: 1.7, marginBottom: 28 }}>{message}</p>
            <a href="/verify-email" style={{ display: "inline-block", padding: "13px 30px", backgroundColor: C.orange, color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
              Send a new link
            </a>
          </>
        )}
      </div>
    </div>
  );
}
