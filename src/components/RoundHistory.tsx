import { useMemo, useState } from "react";
import { useGames } from "../context/GamesContext";
import { EmptyState } from "./ui/EmptyState";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { EditRoundModal } from "./EditRoundModal";
import { playerById } from "../lib/calculations";
import type { Round } from "../types";

interface RoundHistoryProps {
  gameId: string;
}

export function RoundHistory({ gameId }: RoundHistoryProps) {
  const { getGame, editRound, deleteRound } = useGames();
  const game = getGame(gameId);
  const [editing, setEditing] = useState<Round | null>(null);
  const [deleting, setDeleting] = useState<Round | null>(null);

  const roundsDesc = useMemo(
    () => (game ? [...game.rounds].sort((a, b) => b.roundNumber - a.roundNumber) : []),
    [game],
  );

  if (!game) return null;

  if (roundsDesc.length === 0) {
    return (
      <div className="px-5 py-4">
        <EmptyState emoji="🍪" title="ยังไม่มีใครติดคุกกี้" description="เล่นรอบแรกแล้วมาดูกัน 😏" />
      </div>
    );
  }

  return (
    <div className="px-5 py-4 pb-8">
      <h2 className="text-base font-bold text-choc-700 mb-3">ประวัติรอบ ({roundsDesc.length})</h2>
      <div className="flex flex-col gap-3">
        {roundsDesc.map((round) => {
          const winner = playerById(game.players, round.winnerId);
          const loserCount = round.playerIds.length - 1;
          const received = loserCount * round.cookiePerLoser;
          const others = round.playerIds
            .map((id) => playerById(game.players, id))
            .filter((p) => p && p.id !== round.winnerId);

          return (
            <div key={round.id} className="rounded-2xl bg-white border border-cookie-200 shadow-cookie-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold text-choc-400">รอบ {round.roundNumber}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(round)}
                    aria-label="แก้ไขรอบ"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-cookie-100 text-choc-600 active:scale-90 transition-transform"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setDeleting(round)}
                    aria-label="ลบรอบ"
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-uno-red/10 text-uno-red-dark active:scale-90 transition-transform"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className="font-bold text-choc-800 flex items-center gap-1.5 mb-1">
                🏆 {winner ? `${winner.emoji} ${winner.name}` : "?"}
              </p>
              <p className="text-xs text-choc-400 mb-2">
                ผู้เล่น:{" "}
                {round.playerIds
                  .map((id) => playerById(game.players, id))
                  .filter(Boolean)
                  .map((p) => p!.name)
                  .join(" • ")}
              </p>
              <p className="text-sm font-bold text-uno-green-dark">
                {winner?.name ?? "?"}ได้รับ {received} 🍪
                <span className="text-choc-400 font-normal"> จาก {others.length} คน</span>
              </p>
            </div>
          );
        })}
      </div>

      <EditRoundModal
        open={!!editing}
        round={editing}
        allPlayers={game.players}
        onClose={() => setEditing(null)}
        onSave={(input) => {
          if (editing) editRound(gameId, editing.id, input);
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title={`ลบรอบ ${deleting?.roundNumber ?? ""} จริงไหม?`}
        description="ยอดคุกกี้ทั้งหมดของเกมนี้จะถูกคำนวณใหม่"
        confirmLabel="ลบรอบ"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteRound(gameId, deleting.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}
