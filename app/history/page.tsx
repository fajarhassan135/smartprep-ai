"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

const C = {
  snow: "#F5F4ED", snowMist: "#ECECDC", kite: "#351E1C", kiteDeep: "#2a1715",
  garnet: "#733635", garnetLight: "#a07070", orange: "#FF6037", orangeDark: "#c44a26",
};

type QuizSessionRow = {
  score: number;
  total_questions: number;
  completed_at: string;
  subject: string;
  mode: string;
};

export default function HistoryPage() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<QuizSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const bg = dark ? C.kite : C.snow;
  const bgMid = dark ? C.kiteDeep : C.snowMist;
  const text = dark ? C.snow : C.kite;
  const sub = dark ? C.garnetLight : C.garnet;
  const border = dark ? "rgba(245,244,237,0.08)" : "rgba(53,30,28,0.08)";

  async function fetchHistory(userId: string) {
    const { data } = await supabase
      .from("quiz_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    if (data) setSessions(data as QuizSessionRow[]);
    setLoading(false);
  }

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
        fetchHistory(data.user.id);
      }
    });
  }, []);

  const filtered = filter === "All" ? sessions : sessions.filter((s) => s.subject === filter);

  const avgScore = sessions.length
    ? Math.round(sessions.reduce((acc, s) => acc + (s.score / s.total_questions) * 100, 0) / sessions.length)
    : 0;

  const bestScore = sessions.length
    ? Math.round(Math.max(...sessions.map((s) => (s.score / s.total_questions) * 100)))
    : 0;

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
          <a href="/profile" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Profile</a>
          <a href="/history" style={{ fontSize: 13, color: C.orange, textDecoration: "none", fontWeight: 500 }}>History</a>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Quiz History</p>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Your past quizzes</h1>
        <p style={{ fontSize: 14, color: sub, marginBottom: 40 }}>Track your progress and see how you&apos;ve improved over time.</p>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 40 }}>
          {[
            { label: "Total quizzes", value: sessions.length, icon: "📝" },
            { label: "Average score", value: `${avgScore}%`, icon: "📊" },
            { label: "Best score", value: `${bestScore}%`, icon: "🏆" },
          ].map((stat) => (
            <div key={stat.label} style={{ backgroundColor: bgMid, borderRadius: 16, padding: "20px 24px", border: `1px solid ${border}` }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 500, color: text, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: sub }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* FILTER */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["All", "Mathematics", "English", "Computer Science"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 16px", borderRadius: 999, border: filter === f ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: filter === f ? "rgba(255,96,55,0.08)" : bg, color: filter === f ? C.orange : text, fontSize: 12, fontWeight: filter === f ? 500 : 400, cursor: "pointer", fontFamily: "inherit" }}>
              {f}
            </button>
          ))}
        </div>

        {/* HISTORY LIST */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: sub, fontSize: 14 }}>Loading your quiz history...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", borderRadius: 20, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 8 }}>No quizzes yet</div>
            <div style={{ fontSize: 13, color: sub, marginBottom: 24 }}>Take your first quiz to see your history here!</div>
            <a href="/quiz" style={{ padding: "12px 28px", backgroundColor: C.orange, color: "#fff", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Start a quiz →
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((session, i) => {
              const pct = Math.round((session.score / session.total_questions) * 100);
              const date = new Date(session.completed_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
              const time = new Date(session.completed_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={i} style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid ${border}`, borderRadius: 16, padding: "20px 24px", backdropFilter: "blur(16px)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: text, marginBottom: 4 }}>{session.subject}</div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, backgroundColor: bgMid, color: sub }}>{session.mode === "exam" ? "⏱ Exam mode" : "🧠 Practice mode"}</span>
                        <span style={{ fontSize: 11, color: sub }}>{session.total_questions} questions</span>
                        <span style={{ fontSize: 11, color: sub }}>{date} · {time}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 24, fontWeight: 500, color: pct >= 80 ? "#639922" : pct >= 60 ? C.orange : "#E24B4A" }}>{pct}%</div>
                      <div style={{ fontSize: 11, color: sub }}>{session.score}/{session.total_questions} correct</div>
                    </div>
                  </div>
                  <div style={{ height: 4, backgroundColor: border, borderRadius: 20 }}>
                    <div style={{ height: 4, width: `${pct}%`, backgroundColor: pct >= 80 ? "#639922" : pct >= 60 ? C.orange : "#E24B4A", borderRadius: 20, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}