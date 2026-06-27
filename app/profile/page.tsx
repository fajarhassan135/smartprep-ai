"use client";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../lib/ThemeContext";
import Navbar from "../../lib/Navbar";

const C = {
  snow: "#F5F4ED", snowMist: "#ECECDC", kite: "#351E1C", kiteDeep: "#2a1715",
  garnet: "#733635", garnetLight: "#a07070", orange: "#FF6037", orangeDark: "#c44a26",
};

export default function ProfilePage() {
  const { dark } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);

  const bg = dark ? C.kite : C.snow;
  const bgMid = dark ? C.kiteDeep : C.snowMist;
  const text = dark ? C.snow : C.kite;
  const sub = dark ? C.garnetLight : C.garnet;
  const border = dark ? "rgba(245,244,237,0.08)" : "rgba(53,30,28,0.08)";

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUser(data.user);
      setFullName(data.user.user_metadata?.full_name || "");
      setEmail(data.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, school, avatar_url")
        .eq("id", data.user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setSchool(profile.school || "");
        setAvatarUrl(profile.avatar_url || null);
      }
    }
    load();
  }, []);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName, school, display_name: displayName },
    });

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ display_name: displayName, school })
      .eq("id", user.id);

    if (authError || profileError) {
      setErrorMsg((authError || profileError)?.message || "Something went wrong.");
    } else {
      setSuccessMsg("Profile updated successfully!");
    }
    setSaving(false);
  }

  async function savePassword() {
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords don't match!");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters!");
      return;
    }
    setSavingPassword(true);
    setSuccessMsg("");
    setErrorMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setErrorMsg(error.message);
    else {
      setSuccessMsg("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg("Please upload a JPEG, PNG, or WebP image.");
      return;
    }

    const maxSizeBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMsg("Image must be smaller than 2MB.");
      return;
    }

    setUploadingAvatar(true);
    setErrorMsg("");
    setSuccessMsg("");

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setErrorMsg(uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      setErrorMsg(updateError.message);
    } else {
      setAvatarUrl(publicUrl);
      setSuccessMsg("Profile picture updated!");
    }

    setUploadingAvatar(false);
  }

  async function handleDeleteAccount() {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setErrorMsg("Session expired. Please log in again.");
        setDeleting(false);
        return;
      }

      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, accessToken }),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.error || "Could not delete account.");
        setDeleting(false);
        return;
      }

      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setDeleting(false);
    }
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.snow, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontSize: 14, color: C.garnet }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: bg, fontFamily: "'DM Sans', sans-serif", transition: "background 0.3s" }}>

      <Navbar active="/profile" />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 40px" }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: C.orange, marginBottom: 12 }}>Account</p>
        <h1 style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", color: text, marginBottom: 8 }}>Your profile</h1>
        <p style={{ fontSize: 14, color: sub, marginBottom: 48 }}>Manage your account details and password.</p>

        {successMsg && (
          <div style={{ backgroundColor: "rgba(99,153,34,0.1)", border: "1px solid rgba(99,153,34,0.3)", borderRadius: 12, padding: "14px 20px", marginBottom: 24, fontSize: 13, color: "#639922" }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ backgroundColor: "rgba(255,96,55,0.08)", border: "1px solid rgba(255,96,55,0.2)", borderRadius: 12, padding: "14px 20px", marginBottom: 24, fontSize: 13, color: C.orangeDark }}>
            {errorMsg}
          </div>
        )}

        {/* AVATAR */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40 }}>
          <div style={{ position: "relative" }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile picture"
                onClick={() => setShowAvatarPreview(true)}
                style={{ width: 72, height: 72, borderRadius: 999, objectFit: "cover", flexShrink: 0, cursor: "pointer" }}
              />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 999, backgroundColor: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 500, color: "#fff", flexShrink: 0 }}>
                {fullName ? fullName[0].toUpperCase() : email[0].toUpperCase()}
              </div>
            )}
            <label
              htmlFor="avatarInput"
              style={{ position: "absolute", bottom: -4, right: -4, width: 26, height: 26, borderRadius: 999, backgroundColor: C.orange, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px solid ${bg}`, fontSize: 12, color: "#fff" }}
            >
              +
            </label>
            <input
              id="avatarInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              style={{ display: "none" }}
              disabled={uploadingAvatar}
            />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: text, marginBottom: 4 }}>{fullName || "Student"}</div>
            <div style={{ fontSize: 13, color: sub }}>{email}</div>
            {school && <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{school}</div>}
            {uploadingAvatar && <div style={{ fontSize: 12, color: C.orange, marginTop: 4 }}>Uploading...</div>}
          </div>
        </div>

        {/* PROFILE DETAILS */}
        <div style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid ${border}`, borderRadius: 20, padding: "32px", backdropFilter: "blur(16px)", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 24 }}>Personal details</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>
              Display name <span style={{ color: sub, fontWeight: 400 }}>(shown on leaderboard)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. FJ or a nickname"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Email <span style={{ color: sub, fontWeight: 400 }}>(cannot be changed)</span></label>
            <input
              type="email"
              value={email}
              disabled
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: bgMid, color: sub, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", cursor: "not-allowed" }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>School</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Your school name"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <button onClick={saveProfile} disabled={saving} style={{ padding: "12px 28px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>

        {/* CHANGE PASSWORD */}
        <div style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid ${border}`, borderRadius: 20, padding: "32px", backdropFilter: "blur(16px)", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: text, marginBottom: 24 }}>Change password</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: text, display: "block", marginBottom: 6 }}>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${border}`, backgroundColor: dark ? "rgba(255,255,255,0.06)" : "#fff", color: text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <button onClick={savePassword} disabled={savingPassword} style={{ padding: "12px 28px", borderRadius: 12, backgroundColor: C.orange, color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit", opacity: savingPassword ? 0.7 : 1 }}>
            {savingPassword ? "Updating..." : "Update password"}
          </button>
        </div>

        {/* DANGER ZONE */}
        <div style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)", border: `1px solid rgba(226,75,74,0.2)`, borderRadius: 20, padding: "32px", backdropFilter: "blur(16px)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: "#E24B4A", marginBottom: 8 }}>Account</h2>
          <p style={{ fontSize: 13, color: sub, marginBottom: 20 }}>Logging out will end your current session on this device.</p>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} style={{ padding: "12px 28px", borderRadius: 12, backgroundColor: "transparent", color: "#E24B4A", fontWeight: 500, fontSize: 14, border: "1px solid rgba(226,75,74,0.3)", cursor: "pointer", fontFamily: "inherit", marginBottom: 24 }}>
            Log out
          </button>

          <div style={{ borderTop: "1px solid rgba(226,75,74,0.2)", paddingTop: 24 }}>
            <p style={{ fontSize: 13, color: sub, marginBottom: 16 }}>
              Deleting your account permanently removes your profile, quiz history, and leaderboard standing. This cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: "12px 28px", borderRadius: 12, backgroundColor: "transparent", color: "#E24B4A", fontWeight: 500, fontSize: 14, border: "1px solid rgba(226,75,74,0.3)", cursor: "pointer", fontFamily: "inherit" }}>
                Delete account
              </button>
            ) : (
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#E24B4A", marginBottom: 12 }}>
                  Are you sure? This is permanent.
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={handleDeleteAccount} disabled={deleting} style={{ padding: "12px 28px", borderRadius: 12, backgroundColor: "#E24B4A", color: "#fff", fontWeight: 500, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit", opacity: deleting ? 0.6 : 1 }}>
                    {deleting ? "Deleting..." : "Yes, delete my account"}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: "12px 28px", borderRadius: 12, backgroundColor: "transparent", color: text, fontWeight: 500, fontSize: 14, border: `1px solid ${border}`, cursor: "pointer", fontFamily: "inherit" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* AVATAR PREVIEW MODAL */}
      {showAvatarPreview && avatarUrl && (
        <div
          onClick={() => setShowAvatarPreview(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            cursor: "pointer",
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
            <img
              src={avatarUrl}
              alt="Profile picture preview"
              style={{ maxWidth: "min(80vw, 480px)", maxHeight: "80vh", borderRadius: 16, objectFit: "contain", display: "block" }}
            />
            <button
              onClick={() => setShowAvatarPreview(false)}
              style={{
                position: "absolute",
                top: -16,
                right: -16,
                width: 32,
                height: 32,
                borderRadius: 999,
                backgroundColor: "#fff",
                color: C.kite,
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}