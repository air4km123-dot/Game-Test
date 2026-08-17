import { useEffect, useState } from "react";
import { Modal } from "./ui/Modal";
import { COLOR_PRESETS, EMOJI_PRESETS, randomColor, randomEmoji } from "../lib/players";
import type { Player } from "../types";

interface PlayerModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: { name: string; emoji: string; color: string }) => void;
  existingEmojis: string[];
  editingPlayer?: Player | null;
}

export function PlayerModal({ open, onClose, onSave, existingEmojis, editingPlayer }: PlayerModalProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🐶");
  const [color, setColor] = useState(COLOR_PRESETS[0].hex);

  useEffect(() => {
    if (!open) return;
    if (editingPlayer) {
      setName(editingPlayer.name);
      setEmoji(editingPlayer.emoji);
      setColor(editingPlayer.color);
    } else {
      setName("");
      setEmoji(randomEmoji(existingEmojis));
      setColor(randomColor());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingPlayer]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji, color });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingPlayer ? "แก้ไขผู้เล่น" : "🙋 เพิ่มผู้เล่น"}
      footer={
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full h-14 rounded-2xl bg-uno-blue text-white text-lg font-bold shadow-cookie-sm active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
        >
          {editingPlayer ? "บันทึก" : "เพิ่มผู้เล่น"}
        </button>
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-cookie-sm"
          style={{ background: `${color}33`, border: `2px solid ${color}` }}
        >
          {emoji}
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อเล่น เช่น เม, เจม"
          className="flex-1 h-14 rounded-2xl border-2 border-cookie-300 bg-white px-4 text-base font-bold text-choc-800 placeholder:text-choc-300 focus:outline-none focus:border-uno-blue"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
        />
      </div>

      <p className="text-xs font-bold text-choc-400 mb-2">เลือกอิโมจิ</p>
      <div className="grid grid-cols-8 gap-2 mb-4">
        {EMOJI_PRESETS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className={`aspect-square rounded-xl flex items-center justify-center text-xl transition-transform active:scale-90 ${
              emoji === e ? "bg-uno-yellow/40 ring-2 ring-uno-yellow scale-110" : "bg-cookie-100"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <p className="text-xs font-bold text-choc-400 mb-2">เลือกสี</p>
      <div className="grid grid-cols-8 gap-2">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.id}
            onClick={() => setColor(c.hex)}
            aria-label={c.label}
            className={`aspect-square rounded-full transition-transform active:scale-90 ${
              color === c.hex ? "ring-2 ring-offset-2 ring-choc-700 scale-110" : ""
            }`}
            style={{ background: c.hex }}
          />
        ))}
      </div>
    </Modal>
  );
}
