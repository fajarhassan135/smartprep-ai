/**
 * SmartPrep AI's mark.
 *
 * Contour lines rippling out from a single point in the shape of a head, ringed
 * by two orbits: a mind widening around an idea.
 *
 * The outer line carries the head, neck and shoulders; the inner rings follow
 * just the skull, the way contours on a map simplify as they climb. Drawing all
 * six from one scaled outline made it read as a bullseye instead of a head, so
 * the silhouette and the ripples are separate shapes.
 *
 * Only the core and the orbits are accent-coloured. Everything else is
 * currentColor, so the mark takes the text colour it sits in and needs no
 * second asset for dark mode.
 */

/** The head, neck and shoulders. */
const SILHOUETTE =
  "M0,-40 C15,-40 26,-27 26,-11 C26,0 22,9 15,15 L15,24 C15,26 16,28 19,29 " +
  "C29,33 35,38 38,44 L-38,44 C-35,38 -29,33 -19,29 C-16,28 -15,26 -15,24 " +
  "L-15,15 C-22,9 -26,0 -26,-11 C-26,-27 -15,-40 0,-40 Z";

/**
 * The skull alone, repeated inward as ripples. Centred on the origin so that
 * scaling shrinks it towards its own middle: scaling the head-positioned shape
 * instead pulled every ring down towards the neck.
 */
const RIPPLE = "M0,-23 C12,-23 21,-13 21,0 C21,13 12,23 0,23 C-12,23 -21,13 -21,0 C-21,-13 -12,-23 0,-23 Z";

/** Where the skull's centre sits in the viewBox. */
const SKULL_Y = -13;

const RIPPLES = [1, 0.78, 0.57, 0.37];

export function LogoMark({ size = 32, spin = true }: { size?: number; spin?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      fill="none"
      role="img"
      aria-label="SmartPrep AI"
      style={{ flexShrink: 0, display: "block" }}
    >
      {/* Orbits sit behind the head. Kept inside the viewBox so the mark never
          bleeds into whatever it is placed next to. */}
      <g
        stroke="var(--accent, #FF6037)"
        strokeWidth="1.5"
        className={spin ? "logo-orbit" : undefined}
      >
        <ellipse cx="0" cy="0" rx="45" ry="17" transform="rotate(-20)" opacity="0.9" />
        <ellipse cx="0" cy="0" rx="45" ry="17" transform="rotate(34)" opacity="0.45" />
      </g>

      <g stroke="currentColor" strokeLinejoin="round" strokeLinecap="round">
        <path d={SILHOUETTE} strokeWidth="3" opacity="0.95" />
        {RIPPLES.map((scale, i) => (
          <path
            key={scale}
            d={RIPPLE}
            transform={`translate(0 ${SKULL_Y}) scale(${scale})`}
            strokeWidth={3 / scale}
            opacity={0.3 + i * 0.16}
          />
        ))}
      </g>

      {/* The idea at the centre. */}
      <circle cx="0" cy={SKULL_Y} r="3.6" fill="var(--accent, #FF6037)" />
    </svg>
  );
}

/** Mark plus wordmark, as used in navigation. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={size} />
      <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
        Smart<span style={{ color: "var(--accent)" }}>Prep</span> AI
      </span>
    </span>
  );
}
