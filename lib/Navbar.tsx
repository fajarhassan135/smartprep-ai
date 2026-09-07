"use client";
import { useEffect, useState } from "react";
import { Logo } from "../components/Logo";
import Link from "next/link";
import { useTheme } from "./ThemeContext";
import { supabase } from "./supabase";
import { playToggle, playToggleOn, soundEnabled, setSoundEnabled } from "./sound";

const C = {
  snow: "#F5F4ED",
  kite: "#351E1C",
  garnet: "#733635",
  garnetLight: "#a07070",
  orange: "#FF6037",
};

export default function Navbar({ active }: { active?: string }) {
  const { toggleDark } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initial, setInitial] = useState("?");
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  const text = "var(--text)";
  const sub = "var(--sub)";
  const bg = "var(--bg)";
  const border = "var(--border)";

  useEffect(() => {
    async function loadAvatar() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setInitial((data.user.email || "?")[0].toUpperCase());
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", data.user.id)
        .single();
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
    }
    loadAvatar();
  }, []);

  useEffect(() => {
    // Read the stored preference after mount: it lives in localStorage, which
    // the server render cannot see.
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setSoundOn(soundEnabled());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function handleToggleClick() {
    playToggle();
    toggleDark();
  }

  function handleSoundToggle() {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    // Play the confirmation even though sound was off a moment ago, so the
    // click that enables it is the click you hear.
    if (next) playToggleOn();
  }

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/quiz", label: "Quiz" },
    { href: "/past-papers", label: "Past Papers" },
    { href: "/flashcards", label: "Flashcards" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/history", label: "History" },
  ];

  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px clamp(16px, 4vw, 40px)", borderBottom: `1px solid ${border}`, backgroundColor: bg, position: "sticky", top: 0, zIndex: 50, gap: 16 }}>
      <Link href="/" style={{ fontSize: 15, fontWeight: 600, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>
        <Logo />
      </Link>

      <button
        className="nav-menu-button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        {menuOpen ? "Close" : "Menu"}
      </button>

      <div className={`nav-links${menuOpen ? " is-open" : ""}`}>
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} style={{ fontSize: 13, color: active === link.href ? C.orange : sub, textDecoration: "none", fontWeight: active === link.href ? 500 : 400 }}>
            {link.label}
          </a>
        ))}
        <button onClick={handleSoundToggle} className="pill" aria-pressed={soundOn} aria-label={soundOn ? "Turn sound off" : "Turn sound on"} title={soundOn ? "Sound on" : "Sound off"} style={{ padding: "6px 12px", fontSize: 12 }}>
          {soundOn ? "Sound on" : "Sound off"}
        </button>
        <button onClick={handleToggleClick} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} aria-label="Toggle dark mode">
          <div className="theme-switch">
            <div className="theme-switch-knob" />
          </div>
        </button>
        <a href="/profile" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" style={{ width: 28, height: 28, borderRadius: 999, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: C.orange, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>
              {initial}
            </div>
          )}
          <span style={{ fontSize: 13, color: active === "/profile" ? C.orange : sub, fontWeight: active === "/profile" ? 500 : 400 }}>
            Profile
          </span>
        </a>
        <button onClick={handleLogout} style={{ fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 999, backgroundColor: "transparent", color: C.orange, border: `1px solid ${C.orange}`, cursor: "pointer", fontFamily: "inherit" }}>
          Log out
        </button>
      </div>
    </nav>
  );
}