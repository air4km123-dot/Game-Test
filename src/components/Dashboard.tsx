import { useMemo, useState } from "react";
import { useGames } from "../context/GamesContext";
import { computeDashboard, dateKey, roundDateBounds } from "../lib/dashboard";
import { Podium } from "./Podium";
import { EmptyState } from "./ui/EmptyState";

interface DashboardProps {
  onBack: () => void;
}

function shiftDays(ts: number, days: number): number {
  const d = new Date(ts);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

function formatKey(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}

export function Dashboard({ onBack }: DashboardProps) {
  const { games } = useGames();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const bounds = useMemo(() => roundDateBounds(games), [games]);
  const result = useMemo(() => computeDashboard(games, { from, to }), [games, from, to]);

  const now = Date.now();
  const today = dateKey(now);
  const presets = [
    { label: "ทั้งหมด", from: "", to: "" },
    { label: "วันนี้", from: today, to: today },
    { label: "7 วันล่าสุด", from: dateKey(shiftDays(now, -6)), to: today },
    { label: "เดือนนี้", from: `${today.slice(0, 7)}-01`, to: today },
  ];

  const hasData = games.some((g) => g.rounds.length > 0);
  const top = result.rows.slice(0, 3);
  const rest = result.rows.slice(3);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <header className="flex items-center gap-2 px-3 py-3 shrink-0 border-b border-cookie-200 bg-cookie-50">
        <button
          onClick={onBack}
          aria-label="กลับหน้าแรก"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-cookie-200 text-choc-700 text-lg active:scale-90 transition-transform shrink-0"
        >
          ←
        </button>
        <div className="min-w-0 leading-tight">
          <h1 className="font-display font-extrabold text-choc-800">🏆 แดชบอร์ดคุกกี้สะสม</h1>
          <p className="text-[11px] text-choc-400">รวมทุกเกมที่บันทึกไว้</p>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 pb-8">
        {!hasData ? (
          <EmptyState emoji="🍪" title="ยังไม่มีใครติดคุกกี้" description="เล่นรอบแรกแล้วมาดูกัน 😏" />
        ) : (
          <>
            <section className="rounded-2xl bg-white border border-cookie-200 shadow-cookie-sm p-3.5 mb-5">
              <p className="text-xs font-bold text-choc-500 mb-2">📅 เลือกช่วงวันที่</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {presets.map((p) => {
                  const active = p.from === from && p.to === to;
                  return (
                    <button
                      key={p.label}
                      onClick={() => {
                        setFrom(p.from);
                        setTo(p.to);
                      }}
                      className={`h-9 px-3.5 rounded-full text-xs font-bold active:scale-95 transition-transform ${
                        active ? "bg-uno-green text-white" : "bg-cookie-100 text-choc-600"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <label className="block min-w-0">
                  <span className="text-[11px] font-bold text-choc-400">ตั้งแต่</span>
                  <input
                    type="date"
                    value={from}
                    min={bounds.min ?? undefined}
                    max={to || bounds.max || undefined}
                    onChange={(e) => setFrom(e.target.value)}
                    className="mt-0.5 w-full min-w-0 h-11 rounded-xl border-2 border-cookie-300 bg-white px-2 text-sm font-bold text-choc-800 focus:outline-none focus:border-uno-blue"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="text-[11px] font-bold text-choc-400">ถึง</span>
                  <input
                    type="date"
                    value={to}
                    min={from || bounds.min || undefined}
                    max={bounds.max ?? undefined}
                    onChange={(e) => setTo(e.target.value)}
                    className="mt-0.5 w-full min-w-0 h-11 rounded-xl border-2 border-cookie-300 bg-white px-2 text-sm font-bold text-choc-800 focus:outline-none focus:border-uno-blue"
                  />
                </label>
              </div>
              <p className="text-[11px] text-choc-400 mt-2.5">
                {from || to
                  ? `${from ? formatKey(from) : "เริ่มต้น"} – ${to ? formatKey(to) : "ล่าสุด"}`
                  : bounds.min && bounds.max
                    ? `ทั้งหมด ${formatKey(bounds.min)} – ${formatKey(bounds.max)}`
                    : "ทั้งหมด"}
                {" · "}
                {result.dayCount} วัน · {result.gameCount} เกม · {result.roundCount} รอบ
              </p>
            </section>

            {result.rows.length === 0 ? (
              <EmptyState emoji="🗓️" title="ไม่มีรอบที่เล่นในช่วงนี้" description="ลองเลือกช่วงวันที่ใหม่ดูนะ" />
            ) : (
              <>
                <section className="mb-5">
                  <Podium top={top} />
                </section>

                {rest.length > 0 && (
                  <section>
                    <h2 className="text-sm font-bold text-choc-500 mb-2">อันดับอื่นๆ</h2>
                    <div className="flex flex-col gap-2">
                      {rest.map((row, i) => {
                        const netColor =
                          row.net > 0
                            ? "text-uno-green-dark"
                            : row.net < 0
                              ? "text-uno-red-dark"
                              : "text-choc-400";
                        return (
                          <div
                            key={row.key}
                            className="flex items-center gap-3 rounded-2xl bg-white border border-cookie-200 px-3.5 py-3"
                          >
                            <span className="w-6 text-center font-extrabold text-choc-400">{i + 4}</span>
                            <span className="text-2xl">{row.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-choc-800 truncate leading-tight">{row.name}</p>
                              <p className="text-[11px] text-choc-400 leading-tight">
                                ชนะ {row.won}/{row.played} รอบ · ได้ {row.received} · ให้ {row.given}
                              </p>
                            </div>
                            <span className={`font-extrabold ${netColor}`}>
                              {row.net > 0 ? "+" : ""}
                              {row.net} 🍪
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
