"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const C = {
  snow: "#F5F4ED", snowMist: "#ECECDC", kite: "#351E1C", kiteDeep: "#2a1715",
  garnet: "#733635", garnetLight: "#a07070", orange: "#FF6037", orangeDark: "#c44a26",
};

const defaultCards = [
  { front: "What is the quadratic formula?", back: "x = (-b ± √(b²-4ac)) / 2a — used to find roots of ax² + bx + c = 0", subject: "Mathematics" },
  { front: "What is photosynthesis?", back: "The process by which green plants convert sunlight, water and CO₂ into glucose and oxygen", subject: "Biology" },
  { front: "What does CPU stand for?", back: "Central Processing Unit — the primary component that executes instructions in a computer", subject: "Computer Science" },
  { front: "What is Newton's Second Law?", back: "Force = Mass × Acceleration (F = ma) — the acceleration of an object depends on its mass and the force applied", subject: "Physics" },
  { front: "What is an algorithm?", back: "A step-by-step set of instructions designed to solve a problem or complete a task", subject: "Computer Science" },
  { front: "What is the Pythagorean theorem?", back: "a² + b² = c² — in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides", subject: "Mathematics" },
];

export default function FlashcardsPage() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });
  const [cards, setCards] = useState(defaultCards);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"browse" | "study" | "create">("browse");
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiSubject, setAiSubject] = useState("");

  const bg = dark ? C.kite : C.snow;
  const bgMid = dark ? C.kiteDeep : C.snowMist;
  const text = dark ? C.snow : C.kite;
  const sub = dark ? C.garnetLight : C.garnet;
  const border = dark ? "rgba(245,244,237,0.08)" : "rgba(53,30,28,0.08)";

  useEffect(() => {
    queueMicrotask(() => {
      const saved = localStorage.getItem("darkMode") === "true";
      setDark(saved);
    });
  }, []);

  function addCard() {
    if (!newFront || !newBack) return;
    setCards([...cards, { front: newFront, back: newBack, subject: newSubject || "General" }]);
    setNewFront(""); setNewBack(""); setNewSubject("");
  }

  async function generateAICards() {
    if (!aiSubject) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: aiSubject }),
      });
      const data = await res.json();
      setCards([...cards, ...data.cards]);
    } catch {
      alert("Failed to generate flashcards");
    }
    setGenerating(false);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 50, backgroundColor: bg }}>
        <Link href="/" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>Exam<span style={{ color: C.orange }}>Prep</span> AI</Link>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/dashboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Dashboard</a>
          <a href="/quiz" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Quiz</a>
          <a href="/past-papers" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Past Papers</a>
          <a href="/flashcards" style={{ fontSize: 13, color: C.orange, textDecoration: "none", fontWeight: 500 }}>Flashcards</a>
          <a href="/leaderboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Leaderboard</a>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Flashcards</p>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Study with flashcards</h1>
        <p style={{ fontSize: 14, color: sub, marginBottom: 40 }}>Flip cards to test your memory. Create your own or generate with AI.</p>

        {/* MODE TABS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40 }}>
          {[
            { val: "browse", label: "📚 Browse" },
            { val: "study", label: "🧠 Study mode" },
            { val: "create", label: "✏️ Create" },
          ].map((m) => (
            <button key={m.val} onClick={() => setMode(m.val as "browse" | "study" | "create")} style={{ padding: "10px 20px", borderRadius: 10, border: mode === m.val ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: mode === m.val ? "rgba(255,96,55,0.08)" : bg, color: mode === m.val ? C.orange : text, fontSize: 13, fontWeight: mode === m.val ? 500 : 400, cursor: "pointer", fontFamily: "inherit" }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* BROWSE MODE */}
        {mode === "browse" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {cards.map((card, i) => (
              <div key={i} style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid ${border}`, borderRadius: 16, padding: "24px", backdropFilter: "blur(16px)" }}>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999, backgroundColor: bgMid, color: sub, display: "inline-block", marginBottom: 16 }}>{card.subject}</span>
                <div style={{ fontSize: 14, fontWeight: 500, color: text, marginBottom: 12 }}>{card.front}</div>
                <div style={{ fontSize: 13, color: sub, lineHeight: 1.6, paddingTop: 12, borderTop: `1px solid ${border}` }}>{card.back}</div>
              </div>
            ))}
          </div>
        )}

        {/* STUDY MODE */}
        {mode === "study" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: sub, marginBottom: 24 }}>{current + 1} / {cards.length}</div>
            <div onClick={() => setFlipped(!flipped)} style={{ cursor: "pointer", perspective: "1000px", marginBottom: 32 }}>
              <div style={{ width: "100%", minHeight: 280, borderRadius: 24, padding: "48px 40px", display: "flex", alignItems: "center", justifyContent: "center", background: flipped ? C.orange : dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.9)", border: `1px solid ${flipped ? C.orange : border}`, backdropFilter: "blur(16px)", transition: "all 0.3s", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: flipped ? "rgba(255,255,255,0.7)" : sub, marginBottom: 16 }}>
                    {flipped ? "Answer" : "Question — click to reveal"}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 500, color: flipped ? "#fff" : text, lineHeight: 1.5 }}>
                    {flipped ? cards[current].back : cards[current].front}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => { setCurrent((c) => Math.max(0, c - 1)); setFlipped(false); }} disabled={current === 0} style={{ padding: "12px 24px", borderRadius: 12, border: `1px solid ${border}`, backgroundColor: bg, color: text, fontSize: 14, cursor: "pointer", fontFamily: "inherit", opacity: current === 0 ? 0.4 : 1 }}>← Prev</button>
              <button onClick={() => setFlipped(!flipped)} style={{ padding: "12px 24px", borderRadius: 12, border: `1px solid ${C.orange}`, backgroundColor: "rgba(255,96,55,0.08)", color: C.orange, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Flip card</button>
              <button onClick={() => { setCurrent((c) => Math.min(cards.length - 1, c + 1)); setFlipped(false); }} disabled={current === cards.length - 1} style={{ padding: "12px 24px", borderRadius: 12, border: `1px solid ${border}`, backgroundColor: bg, color: text, fontSize: 14, cursor: "pointer", fontFamily: "inherit", opacity: current === cards.length - 1 ? 0.4 : 1 }}>Next →</button>
            </div>
          </div>
        )}

        {/* CREATE MODE */}
        {mode === "create" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 20 }}>Create manually</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Front (question)</label>
                <textarea value={newFront} onChange={(e) => setNewFront(e.target.value)} placeholder="Enter the question..." style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", minHeight: 80, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Back (answer)</label>
                <textarea value={newBack} onChange={(e) => setNewBack(e.target.value)} placeholder="Enter the answer..." style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", minHeight: 80, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Subject</label>
                <input type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="e.g. Mathematics" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={addCard} style={{ width: "100%", padding: "13px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                Add card
              </button>
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 20 }}>Generate with AI</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Subject or topic</label>
                <input type="text" value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} placeholder="e.g. Quadratic equations" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <button onClick={generateAICards} disabled={generating || !aiSubject} style={{ width: "100%", padding: "13px", borderRadius: 12, backgroundColor: generating ? C.garnet : C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: generating ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: !aiSubject ? 0.5 : 1 }}>
                {generating ? "Generating..." : "Generate 5 cards with AI"}
              </button>
              <div style={{ marginTop: 16, padding: "16px", borderRadius: 12, backgroundColor: bgMid, fontSize: 13, color: sub, lineHeight: 1.6 }}>
                💡 AI will generate 5 flashcards on your chosen topic using exam-appropriate content for your board.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}