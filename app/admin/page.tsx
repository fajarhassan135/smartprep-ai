"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { SUBJECTS, LEVELS } from "../../lib/curriculum";

const C = { orange: "#FF6037" };

const bg = "var(--bg)";
const bgMid = "var(--bg-mid)";
const text = "var(--text)";
const sub = "var(--sub)";
const border = "var(--border)";

const SESSIONS = ["May/June", "Oct/Nov", "Feb/March", "Annual"];

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

export default function AdminPage() {
  const [authState, setAuthState] = useState<"checking" | "denied" | "ok">("checking");
  const [authError, setAuthError] = useState("");

  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [levelId, setLevelId] = useState<string>(LEVELS[0].id);
  const [year, setYear] = useState("");
  const [session, setSession] = useState(SESSIONS[0]);
  const [paperLabel, setPaperLabel] = useState("");
  const [docType, setDocType] = useState<"question_paper" | "mark_scheme">("question_paper");
  const [mode, setMode] = useState<"file" | "link">("file");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // The server decides who is an admin; this only controls what the page shows.
  // Every upload is re-checked server side, so a forged answer here buys nothing.
  useEffect(() => {
    async function checkAccess() {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }
      const res = await fetch("/api/upload-past-paper", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await res.json();
      if (res.ok && result.isAdmin) {
        setAuthState("ok");
      } else {
        setAuthError(result.error || "You do not have admin access.");
        setAuthState("denied");
      }
    }
    checkAccess();
  }, []);

  const ready =
    subject && levelId && year && paperLabel && (mode === "file" ? file : externalUrl);

  async function handleUpload() {
    if (!ready) return;
    setUploading(true);
    setNotice("");
    setError("");

    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setError("Session expired. Please log in again.");
        setUploading(false);
        return;
      }

      const form = new FormData();
      if (mode === "file" && file) form.append("file", file);
      else form.append("externalUrl", externalUrl);
      form.append("subject", subject);
      form.append("levelId", levelId);
      form.append("year", year);
      form.append("session", session);
      form.append("paperLabel", paperLabel);
      form.append("docType", docType);

      const res = await fetch("/api/upload-past-paper", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");

      setNotice(`Added ${subject} ${paperLabel}, ${session} ${year}.`);
      setFile(null);
      setExternalUrl("");
      setPaperLabel("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setUploading(false);
  }

  if (authState !== "ok") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 24 }}>
        {authState === "checking" ? (
          <div style={{ fontSize: 14, color: sub }}>Checking access...</div>
        ) : (
          <div style={{ textAlign: "center", maxWidth: 380 }}>
            <h1 style={{ fontSize: 24, fontWeight: 500, color: text, marginBottom: 10, letterSpacing: "-0.02em" }}>Admins only</h1>
            <p style={{ fontSize: 14, color: sub, lineHeight: 1.7, marginBottom: 24 }}>{authError}</p>
            <a href="/dashboard" style={{ padding: "12px 28px", backgroundColor: C.orange, color: "#fff", borderRadius: 12, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
              Back to dashboard
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px clamp(16px, 4vw, 40px)", borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 50, backgroundColor: bg }}>
        <Link href="/" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>
          Smart<span style={{ color: C.orange }}>Prep</span> AI
        </Link>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/dashboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Dashboard</a>
          <a href="/past-papers" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Past papers</a>
          <span style={{ fontSize: 13, color: C.orange, fontWeight: 500 }}>Admin</span>
        </div>
      </nav>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px clamp(16px, 4vw, 40px)" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Admin</p>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Add a past paper</h1>
        <p style={{ fontSize: 14, color: sub, marginBottom: 40, lineHeight: 1.7 }}>
          Upload a PDF you have the right to distribute, or catalogue the paper as a
          link to its official page. Either way it appears on the past papers page,
          filed by subject, level and year.
        </p>

        {notice && (
          <div style={{ backgroundColor: "rgba(99,153,34,0.1)", border: "1px solid rgba(99,153,34,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, fontSize: 13, color: "#639922" }}>
            {notice}
          </div>
        )}
        {error && (
          <div style={{ backgroundColor: "rgba(226,75,74,0.1)", border: "1px solid rgba(226,75,74,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, fontSize: 13, color: "#E24B4A" }}>
            {error}
          </div>
        )}

        <div style={{ background: "var(--card-strong)", border: `1px solid ${border}`, borderRadius: 20, padding: "clamp(20px, 4vw, 32px)", backdropFilter: "blur(16px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle}>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Level</label>
              <select value={levelId} onChange={(e) => setLevelId(e.target.value)} style={inputStyle}>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>{l.label} · {l.board}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Year</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2023" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Session</label>
              <select value={session} onChange={(e) => setSession(e.target.value)} style={inputStyle}>
                {SESSIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>Paper label</label>
              <input type="text" value={paperLabel} onChange={(e) => setPaperLabel(e.target.value)} placeholder="e.g. Paper 4 Variant 2" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Document</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value as "question_paper" | "mark_scheme")} style={inputStyle}>
                <option value="question_paper">Question paper</option>
                <option value="mark_scheme">Mark scheme</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {([
              { val: "file", label: "Upload a PDF" },
              { val: "link", label: "Link to official page" },
            ] as const).map((m) => (
              <button
                key={m.val}
                onClick={() => setMode(m.val)}
                style={{ padding: "9px 16px", borderRadius: 999, border: mode === m.val ? `2px solid ${C.orange}` : `1px solid ${border}`, backgroundColor: mode === m.val ? "var(--accent-badge)" : bg, color: mode === m.val ? C.orange : text, fontSize: 12, fontWeight: mode === m.val ? 500 : 400, cursor: "pointer", fontFamily: "inherit" }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === "file" ? (
            <div style={{ marginBottom: 28 }}>
              <div
                onClick={() => document.getElementById("fileInput")?.click()}
                style={{ border: `2px dashed ${file ? C.orange : border}`, borderRadius: 12, padding: "32px", textAlign: "center", backgroundColor: file ? "var(--accent-badge)" : "transparent", cursor: "pointer" }}
              >
                <input id="fileInput" type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <div style={{ fontSize: 14, fontWeight: 500, color: text, marginBottom: 4 }}>
                  {file ? file.name : "Click to choose a PDF"}
                </div>
                <div style={{ fontSize: 12, color: sub }}>
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF only, up to 20MB"}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Official page URL</label>
              <input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
              <div style={{ fontSize: 11, color: sub, marginTop: 6 }}>
                Students get a link straight to the source. Nothing is hosted here.
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || !ready}
            style={{ width: "100%", padding: "14px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 15, border: "none", cursor: ready ? "pointer" : "not-allowed", fontFamily: "inherit", opacity: ready ? 1 : 0.5 }}
          >
            {uploading ? "Adding..." : "Add to catalogue"}
          </button>
        </div>

        <div style={{ marginTop: 24, padding: "20px 24px", borderRadius: 16, backgroundColor: bgMid, border: `1px solid ${border}` }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: text, marginBottom: 8 }}>Before you upload</div>
          <div style={{ fontSize: 13, color: sub, lineHeight: 1.7 }}>
            Exam papers are copyright their board. Upload PDFs only where you hold the
            right to distribute them — for Cambridge that usually means your school&apos;s
            own licence. Where you don&apos;t, catalogue the paper as a link instead: students
            still find it through the same filters.
          </div>
        </div>
      </div>
    </div>
  );
}
