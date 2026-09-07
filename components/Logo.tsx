/**
 * SmartPrep AI's mark: a graduation cap seen from above.
 *
 * The board is an isometric projection of a square — the same matrix is applied
 * to the S inside it, so the letter sits on the board's own 30° grid rather than
 * being laid flat on top of it.
 *
 * The S is cut out with a mask rather than filled, so it is a real hole: the
 * ground shows through and one mark works on cream, on brown, or on anything
 * else, with no second asset for dark mode. The board takes currentColor; only
 * the tassel carries the accent.
 *
 * Every instance draws the identical mask, so they can share one id safely.
 */

const MASK_ID = "smartprep-cap";

/** Maps a square onto the board's isometric plane. */
const ISO = "matrix(0.866,0.5,-0.866,0.5,0,0)";

export function LogoMark({ size = 32, bold = false }: { size?: number; bold?: boolean }) {
  // Small renderings need a heavier cut, or the S closes up.
  const cut = bold ? 14 : 11;
  const capWeight = bold ? 11 : 9;

  return (
    <svg
      width={size}
      height={(size * 104) / 116}
      viewBox="-58 -52 116 104"
      fill="none"
      role="img"
      aria-label="SmartPrep AI"
      style={{ flexShrink: 0, display: "block", overflow: "visible" }}
    >
      <defs>
        <mask id={MASK_ID}>
          <g transform={ISO}>
            <rect x="-30" y="-30" width="60" height="60" fill="#fff" />
            <path
              d="M16,-16 L-10,-16 L-10,0 L10,0 L10,16 L-16,16"
              stroke="#000"
              strokeWidth={cut}
              fill="none"
              strokeLinecap="square"
            />
          </g>
        </mask>
      </defs>

      {/* The cap beneath the board. */}
      <path
        d="M-27,10 L-27,26 L0,42 L27,26 L27,10"
        stroke="currentColor"
        strokeWidth={capWeight}
        fill="none"
        strokeLinejoin="round"
      />

      {/* The board, with the S taken out of it. */}
      <rect x="-58" y="-52" width="116" height="104" fill="currentColor" mask={`url(#${MASK_ID})`} />

      {/* Tassel. */}
      <path d="M-49,2 L-49,20" stroke="var(--accent, #FF6037)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="-49" cy="24" r="4.5" fill="var(--accent, #FF6037)" />
      <path d="M-49,28 L-54,42 L-44,42 Z" fill="var(--accent, #FF6037)" />
    </svg>
  );
}

/** Mark plus wordmark, as used in navigation. */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={size} />
      <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
        Smart<span style={{ color: "var(--accent)" }}>Prep</span> AI
      </span>
    </span>
  );
}
