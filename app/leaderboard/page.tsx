"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../lib/ThemeContext";
import Navbar from "../../lib/Navbar";

const C = {
  snow: "#F5F4ED", snowMist: "#ECECDC", kite: "#351E1C", kiteDeep: "#2a1715",
  garnet: "#733635", garnetLight: "#a07070", orange: "#FF6037", orangeDark: "#c44a26",
};

type LeaderboardRow = {
  user_id: string;
  display_name: string | null;
  school: string | null;
  total_quizzes: number;
  avg_score: number;
  best_score: number;
};

export default function LeaderboardPage() {
  const { dark } = useTheme();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const bg = dark ? C.kite : C.snow;
  const bgMid = dark ? C.kiteDeep : C.snowMist;
  const text = dark ? C.snow : C.kite;
  const sub = dark ? C.garnetLight : C.garnet;
  const border = dark ? "rgba(245,244,237,0.08)" : "rgba(53,30,28,0.08)";

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("leaderboard_view")
        .select("*")
        .order("avg_score", { ascending: false })
        .limit(50);

      if (!error && data) setRows(data as LeaderboardRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>
      <Navbar active="/leaderboard" />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Leaderboard</p>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Class rankings</h1>
        <p style={{ fontSize: 14, color: sub, marginBottom: 40 }}>See how you stack up against other students preparing with ExamPrep AI.</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: sub, fontSize: 14 }}>Loading leaderboard...</div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", borderRadius: 20, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 8 }}>No rankings yet</div>
            <div style={{ fontSize: 13, color: sub, marginBottom: 24 }}>Be the first to take a quiz and claim the top spot!</div>
            <a href="/quiz" style={{ padding: "12px 28px", backgroundColor: C.orange, color: "#fff", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Start a quiz →
            </a>
          </div>
        ) : (
          <>
            {/* TOP 3 */}
            {top3.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${top3.length}, 1fr)`, gap: 16, marginBottom: 40 }}>
                {top3.map((row, i) => {
                  const rank = i + 1;
                  return (
                    <div key={row.user_id} style={{ background: rank === 1 ? `linear-gradient(135deg, ${C.orange}, ${C.orangeDark})` : dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid ${rank === 1 ? C.orange : border}`, borderRadius: 20, padding: "28px 20px", textAlign: "center", backdropFilter: "blur(16px)" }}>
                      <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: rank === 1 ? "rgba(255,255,255,0.85)" : sub, marginBottom: 12 }}>Rank {rank}</div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: rank === 1 ? "#fff" : text, marginBottom: 4 }}>
                        {row.display_name || "Anonymous"} {row.user_id === currentUserId && <span style={{ fontSize: 11 }}>(you)</span>}
                      </div>
                      <div style={{ fontSize: 12, color: rank === 1 ? "rgba(255,255,255,0.75)" : sub, marginBottom: 16 }}>{row.school || "—"}</div>
                      <div style={{ fontSize: 28, fontWeight: 500, color: rank === 1 ? "#fff" : C.orange }}>{row.avg_score}%</div>
                      <div style={{ fontSize: 11, color: rank === 1 ? "rgba(255,255,255,0.75)" : sub, marginTop: 4 }}>{row.total_quizzes} quizzes</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FULL LIST */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {rest.map((row, i) => {
                const rank = i + 4;
                const isYou = row.user_id === currentUserId;
                return (
                  <div key={row.user_id} style={{ background: isYou ? "rgba(255,96,55,0.08)" : dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: isYou ? `1px solid ${C.orange}` : `1px solid ${border}`, borderRadius: 14, padding: "16px 24px", display: "flex", alignItems: "center", gap: 20, backdropFilter: "blur(16px)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: bgMid, color: sub, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                      {rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: text }}>
                        {row.display_name || "Anonymous"} {isYou && <span style={{ fontSize: 11, color: C.orange }}>(you)</span>}
                      </div>
                      <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{row.school || "—"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: text }}>{row.total_quizzes}</div>
                        <div style={{ fontSize: 10, color: sub }}>quizzes</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: text }}>{row.best_score}%</div>
                        <div style={{ fontSize: 10, color: sub }}>best</div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 500, color: C.orange, minWidth: 48, textAlign: "right" }}>
                        {row.avg_score}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}