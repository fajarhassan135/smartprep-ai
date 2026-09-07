"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuthGuard } from "../../lib/useAuthGuard";
import Navbar from "../../lib/Navbar";
import { SUBJECTS, shortBoard } from "../../lib/curriculum";

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

type QuizSessionRow = {
  score: number;
  total_questions: number;
  completed_at: string;
  subject: string;
  board: string | null;
  mode: string;
};



export default function DashboardPage() {
  const { user, status } = useAuthGuard();
  const [sessions, setSessions] = useState<QuizSessionRow[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const bg = "var(--bg)";
  const bgMid = "var(--bg-mid)";
  const text = "var(--text)";
  const sub = "var(--sub)";
  const border = "var(--border)";

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchStats(userId: string) {
      const { data } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        // Stats and the streak are read from the recent run, not all of history.
        .limit(500);
      if (cancelled) return;
      if (data) setSessions(data as QuizSessionRow[]);
      setLoadingStats(false);
    }

    fetchStats(user.id);
    return () => {
      cancelled = true;
    };
  }, [user]);

  const totalQuizzes = sessions.length;
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((acc, s) => acc + (s.score / s.total_questions) * 100, 0) / sessions.length)
    : 0;
  const bestScore = sessions.length
    ? Math.round(Math.max(...sessions.map((s) => (s.score / s.total_questions) * 100)))
    : 0;

  function calcStreak() {
    if (!sessions.length) return 0;

    const dayMs = 1000 * 60 * 60 * 24;
    const startOfDay = (value: string | Date) => {
      const d = new Date(value);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };

    const days = [...new Set(sessions.map((s) => startOfDay(s.completed_at)))].sort((a, b) => b - a);
    const today = startOfDay(new Date());

    // A streak has to be live. Studying five days straight last month is not a
    // current streak, so unless the most recent day is today or yesterday the
    // count is zero.
    const gapFromToday = (today - days[0]) / dayMs;
    if (gapFromToday > 1) return 0;

    let streak = 1;
    for (let i = 0; i < days.length - 1; i++) {
      if ((days[i] - days[i + 1]) / dayMs === 1) streak++;
      else break;
    }
    return streak;
  }

  const streak = calcStreak();
  const recentSessions = sessions.slice(0, 3);
  const greetings = [
    `Hey ${user?.user_metadata?.full_name?.split(" ")[0] || "there"}!`,
    "Hey diva!",
    "Hey legend!",
    "Hey champ!",
    "Hey superstar!",
    "Hey genius!",
  ];
  
  const punchlines = [
    "Time to lock in.",
    "No cap, let's get this score up.",
    "Lock in, future topper.",
    "Bestie, your streak is calling.",
    "Main character energy starts with a quiz.",
    "Let's get this bag of marks.",
  ];
  
  // Picked once per visit rather than on every render, so the greeting stops
  // changing under the reader whenever something else updates. Safe to
  // randomise in the initialiser: this block only renders after the auth guard
  // resolves on the client, so it is never part of the server output.
  const [greetingIndex] = useState(() => Math.floor(Math.random() * greetings.length));
  const [punchlineIndex] = useState(() => Math.floor(Math.random() * punchlines.length));
  const greeting = greetings[greetingIndex];
  const punchline = punchlines[punchlineIndex];

  // Built from the user's own sessions rather than invented counts. Subjects
  // they have actually worked on come first; the rest stay as prompts to start.
  const subjects = SUBJECTS.map((title) => {
    const mine = sessions.filter((s) => s.subject === title);
    const attempts = mine.length;
    const avg = attempts
      ? Math.round(mine.reduce((acc, s) => acc + (s.score / s.total_questions) * 100, 0) / attempts)
      : null;
    const best = attempts
      ? Math.round(Math.max(...mine.map((s) => (s.score / s.total_questions) * 100)))
      : null;
    // `sessions` is ordered newest first, so the first match is the last board used.
    const lastBoard = mine.find((s) => s.board)?.board ?? null;
    return { title, attempts, avg, best, lastBoard };
  }).sort((a, b) => b.attempts - a.attempts);

  if (status !== "ready" || !user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.snow, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 14, color: C.garnet }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s, color 0.3s" }}>

      <Navbar active="/dashboard" />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px clamp(16px, 4vw, 40px)" }}>

      <div style={{ marginBottom: 48 }}>
  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 8 }}>Welcome back</p>
  <h1 style={{ fontSize: "clamp(26px, 6.5vw, 36px)", fontWeight: 600, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>
    {greeting}
  </h1>
  <p style={{ fontSize: 14, color: sub }}>{punchline}</p>
</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 48 }}>
          {[
            { label: "Quizzes taken", value: loadingStats ? "..." : totalQuizzes.toString() },
            { label: "Avg score", value: loadingStats ? "..." : totalQuizzes ? `${avgScore}%` : "N/A" },
            { label: "Best score", value: loadingStats ? "..." : totalQuizzes ? `${bestScore}%` : "N/A" },
            { label: "Study streak", value: loadingStats ? "..." : `${streak} day${streak !== 1 ? "s" : ""}` },
          ].map((stat) => (
            <div key={stat.label} style={{ backgroundColor: bgMid, borderRadius: 16, padding: "20px 24px", border: `1px solid ${border}` }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: text, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: sub }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: text, letterSpacing: "-0.02em" }}>Your subjects</h2>
              <a href="/quiz" style={{ fontSize: 12, color: C.orange, textDecoration: "none" }}>New quiz →</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {subjects.map((subject) => {
                const board = subject.lastBoard ? shortBoard(subject.lastBoard) : null;
                return (
                  <a key={subject.title} href={`/quiz?subject=${encodeURIComponent(subject.title)}`} className="fill-hover"
                    style={{ background: "var(--card)", border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", backdropFilter: "blur(16px)", textDecoration: "none" }}>
                    <div data-chip style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: subject.attempts ? "var(--accent-badge)" : "var(--bg-mid)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: subject.attempts ? "var(--accent-ink)" : sub, flexShrink: 0 }}>
                      {subject.title[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{subject.title}</div>
                      <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>
                        {subject.attempts
                          ? `${subject.attempts} quiz${subject.attempts === 1 ? "" : "zes"} · ${subject.avg}% average · ${subject.best}% best`
                          : "Not tried yet"}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      {board && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: board === "Cambridge" ? "var(--teal-badge)" : "var(--accent-badge)", color: board === "Cambridge" ? "var(--teal-ink)" : "var(--accent-ink)" }}>
                          {board}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: C.orange }}>
                        {subject.attempts ? "Practise again →" : "Start quiz →"}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: text, letterSpacing: "-0.02em" }}>Recent activity</h2>
              <a href="/history" style={{ fontSize: 12, color: C.orange, textDecoration: "none" }}>View all →</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {loadingStats ? (
                <div style={{ fontSize: 14, color: sub, padding: "20px" }}>Loading...</div>
              ) : recentSessions.length === 0 ? (
                <div style={{ background: "var(--card)", border: `1px solid ${border}`, borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: text, marginBottom: 6 }}>No quizzes yet</div>
                  <div style={{ fontSize: 12, color: sub, marginBottom: 16 }}>Take your first quiz to see activity here!</div>
                  <a href="/quiz" style={{ fontSize: 13, fontWeight: 600, color: C.orange, textDecoration: "none" }}>Start a quiz →</a>
                </div>
              ) : (
                recentSessions.map((session, i) => {
                  const pct = Math.round((session.score / session.total_questions) * 100);
                  const date = new Date(session.completed_at).toLocaleDateString("en-US", { day: "numeric", month: "short" });
                  return (
                    <div key={i} style={{ background: "var(--card)", border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", backdropFilter: "blur(16px)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{session.subject}</div>
                          <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{session.mode === "exam" ? "Exam" : "Practice"} · {date}</div>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: pct >= 80 ? "#639922" : pct >= 60 ? C.orange : "#E24B4A" }}>
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

        <div style={{ marginTop: 32, backgroundColor: C.orange, borderRadius: 20, padding: "32px clamp(20px, 4vw, 40px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 6, letterSpacing: "-0.02em" }}>Ready for a quiz?</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Pick a subject, board and difficulty — questions are generated instantly.</p>
          </div>
          <a href="/quiz" style={{ padding: "12px 28px", backgroundColor: "#fff", color: C.orange, fontWeight: 600, fontSize: 14, borderRadius: 12, textDecoration: "none", flexShrink: 0 }}>
            Start quiz →
          </a>
        </div>

      </div>
    </div>
  );
}