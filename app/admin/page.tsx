"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

const C = {
  snow: "#F5F4ED", snowMist: "#ECECDC", kite: "#351E1C", kiteDeep: "#2a1715",
  garnet: "#733635", garnetLight: "#a07070", orange: "#FF6037", orangeDark: "#c44a26",
};

export default function AdminPage() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true";
    }
    return false;
  });
  const [subject, setSubject] = useState("");
  const [board, setBoard] = useState("");
  const [year, setYear] = useState("");
  const [paper, setPaper] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);

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

  async function handleUpload() {
    if (!file || !subject || !board || !year) return;
    setUploading(true);
    try {
      const fileName = `${board}-${subject}-${year}-${paper}-${Date.now()}.pdf`;
      const { error } = await supabase.storage
        .from("past-papers")
        .upload(fileName, file);
      if (error) throw error;
      setSuccess(true);
      setFile(null);
      setSubject(""); setBoard(""); setYear(""); setPaper("");
    } catch (e: unknown) {
      alert("Upload failed: " + (e instanceof Error ? e.message : String(e)));
    }
    setUploading(false);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 50, backgroundColor: bg }}>
        <Link href="/" style={{ fontSize: 15, fontWeight: 500, color: text, textDecoration: "none", letterSpacing: "-0.03em" }}>Exam<span style={{ color: C.orange }}>Prep</span> AI</Link>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/dashboard" style={{ fontSize: 13, color: sub, textDecoration: "none" }}>Dashboard</a>
          <span style={{ fontSize: 13, color: C.orange, fontWeight: 500 }}>Admin</span>
        </div>
      </nav>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Admin</p>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Upload past papers</h1>
        <p style={{ fontSize: 14, color: sub, marginBottom: 48 }}>Upload PDF past papers to the database. Students can then generate AI quizzes from them.</p>

        {success && (
          <div style={{ backgroundColor: "rgba(99,153,34,0.1)", border: "1px solid rgba(99,153,34,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 32, fontSize: 14, color: "#639922" }}>
            ✓ Past paper uploaded successfully!
          </div>
        )}

        <div style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid ${border}`, borderRadius: 20, padding: "32px", backdropFilter: "blur(16px)" }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
                <option value="">Select subject</option>
                <option>Mathematics</option>
                <option>English</option>
                <option>Computer Science</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Board</label>
              <select value={board} onChange={(e) => setBoard(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
                <option value="">Select board</option>
                <option>Cambridge IGCSE/A-Level</option>
                <option>Pakistan Board (Matric/FSc)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Year</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2023" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Paper number</label>
              <input type="text" value={paper} onChange={(e) => setPaper(e.target.value)} placeholder="e.g. Paper 1" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>PDF file</label>
            <div style={{ border: `2px dashed ${file ? C.orange : border}`, borderRadius: 12, padding: "32px", textAlign: "center", backgroundColor: file ? "rgba(255,96,55,0.04)" : "transparent", cursor: "pointer" }}
              onClick={() => document.getElementById("fileInput")?.click()}>
              <input id="fileInput" type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: text, marginBottom: 4 }}>
                {file ? file.name : "Click to upload PDF"}
              </div>
              <div style={{ fontSize: 12, color: sub }}>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Supports PDF files up to 10MB"}</div>
            </div>
          </div>

          <button onClick={handleUpload} disabled={uploading || !file || !subject || !board || !year} style={{ width: "100%", padding: "14px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "inherit", opacity: !file || !subject || !board || !year ? 0.5 : 1 }}>
            {uploading ? "Uploading..." : "Upload past paper"}
          </button>
        </div>

        {/* INFO */}
        <div style={{ marginTop: 24, padding: "20px 24px", borderRadius: 16, backgroundColor: bgMid, border: `1px solid ${border}` }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: text, marginBottom: 8 }}>How it works</div>
          <div style={{ fontSize: 13, color: sub, lineHeight: 1.7 }}>
            1. Upload a PDF past paper here<br />
            2. The system extracts text from the PDF<br />
            3. Students can select this paper in the quiz section<br />
            4. AI generates questions directly from the paper content
          </div>
        </div>
      </div>
    </div>
  );
}