"use client";
import { useState } from "react";

const C = {
  snow: "#F5F4ED", snowMist: "#ECECDC", kite: "#351E1C", kiteDeep: "#2a1715",
  garnet: "#733635", garnetLight: "#a07070", orange: "#FF6037", orangeDark: "#c44a26", aqua: "#A0C9CB",
};

const papers = [
  { subject: "Mathematics", board: "Cambridge", year: 2023, paper: "Paper 1", level: "IGCSE", topics: ["Algebra", "Geometry", "Statistics"] },
  { subject: "Mathematics", board: "Cambridge", year: 2022, paper: "Paper 2", level: "IGCSE", topics: ["Calculus", "Trigonometry"] },
  { subject: "Mathematics", board: "Pakistan Board", year: 2023, paper: "Annual", level: "Matric", topics: ["Algebra", "Geometry"] },
  { subject: "English", board: "Cambridge", year: 2023, paper: "Paper 1", level: "IGCSE", topics: ["Reading", "Writing"] },
  { subject: "English", board: "Cambridge", year: 2022, paper: "Paper 2", level: "IGCSE", topics: ["Literature", "Comprehension"] },
  { subject: "English", board: "Pakistan Board", year: 2023, paper: "Annual", level: "Matric", topics: ["Grammar", "Composition"] },
  { subject: "Computer Science", board: "Cambridge", year: 2023, paper: "Paper 1", level: "IGCSE", topics: ["Programming", "Data Structures"] },
  { subject: "Computer Science", board: "Cambridge", year: 2022, paper: "Paper 2", level: "IGCSE", topics: ["Networks", "Databases"] },
  { subject: "Computer Science", board: "Pakistan Board", year: 2023, paper: "Annual", level: "FSc", topics: ["OOP", "Web Development"] },
];

export default function PastPapersPage() {
  const [dark, setDark] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedBoard, setSelectedBoard] = useState("All");

  const bg = dark ? C.kite : C.snow;
  const bgMid = dark ? C.kiteDeep : C.snowMist;
  const text = dark ? C.snow : C.kite;
  const sub = dark ? C.garnetLight : C.garnet;
  const border = dark ? "rgba(245,244,237,0.08)" : "rgba(53,30,28,0.08)";

  const filtered = papers.filter((p) => {
    if (selectedSubject !== "All" && p.subject !== selectedSubject) return false;
    if (selectedBoard !== "All" && p.board !== selectedBoard) return false;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 50, backgroundColor: bg }}>
        <a href="/" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>Exam<span style={{ color: C.orange }}>Prep</span> AI</a>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/dashboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Dashboard</a>
          <a href="/quiz" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Quiz</a>
          <a href="/past-papers" style={{ fontSize: 13, color: C.orange, textDecoration: "none", fontWeight: 500 }}>Past Papers</a>
          <a href="/flashcards" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Flashcards</a>
          <a href="/leaderboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Leaderboard</a>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Past Papers</p>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Browse past papers</h1>
        <p style={{ fontSize: 14, color: sub, marginBottom: 40 }}>Filter by subject and board to find the papers you need.</p>

        {/* FILTERS */}
        <div style={{ display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: sub, display: "block", marginBottom: 6 }}>Subject</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["All", "Mathematics", "English", "Computer Science"].map((s) => (
                <button key={s} onClick={() => setSelectedSubject(s)} style={{ padding: "8px 16px", borderRadius: 999, border: selectedSubject === s ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: selectedSubject === s ? "rgba(255,96,55,0.08)" : bg, color: selectedSubject === s ? C.orange : text, fontSize: 12, fontWeight: selectedSubject === s ? 500 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: sub, display: "block", marginBottom: 6 }}>Board</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["All", "Cambridge", "Pakistan Board"].map((b) => (
                <button key={b} onClick={() => setSelectedBoard(b)} style={{ padding: "8px 16px", borderRadius: 999, border: selectedBoard === b ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: selectedBoard === b ? "rgba(255,96,55,0.08)" : bg, color: selectedBoard === b ? C.orange : text, fontSize: 12, fontWeight: selectedBoard === b ? 500 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PAPERS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {filtered.map((paper, i) => (
            <div key={i} style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid ${border}`, borderRadius: 16, padding: "24px", backdropFilter: "blur(16px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999, background: paper.board === "Cambridge" ? "rgba(160,201,203,0.25)" : "rgba(255,96,55,0.1)", color: paper.board === "Cambridge" ? "#2a6b6d" : C.orangeDark }}>
                  {paper.board}
                </span>
                <span style={{ fontSize: 12, color: sub }}>{paper.year}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 4 }}>{paper.subject}</div>
              <div style={{ fontSize: 13, color: sub, marginBottom: 16 }}>{paper.paper} · {paper.level}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {paper.topics.map((t) => (
                  <span key={t} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, backgroundColor: bgMid, color: sub }}>{t}</span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => window.location.href = `/quiz?subject=${paper.subject}&board=${paper.board}`} style={{ flex: 1, padding: "10px", borderRadius: 10, backgroundColor: C.orange, color: "#fff", fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Generate quiz
                </button>
                <button style={{ padding: "10px 14px", borderRadius: 10, backgroundColor: bgMid, color: text, fontSize: 12, border: `1px solid ${border}`, cursor: "pointer", fontFamily: "inherit" }}>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}