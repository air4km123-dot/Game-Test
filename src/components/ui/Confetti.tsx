import { useMemo } from "react";

const COLORS = ["#ef4444", "#fbbf24", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];

interface ConfettiProps {
  count?: number;
}

export function Confetti({ count = 24 }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1 + Math.random() * 0.6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.5,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
