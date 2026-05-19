"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

const C = {
  snow: "#F5F4ED", snowMist: "#ECECDC", kite: "#351E1C", kiteDeep: "#2a1715",
  garnet: "#733635", garnetLight: "#a07070", orange: "#FF6037", orangeDark: "#c44a26",
};

export default function ProfilePage() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const bg = dark ? C.kite : C.snow;
  const bgMid = dark ? C.kiteDeep : C.snowMist;
  const text = dark ? C.snow : C.kite;
  const sub = dark ? C.garnetLight : C.garnet;
  const border = dark ? "rgba(245,244,237,0.08)" : "rgba(53,30,28,0.08)";

  useEffect(() => {
    queueMicrotask(() => {
      const saved = localStorage.getItem("darkMode") === "true";
      setDark(saved);
    });
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
      } else {
        setUser(data.user);
        setFullName(data.user.user_metadata?.full_name || "");
        setSchool(data.user.user_metadata?.school || "");
        setEmail(data.user.email || "");
      }
    });
  }, []);

  async function saveProfile() {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, school },
    });
    if (error) setErrorMsg(error.message);
    else setSuccessMsg("Profile updated successfully!");
    setSaving(false);
  }

  async function savePassword() {
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords don't match!");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters!");
      return;
    }
    setSavingPassword(true);
    setSuccessMsg("");
    setErrorMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setErrorMsg(error.message);
    else {
      setSuccessMsg("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.snow, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 14, color: C.garnet }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>

      {/* NAVBAR */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 50, backgroundColor: bg }}>
        <Link href="/" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>
          Exam<span style={{ color: C.orange }}>Prep</span> AI
        </Link>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/dashboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Dashboard</a>
          <a href="/quiz" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Quiz</a>
          <a href="/past-papers" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Past Papers</a>
          <a href="/flashcards" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Flashcards</a>
          <a href="/leaderboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Leaderboard</a>
          <a href="/profile" style={{ fontSize: 13, color: C.orange, textDecoration: "none", fontWeight: 500 }}>Profile</a>
          <button onClick={handleLogout} style={{ fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 999, backgroundColor: "transparent", color: C.orange, border: `1px solid ${C.orange}`, cursor: "pointer", fontFamily: "inherit" }}>
            Log out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Account</p>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Your profile</h1>
        <p style={{ fontSize: 14, color: sub, marginBottom: 48 }}>Manage your account details and password.</p>

        {/* SUCCESS / ERROR */}
        {successMsg && (
          <div style={{ backgroundColor: "rgba(99,153,34,0.1)", border: "1px solid rgba(99,153,34,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 24, fontSize: 13, color: "#639922" }}>
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ backgroundColor: "rgba(255,96,55,0.08)", border: "1px solid rgba(255,96,55,0.2)", borderRadius: 12, padding: "14px 20px", marginBottom: 24, fontSize: 13, color: C.orangeDark }}>
            {errorMsg}
          </div>
        )}

        {/* AVATAR */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, backgroundColor: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 500, color: "#fff", flexShrink: 0 }}>
            {fullName ? fullName[0].toUpperCase() : email[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: text, marginBottom: 4 }}>{fullName || "Student"}</div>
            <div style={{ fontSize: 13, color: sub }}>{email}</div>
            {school && <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>🏫 {school}</div>}
          </div>
        </div>

        {/* PROFILE DETAILS */}
        <div style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid ${border}`, borderRadius: 20, padding: "32px", backdropFilter: "blur(16px)", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 24 }}>Personal details</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Email <span style={{ color: sub, fontWeight: 400 }}>(cannot be changed)</span></label>
            <input
              type="email"
              value={email}
              disabled
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: bgMid, color: sub, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", cursor: "not-allowed" }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>School</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Your school name"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <button onClick={saveProfile} disabled={saving} style={{ padding: "12px 28px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>

        {/* CHANGE PASSWORD */}
        <div style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid ${border}`, borderRadius: 20, padding: "32px", backdropFilter: "blur(16px)", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 24 }}>Change password</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <button onClick={savePassword} disabled={savingPassword} style={{ padding: "12px 28px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit", opacity: savingPassword ? 0.7 : 1 }}>
            {savingPassword ? "Updating..." : "Update password"}
          </button>
        </div>

        {/* DANGER ZONE */}
        <div style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid rgba(226,75,74,0.2)`, borderRadius: 20, padding: "32px", backdropFilter: "blur(16px)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: "#E24B4A", marginBottom: 8 }}>Danger zone</h2>
          <p style={{ fontSize: 13, color: sub, marginBottom: 20 }}>Once you log out all your session data will be cleared.</p>
          <button onClick={handleLogout} style={{ padding: "12px 28px", borderRadius: 12, backgroundColor: "transparent", color: "#E24B4A", fontWeight: 500, fontSize: 14, border: "1px solid rgba(226,75,74,0.3)", cursor: "pointer", fontFamily: "inherit" }}>
            Log out of all devices
          </button>
        </div>

      </div>
    </div>
  );
}