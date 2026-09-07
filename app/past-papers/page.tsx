"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase, authHeader } from "../../lib/supabase";
import Navbar from "../../lib/Navbar";
import { useAuthGuard } from "../../lib/useAuthGuard";
import { SUBJECTS, LEVELS } from "../../lib/curriculum";

const C = { orange: "#FF6037" };

type Paper = {
  id: string;
  subject: string;
  board: string;
  level: string;
  year: number;
  session: string;
  paper_label: string;
  doc_type: "question_paper" | "mark_scheme";
  storage_path: string | null;
  external_url: string | null;
};

const bg = "var(--bg)";
const bgMid = "var(--bg-mid)";
const text = "var(--text)";
const sub = "var(--sub)";
const border = "var(--border)";

function pill(active: boolean): React.CSSProperties {
  return {
    padding: "8px 16px",
    borderRadius: 999,
    border: active ? `2px solid ${C.orange}` : `1px solid ${border}`,
    backgroundColor: active ? "var(--accent-badge)" : bg,
    color: active ? "var(--accent-ink)" : text,
    fontSize: 12,
    fontWeight: active ? 500 : 400,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

export default function PastPapersPage() {
  const { status } = useAuthGuard();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [subject, setSubject] = useState("All");
  const [level, setLevel] = useState("All");
  const [year, setYear] = useState<number | "All">("All");

  // The paper currently open in the in-page reader.
  const [viewing, setViewing] = useState<Paper | null>(null);
  const [viewUrl, setViewUrl] = useState("");
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error: loadError } = await supabase
        .from("past_papers")
        .select("*")
        .order("subject")
        .order("level")
        .order("year", { ascending: false })
        .order("session")
        .order("paper_label")
        // The catalogue is browsed by filter, not by scrolling to the end of it.
        .limit(2000);

      if (cancelled) return;
      if (loadError) setError(loadError.message);
      else setPapers((data as Paper[]) || []);
      setLoading(false);
    }

    if (status === "ready") load();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const years = [...new Set(papers.map((p) => p.year))].sort((a, b) => b - a);

  const filtered = papers.filter((p) => {
    if (subject !== "All" && p.subject !== subject) return false;
    if (level !== "All" && p.level !== level) return false;
    if (year !== "All" && p.year !== year) return false;
    return true;
  });

  type PaperGroup = {
    key: string;
    subject: string;
    level: string;
    year: number;
    session: string;
    paper_label: string;
    questionPaper?: Paper;
    markScheme?: Paper;
  };

  const groups: PaperGroup[] = [];
  const groupIndex = new Map<string, PaperGroup>();

  for (const p of filtered) {
    const key = [p.subject, p.level, p.year, p.session, p.paper_label].join("|");
    let group = groupIndex.get(key);
    if (!group) {
      group = {
        key,
        subject: p.subject,
        level: p.level,
        year: p.year,
        session: p.session,
        paper_label: p.paper_label,
      };
      groupIndex.set(key, group);
      groups.push(group);
    }
    if (p.doc_type === "mark_scheme") group.markScheme = p;
    else group.questionPaper = p;
  }

  const openPaper = useCallback(async (paper: Paper) => {
    setOpening(true);
    setError("");
    try {
      const res = await fetch("/api/past-paper-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ paperId: paper.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not open that paper.");
        setOpening(false);
        return;
      }
      if (data.external) {
        // Catalogued as a link to the official page rather than a hosted file.
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        setViewing(paper);
        setViewUrl(data.url);
      }
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setOpening(false);
  }, []);

  if (status !== "ready") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 14, color: sub }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar active="/past-papers" />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px clamp(16px, 4vw, 40px)" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Past Papers</p>
        <h1 style={{ fontSize: "clamp(26px, 6.5vw, 36px)", fontWeight: 600, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Browse past papers</h1>
        <p style={{ fontSize: 14, color: sub, marginBottom: 40 }}>
          Filter by subject, level and year. Papers open here in the page.
        </p>

        {error && (
          <div style={{ backgroundColor: "rgba(226,75,74,0.1)", border: "1px solid rgba(226,75,74,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, fontSize: 13, color: "#E24B4A" }}>
            {error}
          </div>
        )}

        {/* FILTERS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: sub, display: "block", marginBottom: 8 }}>Subject</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["All", ...SUBJECTS].map((s) => (
                <button key={s} onClick={() => setSubject(s)} style={pill(subject === s)}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: sub, display: "block", marginBottom: 8 }}>Level</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["All", ...LEVELS.map((l) => l.label)].map((l) => (
                <button key={l} onClick={() => setLevel(l)} style={pill(level === l)}>{l}</button>
              ))}
            </div>
          </div>

          {years.length > 0 && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: sub, display: "block", marginBottom: 8 }}>Year</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => setYear("All")} style={pill(year === "All")}>All</button>
                {years.map((y) => (
                  <button key={y} onClick={() => setYear(y)} style={pill(year === y)}>{y}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* LIST */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: sub, fontSize: 14 }}>Loading papers...</div>
        ) : papers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 32px", background: "var(--card-strong)", borderRadius: 20, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: text, marginBottom: 8 }}>No papers yet</div>
            <div style={{ fontSize: 13, color: sub, lineHeight: 1.7, maxWidth: 420, margin: "0 auto" }}>
              Nothing has been added yet. Papers appear here as soon as they are
              imported, filed by subject, level and year.
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: sub, fontSize: 14 }}>
            Nothing matches those filters.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {groups.map((g) => (
              <div key={g.key} style={{ background: "var(--card)", border: `1px solid ${border}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", backdropFilter: "blur(16px)" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: text }}>
                    {g.subject} — {g.paper_label}
                  </div>
                  <div style={{ fontSize: 11, color: sub, marginTop: 3 }}>
                    {g.session} {g.year}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: g.level === "IGCSE" || g.level === "A-Level" ? "var(--teal-badge)" : "var(--accent-badge)", color: g.level === "IGCSE" || g.level === "A-Level" ? "var(--teal-ink)" : "var(--accent-ink)" }}>
                  {g.level}
                </span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {g.questionPaper && (
                    <button onClick={() => openPaper(g.questionPaper!)} disabled={opening} style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${C.orange}`, backgroundColor: "var(--accent-badge)", color: "var(--accent-ink)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      Question paper
                    </button>
                  )}
                  {g.markScheme && (
                    <button onClick={() => openPaper(g.markScheme!)} disabled={opening} style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: "transparent", color: text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      Mark scheme
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* IN-PAGE READER */}
      {viewing && (
        <div
          onClick={() => { setViewing(null); setViewUrl(""); }}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(12px, 3vw, 32px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: bgMid, border: `1px solid ${border}`, borderRadius: 20, width: "100%", maxWidth: 1000, height: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 20px", borderBottom: `1px solid ${border}`, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: text }}>
                  {viewing.subject} — {viewing.paper_label}
                </div>
                <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>
                  {viewing.level} · {viewing.session} {viewing.year} ·{" "}
                  {viewing.doc_type === "mark_scheme" ? "Mark scheme" : "Question paper"}
                </div>
              </div>
              <button
                onClick={() => { setViewing(null); setViewUrl(""); }}
                style={{ padding: "9px 18px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: bg, color: text, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
              >
                Close
              </button>
            </div>
            <iframe
              src={viewUrl}
              title={`${viewing.subject} ${viewing.paper_label}`}
              style={{ flex: 1, width: "100%", border: "none", backgroundColor: "#fff" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
