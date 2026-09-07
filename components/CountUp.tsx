"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Counts from zero to `value` the first time it scrolls into view.
 *
 * Two details do most of the work for smoothness. The easing is easeOutExpo,
 * which covers most of the distance early and then settles for a long time, so
 * the number arrives rather than stopping dead. And the digits are tabular, so
 * a figure going 6 -> 71 -> 178 does not change width as it climbs and shove
 * the label around underneath it.
 *
 * Someone who has asked for reduced motion gets the final number immediately.
 */
export function CountUp({
  value,
  duration = 1500,
  delay = 0,
}: {
  value: number;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      queueMicrotask(() => setShown(value));
      return;
    }

    let frame = 0;
    let startedAt = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        // Count once. Re-running it every time the section scrolls past would
        // be a distraction, not a flourish.
        observer.disconnect();

        const step = (now: number) => {
          if (!startedAt) startedAt = now + delay;
          const elapsed = now - startedAt;

          if (elapsed < 0) {
            frame = requestAnimationFrame(step);
            return;
          }

          const t = Math.min(1, elapsed / duration);
          const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          setShown(Math.round(value * eased));

          if (t < 1) frame = requestAnimationFrame(step);
        };

        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration, delay]);

  return (
    <span ref={ref} className="tabular">
      {shown.toLocaleString("en-GB")}
    </span>
  );
}
