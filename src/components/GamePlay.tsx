import { useMemo, useState } from "react";
import { useGames } from "../context/GamesContext";
import { PlayerModal } from "./PlayerModal";
import { EmptyState } from "./ui/EmptyState";
import { Toast } from "./ui/Toast";
import { Confetti } from "./ui/Confetti";
import { COOKIE_PER_LOSER } from "../lib/calculations";

interface GamePlayProps {
  gameId: string;
}

export function GamePlay({ gameId }: GamePlayProps) {
  const { getGame, setPlayerActive, addRound, addPlayer } = useGames();
  const game = getGame(gameId);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [toast, setToast] = useState<{ title: string; sub: string } | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const activePlayers = useMemo(() => game?.players.filter((p) => p.active) ?? [], [game]);

  if (!game) return null;

  const canSave = activePlayers.length >= 2 && !!winnerId;

  const handleToggle = (playerId: string, currentlyActive: boolean) => {
    setPlayerActive(gameId, playerId, !currentlyActive);
    if (currentlyActive && winnerId === playerId) {
      setWinnerId(null);
    }
  };

  const handleSave = () => {
    if (!canSave || !winnerId) return;
    const playerIds = activePlayers.map((p) => p.id);
    addRound(gameId, { playerIds, winnerId });

    const winner = activePlayers.find((p) => p.id === winnerId);
    const loserCount = playerIds.length - 1;
    setToast({
      title: `🎉 ${winner?.name ?? ""}ชนะรอบนี้!`,
      sub: `ได้รับ ${loserCount * COOKIE_PER_LOSER} 🍪 จากผู้เล่น ${loserCount} คน`,
    });
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1200);
    setWinnerId(null);
  };

  return (
    <div className="relative px-5 py-4 pb-8">
      {celebrate && <Confetti />}
      <Toast
        message={toast?.title ?? null}
        subMessage={toast?.sub}
        onDone={() => setToast(null)}
      />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-choc-700">ผู้เล่นรอบนี้</h2>
        <span className="text-xs font-bold text-choc-400">รอบที่ {game.rounds.length + 1}</span>
      </div>

      {game.players.length === 0 ? (
        <EmptyState
          emoji="🙋"
          title="ยังไม่มีผู้เล่น"
          description="เพิ่มผู้เล่นเพื่อเริ่มรอบแรก"
          action={
            <button
              onClick={() => setShowAddPlayer(true)}
              className="h-12 px-6 rounded-2xl bg-uno-blue text-white font-bold active:scale-95 transition-transform"
            >
              + เพิ่มผู้เล่น
            </button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {game.players.map((p) => (
              <button
                key={p.id}
                onClick={() => handleToggle(p.id, p.active)}
                className={`relative flex items-center gap-2 rounded-2xl px-3 py-3 border-2 transition-all active:scale-95 ${
                  p.active
                    ? "bg-white shadow-cookie-sm"
                    : "bg-cookie-100/60 border-dashed opacity-60"
                }`}
                style={{ borderColor: p.active ? p.color : "#e5d4b8" }}
              >
                <span className="text-2xl shrink-0">{p.emoji}</span>
                <span className="font-bold text-choc-800 truncate flex-1 text-left text-sm">{p.name}</span>
                {p.active && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] shrink-0"
                    style={{ background: p.color }}
                  >
                    ✓
                  </span>
                )}
              </button>
            ))}

            <button
              onClick={() => setShowAddPlayer(true)}
              className="flex items-center justify-center gap-1.5 rounded-2xl px-3 py-3 border-2 border-dashed border-cookie-300 text-choc-400 font-bold active:scale-95 transition-transform"
            >
              <span className="text-xl">＋</span> เพิ่มผู้เล่น
            </button>
          </div>

          {activePlayers.length < 2 && (
            <p className="text-center text-sm font-bold text-uno-red-dark bg-uno-red/10 rounded-xl py-2 mb-4">
              ต้องมีผู้เล่นอย่างน้อย 2 คน
            </p>
          )}

          {activePlayers.length >= 2 && (
            <>
              <h2 className="text-base font-bold text-choc-700 mb-3 mt-5">ใครชนะรอบนี้?</h2>
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {activePlayers.map((p) => {
                  const isWinner = winnerId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setWinnerId(p.id)}
                      className={`relative flex flex-col items-center gap-1 rounded-2xl px-3 py-4 border-2 transition-all active:scale-95 ${
                        isWinner
                          ? "bg-uno-yellow/25 border-uno-yellow shadow-cookie scale-[1.03]"
                          : "bg-white border-cookie-200"
                      }`}
                    >
                      {isWinner && <span className="absolute -top-2.5 -right-2 text-2xl">👑</span>}
                      <span className="text-3xl">{p.emoji}</span>
                      <span className="font-bold text-choc-800 text-sm truncate w-full text-center">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full h-16 rounded-3xl bg-uno-green text-white text-xl font-extrabold shadow-cookie active:scale-95 transition-transform disabled:opacity-35 disabled:active:scale-100 sticky bottom-3"
          >
            🍪 บันทึกรอบ
          </button>
        </>
      )}

      <PlayerModal
        open={showAddPlayer}
        onClose={() => setShowAddPlayer(false)}
        existingEmojis={game.players.map((p) => p.emoji)}
        onSave={(input) => addPlayer(gameId, input)}
      />
    </div>
  );
}
