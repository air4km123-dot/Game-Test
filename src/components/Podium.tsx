import type { DashboardRow } from "../lib/dashboard";

interface PodiumProps {
  /** already sorted, best first */
  top: DashboardRow[];
}

const SLOTS = [
  // visual order on screen: 2nd, 1st, 3rd
  { place: 2, medal: "🥈", height: "h-20", bar: "#cbd5e1", text: "#475569" },
  { place: 1, medal: "🥇", height: "h-28", bar: "#fbbf24", text: "#78350f" },
  { place: 3, medal: "🥉", height: "h-14", bar: "#e0983c", text: "#fff" },
] as const;

function formatNet(net: number): string {
  return `${net > 0 ? "+" : ""}${net}`;
}

export function Podium({ top }: PodiumProps) {
  return (
    <div className="grid grid-cols-3 items-end gap-2 px-1">
      {SLOTS.map((slot) => {
        const row = top[slot.place - 1];
        if (!row) return <div key={slot.place} />;
        const netColor =
          row.net > 0 ? "text-uno-green-dark" : row.net < 0 ? "text-uno-red-dark" : "text-choc-400";
        return (
          <div key={slot.place} className="flex flex-col items-center min-w-0">
            <span className={`${slot.place === 1 ? "text-3xl" : "text-2xl"} leading-none`}>{slot.medal}</span>
            <span className={`${slot.place === 1 ? "text-4xl" : "text-3xl"} leading-none mt-1`}>{row.emoji}</span>
            <span className="font-bold text-choc-800 text-sm truncate max-w-full mt-1">{row.name}</span>
            <span className={`font-extrabold text-sm ${netColor}`}>{formatNet(row.net)} 🍪</span>
            <span className="text-[10px] text-choc-400 mb-1.5">
              ชนะ {row.won}/{row.played} รอบ
            </span>
            <div
              className={`${slot.height} w-full rounded-t-2xl flex items-start justify-center pt-2 text-2xl font-extrabold shadow-cookie-sm`}
              style={{ background: slot.bar, color: slot.text }}
            >
              {slot.place}
            </div>
          </div>
        );
      })}
    </div>
  );
}
