"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase, authHeader } from "../../lib/supabase";
import Navbar from "../../lib/Navbar";
import { useAuthGuard } from "../../lib/useAuthGuard";
import { SUBJECTS, LEVELS, findLevel } from "../../lib/curriculum";

const C = { orange: "#FF6037", garnet: "#733635" };

type Flashcard = {
  id: string;
  subject: string;
  board: string;
  level: string;
  topic: string;
  front: string;
  back: string;
  source: "manual" | "ai";
  created_at: string;
};

const bg = "var(--bg)";
const text = "var(--text)";
const sub = "var(--sub)";
const border = "var(--border)";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 10,
  border: `1px solid ${border}`,
  backgroundColor: "var(--input-bg)",
  color: text,
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: text,
  display: "block",
  marginBottom: 6,
};

function pill(active: boolean): React.CSSProperties {
  return {
    padding: "9px 16px",
    borderRadius: 999,
    border: active ? `2px solid ${C.orange}` : `1px solid ${border}`,
    backgroundColor: active ? "var(--accent-badge)" : bg,
    color: active ? C.orange : text,
    fontSize: 12,
    fontWeight: active ? 500 : 400,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

type FolderItem = { key: string; title: string; meta?: string; count: number };

function FolderGrid({ items, onOpen }: { items: FolderItem[]; onOpen: (key: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onOpen(item.key)}
          style={{ background: "var(--card-strong)", border: `1px solid ${border}`, borderRadius: 16, padding: "22px 24px", textAlign: "left", cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(16px)" }}
        >
          <div style={{ fontSize: 15, fontWeight: 500, color: text, marginBottom: 4 }}>{item.title}</div>
          {item.meta && <div style={{ fontSize: 11, color: sub, marginBottom: 6 }}>{item.meta}</div>}
          <div style={{ fontSize: 12, color: sub }}>
            {item.count} card{item.count === 1 ? "" : "s"}
          </div>
        </button>
      ))}
    </div>
  );
}

export default function FlashcardsPage() {
  const { user, status } = useAuthGuard();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"library" | "create">("library");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Where we are in Subject -> Level -> Topic.
  const [openSubject, setOpenSubject] = useState<string | null>(null);
  const [openLevel, setOpenLevel] = useState<string | null>(null);
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  // One card at a time.
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Create / generate form.
  const [formSubject, setFormSubject] = useState<string>(SUBJECTS[0]);
  const [formLevel, setFormLevel] = useState<string>(LEVELS[0].id);
  const [formTopic, setFormTopic] = useState("");
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genCount, setGenCount] = useState(5);

  const fetchCards = useCallback(async (userId: string) => {
    return supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  }, []);

  const loadCards = useCallback(
    async (userId: string) => {
      const { data, error: loadError } = await fetchCards(userId);
      if (loadError) setError(loadError.message);
      else setCards((data as Flashcard[]) || []);
      setLoading(false);
    },
    [fetchCards]
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load(userId: string) {
      const { data, error: loadError } = await fetchCards(userId);
      if (cancelled) return;
      if (loadError) setError(loadError.message);
      else setCards((data as Flashcard[]) || []);
      setLoading(false);
    }

    load(user.id);
    return () => {
      cancelled = true;
    };
  }, [user, fetchCards]);

  // ---- folder contents -----------------------------------------------------

  const subjectFolders = SUBJECTS.map((name) => ({
    name,
    count: cards.filter((c) => c.subject === name).length,
  })).filter((f) => f.count > 0);

  const levelFolders = openSubject
    ? LEVELS.map((level) => ({
        level,
        count: cards.filter((c) => c.subject === openSubject && c.level === level.label).length,
      })).filter((f) => f.count > 0)
    : [];

  const topicFolders =
    openSubject && openLevel
      ? [
          ...new Set(
            cards
              .filter((c) => c.subject === openSubject && c.level === openLevel)
              .map((c) => c.topic || "General")
          ),
        ]
          .sort((a, b) => a.localeCompare(b))
          .map((topic) => ({
            topic,
            count: cards.filter(
              (c) =>
                c.subject === openSubject &&
                c.level === openLevel &&
                (c.topic || "General") === topic
            ).length,
          }))
      : [];

  const deck =
    openSubject && openLevel && openTopic
      ? cards.filter(
          (c) =>
            c.subject === openSubject &&
            c.level === openLevel &&
            (c.topic || "General") === openTopic
        )
      : [];

  function openFolder(setter: () => void) {
    setter();
    setCurrent(0);
    setFlipped(false);
  }

  // ---- writes --------------------------------------------------------------

  async function addCard() {
    if (!user || !newFront.trim() || !newBack.trim()) return;
    const level = findLevel(formLevel);
    if (!level) return;

    setSaving(true);
    setError("");
    setNotice("");

    const { error: insertError } = await supabase.from("flashcards").insert({
      user_id: user.id,
      subject: formSubject,
      board: level.board,
      level: level.label,
      topic: formTopic.trim() || "General",
      front: newFront.trim(),
      back: newBack.trim(),
      source: "manual",
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setNewFront("");
      setNewBack("");
      setNotice("Card saved.");
      await loadCards(user.id);
    }
    setSaving(false);
  }

  async function generateCards() {
    if (!user) return;
    const level = findLevel(formLevel);
    if (!level) return;

    setGenerating(true);
    setError("");
    setNotice("");

    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({
          subject: formSubject,
          levelId: formLevel,
          topic: formTopic.trim(),
          count: genCount,
        }),
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data.cards) || data.cards.length === 0) {
        setError(data.error || "Failed to generate flashcards.");
        setGenerating(false);
        return;
      }

      const rows = data.cards.map((c: { front: string; back: string; topic: string }) => ({
        user_id: user.id,
        subject: formSubject,
        board: level.board,
        level: level.label,
        topic: formTopic.trim() || c.topic || "General",
        front: c.front,
        back: c.back,
        source: "ai" as const,
      }));

      const { error: insertError } = await supabase.from("flashcards").insert(rows);
      if (insertError) {
        setError(insertError.message);
      } else {
        setNotice(`Saved ${rows.length} card${rows.length === 1 ? "" : "s"} to ${formSubject}.`);
        await loadCards(user.id);
      }
    } catch {
      setError("Could not reach the flashcard generator. Check your connection and try again.");
    }
    setGenerating(false);
  }

  async function deleteCard(id: string) {
    if (!user) return;
    const { error: deleteError } = await supabase.from("flashcards").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    if (current >= deck.length - 1 && current > 0) setCurrent(current - 1);
    setFlipped(false);
    await loadCards(user.id);
  }

  if (status !== "ready") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 14, color: sub }}>Loading...</div>
      </div>
    );
  }

  const card = deck[current];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar active="/flashcards" />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px clamp(16px, 4vw, 40px)" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Flashcards</p>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Your card library</h1>
        <p style={{ fontSize: 14, color: sub, marginBottom: 32 }}>
          Sorted by subject, then exam level, then syllabus topic. Cards are saved to your account.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
          {([
            { val: "library", label: "Library" },
            { val: "create", label: "Add cards" },
          ] as const).map((m) => (
            <button key={m.val} onClick={() => setView(m.val)} style={pill(view === m.val)}>
              {m.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: "rgba(226,75,74,0.1)", border: "1px solid rgba(226,75,74,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#E24B4A" }}>
            {error}
          </div>
        )}
        {notice && (
          <div style={{ backgroundColor: "rgba(99,153,34,0.1)", border: "1px solid rgba(99,153,34,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#639922" }}>
            {notice}
          </div>
        )}

        {/* ------------------------------ LIBRARY ------------------------------ */}
        {view === "library" && (
          <>
            {(openSubject || openLevel || openTopic) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 13, color: sub, flexWrap: "wrap" }}>
                <button
                  onClick={() => openFolder(() => { setOpenSubject(null); setOpenLevel(null); setOpenTopic(null); })}
                  style={{ background: "none", border: "none", color: C.orange, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0 }}
                >
                  All subjects
                </button>
                {openSubject && (
                  <>
                    <span>/</span>
                    <button
                      onClick={() => openFolder(() => { setOpenLevel(null); setOpenTopic(null); })}
                      style={{ background: "none", border: "none", color: openLevel ? C.orange : text, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0 }}
                    >
                      {openSubject}
                    </button>
                  </>
                )}
                {openLevel && (
                  <>
                    <span>/</span>
                    <button
                      onClick={() => openFolder(() => setOpenTopic(null))}
                      style={{ background: "none", border: "none", color: openTopic ? C.orange : text, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0 }}
                    >
                      {openLevel}
                    </button>
                  </>
                )}
                {openTopic && (
                  <>
                    <span>/</span>
                    <span style={{ color: text }}>{openTopic}</span>
                  </>
                )}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: sub, fontSize: 14 }}>Loading your cards...</div>
            ) : cards.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, background: "var(--card-strong)", borderRadius: 20, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 8 }}>No cards yet</div>
                <div style={{ fontSize: 13, color: sub, marginBottom: 24 }}>Write your own or generate a set for a topic you are revising.</div>
                <button onClick={() => setView("create")} style={{ padding: "12px 28px", backgroundColor: C.orange, color: "#fff", borderRadius: 12, border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                  Add cards →
                </button>
              </div>
            ) : !openSubject ? (
              <FolderGrid
                items={subjectFolders.map((f) => ({ key: f.name, title: f.name, count: f.count }))}
                onOpen={(key) => openFolder(() => setOpenSubject(key))}
              />
            ) : !openLevel ? (
              <FolderGrid
                items={levelFolders.map((f) => ({
                  key: f.level.label,
                  title: f.level.label,
                  meta: f.level.board,
                  count: f.count,
                }))}
                onOpen={(key) => openFolder(() => setOpenLevel(key))}
              />
            ) : !openTopic ? (
              <FolderGrid
                items={topicFolders.map((f) => ({ key: f.topic, title: f.topic, count: f.count }))}
                onOpen={(key) => openFolder(() => setOpenTopic(key))}
              />
            ) : deck.length === 0 || !card ? (
              <div style={{ textAlign: "center", padding: 60, color: sub, fontSize: 14 }}>
                Nothing left in this topic.
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, color: sub, marginBottom: 24 }}>
                  Card {current + 1} of {deck.length}
                </div>

                <div className="flashcard-scene" onClick={() => setFlipped(!flipped)} style={{ cursor: "pointer", marginBottom: 24 }}>
                  <div className={`flashcard-inner ${flipped ? "is-flipped" : ""}`}>
                    <div className="flashcard-face front" style={{ background: "var(--card-solid)", border: `1px solid ${border}`, backdropFilter: "blur(16px)" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: sub, marginBottom: 16 }}>
                          Question — click to reveal
                        </div>
                        <div style={{ fontSize: 19, fontWeight: 500, color: text, lineHeight: 1.5 }}>{card.front}</div>
                      </div>
                    </div>
                    <div className="flashcard-face back" style={{ background: C.orange, border: `1px solid ${C.orange}` }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
                          Answer
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 500, color: "#fff", lineHeight: 1.6 }}>{card.back}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
                  <button
                    onClick={() => { setCurrent(Math.max(0, current - 1)); setFlipped(false); }}
                    disabled={current === 0}
                    style={{ padding: "12px 24px", borderRadius: 12, border: `1px solid ${border}`, backgroundColor: bg, color: text, fontSize: 14, cursor: "pointer", fontFamily: "inherit", opacity: current === 0 ? 0.4 : 1 }}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setFlipped(!flipped)}
                    style={{ padding: "12px 24px", borderRadius: 12, border: `1px solid ${C.orange}`, backgroundColor: "var(--accent-badge)", color: C.orange, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Flip card
                  </button>
                  <button
                    onClick={() => { setCurrent(Math.min(deck.length - 1, current + 1)); setFlipped(false); }}
                    disabled={current === deck.length - 1}
                    style={{ padding: "12px 24px", borderRadius: 12, border: `1px solid ${border}`, backgroundColor: bg, color: text, fontSize: 14, cursor: "pointer", fontFamily: "inherit", opacity: current === deck.length - 1 ? 0.4 : 1 }}
                  >
                    Next →
                  </button>
                </div>

                <button onClick={() => deleteCard(card.id)} style={{ background: "none", border: "none", color: sub, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
                  Delete this card
                </button>
              </div>
            )}
          </>
        )}

        {/* ------------------------------ CREATE ------------------------------ */}
        {view === "create" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 20 }}>Where it goes</h3>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Subject</label>
                <select value={formSubject} onChange={(e) => setFormSubject(e.target.value)} style={inputStyle}>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Exam level</label>
                <select value={formLevel} onChange={(e) => setFormLevel(e.target.value)} style={inputStyle}>
                  {LEVELS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label} · {l.board}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Topic</label>
                <input type="text" value={formTopic} onChange={(e) => setFormTopic(e.target.value)} placeholder="e.g. Electromagnetism" style={inputStyle} />
                <div style={{ fontSize: 11, color: sub, marginTop: 6 }}>
                  Leave blank when generating and the AI files each card under its own syllabus topic.
                </div>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 20 }}>Generate with AI</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>How many cards</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[5, 10].map((n) => (
                    <button key={n} onClick={() => setGenCount(n)} style={pill(genCount === n)}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={generateCards}
                disabled={generating}
                style={{ width: "100%", padding: "13px", borderRadius: 12, backgroundColor: generating ? C.garnet : C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: generating ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {generating ? "Writing exam-standard cards..." : `Generate ${genCount} cards`}
              </button>
            </div>

            <div>
              <h3 style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 20 }}>Write your own</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Front (question)</label>
                <textarea value={newFront} onChange={(e) => setNewFront(e.target.value)} placeholder="Explain why..." style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Back (answer)</label>
                <textarea value={newBack} onChange={(e) => setNewBack(e.target.value)} placeholder="The full mark-scoring answer..." style={{ ...inputStyle, minHeight: 140, resize: "vertical" }} />
              </div>
              <button
                onClick={addCard}
                disabled={saving || !newFront.trim() || !newBack.trim()}
                style={{ width: "100%", padding: "13px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit", opacity: !newFront.trim() || !newBack.trim() ? 0.5 : 1 }}
              >
                {saving ? "Saving..." : "Save card"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
