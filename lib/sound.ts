/**
 * A small synthesised sound kit. No audio files: each cue is a couple of
 * oscillator notes, which keeps them tiny and lets them be tuned in code.
 *
 * Off by default and remembered per browser. A revision app that chirps
 * unexpectedly in a classroom is one someone mutes by closing the tab.
 */

const STORAGE_KEY = "sound";

export function soundEnabled() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Blocked storage: the setting just won't persist.
  }
}

type Note = { freq: number; to?: number; at: number; len: number; gain?: number };

function play(notes: Note[], force = false) {
  if (typeof window === "undefined") return;
  if (!force && !soundEnabled()) return;

  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const now = ctx.currentTime;

    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);

      const start = now + n.at;
      osc.frequency.setValueAtTime(n.freq, start);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, start + n.len);

      // Ramp rather than switch, or the note clicks at both ends.
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(n.gain ?? 0.12, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.len);

      osc.start(start);
      osc.stop(start + n.len + 0.02);
    }

    // Let the context go once the last note has finished.
    const total = Math.max(...notes.map((n) => n.at + n.len)) + 0.1;
    setTimeout(() => ctx.close().catch(() => {}), total * 1000 + 60);
  } catch {
    // Audio unavailable or blocked before a user gesture: silence is fine.
  }
}

/** Plays even when muted: the user just turned sound on and wants to hear it. */
export const playToggleOn = () => play([{ freq: 520, to: 780, at: 0, len: 0.09 }], true);

export const playToggle = () => play([{ freq: 620, to: 320, at: 0, len: 0.09 }]);
export const playTap = () => play([{ freq: 740, to: 520, at: 0, len: 0.05, gain: 0.07 }]);

/** A rising third. */
export const playCorrect = () =>
  play([
    { freq: 587.33, at: 0, len: 0.1 },
    { freq: 880, at: 0.08, len: 0.16 },
  ]);

/** A falling second: clearly not a failure fanfare, just a nudge. */
export const playWrong = () =>
  play([
    { freq: 320, at: 0, len: 0.1 },
    { freq: 240, at: 0.07, len: 0.16 },
  ]);

/** Three notes up, for finishing a quiz. */
export const playComplete = () =>
  play([
    { freq: 523.25, at: 0, len: 0.12 },
    { freq: 659.25, at: 0.1, len: 0.12 },
    { freq: 783.99, at: 0.2, len: 0.24 },
  ]);
