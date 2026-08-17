import { useState } from "react";
import { useGames } from "../context/GamesContext";
import type { GameTab } from "./BottomNavigation";
import { GamePlay } from "./GamePlay";
import { RoundHistory } from "./RoundHistory";
import { GameSummary } from "./GameSummary";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Modal } from "./ui/Modal";

interface GameShellProps {
  gameId: string;
  tab: GameTab;
  onBack: () => void;
}

export function GameShell({ gameId, tab, onBack }: GameShellProps) {
  const { getGame, finishGame, reopenGame, deleteGame, renameGame } = useGames();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const game = getGame(gameId);

  if (!game) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-choc-500 font-bold">ไม่พบเกมนี้</p>
        <button
          onClick={onBack}
          className="h-12 px-6 rounded-2xl bg-uno-blue text-white font-bold active:scale-95 transition-transform"
        >
          กลับหน้าแรก
        </button>
      </div>
    );
  }

  const isActive = game.status === "active";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="flex items-center gap-2 px-3 pt-4 pb-3 shrink-0 border-b border-cookie-200 bg-cookie-50">
        <button
          onClick={onBack}
          aria-label="กลับ"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-cookie-200 text-choc-700 text-lg active:scale-90 transition-transform shrink-0"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-choc-800 truncate leading-tight">{game.name}</p>
          <p className="text-[11px] text-choc-400 leading-tight">
            {isActive ? "🟢 กำลังเล่น" : "🏁 จบแล้ว"} · รอบที่ {game.rounds.length}
          </p>
        </div>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="เมนู"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-cookie-200 text-choc-700 text-lg active:scale-90 transition-transform shrink-0"
        >
          ⋮
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {tab === "play" && <GamePlay gameId={gameId} />}
        {tab === "history" && <RoundHistory gameId={gameId} />}
        {tab === "summary" && <GameSummary gameId={gameId} />}
      </div>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="⚙️ จัดการเกม">
        <div className="flex flex-col gap-2 pb-2">
          <button
            onClick={() => {
              setNameDraft(game.name);
              setRenaming(true);
              setMenuOpen(false);
            }}
            className="w-full h-14 rounded-2xl bg-cookie-100 text-choc-700 font-bold flex items-center gap-3 px-4 active:scale-95 transition-transform"
          >
            ✏️ แก้ไขชื่อเกม
          </button>
          {isActive ? (
            <button
              onClick={() => {
                setMenuOpen(false);
                setConfirmFinish(true);
              }}
              className="w-full h-14 rounded-2xl bg-cookie-100 text-choc-700 font-bold flex items-center gap-3 px-4 active:scale-95 transition-transform"
            >
              🏁 จบเกม
            </button>
          ) : (
            <button
              onClick={() => {
                reopenGame(gameId);
                setMenuOpen(false);
              }}
              className="w-full h-14 rounded-2xl bg-cookie-100 text-choc-700 font-bold flex items-center gap-3 px-4 active:scale-95 transition-transform"
            >
              🔓 เปิดเกมอีกครั้ง
            </button>
          )}
          <button
            onClick={() => {
              setMenuOpen(false);
              setConfirmDelete(true);
            }}
            className="w-full h-14 rounded-2xl bg-uno-red/10 text-uno-red-dark font-bold flex items-center gap-3 px-4 active:scale-95 transition-transform"
          >
            🗑️ ลบเกม
          </button>
        </div>
      </Modal>

      <Modal
        open={renaming}
        onClose={() => setRenaming(false)}
        title="✏️ แก้ไขชื่อเกม"
        footer={
          <button
            onClick={() => {
              renameGame(gameId, nameDraft);
              setRenaming(false);
            }}
            className="w-full h-14 rounded-2xl bg-uno-blue text-white text-lg font-bold shadow-cookie-sm active:scale-95 transition-transform"
          >
            บันทึก
          </button>
        }
      >
        <input
          autoFocus
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          className="w-full h-14 rounded-2xl border-2 border-cookie-300 bg-white px-4 text-base font-bold text-choc-800 focus:outline-none focus:border-uno-blue"
        />
      </Modal>

      <ConfirmDialog
        open={confirmFinish}
        danger={false}
        title="จบเกมนี้เลยไหม?"
        description="คุณยังดูประวัติและสรุปยอดได้เหมือนเดิม แค่จะย้ายไปอยู่ในประวัติเกม"
        confirmLabel="จบเกม"
        onCancel={() => setConfirmFinish(false)}
        onConfirm={() => {
          finishGame(gameId);
          setConfirmFinish(false);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="ลบเกมนี้จริงไหม?"
        description="ประวัติและยอดคุกกี้ทั้งหมดของเกมนี้จะหายไป"
        confirmLabel="ลบเกม"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteGame(gameId);
          onBack();
        }}
      />
    </div>
  );
}
