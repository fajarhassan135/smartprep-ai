"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const C = {
  snow: "#F5F4ED", kite: "#351E1C", garnet: "#733635",
  garnetLight: "#a07070", orange: "#FF6037",
};

/**
 * Where the guard sends a signed-in user whose email is still unconfirmed.
 * They can resend the link or sign out; there is no way past this screen.
 */
export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const bg = "var(--bg)";
  const text = "var(--text)";
  const sub = "var(--sub)";

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      // Already confirmed in another tab? Don't strand them here.
      if (data.user.email_confirmed_at) {
        window.location.href = "/dashboard";
        return;
      }
      setEmail(data.user.email || "");
      setChecking(false);
    }
    load();
  }, []);

  async function resend() {
    if (!email) return;
    setSending(true);
    setNotice("");
    setError("");
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/verified` },
    });
    if (resendError) setError(resendError.message);
    else setNotice("Sent. Check your inbox — and your spam folder.");
    setSending(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 14, color: sub }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>One more step</p>
        <h1 style={{ fontSize: "clamp(24px, 5.5vw, 30px)", fontWeight: 600, color: text, marginBottom: 14, letterSpacing: "-0.03em" }}>Verify your email</h1>
        <p style={{ fontSize: 14, color: sub, lineHeight: 1.7, marginBottom: 28 }}>
          We sent a confirmation link to <strong style={{ color: text }}>{email}</strong>.
          Click it and you can come straight back here.
        </p>

        {notice && (
          <div style={{ backgroundColor: "rgba(99,153,34,0.1)", border: "1px solid rgba(99,153,34,0.3)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, fontSize: 13, color: "#639922" }}>
            {notice}
          </div>
        )}
        {error && (
          <div style={{ backgroundColor: "rgba(226,75,74,0.1)", border: "1px solid rgba(226,75,74,0.3)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, fontSize: 13, color: "#E24B4A" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={resend} disabled={sending} style={{ padding: "13px 28px", backgroundColor: C.orange, color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 600, border: "none", cursor: sending ? "default" : "pointer", fontFamily: "inherit", opacity: sending ? 0.6 : 1 }}>
            {sending ? "Sending..." : "Resend link"}
          </button>
          <button onClick={() => window.location.reload()} style={{ padding: "13px 28px", backgroundColor: "transparent", color: C.orange, borderRadius: 12, fontSize: 14, fontWeight: 600, border: `1px solid ${C.orange}`, cursor: "pointer", fontFamily: "inherit" }}>
            I&apos;ve verified
          </button>
        </div>

        <button onClick={signOut} style={{ marginTop: 24, background: "none", border: "none", color: sub, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
