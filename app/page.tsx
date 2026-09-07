"use client";
import { useEffect, useState } from "react";
import { useTheme } from "../lib/ThemeContext";

type Stats = {
  students?: number;
  quizzes?: number;
  questions?: number;
  papers?: number;
  flashcards?: number;
};

export default function HomePage() {
  const { toggleDark } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Real counts, refreshed on every visit. Anything still at zero is left out
  // rather than advertised, and the strip falls back to facts about the product
  // until there is usage worth showing.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setStats(d); })
      .catch(() => { if (!cancelled) setStats({}); });
    return () => { cancelled = true; };
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-GB");
  const liveStats = stats
    ? [
        stats.questions ? { num: fmt(stats.questions), label: "Questions answered" } : null,
        stats.quizzes ? { num: fmt(stats.quizzes), label: "Quizzes completed" } : null,
        stats.students ? { num: fmt(stats.students), label: stats.students === 1 ? "Student" : "Students" } : null,
        stats.papers ? { num: fmt(stats.papers), label: "Past papers" } : null,
        stats.flashcards ? { num: fmt(stats.flashcards), label: "Flashcards made" } : null,
      ].filter(Boolean).slice(0, 3)
    : [];

  // True on day one, and still true later.
  const fallbackStats = [
    { num: "6", label: "Subjects covered" },
    { num: "4", label: "Exam levels" },
    { num: "2", label: "Boards" },
  ];

  const shownStats = liveStats.length === 3 ? (liveStats as { num: string; label: string }[]) : fallbackStats;

  const C = {
    snow: "#F5F4ED",
    snowMist: "#ECECDC",
    kite: "#351E1C",
    kiteDeep: "#2a1715",
    garnet: "#733635",
    garnetLight: "#a07070",
    orange: "#FF6037",
    orangeDark: "#c44a26",
    aqua: "#A0C9CB",
    aquaDark: "#2a6b6d",
  };

  const bg = "var(--bg)";
  const bgMid = "var(--bg-mid)";
  const text = "var(--text)";
  const sub = "var(--sub)";
  const border = "var(--border)";

  const subjects = [
    { title: "Mathematics", sub: "Algebra · Calculus · Statistics", board: "Cambridge" },
    { title: "English", sub: "Comprehension · Writing · Grammar", board: "Pak Board" },
    { title: "Computer Science", sub: "Programming · Data · Networks", board: "Cambridge" },
    { title: "Physics", sub: "Mechanics · Electromagnetism · Waves", board: "Cambridge" },
    { title: "Business Studies", sub: "Marketing · Finance · Management", board: "Pak Board" },
    { title: "Economics", sub: "Micro · Macro · National Income", board: "Cambridge" },
  ];

  const features = [
    { title: "AI Quiz Generation", desc: "Exam-standard questions written to your syllabus, board and level, at the difficulty you choose." },
    { title: "Timed Exam Mode", desc: "Simulate real exam conditions with a countdown timer and strict mode." },
    { title: "Progress Analytics", desc: "Track your scores, weak topics, and improvement over time." },
    { title: "Flashcards", desc: "Create and study flashcards for quick revision before your exam." },
    { title: "Class Leaderboard", desc: "Compete with classmates and stay motivated with school-based rankings." },
    { title: "Past Papers", desc: "Access organized past papers by year, subject, board and chapter." },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, color: text, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s, color 0.3s" }}>

      {/* NAVBAR */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px clamp(16px, 4vw, 40px)", borderBottom: `1px solid ${border}`, backgroundColor: bg, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.03em", color: text, whiteSpace: "nowrap" }}>
          Smart<span style={{ color: C.orange }}>Prep</span> AI
        </div>

        <button
          className="nav-menu-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <div className={`nav-links${menuOpen ? " is-open" : ""}`} style={{ gap: 28 }}>
          <a onClick={() => setMenuOpen(false)} href="#subjects" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Subjects</a>
          <a onClick={() => setMenuOpen(false)} href="#features" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Features</a>
          <button
            onClick={toggleDark}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <div style={{ width: 44, height: 24, borderRadius: 999, backgroundColor: "var(--text)", position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
              <div className="theme-switch-knob" />
            </div>
          </button>
          <a href="/login" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Log in</a>
          <a href="/signup" style={{ fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 999, backgroundColor: C.orange, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>
            Sign up
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(48px, 10vw, 80px) clamp(16px, 4vw, 40px) clamp(40px, 8vw, 64px)", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 16 }}>
          Cambridge & Pakistan Board
        </p>
        <h1 style={{ fontSize: "clamp(34px, 9vw, 56px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 24, color: text }}>
          Study smarter.<br />
          <span style={{ color: C.orange }}>Score higher.</span>
        </h1>
        <p style={{ fontSize: 16, color: sub, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px" }}>
          AI quizzes written to your syllabus, plus the real past papers. Built for IGCSE, A-Level, Matric & FSc students who want results, not just practice.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <a href="/signup" style={{ padding: "13px 28px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>
            Start for free
          </a>
          <a href="/past-papers" style={{ padding: "13px 28px", borderRadius: 12, backgroundColor: "transparent", color: text, fontWeight: 500, fontSize: 14, border: `1px solid ${border}`, cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>
            See past papers
          </a>
        </div>
      </section>

      {/* STATS */}
      <section style={{ backgroundColor: bgMid, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px clamp(16px, 4vw, 40px)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", textAlign: "center", gap: 16 }}>
          {shownStats.map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: "clamp(24px, 5.5vw, 30px)", fontWeight: 500, color: text }}>{stat.num}</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 6 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SUBJECTS */}
      <section id="subjects" style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(44px, 9vw, 72px) clamp(16px, 4vw, 40px)" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Subjects</p>
        <h2 style={{ fontSize: "clamp(25px, 6vw, 34px)", fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 40 }}>Pick your subject & start</h2>
        <div style={{ background: "var(--hero-panel)", borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {subjects.map((subject) => (
            <div key={subject.title} style={{ background: "var(--card)", border: "var(--glass-border)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", backdropFilter: "blur(16px)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,96,55,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--accent-ink)", flexShrink: 0 }}>
                {subject.title[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: text }}>{subject.title}</div>
                <div style={{ fontSize: 12, color: sub, marginTop: 3 }}>{subject.sub}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, padding: "4px 12px", borderRadius: 999, background: subject.board === "Cambridge" ? "var(--teal-badge)" : "rgba(255,96,55,0.1)", color: subject.board === "Cambridge" ? "var(--teal-ink)" : "var(--accent-ink)", flexShrink: 0 }}>
                {subject.board}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ backgroundColor: bgMid, padding: "clamp(44px, 9vw, 72px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Features</p>
          <h2 style={{ fontSize: "clamp(25px, 6vw, 34px)", fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 40 }}>Everything you need to ace your exams</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {features.map((f) => (
              <div key={f.title} style={{ backgroundColor: bg, borderRadius: 18, padding: 24, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: text, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: sub, lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(44px, 9vw, 72px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ backgroundColor: C.orange, borderRadius: 24, padding: "clamp(40px, 8vw, 64px) clamp(20px, 4vw, 40px)", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(25px, 6vw, 34px)", fontWeight: 500, color: "#fff", letterSpacing: "-0.03em", marginBottom: 16 }}>Ready to start preparing?</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", marginBottom: 36, maxWidth: 420, margin: "0 auto 36px" }}>
            Join thousands of students already using SmartPrep AI to study smarter and score higher.
          </p>
          <a href="/signup" style={{ display: "inline-block", padding: "13px 32px", backgroundColor: "#fff", color: C.orange, fontWeight: 500, fontSize: 14, borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>
            Create free account
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: "32px clamp(16px, 4vw, 40px)", backgroundColor: bg }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: text }}>
            Smart<span style={{ color: C.orange }}>Prep</span> AI
          </div>
          <div style={{ fontSize: 12, color: sub }}>© {new Date().getFullYear()} SmartPrep AI. Built for students, by students.</div>
        </div>
      </footer>

    </div>
  );
}