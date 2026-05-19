"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
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

export default function SignupPage() {
  const router = useRouter();
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const bg = dark ? C.kite : C.snow;
  const text = dark ? C.snow : C.kite;
  const sub = dark ? C.garnetLight : C.garnet;
  const border = dark ? "rgba(245,244,237,0.08)" : "rgba(53,30,28,0.08)";
  const inputBorder = dark ? "rgba(245,244,237,0.15)" : "rgba(53,30,28,0.15)";
  const inputBg = dark ? "rgba(255,255,255,0.06)" : "#fff";

  useEffect(() => {
    queueMicrotask(() => {
      const saved = localStorage.getItem("darkMode") === "true";
      setDark(saved);
    });
  }, []);

  async function handleSignup() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, school } },
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      router.push("/login");
    }
    setLoading(false);
  }

  function toggleDark() {
    localStorage.setItem("darkMode", String(!dark));
    setDark((d) => !d);
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s", position: "relative" }}>
        <button type="button" onClick={toggleDark} style={{ position: "absolute", top: 24, right: 40, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: 44, height: 24, borderRadius: 999, backgroundColor: dark ? C.snow : C.kite, position: "relative", transition: "background 0.3s" }}>
            <div style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: dark ? C.kite : C.snow, position: "absolute", top: 3, left: dark ? 23 : 3, transition: "left 0.3s" }} />
          </div>
        </button>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📬</div>
          <h2 style={{ fontSize: 28, fontWeight: 500, color: text, marginBottom: 12, letterSpacing: "-0.03em" }}>Check your email</h2>
          <p style={{ fontSize: 14, color: sub, lineHeight: 1.7 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <a href="/login" style={{ display: "inline-block", marginTop: 28, padding: "12px 28px", backgroundColor: C.orange, color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", transition: "background 0.3s" }}>

      {/* NAVBAR */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid ${border}`, backgroundColor: bg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", color: sub, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>
            ←
          </button>
          <Link href="/" style={{ fontSize: 18, color: text, textDecoration: "none", lineHeight: 1 }}>
            ⌂
          </Link>
          <Link href="/" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>
            Exam<span style={{ color: C.orange }}>Prep</span> AI
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <button onClick={toggleDark} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ width: 44, height: 24, borderRadius: 999, backgroundColor: dark ? C.snow : C.kite, position: "relative", transition: "background 0.3s" }}>
              <div style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: dark ? C.kite : C.snow, position: "absolute", top: 3, left: dark ? 23 : 3, transition: "left 0.3s" }} />
            </div>
          </button>
          <a href="/login" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>
            Already have an account? <span style={{ color: C.orange, fontWeight: 500 }}>Log in</span>
          </a>
        </div>
      </nav>

      {/* FORM */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* HEADER */}
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Get started free</p>
            <h1 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Create account</h1>
            <p style={{ fontSize: 14, color: sub, lineHeight: 1.6 }}>Join thousands of students preparing smarter.</p>
          </div>

          {/* ERROR */}
          {error && (
            <div style={{ backgroundColor: "rgba(255,96,55,0.08)", border: "1px solid rgba(255,96,55,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: C.orangeDark }}>
              {error}
            </div>
          )}

          {/* NAME */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fajar Warriach"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${inputBorder}`, backgroundColor: inputBg, fontSize: 14, color: text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* EMAIL */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${inputBorder}`, backgroundColor: inputBg, fontSize: 14, color: text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* SCHOOL */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>School <span style={{ color: sub, fontWeight: 400 }}>(optional)</span></label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Your school name"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${inputBorder}`, backgroundColor: inputBg, fontSize: 14, color: text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* PASSWORD */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${inputBorder}`, backgroundColor: inputBg, fontSize: 14, color: text, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={handleSignup}
            disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: 12, backgroundColor: loading ? C.garnet : C.orange, color: "#fff", fontWeight: 500, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.2s" }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: sub, marginTop: 24, lineHeight: 1.6 }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: C.orange, textDecoration: "none", fontWeight: 500 }}>Log in</a>
          </p>

        </div>
      </div>
    </div>
  );
}