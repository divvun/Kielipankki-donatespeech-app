import { useEffect, useRef, useState } from "react";

const FLAG_COLORS = ["#fece04", "#0035ad", "#00722a", "#db241f"];
const FLAG_SHADOWS = [
  "0 4px 20px rgba(254,206,4,0.35)",
  "0 4px 20px rgba(0,53,173,0.35)",
  "0 4px 20px rgba(0,114,42,0.35)",
  "0 4px 20px rgba(219,36,31,0.35)",
];
const BAR_CONFIG = [
  { baseH: 60, amp: 30, freq: 0.8, phase: 0 },
  { baseH: 80, amp: 35, freq: 0.9, phase: 1.2 },
  { baseH: 70, amp: 28, freq: 0.75, phase: 2.5 },
  { baseH: 55, amp: 32, freq: 0.85, phase: 3.8 },
];

export function SamiBarAnimation() {
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const [visibleBars, setVisibleBars] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Stagger entrance — use state to trigger CSS transition
    BAR_CONFIG.forEach((_, i) => {
      const t = setTimeout(
        () => {
          setVisibleBars((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        },
        400 + i * 150,
      );
      timeouts.push(t);
    });

    // Start wave animation after all bars have appeared
    const waveDelay = 400 + 4 * 150 + 400;
    const waveTimeout = setTimeout(() => {
      startRef.current = 0;
      const bars = barsRef.current;

      const animLoop = (timestamp: number) => {
        if (!startRef.current) startRef.current = timestamp;
        const elapsed = (timestamp - startRef.current) / 1000;

        bars.forEach((bar, i) => {
          if (!bar) return;
          const c = BAR_CONFIG[i];
          const w1 = Math.sin(elapsed * c.freq + c.phase);
          const w2 = Math.sin(elapsed * c.freq * 0.6 + c.phase * 1.4) * 0.4;
          const h = c.baseH + c.amp * ((w1 + w2) / 1.4);
          bar.style.height = `${h}px`;
        });

        rafRef.current = requestAnimationFrame(animLoop);
      };

      rafRef.current = requestAnimationFrame(animLoop);
    }, waveDelay);
    timeouts.push(waveTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="flex items-center justify-center gap-1.5 h-[160px] relative z-[1]">
      {BAR_CONFIG.map((config, i) => (
        <div
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
          style={{
            width: "20px",
            height: `${config.baseH}px`,
            borderRadius: "44px",
            background: FLAG_COLORS[i],
            boxShadow: FLAG_SHADOWS[i],
            flexShrink: 0,
            opacity: visibleBars[i] ? 1 : 0,
            transform: visibleBars[i] ? "scale(1)" : "scale(0)",
            transition:
              "opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      ))}
    </div>
  );
}
