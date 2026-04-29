"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const C = {
  snow: "#F5F4ED",
  snowMist: "#ECECDC",
  kite: "#351E1C",
  kiteDeep: "#2a1715",
  garnet: "#733635",
  garnetLight: "#a07070",
  orange: "#FF6037",
  orangeDark: "#c44a26",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.snow, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>

      {/* NAVBAR */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid rgba(53,30,28,0.08)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#733635", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>
            ←
          </button>
          <a href="/" style={{ fontSize: 18, color: C.kite, textDecoration: "none", lineHeight: 1 }}>
            ⌂
          </a>
          <a href="/" style={{ fontSize: 15, fontWeight: 500, color: C.kite, textDecoration: "none", letterSpacing: "-0.03em" }}>
            Exam<span style={{ color: C.orange }}>Prep</span> AI
          </a>
        </div>
        <a href="/signup" style={{ fontSize: 13, color: C.garnet, textDecoration: "none" }}>
          Don't have an account? <span style={{ color: C.orange, fontWeight: 500 }}>Sign up</span>
        </a>
      </nav>

      {/* FORM */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* HEADER */}
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Welcome back</p>
            <h1 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.03em", color: C.kite, marginBottom: 8 }}>Log in</h1>
            <p style={{ fontSize: 14, color: C.garnet, lineHeight: 1.6 }}>Continue your exam preparation journey.</p>
          </div>

          {/* ERROR */}
          {error && (
            <div style={{ backgroundColor: "rgba(255,96,55,0.08)", border: "1px solid rgba(255,96,55,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: C.orangeDark }}>
              {error}
            </div>
          )}

          {/* EMAIL */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: C.kite, display: "block", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid rgba(53,30,28,0.15)`, backgroundColor: "#fff", fontSize: 14, color: C.kite, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* PASSWORD */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: C.kite, display: "block", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid rgba(53,30,28,0.15)`, backgroundColor: "#fff", fontSize: 14, color: C.kite, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: 12, backgroundColor: loading ? C.garnet : C.orange, color: "#fff", fontWeight: 500, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.2s" }}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          {/* DIVIDER */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, backgroundColor: "rgba(53,30,28,0.08)" }} />
            <span style={{ fontSize: 12, color: C.garnetLight }}>or</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "rgba(53,30,28,0.08)" }} />
          </div>

          {/* GOOGLE */}
          <button
            onClick={async () => {
              await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
            }}
            style={{ width: "100%", padding: "13px", borderRadius: 12, backgroundColor: "#fff", color: C.kite, fontWeight: 500, fontSize: 14, border: `1px solid rgba(53,30,28,0.15)`, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            <span style={{ fontSize: 18 }}>G</span> Continue with Google
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: C.garnetLight, marginTop: 24 }}>
            Don't have an account?{" "}
            <a href="/signup" style={{ color: C.orange, textDecoration: "none", fontWeight: 500 }}>Sign up</a>
          </p>

        </div>
      </div>
    </div>
  );
}