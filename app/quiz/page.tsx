"use client";
import { useState, useEffect, useRef } from "react";
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

type Question = {
  type: "mcq" | "short";
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  model_answer?: string;
  keywords?: string[];
};

type Mode = "setup" | "quiz" | "results";

export default function QuizPage() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });
  const [mode, setMode] = useState<Mode>("setup");
  const [subject, setSubject] = useState("");
  const [board, setBoard] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [examMode, setExamMode] = useState<"practice" | "exam">("practice");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [shortAnswer, setShortAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bg = dark ? C.kite : C.snow;
  const bgMid = dark ? C.kiteDeep : C.snowMist;
  const text = dark ? C.snow : C.kite;
  const sub = dark ? C.garnetLight : C.garnet;
  const border = dark ? "rgba(245,244,237,0.08)" : "rgba(53,30,28,0.08)";

  async function finishQuiz() {
    clearInterval(timerRef.current);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("quiz_sessions").insert({
          user_id: user.id,
          subject,
          board,
          mode: examMode,
          score,
          total_questions: questions.length,
        });
      }
    } catch (e) {
      console.error("Failed to save quiz session", e);
    }
    setMode("results");
  }

  useEffect(() => {
    queueMicrotask(() => {
      const saved = localStorage.getItem("darkMode") === "true";
      setDark(saved);
    });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- interval is reset only when mode/examMode change; finishQuiz reads latest state when the timer fires.
  useEffect(() => {
    if (examMode === "exam" && mode === "quiz" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            finishQuiz();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [mode, examMode]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  async function generateQuiz() {
    if (!subject || !board) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, board, count: questionCount }),
      });
      const data = await res.json();
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(""));
      setFeedback(new Array(data.questions.length).fill(""));
      if (examMode === "exam") setTimeLeft(questionCount * 90);
      setMode("quiz");
      setCurrentQ(0);
    } catch {
      alert("Failed to generate quiz. Please try again.");
    }
    setLoading(false);
  }

  async function checkMCQ(option: string) {
    if (answered) return;
    setSelectedOption(option);
    setAnswered(true);
    const q = questions[currentQ];
    const correct = option === q.answer;
    if (correct) setScore((s) => s + 1);
    const newAnswers = [...answers];
    newAnswers[currentQ] = option;
    setAnswers(newAnswers);
    const newFeedback = [...feedback];
    newFeedback[currentQ] = correct ? "correct" : "incorrect";
    setFeedback(newFeedback);
  }

  async function checkShort() {
    if (!shortAnswer.trim()) return;
    setGrading(true);
    try {
      const res = await fetch("/api/grade-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questions[currentQ].question,
          modelAnswer: questions[currentQ].model_answer,
          keywords: questions[currentQ].keywords,
          studentAnswer: shortAnswer,
          subject,
          board,
        }),
      });
      const data = await res.json();
      const newAnswers = [...answers];
      newAnswers[currentQ] = shortAnswer;
      setAnswers(newAnswers);
      const newFeedback = [...feedback];
      newFeedback[currentQ] = data.feedback;
      setFeedback(newFeedback);
      if (data.verdict === "correct") setScore((s) => s + 1);
      else if (data.verdict === "partial") setScore((s) => s + 0.5);
      setAnswered(true);
    } catch {
      alert("Failed to grade answer.");
    }
    setGrading(false);
  }

  function nextQuestion() {
    if (currentQ + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentQ((q) => q + 1);
      setAnswered(false);
      setSelectedOption("");
      setShortAnswer("");
    }
  }

  function playClick() {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!;
    const ctx = new AudioContextClass();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(800, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.06);
    g.gain.setValueAtTime(0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    o.start(); o.stop(ctx.currentTime + 0.08);
  }

  // SETUP SCREEN
  if (mode === "setup") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid ${border}` }}>
          <a href="/dashboard" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>
            Exam<span style={{ color: C.orange }}>Prep</span> AI
          </a>
          <a href="/dashboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>← Dashboard</a>
        </nav>

        <div style={{ maxWidth: 600, margin: "0 auto", padding: "64px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>AI Quiz</p>
          <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Set up your quiz</h1>
          <p style={{ fontSize: 14, color: sub, marginBottom: 48 }}>Choose your subject, board and mode to get started.</p>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 10 }}>Subject</label>
            <div style={{ display: "flex", gap: 10 }}>
              {["Mathematics", "English", "Computer Science"].map((s) => (
                <button key={s} onClick={() => { setSubject(s); playClick(); }} style={{ flex: 1, padding: "12px 8px", borderRadius: 12, border: subject === s ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: subject === s ? "rgba(255,96,55,0.08)" : bg, color: subject === s ? C.orange : text, fontWeight: subject === s ? 500 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 10 }}>Board</label>
            <div style={{ display: "flex", gap: 10 }}>
              {["Cambridge IGCSE/A-Level", "Pakistan Board (Matric/FSc)"].map((b) => (
                <button key={b} onClick={() => { setBoard(b); playClick(); }} style={{ flex: 1, padding: "12px 8px", borderRadius: 12, border: board === b ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: board === b ? "rgba(255,96,55,0.08)" : bg, color: board === b ? C.orange : text, fontWeight: board === b ? 500 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 10 }}>Number of questions</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[5, 10, 15, 20].map((n) => (
                <button key={n} onClick={() => { setQuestionCount(n); playClick(); }} style={{ flex: 1, padding: "12px 8px", borderRadius: 12, border: questionCount === n ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: questionCount === n ? "rgba(255,96,55,0.08)" : bg, color: questionCount === n ? C.orange : text, fontWeight: questionCount === n ? 500 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 10 }}>Mode</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { val: "practice", label: "🧠 Practice", desc: "Hints & explanations" },
                { val: "exam", label: "⏱ Exam", desc: "Timed, no hints" },
              ].map((m) => (
                <button key={m.val} onClick={() => { setExamMode(m.val as "practice" | "exam"); playClick(); }} style={{ flex: 1, padding: "14px", borderRadius: 12, border: examMode === m.val ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: examMode === m.val ? "rgba(255,96,55,0.08)" : bg, color: examMode === m.val ? C.orange : text, fontWeight: examMode === m.val ? 500 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" }}>
                  <div>{m.label}</div>
                  <div style={{ fontSize: 11, color: sub, marginTop: 4 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={generateQuiz} disabled={!subject || !board || loading} style={{ width: "100%", padding: "15px", borderRadius: 12, backgroundColor: !subject || !board ? C.garnet : C.orange, color: "#fff", fontWeight: 500, fontSize: 15, border: "none", cursor: !subject || !board ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: !subject || !board ? 0.5 : 1 }}>
            {loading ? "Generating quiz..." : "Generate quiz →"}
          </button>
        </div>
      </div>
    );
  }

  // QUIZ SCREEN
  if (mode === "quiz") {
    const q = questions[currentQ];
    const progress = ((currentQ) / questions.length) * 100;

    return (
      <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid ${border}` }}>
          <a href="/dashboard" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>
            Exam<span style={{ color: C.orange }}>Prep</span> AI
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {examMode === "exam" && (
              <div style={{ fontSize: 14, fontWeight: 500, color: timeLeft < 60 ? C.orange : text }}>
                ⏱ {formatTime(timeLeft)}
              </div>
            )}
            <div style={{ fontSize: 13, color: sub }}>{currentQ + 1} / {questions.length}</div>
          </div>
        </nav>

        <div style={{ height: 3, backgroundColor: bgMid }}>
          <div style={{ height: 3, width: `${progress}%`, backgroundColor: C.orange, transition: "width 0.4s" }} />
        </div>

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 500, padding: "4px 12px", borderRadius: 999, backgroundColor: bgMid, color: sub }}>
              {q.type === "mcq" ? "Multiple choice" : "Short answer"}
            </span>
            <span style={{ fontSize: 11, color: sub }}>{subject} · {board}</span>
          </div>

          <div style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid ${border}`, borderRadius: 18, padding: "28px 32px", marginBottom: 24, backdropFilter: "blur(16px)" }}>
            <p style={{ fontSize: 17, fontWeight: 500, color: text, lineHeight: 1.65, margin: 0 }}>{q.question}</p>
          </div>

          {q.type === "mcq" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {q.options?.map((opt, i) => {
                const letters = ["A", "B", "C", "D"];
                const isSelected = selectedOption === letters[i];
                const isCorrect = answered && letters[i] === q.answer;
                const isWrong = answered && isSelected && letters[i] !== q.answer;
                return (
                  <button key={i} onClick={() => { checkMCQ(letters[i]); playClick(); }} disabled={answered}
                    style={{ padding: "14px 18px", borderRadius: 12, border: isCorrect ? `2px solid #639922` : isWrong ? `2px solid #E24B4A` : isSelected ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: isCorrect ? "rgba(99,153,34,0.1)" : isWrong ? "rgba(226,75,74,0.1)" : isSelected ? "rgba(255,96,55,0.08)" : bg, color: isCorrect ? "#639922" : isWrong ? "#E24B4A" : text, fontSize: 14, cursor: answered ? "default" : "pointer", fontFamily: "inherit", textAlign: "left", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" }}>
                    <span style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: isCorrect ? "#639922" : isWrong ? "#E24B4A" : bgMid, color: isCorrect || isWrong ? "#fff" : sub, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                      {letters[i]}
                    </span>
                    {opt.replace(/^[A-D]\)\s*/, "")}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "short" && (
            <div style={{ marginBottom: 24 }}>
              <textarea
                value={shortAnswer}
                onChange={(e) => setShortAnswer(e.target.value)}
                disabled={answered}
                placeholder="Write your answer here..."
                style={{ width: "100%", minHeight: 120, padding: "14px 16px", borderRadius: 12, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
              {!answered && (
                <button onClick={checkShort} disabled={grading || !shortAnswer.trim()} style={{ marginTop: 12, padding: "12px 24px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  {grading ? "Grading..." : "Submit answer"}
                </button>
              )}
            </div>
          )}

          {answered && feedback[currentQ] && (
            <div style={{ padding: "16px 20px", borderRadius: 12, backgroundColor: feedback[currentQ] === "correct" ? "rgba(99,153,34,0.1)" : feedback[currentQ] === "incorrect" ? "rgba(226,75,74,0.1)" : "rgba(255,96,55,0.08)", border: `1px solid ${feedback[currentQ] === "correct" ? "rgba(99,153,34,0.3)" : feedback[currentQ] === "incorrect" ? "rgba(226,75,74,0.3)" : "rgba(255,96,55,0.2)"}`, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: feedback[currentQ] === "correct" ? "#639922" : feedback[currentQ] === "incorrect" ? "#E24B4A" : C.orange, marginBottom: 6 }}>
                {feedback[currentQ] === "correct" ? "✓ Correct!" : feedback[currentQ] === "incorrect" ? "✗ Incorrect" : feedback[currentQ]}
              </div>
              {examMode === "practice" && q.explanation && (
                <div style={{ fontSize: 13, color: sub, lineHeight: 1.6 }}>{q.explanation}</div>
              )}
            </div>
          )}

          {answered && (
            <button onClick={nextQuestion} style={{ width: "100%", padding: "14px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {currentQ + 1 >= questions.length ? "See results →" : "Next question →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  const percentage = Math.round((score / questions.length) * 100);
  const getMessage = () => {
    if (percentage >= 80) return "Excellent work! 🎉";
    if (percentage >= 60) return "Good effort! Keep practising 💪";
    if (percentage >= 40) return "Keep going! Review your notes 📚";
    return "Don't give up! Try again 🔄";
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid ${border}` }}>
        <a href="/dashboard" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>
          Exam<span style={{ color: C.orange }}>Prep</span> AI
        </a>
        <a href="/dashboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>← Dashboard</a>
      </nav>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>
          {percentage >= 80 ? "🎉" : percentage >= 60 ? "💪" : "📚"}
        </div>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Quiz complete</p>
        <h1 style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>{percentage}%</h1>
        <p style={{ fontSize: 16, color: sub, marginBottom: 48 }}>{getMessage()}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 48 }}>
          {[
            { label: "Correct", value: Math.round(score), color: "#639922" },
            { label: "Incorrect", value: questions.length - Math.round(score), color: "#E24B4A" },
            { label: "Total", value: questions.length, color: C.orange },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: bgMid, borderRadius: 16, padding: "20px", border: `1px solid ${border}` }}>
              <div style={{ fontSize: 28, fontWeight: 500, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => { setMode("setup"); setScore(0); setCurrentQ(0); setAnswers([]); setFeedback([]); setAnswered(false); setSelectedOption(""); setShortAnswer(""); }} style={{ padding: "13px 28px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Try again
          </button>
          <a href="/dashboard" style={{ padding: "13px 28px", borderRadius: 12, backgroundColor: bgMid, color: text, fontWeight: 500, fontSize: 14, border: `1px solid ${border}`, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Dashboard
          </a>
          <a href="/history" style={{ padding: "13px 28px", borderRadius: 12, backgroundColor: bgMid, color: text, fontWeight: 500, fontSize: 14, border: `1px solid ${border}`, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            View history →
          </a>
        </div>
      </div>
    </div>
  );
}