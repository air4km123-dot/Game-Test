import { useState } from "react";
import { useGames } from "../context/GamesContext";
import { NewGameModal } from "./NewGameModal";
import { EmptyState } from "./ui/EmptyState";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { SyncChip } from "./SyncStatus";
import type { GameTab } from "./BottomNavigation";
import type { Game } from "../types";

interface HomeProps {
  onOpenGame: (gameId: string, tab?: GameTab) => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}

function GameCard({
  game,
  onOpen,
  onDelete,
  active,
}: {
  game: Game;
  onOpen: () => void;
  onDelete: () => void;
  active: boolean;
}) {
  return (
    <div className="relative rounded-2xl bg-white shadow-cookie-sm border border-cookie-200 p-4 mb-3 overflow-hidden">
      {active && (
        <div className="absolute top-0 right-0 bg-uno-green text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl">
          กำลังเล่น
        </div>
      )}
      {!active && (
        <div className="absolute top-0 right-0 bg-choc-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl">
          จบแล้ว
        </div>
      )}
      <button onClick={onOpen} className="block w-full text-left">
        <p className="font-bold text-choc-800 text-base pr-14 truncate">{game.name}</p>
        <p className="text-xs text-choc-400 mt-0.5">{formatDate(game.createdAt)}</p>
        <div className="flex items-center gap-3 mt-2 text-sm text-choc-500">
          <span>🎲 รอบที่ {game.rounds.length}</span>
          <span>👥 {game.players.length} คน</span>
        </div>
      </button>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onOpen}
          className="flex-1 h-10 rounded-xl bg-uno-blue text-white font-bold text-sm active:scale-95 transition-transform"
        >
          {active ? "เล่นต่อ" : "ดูเกม"}
        </button>
        <button
          onClick={onDelete}
          aria-label="ลบเกม"
          className="w-10 h-10 rounded-xl bg-cookie-100 text-uno-red-dark active:scale-90 transition-transform"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export function Home({ onOpenGame }: HomeProps) {
  const { activeGames, finishedGames, createGame, deleteGame } = useGames();
  const [showNewGame, setShowNewGame] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Game | null>(null);

  const handleCreate = (name: string) => {
    const game = createGame(name);
    setShowNewGame(false);
    onOpenGame(game.id);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-6">
      <header className="sticky top-0 z-10 flex items-center gap-2.5 px-4 py-3 bg-cookie-50/95 backdrop-blur border-b border-cookie-200">
        <span className="text-2xl leading-none shrink-0">🍪</span>
        <div className="min-w-0 leading-tight">
          <h1 className="text-base font-display font-extrabold text-choc-800 truncate">เคลียร์คุกกี้</h1>
          <p className="text-[11px] text-choc-400 font-bold truncate">หนี้คุกกี้ต้องเคลียร์</p>
        </div>
        <SyncChip />
      </header>

      <section className="px-5 pt-4">
        <h2 className="text-sm font-bold text-choc-500 mb-2">เกมที่กำลังเล่น</h2>
        {activeGames.length === 0 ? (
          <EmptyState
            emoji="🍪"
            title="ยังไม่มีหนี้คุกกี้"
            description="เริ่มเกมแรกกันเลย"
          />
        ) : (
          activeGames.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              active
              onOpen={() => onOpenGame(g.id, "play")}
              onDelete={() => setDeleteTarget(g)}
            />
          ))
        )}

        <button
          onClick={() => setShowNewGame(true)}
          className="w-full h-14 rounded-2xl bg-uno-green text-white text-base font-bold shadow-cookie-sm active:scale-95 transition-transform mt-1 mb-8"
        >
          + เริ่มเกมใหม่
        </button>
      </section>

      <section className="px-5">
        <h2 className="text-sm font-bold text-choc-500 mb-2">ประวัติเกม</h2>
        {finishedGames.length === 0 ? (
          <p className="text-sm text-choc-300 text-center py-6">ยังไม่มีเกมที่จบแล้ว</p>
        ) : (
          finishedGames.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              active={false}
              onOpen={() => onOpenGame(g.id, "summary")}
              onDelete={() => setDeleteTarget(g)}
            />
          ))
        )}
      </section>

      <NewGameModal open={showNewGame} onClose={() => setShowNewGame(false)} onCreate={handleCreate} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="ลบเกมนี้จริงไหม?"
        description="ประวัติและยอดคุกกี้ทั้งหมดของเกมนี้จะหายไป"
        confirmLabel="ลบเกม"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteGame(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
