"use client";
import { useTheme } from "../lib/ThemeContext";

export default function HomePage() {
  const { dark, toggleDark } = useTheme();

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

  const bg = dark ? C.kite : C.snow;
  const bgMid = dark ? C.kiteDeep : C.snowMist;
  const text = dark ? C.snow : C.kite;
  const sub = dark ? C.garnetLight : C.garnet;
  const border = dark ? "rgba(245,244,237,0.08)" : "rgba(53,30,28,0.08)";

  const subjects = [
    { title: "Mathematics", sub: "Algebra · Calculus · Statistics", board: "Cambridge" },
    { title: "English", sub: "Comprehension · Writing · Grammar", board: "Pak Board" },
    { title: "Computer Science", sub: "Programming · Data · Networks", board: "Cambridge" },
    { title: "Physics", sub: "Mechanics · Electromagnetism · Waves", board: "Cambridge" },
    { title: "Business Studies", sub: "Marketing · Finance · Management", board: "Pak Board" },
    { title: "Economics", sub: "Micro · Macro · National Income", board: "Cambridge" },
  ];

  const features = [
    { title: "AI Quiz Generation", desc: "Questions generated from real past papers, tailored to your board and level." },
    { title: "Timed Exam Mode", desc: "Simulate real exam conditions with a countdown timer and strict mode." },
    { title: "Progress Analytics", desc: "Track your scores, weak topics, and improvement over time." },
    { title: "Flashcards", desc: "Create and study flashcards for quick revision before your exam." },
    { title: "Class Leaderboard", desc: "Compete with classmates and stay motivated with school-based rankings." },
    { title: "Past Papers", desc: "Access organized past papers by year, subject, board and chapter." },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, color: text, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s, color 0.3s" }}>

      {/* NAVBAR */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid ${border}`, backgroundColor: bg, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.03em", color: text }}>
          Exam<span style={{ color: C.orange }}>Prep</span> AI
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="#subjects" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Subjects</a>
          <a href="#features" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Features</a>
          <button
            onClick={toggleDark}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <div style={{ width: 44, height: 24, borderRadius: 999, backgroundColor: dark ? C.snow : C.kite, position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: dark ? C.kite : C.snow, position: "absolute", top: 3, left: dark ? 23 : 3, transition: "left 0.3s" }} />
            </div>
          </button>
          <a href="/login" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Log in</a>
          <a href="/signup" style={{ fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 999, backgroundColor: C.orange, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>
            Sign up
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 40px 64px", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 16 }}>
          Cambridge & Pakistan Board
        </p>
        <h1 style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 24, color: text }}>
          Study smarter.<br />
          <span style={{ color: C.orange }}>Score higher.</span>
        </h1>
        <p style={{ fontSize: 16, color: sub, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px" }}>
          AI-powered quizzes from real past papers. Built for IGCSE, A-Level, Matric & FSc students who want results, not just practice.
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
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", textAlign: "center", gap: 16 }}>
          {[
            { num: "2,400+", label: "Past paper questions" },
            { num: "6", label: "Subjects covered" },
            { num: "92%", label: "Student pass rate" },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: 30, fontWeight: 500, color: text }}>{stat.num}</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 6 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SUBJECTS */}
      <section id="subjects" style={{ maxWidth: 900, margin: "0 auto", padding: "72px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Subjects</p>
        <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 40 }}>Pick your subject & start</h2>
        <div style={{ background: dark ? `linear-gradient(135deg, ${C.kite} 0%, ${C.kiteDeep} 60%, #1e3030 100%)` : `linear-gradient(135deg, ${C.snow} 0%, ${C.snowMist} 60%, rgba(160,201,203,0.27) 100%)`, borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {subjects.map((subject) => (
            <div key={subject.title} style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)", border: dark ? "0.5px solid rgba(255,255,255,0.1)" : "0.5px solid rgba(255,255,255,0.9)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", backdropFilter: "blur(16px)" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,96,55,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: C.orangeDark, flexShrink: 0 }}>
                {subject.title[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: text }}>{subject.title}</div>
                <div style={{ fontSize: 12, color: sub, marginTop: 3 }}>{subject.sub}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, padding: "4px 12px", borderRadius: 999, background: subject.board === "Cambridge" ? "rgba(160,201,203,0.25)" : "rgba(255,96,55,0.1)", color: subject.board === "Cambridge" ? C.aquaDark : C.orangeDark, flexShrink: 0 }}>
                {subject.board}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ backgroundColor: bgMid, padding: "72px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Features</p>
          <h2 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 40 }}>Everything you need to ace your exams</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
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
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "72px 40px" }}>
        <div style={{ backgroundColor: C.orange, borderRadius: 24, padding: "64px 40px", textAlign: "center" }}>
          <h2 style={{ fontSize: 34, fontWeight: 500, color: "#fff", letterSpacing: "-0.03em", marginBottom: 16 }}>Ready to start preparing?</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", marginBottom: 36, maxWidth: 420, margin: "0 auto 36px" }}>
            Join thousands of students already using ExamPrep AI to study smarter and score higher.
          </p>
          <a href="/signup" style={{ display: "inline-block", padding: "13px 32px", backgroundColor: "#fff", color: C.orange, fontWeight: 500, fontSize: 14, borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }}>
            Create free account
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: "32px 40px", backgroundColor: bg }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: text }}>
            Exam<span style={{ color: C.orange }}>Prep</span> AI
          </div>
          <div style={{ fontSize: 12, color: sub }}>© 2025 ExamPrep AI. Built for students, by students.</div>
        </div>
      </footer>

    </div>
  );
}