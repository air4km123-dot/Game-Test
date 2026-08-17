import { useEffect, useState } from "react";
import { Modal } from "./ui/Modal";
import type { Player, Round } from "../types";

interface EditRoundModalProps {
  open: boolean;
  round: Round | null;
  allPlayers: Player[];
  onClose: () => void;
  onSave: (input: { playerIds: string[]; winnerId: string }) => void;
}

export function EditRoundModal({ open, round, allPlayers, onClose, onSave }: EditRoundModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  useEffect(() => {
    if (open && round) {
      setSelected(round.playerIds);
      setWinnerId(round.winnerId);
    }
  }, [open, round]);

  if (!round) return null;

  const togglePlayer = (id: string) => {
    setSelected((prev) => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter((p) => p !== id) : [...prev, id];
      if (isSelected && winnerId === id) setWinnerId(null);
      return next;
    });
  };

  const canSave = selected.length >= 2 && !!winnerId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`✏️ แก้ไขรอบ ${round.roundNumber}`}
      footer={
        <button
          disabled={!canSave}
          onClick={() => {
            if (!winnerId) return;
            onSave({ playerIds: selected, winnerId });
            onClose();
          }}
          className="w-full h-14 rounded-2xl bg-uno-blue text-white text-lg font-bold shadow-cookie-sm active:scale-95 transition-transform disabled:opacity-40"
        >
          บันทึกการแก้ไข
        </button>
      }
    >
      <p className="text-xs font-bold text-choc-400 mb-2">ผู้เล่นในรอบนี้</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {allPlayers.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => togglePlayer(p.id)}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 border-2 transition-all active:scale-95 ${
                isSelected ? "bg-white shadow-cookie-sm" : "bg-cookie-100/60 border-dashed opacity-60"
              }`}
              style={{ borderColor: isSelected ? p.color : "#e5d4b8" }}
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="font-bold text-choc-800 text-sm truncate flex-1 text-left">{p.name}</span>
              {isSelected && <span className="text-xs">✓</span>}
            </button>
          );
        })}
      </div>

      {selected.length < 2 && (
        <p className="text-center text-sm font-bold text-uno-red-dark bg-uno-red/10 rounded-xl py-2 mb-4">
          ต้องมีผู้เล่นอย่างน้อย 2 คน
        </p>
      )}

      {selected.length >= 2 && (
        <>
          <p className="text-xs font-bold text-choc-400 mb-2">ใครชนะรอบนี้?</p>
          <div className="grid grid-cols-2 gap-2">
            {allPlayers
              .filter((p) => selected.includes(p.id))
              .map((p) => {
                const isWinner = winnerId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setWinnerId(p.id)}
                    className={`relative flex flex-col items-center gap-1 rounded-2xl px-3 py-3 border-2 transition-all active:scale-95 ${
                      isWinner
                        ? "bg-uno-yellow/25 border-uno-yellow shadow-cookie-sm"
                        : "bg-white border-cookie-200"
                    }`}
                  >
                    {isWinner && <span className="absolute -top-2 -right-1 text-lg">👑</span>}
                    <span className="text-2xl">{p.emoji}</span>
                    <span className="font-bold text-choc-800 text-xs truncate w-full text-center">
                      {p.name}
                    </span>
                  </button>
                );
              })}
          </div>
        </>
      )}
    </Modal>
  );
}
