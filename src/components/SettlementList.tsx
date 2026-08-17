import type { Player, SettlementEntry } from "../types";
import { playerById } from "../lib/calculations";
import { EmptyState } from "./ui/EmptyState";

interface SettlementListProps {
  players: Player[];
  settlements: SettlementEntry[];
  onToggle: (fromPlayerId: string, toPlayerId: string) => void;
}

export function SettlementList({ players, settlements, onToggle }: SettlementListProps) {
  if (settlements.length === 0) {
    return (
      <EmptyState
        emoji="🎉"
        title="หนี้คุกกี้เคลียร์หมดแล้ว!"
        description="วันนี้ไม่มีใครหนีกลับบ้านพร้อมหนี้ 🍪"
      />
    );
  }

  const settledCount = settlements.filter((s) => s.settled).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-choc-400">
          เคลียร์แล้ว {settledCount} / {settlements.length} รายการ
        </p>
        <div className="w-24 h-2 rounded-full bg-cookie-200 overflow-hidden">
          <div
            className="h-full bg-uno-green transition-all"
            style={{ width: `${(settledCount / settlements.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {settlements.map((s) => {
          const from = playerById(players, s.fromPlayerId);
          const to = playerById(players, s.toPlayerId);
          return (
            <div
              key={`${s.fromPlayerId}-${s.toPlayerId}`}
              className={`rounded-2xl border p-3.5 flex items-center gap-3 transition-colors ${
                s.settled ? "bg-uno-green/10 border-uno-green/40" : "bg-white border-cookie-200"
              }`}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0 text-sm font-bold text-choc-800">
                <span className="truncate">
                  {from?.emoji} {from?.name}
                </span>
                <span className="text-choc-300">→</span>
                <span className="truncate">
                  {to?.emoji} {to?.name}
                </span>
                <span className="ml-auto shrink-0 text-uno-orange font-extrabold">{s.amount} 🍪</span>
              </div>
              <button
                onClick={() => onToggle(s.fromPlayerId, s.toPlayerId)}
                className={`shrink-0 h-9 px-3 rounded-xl text-xs font-bold active:scale-95 transition-transform ${
                  s.settled ? "bg-uno-green text-white" : "bg-cookie-200 text-choc-500"
                }`}
              >
                {s.settled ? "เคลียร์แล้ว ✓" : "ยังไม่เคลียร์"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
