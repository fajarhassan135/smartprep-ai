"use client";
import { useState } from "react";

const C = {
  snow: "#F5F4ED", snowMist: "#ECECDC", kite: "#351E1C", kiteDeep: "#2a1715",
  garnet: "#733635", garnetLight: "#a07070", orange: "#FF6037", orangeDark: "#c44a26",
};

const leaderboardData = [
  { rank: 1, name: "Ahmed Khan", school: "Lahore Grammar School", score: 96, quizzes: 42, streak: 14, badge: "🥇" },
  { rank: 2, name: "Sara Ali", school: "Beaconhouse", score: 93, quizzes: 38, streak: 10, badge: "🥈" },
  { rank: 3, name: "Fajar Warriach", school: "City School", score: 91, quizzes: 35, streak: 7, badge: "🥉" },
  { rank: 4, name: "Zara Malik", school: "Lahore Grammar School", score: 88, quizzes: 30, streak: 5, badge: "" },
  { rank: 5, name: "Omar Sheikh", school: "Aitchison College", score: 85, quizzes: 28, streak: 4, badge: "" },
  { rank: 6, name: "Ayesha Raza", school: "Beaconhouse", score: 82, quizzes: 25, streak: 3, badge: "" },
  { rank: 7, name: "Hassan Mirza", school: "City School", score: 79, quizzes: 22, streak: 2, badge: "" },
  { rank: 8, name: "Nadia Qureshi", school: "Lahore Grammar School", score: 76, quizzes: 20, streak: 1, badge: "" },
];

export default function LeaderboardPage() {
  const [dark, setDark] = useState(false);
  const [filter, setFilter] = useState<"all" | "week" | "month">("all");

  const bg = dark ? C.kite : C.snow;
  const bgMid = dark ? C.kiteDeep : C.snowMist;
  const text = dark ? C.snow : C.kite;
  const sub = dark ? C.garnetLight : C.garnet;
  const border = dark ? "rgba(245,244,237,0.08)" : "rgba(53,30,28,0.08)";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 50, backgroundColor: bg }}>
        <a href="/" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>Exam<span style={{ color: C.orange }}>Prep</span> AI</a>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/dashboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Dashboard</a>
          <a href="/quiz" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Quiz</a>
          <a href="/past-papers" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Past Papers</a>
          <a href="/flashcards" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Flashcards</a>
          <a href="/leaderboard" style={{ fontSize: 13, color: C.orange, textDecoration: "none", fontWeight: 500 }}>Leaderboard</a>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Leaderboard</p>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Class rankings</h1>
        <p style={{ fontSize: 14, color: sub, marginBottom: 40 }}>See how you stack up against your classmates.</p>

        {/* TOP 3 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 40 }}>
          {leaderboardData.slice(0, 3).map((user) => (
            <div key={user.rank} style={{ background: user.rank === 1 ? `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})` : dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid ${user.rank === 1 ? C.orange : border}`, borderRadius: 20, padding: "28px 20px", textAlign: "center", backdropFilter: "blur(16px)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{user.badge}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: user.rank === 1 ? "#fff" : text, marginBottom: 4 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: user.rank === 1 ? "rgba(255,255,255,0.75)" : sub, marginBottom: 16 }}>{user.school}</div>
              <div style={{ fontSize: 28, fontWeight: 500, color: user.rank === 1 ? "#fff" : C.orange }}>{user.score}%</div>
              <div style={{ fontSize: 11, color: user.rank === 1 ? "rgba(255,255,255,0.75)" : sub, marginTop: 4 }}>{user.quizzes} quizzes</div>
            </div>
          ))}
        </div>

        {/* FILTER */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[
            { val: "all", label: "All time" },
            { val: "month", label: "This month" },
            { val: "week", label: "This week" },
          ].map((f) => (
            <button key={f.val} onClick={() => setFilter(f.val as any)} style={{ padding: "8px 16px", borderRadius: 999, border: filter === f.val ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: filter === f.val ? "rgba(255,96,55,0.08)" : bg, color: filter === f.val ? C.orange : text, fontSize: 12, fontWeight: filter === f.val ? 500 : 400, cursor: "pointer", fontFamily: "inherit" }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* FULL LIST */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {leaderboardData.map((user) => (
            <div key={user.rank} style={{ background: user.name === "Fajar Warriach" ? "rgba(255,96,55,0.08)" : dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: user.name === "Fajar Warriach" ? `1px solid ${C.orange}` : `1px solid ${border}`, borderRadius: 14, padding: "16px 24px", display: "flex", alignItems: "center", gap: 20, backdropFilter: "blur(16px)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: user.rank <= 3 ? C.orange : bgMid, color: user.rank <= 3 ? "#fff" : sub, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                {user.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: text }}>{user.name} {user.name === "Fajar Warriach" && <span style={{ fontSize: 11, color: C.orange }}>(you)</span>}</div>
                <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{user.school}</div>
              </div>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: text }}>{user.quizzes}</div>
                  <div style={{ fontSize: 10, color: sub }}>quizzes</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: text }}>{user.streak}d</div>
                  <div style={{ fontSize: 10, color: sub }}>streak</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 500, color: C.orange, minWidth: 48, textAlign: "right" }}>
                  {user.score}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}