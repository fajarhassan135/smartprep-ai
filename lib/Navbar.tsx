"use client";
import Link from "next/link";
import { useTheme } from "./ThemeContext";
import { supabase } from "./supabase";

const C = {
  snow: "#F5F4ED",
  kite: "#351E1C",
  garnet: "#733635",
  garnetLight: "#a07070",
  orange: "#FF6037",
};

export default function Navbar({ active }: { active?: string }) {
  const { dark, toggleDark } = useTheme();

  const text = dark ? C.snow : C.kite;
  const sub = dark ? C.garnetLight : C.garnet;
  const bg = dark ? C.kite : C.snow;
  const border = dark ? "rgba(245,244,237,0.08)" : "rgba(53,30,28,0.08)";

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function playToggleSound() {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }

  function handleToggleClick() {
    playToggleSound();
    toggleDark();
  }

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/quiz", label: "Quiz" },
    { href: "/past-papers", label: "Past Papers" },
    { href: "/flashcards", label: "Flashcards" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/history", label: "History" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 40px",
        borderBottom: `1px solid ${border}`,
        backgroundColor: bg,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: text,
          textDecoration: "none",
          letterSpacing: "-0.03em",
        }}
      >
        Exam<span style={{ color: C.orange }}>Prep</span> AI
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      {links.map((link) => ( 
        <a
          key={link.href}
          href={link.href}
          style={{
            fontSize: 13,
            color: active === link.href ? C.orange : sub,
            textDecoration: "none",
            fontWeight: active === link.href ? 500 : 400,
          }}
        >
          {link.label}
        </a>
      ))} 
        <button
          onClick={handleToggleClick}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          aria-label="Toggle dark mode"
        >
          <div
            style={{
              width: 44,
              height: 24,
              borderRadius: 999,
              backgroundColor: dark ? C.snow : C.kite,
              position: "relative",
              transition: "background 0.3s",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                backgroundColor: dark ? C.kite : C.snow,
                position: "absolute",
                top: 3,
                left: dark ? 23 : 3,
                transition: "left 0.3s",
              }}
            />
          </div>
        </button>
        <button
          onClick={handleLogout}
          style={{
            fontSize: 13,
            fontWeight: 500,
            padding: "9px 20px",
            borderRadius: 999,
            backgroundColor: "transparent",
            color: C.orange,
            border: `1px solid ${C.orange}`,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Log out
        </button>
      </div>
    </nav>
  );
}