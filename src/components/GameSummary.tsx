import { useState } from "react";
import { useGames } from "../context/GamesContext";
import { deriveGame } from "../lib/calculations";
import { buildShareText, shareOrCopy } from "../lib/share";
import { PlayerStats } from "./PlayerStats";
import { SettlementList } from "./SettlementList";
import { EmptyState } from "./ui/EmptyState";
import { Toast } from "./ui/Toast";

interface GameSummaryProps {
  gameId: string;
}

export function GameSummary({ gameId }: GameSummaryProps) {
  const { getGame, toggleSettlement } = useGames();
  const game = getGame(gameId);
  const [toast, setToast] = useState<string | null>(null);

  if (!game) return null;

  if (game.rounds.length === 0) {
    return (
      <div className="px-5 py-4">
        <EmptyState emoji="🍪" title="ยังไม่มีใครติดคุกกี้" description="เล่นรอบแรกแล้วมาดูกัน 😏" />
      </div>
    );
  }

  const { balances, stats, settlements } = deriveGame(game);

  const sortedByNet = [...game.players].sort((a, b) => (balances[b.id] ?? 0) - (balances[a.id] ?? 0));

  const handleShare = async () => {
    const text = buildShareText(game, balances, settlements);
    const result = await shareOrCopy(text, `เคลียร์คุกกี้ - ${game.name}`);
    if (result === "copied") setToast("คัดลอกสรุปแล้ว 📋");
    if (result === "shared") setToast("แชร์สำเร็จ 🎉");
  };

  return (
    <div className="px-5 py-4 pb-8">
      <Toast message={toast} emoji="🍪" onDone={() => setToast(null)} />

      <h2 className="text-lg font-extrabold text-choc-800 font-display mb-1">🍪 สรุปเกมทั้งหมด</h2>
      <p className="text-xs text-choc-400 mb-4">รวม {game.rounds.length} รอบ</p>

      <button
        onClick={handleShare}
        className="w-full h-14 rounded-2xl bg-uno-blue text-white font-bold shadow-cookie-sm active:scale-95 transition-transform mb-6 flex items-center justify-center gap-2"
      >
        📤 แชร์สรุป
      </button>

      <section className="mb-6">
        <h3 className="text-sm font-bold text-choc-500 mb-2.5">ยอดคุกกี้สุทธิ</h3>
        <div className="flex flex-col gap-2">
          {sortedByNet.map((p) => {
            const net = balances[p.id] ?? 0;
            const isZero = net === 0;
            const isPositive = net > 0;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 border ${
                  isZero
                    ? "bg-cookie-100/60 border-cookie-200"
                    : isPositive
                      ? "bg-uno-green/10 border-uno-green/30"
                      : "bg-uno-red/10 border-uno-red/30"
                }`}
              >
                <span className="text-xl">{p.emoji}</span>
                <span className="font-bold text-choc-800 flex-1 truncate">{p.name}</span>
                <span
                  className={`font-extrabold ${
                    isZero ? "text-choc-400" : isPositive ? "text-uno-green-dark" : "text-uno-red-dark"
                  }`}
                >
                  {isZero ? "0 🍪 — เคลียร์แล้ว" : `${isPositive ? "+" : ""}${net} 🍪`}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-sm font-bold text-choc-500 mb-2.5">ต้องเคลียร์</h3>
        <SettlementList
          players={game.players}
          settlements={settlements}
          onToggle={(from, to) => toggleSettlement(gameId, from, to)}
        />
      </section>

      <section>
        <h3 className="text-sm font-bold text-choc-500 mb-2.5">สถิติผู้เล่น</h3>
        <PlayerStats players={game.players} stats={stats} />
      </section>
    </div>
  );
}
