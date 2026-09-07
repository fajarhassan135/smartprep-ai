"use client";
import { useState, useEffect, useRef } from "react";
import { supabase, authHeader } from "../../lib/supabase";
import Navbar from "../../lib/Navbar";
import { formatMarks } from "../../lib/formatMarks";
import { SUBJECTS, LEVELS, findLevel } from "../../lib/curriculum";
import { useAuthGuard } from "../../lib/useAuthGuard";

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
type Verdict = "correct" | "partial" | "incorrect" | "skipped" | "";
type Difficulty = "easy" | "medium" | "hard";

export default function QuizPage() {
  const { status } = useAuthGuard();
  const [mode, setMode] = useState<Mode>("setup");
  // Deep link from the dashboard: /quiz?subject=Physics arrives with the
  // subject already chosen. Read lazily rather than with useSearchParams so the
  // page does not need a Suspense boundary; the setup screen only renders once
  // the auth guard resolves on the client, so this never runs during SSR.
  const [subject, setSubject] = useState(() => {
    if (typeof window === "undefined") return "";
    const requested = new URLSearchParams(window.location.search).get("subject");
    return requested && (SUBJECTS as readonly string[]).includes(requested) ? requested : "";
  });
  const [levelId, setLevelId] = useState("");
  const level = findLevel(levelId);
  const board = level?.board ?? "";
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionCount, setQuestionCount] = useState(10);
  const [examMode, setExamMode] = useState<"practice" | "exam">("practice");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [hint, setHint] = useState("");
  const [hintLoading, setHintLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [shortAnswer, setShortAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bg = "var(--bg)";
  const bgMid = "var(--bg-mid)";
  const text = "var(--text)";
  const sub = "var(--sub)";
  const border = "var(--border)";

  // The exam timer fires from inside an interval that was created when the quiz
  // started, so it cannot read `score` from that stale closure. Every caller
  // passes the score explicitly, and the timer reads it from this ref.
  const scoreRef = useRef(0);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // The timer calls this from inside a state updater, which React may invoke
  // more than once, so guard against saving the same session twice.
  const finishedRef = useRef(false);

  async function finishQuiz(finalScore: number) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("quiz_sessions").insert({
          user_id: user.id,
          subject,
          board,
          level: level?.label ?? null,
          mode: examMode,
          difficulty,
          score: finalScore,
          total_questions: questions.length,
        });
      }
    } catch (e) {
      console.error("Failed to save quiz session", e);
    }
    setMode("results");
  }

  // The interval is deliberately created once per quiz, so it must not be
  // rebuilt as `timeLeft` ticks down. `finishQuiz` is read from the closure but
  // takes the score as an argument, so nothing stale is captured.
  useEffect(() => {
    if (examMode === "exam" && mode === "quiz" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            finishQuiz(scoreRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, examMode]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  async function generateQuiz() {
    if (!subject || !board) return;
    setLoading(true);
    setSetupError("");
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ subject, levelId, count: questionCount, difficulty }),
      });
      const data = await res.json();

      // The route validates the model's output, but a 502 or an empty list
      // still has to be shown rather than crashing on data.questions.length.
      if (!res.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        setSetupError(data.error || "Could not generate a quiz. Please try again.");
        setLoading(false);
        return;
      }

      setQuestions(data.questions);
      finishedRef.current = false;
      setHint("");
      setAnswers(new Array(data.questions.length).fill(""));
      setFeedback(new Array(data.questions.length).fill(""));
      setVerdicts(new Array(data.questions.length).fill(""));
      if (examMode === "exam") setTimeLeft(questionCount * 90);
      setMode("quiz");
      setCurrentQ(0);
    } catch {
      setSetupError("Could not reach the question generator. Check your connection and try again.");
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
    const newVerdicts = [...verdicts];
    newVerdicts[currentQ] = correct ? "correct" : "incorrect";
    setVerdicts(newVerdicts);
  }

  async function checkShort() {
    if (!shortAnswer.trim()) return;
    setGrading(true);
    try {
      const res = await fetch("/api/grade-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          question: questions[currentQ].question,
          modelAnswer: questions[currentQ].model_answer,
          keywords: questions[currentQ].keywords,
          studentAnswer: shortAnswer,
          subject,
          levelId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to grade answer.");
        setGrading(false);
        return;
      }
      const newAnswers = [...answers];
      newAnswers[currentQ] = shortAnswer;
      setAnswers(newAnswers);
      const newFeedback = [...feedback];
      newFeedback[currentQ] = data.feedback;
      setFeedback(newFeedback);
      const newVerdicts = [...verdicts];
      newVerdicts[currentQ] =
        data.verdict === "correct" ? "correct" : data.verdict === "partial" ? "partial" : "incorrect";
      setVerdicts(newVerdicts);
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
      finishQuiz(score);
    } else {
      setCurrentQ((q) => q + 1);
      setAnswered(false);
      setSelectedOption("");
      setShortAnswer("");
      setHint("");
    }
  }

  /**
   * Move past a question without answering it. Available in both modes: in a
   * real exam you are free to leave a question and come back, and forcing an
   * answer here would put noise in the score.
   */
  function skipQuestion() {
    const newVerdicts = [...verdicts];
    newVerdicts[currentQ] = "skipped";
    setVerdicts(newVerdicts);

    const newFeedback = [...feedback];
    newFeedback[currentQ] = "";
    setFeedback(newFeedback);

    if (currentQ + 1 >= questions.length) {
      finishQuiz(score);
    } else {
      setCurrentQ((q) => q + 1);
      setAnswered(false);
      setSelectedOption("");
      setShortAnswer("");
      setHint("");
    }
  }

  // Practice only: a nudge towards the method, never the answer.
  async function getHint() {
    if (hintLoading) return;
    setHintLoading(true);
    try {
      const q = questions[currentQ];
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ question: q.question, options: q.options, subject, levelId }),
      });
      const data = await res.json();
      setHint(res.ok && data.hint ? data.hint : data.error || "Could not get a hint.");
    } catch {
      setHint("Could not reach the tutor. Check your connection and try again.");
    }
    setHintLoading(false);
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

  if (status !== "ready") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 14, color: sub }}>Loading...</div>
      </div>
    );
  }

  // SETUP SCREEN
  if (mode === "setup") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>
        <Navbar active="/quiz" />

        <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(40px, 8vw, 64px) clamp(16px, 4vw, 24px)" }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>AI Quiz</p>
          <h1 style={{ fontSize: "clamp(26px, 6.5vw, 36px)", fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Set up your quiz</h1>
          <p style={{ fontSize: 14, color: sub, marginBottom: 48 }}>Choose your subject, exam level and mode to get started.</p>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 10 }}>Subject</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {SUBJECTS.map((s) => (
                <button key={s} onClick={() => { setSubject(s); playClick(); }} style={{ flex: "1 1 30%", padding: "12px 8px", borderRadius: 12, border: subject === s ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: subject === s ? "var(--accent-badge)" : bg, color: subject === s ? "var(--accent-ink)" : text, fontWeight: subject === s ? 500 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 10 }}>Exam level</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {LEVELS.map((l) => (
                <button key={l.id} onClick={() => { setLevelId(l.id); playClick(); }} style={{ flex: "1 1 45%", padding: "12px 8px", borderRadius: 12, border: levelId === l.id ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: levelId === l.id ? "var(--accent-badge)" : bg, color: levelId === l.id ? "var(--accent-ink)" : text, fontWeight: levelId === l.id ? 500 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  <div>{l.label}</div>
                  <div style={{ fontSize: 11, color: sub, marginTop: 4 }}>{l.board}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 10 }}>Difficulty</label>
            <div style={{ display: "flex", gap: 10 }}>
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button key={d} onClick={() => { setDifficulty(d); playClick(); }} style={{ flex: 1, padding: "12px 8px", borderRadius: 12, border: difficulty === d ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: difficulty === d ? "var(--accent-badge)" : bg, color: difficulty === d ? "var(--accent-ink)" : text, fontWeight: difficulty === d ? 500 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize", transition: "all 0.15s" }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 10 }}>Number of questions</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[5, 10, 15, 20].map((n) => (
                <button key={n} onClick={() => { setQuestionCount(n); playClick(); }} style={{ flex: 1, padding: "12px 8px", borderRadius: 12, border: questionCount === n ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: questionCount === n ? "var(--accent-badge)" : bg, color: questionCount === n ? "var(--accent-ink)" : text, fontWeight: questionCount === n ? 500 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 10 }}>Mode</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { val: "practice", label: "Practice", desc: "Hints & explanations" },
                { val: "exam", label: "Exam", desc: "Timed, no hints" },
              ].map((m) => (
                <button key={m.val} onClick={() => { setExamMode(m.val as "practice" | "exam"); playClick(); }} style={{ flex: 1, padding: "14px", borderRadius: 12, border: examMode === m.val ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: examMode === m.val ? "var(--accent-badge)" : bg, color: examMode === m.val ? "var(--accent-ink)" : text, fontWeight: examMode === m.val ? 500 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" }}>
                  <div>{m.label}</div>
                  <div style={{ fontSize: 11, color: sub, marginTop: 4 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {setupError && (
            <div style={{ backgroundColor: "rgba(226,75,74,0.1)", border: "1px solid rgba(226,75,74,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 16, fontSize: 13, color: "#E24B4A" }}>
              {setupError}
            </div>
          )}

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
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px clamp(16px, 4vw, 40px)", borderBottom: `1px solid ${border}` }}>
          <a href="/dashboard" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>
            Smart<span style={{ color: C.orange }}>Prep</span> AI
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {examMode === "exam" && (
              <div style={{ fontSize: 14, fontWeight: 500, color: timeLeft < 60 ? "var(--accent-ink)" : text }}>
                {formatTime(timeLeft)}
              </div>
            )}
            <div style={{ fontSize: 13, color: sub }}>{currentQ + 1} / {questions.length}</div>
          </div>
        </nav>

        <div style={{ height: 3, backgroundColor: bgMid }}>
          <div style={{ height: 3, width: `${progress}%`, backgroundColor: C.orange, transition: "width 0.4s" }} />
        </div>

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "clamp(32px, 7vw, 48px) clamp(16px, 4vw, 24px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 500, padding: "4px 12px", borderRadius: 999, backgroundColor: bgMid, color: sub }}>
              {q.type === "mcq" ? "Multiple choice" : "Short answer"}
            </span>
            <span style={{ fontSize: 11, color: sub }}>{subject} · {level?.label} · {difficulty}</span>
          </div>

          <div style={{ background: "var(--card-strong)", border: `1px solid ${border}`, borderRadius: 18, padding: "28px 32px", marginBottom: 24, backdropFilter: "blur(16px)" }}>
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
                    style={{ padding: "14px 18px", borderRadius: 12, border: isCorrect ? `2px solid #639922` : isWrong ? `2px solid #E24B4A` : isSelected ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: isCorrect ? "rgba(99,153,34,0.1)" : isWrong ? "rgba(226,75,74,0.1)" : isSelected ? "var(--accent-badge)" : bg, color: isCorrect ? "#639922" : isWrong ? "#E24B4A" : text, fontSize: 14, cursor: answered ? "default" : "pointer", fontFamily: "inherit", textAlign: "left", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" }}>
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
                style={{ width: "100%", minHeight: 120, padding: "14px 16px", borderRadius: 12, border: `1px solid ${border}`, backgroundColor: "var(--input-bg)", color: text, fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
              {!answered && (
                <button onClick={checkShort} disabled={grading || !shortAnswer.trim()} style={{ marginTop: 12, padding: "12px 24px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  {grading ? "Grading..." : "Submit answer"}
                </button>
              )}
            </div>
          )}

          {answered && feedback[currentQ] && (
            <div style={{ padding: "16px 20px", borderRadius: 12, backgroundColor: feedback[currentQ] === "correct" ? "rgba(99,153,34,0.1)" : feedback[currentQ] === "incorrect" ? "rgba(226,75,74,0.1)" : "var(--accent-badge)", border: `1px solid ${feedback[currentQ] === "correct" ? "rgba(99,153,34,0.3)" : feedback[currentQ] === "incorrect" ? "rgba(226,75,74,0.3)" : "rgba(255,96,55,0.2)"}`, marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: feedback[currentQ] === "correct" ? "#639922" : feedback[currentQ] === "incorrect" ? "#E24B4A" : C.orange, marginBottom: 6 }}>
                {feedback[currentQ] === "correct" ? "Correct!" : feedback[currentQ] === "incorrect" ? "Incorrect" : feedback[currentQ]}
              </div>
              {examMode === "practice" && q.explanation && (
                <div style={{ fontSize: 13, color: sub, lineHeight: 1.6 }}>{q.explanation}</div>
              )}
            </div>
          )}

          {!answered && examMode === "practice" && (
            <div style={{ marginBottom: 16 }}>
              {hint ? (
                <div style={{ padding: "14px 18px", borderRadius: 12, backgroundColor: "var(--teal-badge)", border: "1px solid var(--teal-badge)", fontSize: 13, color: "var(--teal-ink)", lineHeight: 1.6 }}>
                  <strong style={{ fontWeight: 500 }}>Hint:</strong> {hint}
                </div>
              ) : (
                <button onClick={getHint} disabled={hintLoading} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid var(--teal-ink)`, backgroundColor: "transparent", color: "var(--teal-ink)", fontSize: 13, fontWeight: 500, cursor: hintLoading ? "default" : "pointer", fontFamily: "inherit" }}>
                  {hintLoading ? "Thinking..." : "Give me a hint"}
                </button>
              )}
            </div>
          )}

          {!answered && (
            <button onClick={skipQuestion} style={{ width: "100%", padding: "13px", borderRadius: 12, backgroundColor: "transparent", color: sub, fontWeight: 500, fontSize: 14, border: `1px solid ${border}`, cursor: "pointer", fontFamily: "inherit" }}>
              {currentQ + 1 >= questions.length ? "Skip & see results" : "Skip this question"}
            </button>
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
    if (percentage >= 80) return "Excellent work!";
    if (percentage >= 60) return "Good effort! Keep practising.";
    if (percentage >= 40) return "Keep going! Review your notes.";
    return "Don't give up! Try again.";
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px clamp(16px, 4vw, 40px)", borderBottom: `1px solid ${border}` }}>
        <a href="/dashboard" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>
          Smart<span style={{ color: C.orange }}>Prep</span> AI
        </a>
        <a href="/dashboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>← Dashboard</a>
      </nav>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(40px, 8vw, 64px) clamp(16px, 4vw, 24px)", textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Quiz complete</p>
        <h1 style={{ fontSize: "clamp(34px, 9vw, 56px)", fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>{percentage}%</h1>
        <p style={{ fontSize: 16, color: sub, marginBottom: 8 }}>{getMessage()}</p>
        <p style={{ fontSize: 13, color: sub, marginBottom: 48 }}>{formatMarks(score)} of {questions.length} marks · partial answers score half</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 48 }}>
          {[
            { label: "Correct", value: verdicts.filter((v) => v === "correct").length, color: "#639922" },
            { label: "Partial", value: verdicts.filter((v) => v === "partial").length, color: C.orange },
            { label: "Incorrect", value: verdicts.filter((v) => v === "incorrect").length, color: "#E24B4A" },
            { label: "Skipped", value: verdicts.filter((v) => v === "skipped").length, color: sub },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: bgMid, borderRadius: 16, padding: "20px", border: `1px solid ${border}` }}>
              <div style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 500, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => { finishedRef.current = false; setHint(""); setMode("setup"); setScore(0); setCurrentQ(0); setAnswers([]); setFeedback([]); setVerdicts([]); setAnswered(false); setSelectedOption(""); setShortAnswer(""); }} style={{ padding: "13px 28px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
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