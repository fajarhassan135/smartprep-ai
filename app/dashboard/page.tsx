"use client";
import { useState, useEffect } from "react";
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
  aqua: "#A0C9CB",
};

export default function DashboardPage() {
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const bg = dark ? C.kite : C.snow;
  const bgMid = dark ? C.kiteDeep : C.snowMist;
  const text = dark ? C.snow : C.kite;
  const sub = dark ? C.garnetLight : C.garnet;
  const border = dark ? "rgba(245,244,237,0.08)" : "rgba(53,30,28,0.08)";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
      } else {
        setUser(data.user);
        fetchStats(data.user.id);
      }
    });
  }, []);

  async function fetchStats(userId: string) {
    const { data } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });
    if (data) setSessions(data);
    setLoadingStats(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function toggleDark() {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    setDark((d) => !d);
  }

  // REAL STATS
  const totalQuizzes = sessions.length;
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((acc, s) => acc + (s.score / s.total_questions) * 100, 0) / sessions.length)
    : 0;
  const bestScore = sessions.length
    ? Math.round(Math.max(...sessions.map((s) => (s.score / s.total_questions) * 100)))
    : 0;

  // STREAK — count consecutive days
  function calcStreak() {
    if (!sessions.length) return 0;
    const dates = [...new Set(sessions.map((s) => new Date(s.completed_at).toDateString()))];
    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const d1 = new Date(dates[i]);
      const d2 = new Date(dates[i + 1]);
      const diff = (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  }

  const streak = calcStreak();
  const recentSessions = sessions.slice(0, 3);

  const subjects = [
    { icon: "📐", title: "Mathematics", board: "Cambridge", questions: 480, color: "rgba(255,96,55,0.1)" },
    { icon: "📖", title: "English", board: "Pak Board", questions: 320, color: "rgba(160,201,203,0.2)" },
    { icon: "💻", title: "Computer Science", board: "Cambridge", questions: 290, color: "rgba(115,54,53,0.1)" },
  ];

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.snow, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 14, color: C.garnet }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s, color 0.3s" }}>

      {/* NAVBAR */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid ${border}`, backgroundColor: bg, position: "sticky", top: 0, zIndex: 50 }}>
        <a href="/" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>
          Exam<span style={{ color: C.orange }}>Prep</span> AI
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="/dashboard" style={{ fontSize: 13, color: C.orange, textDecoration: "none", fontWeight: 500 }}>Dashboard</a>
          <a href="/quiz" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Quiz</a>
          <a href="/past-papers" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Past Papers</a>
          <a href="/flashcards" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Flashcards</a>
          <a href="/leaderboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Leaderboard</a>
          <a href="/history" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>History</a>
          <a href="/profile" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Profile</a>
          <button onClick={toggleDark} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ width: 44, height: 24, borderRadius: 999, backgroundColor: dark ? C.snow : C.kite, position: "relative", transition: "background 0.3s" }}>
              <div style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: dark ? C.kite : C.snow, position: "absolute", top: 3, left: dark ? 23 : 3, transition: "left 0.3s" }} />
            </div>
          </button>
          <button onClick={handleLogout} style={{ fontSize: 13, fontWeight: 500, padding: "9px 20px", borderRadius: 999, backgroundColor: "transparent", color: C.orange, border: `1px solid ${C.orange}`, cursor: "pointer", fontFamily: "inherit" }}>
            Log out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 40px" }}>

        {/* WELCOME */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 8 }}>Welcome back</p>
          <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>
            {user?.user_metadata?.full_name || user?.email?.split("@")[0]} 👋
          </h1>
          <p style={{ fontSize: 14, color: sub }}>Ready to study? Pick up where you left off.</p>
        </div>

        {/* REAL STATS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 48 }}>
          {[
            { label: "Quizzes taken", value: loadingStats ? "..." : totalQuizzes.toString(), icon: "📝" },
            { label: "Avg score", value: loadingStats ? "..." : totalQuizzes ? `${avgScore}%` : "N/A", icon: "📊" },
            { label: "Best score", value: loadingStats ? "..." : totalQuizzes ? `${bestScore}%` : "N/A", icon: "🏆" },
            { label: "Study streak", value: loadingStats ? "..." : `${streak} day${streak !== 1 ? "s" : ""}`, icon: "🔥" },
          ].map((stat) => (
            <div key={stat.label} style={{ backgroundColor: bgMid, borderRadius: 16, padding: "20px 24px", border: `1px solid ${border}` }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{stat.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 500, color: text, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: sub }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* SUBJECTS */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 500, color: text, letterSpacing: "-0.02em" }}>Your subjects</h2>
              <a href="/past-papers" style={{ fontSize: 12, color: C.orange, textDecoration: "none" }}>View all →</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {subjects.map((subject) => (
                <div key={subject.title} style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)", border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", backdropFilter: "blur(16px)" }}
                  onClick={() => window.location.href = "/quiz"}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: subject.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                    {subject.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: text }}>{subject.title}</div>
                    <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{subject.questions} questions available</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999, background: subject.board === "Cambridge" ? "rgba(160,201,203,0.25)" : "rgba(255,96,55,0.1)", color: subject.board === "Cambridge" ? "#2a6b6d" : C.orangeDark }}>
                      {subject.board}
                    </span>
                    <span style={{ fontSize: 11, color: C.orange }}>Start quiz →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REAL RECENT ACTIVITY */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 500, color: text, letterSpacing: "-0.02em" }}>Recent activity</h2>
              <a href="/history" style={{ fontSize: 12, color: C.orange, textDecoration: "none" }}>View all →</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {loadingStats ? (
                <div style={{ fontSize: 14, color: sub, padding: "20px" }}>Loading...</div>
              ) : recentSessions.length === 0 ? (
                <div style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)", border: `1px solid ${border}`, borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: text, marginBottom: 6 }}>No quizzes yet</div>
                  <div style={{ fontSize: 12, color: sub, marginBottom: 16 }}>Take your first quiz to see activity here!</div>
                  <a href="/quiz" style={{ fontSize: 13, fontWeight: 500, color: C.orange, textDecoration: "none" }}>Start a quiz →</a>
                </div>
              ) : (
                recentSessions.map((session, i) => {
                  const pct = Math.round((session.score / session.total_questions) * 100);
                  const date = new Date(session.completed_at).toLocaleDateString("en-US", { day: "numeric", month: "short" });
                  return (
                    <div key={i} style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)", border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", backdropFilter: "blur(16px)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: text }}>{session.subject}</div>
                          <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{session.mode === "exam" ? "⏱ Exam" : "🧠 Practice"} · {date}</div>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 500, color: pct >= 80 ? "#639922" : pct >= 60 ? C.orange : "#E24B4A" }}>
                          {pct}%
                        </div>
                      </div>
                      <div style={{ height: 4, backgroundColor: border, borderRadius: 20 }}>
                        <div style={{ height: 4, width: `${pct}%`, backgroundColor: pct >= 80 ? "#639922" : pct >= 60 ? C.orange : "#E24B4A", borderRadius: 20, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* START QUIZ BANNER */}
        <div style={{ marginTop: 32, backgroundColor: C.orange, borderRadius: 20, padding: "32px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 500, color: "#fff", marginBottom: 6, letterSpacing: "-0.02em" }}>Ready for a quiz?</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>AI will generate questions from your past papers instantly.</p>
          </div>
          <a href="/quiz" style={{ padding: "12px 28px", backgroundColor: "#fff", color: C.orange, fontWeight: 500, fontSize: 14, borderRadius: 12, textDecoration: "none", flexShrink: 0 }}>
            Start quiz →
          </a>
        </div>

      </div>
    </div>
  );
}