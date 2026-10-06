import { useEffect, useState } from "react";
import { Modal } from "./ui/Modal";

interface NewGameModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

function todayThaiSuggestion(): string {
  const now = new Date();
  const thaiMonths = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  return `UNO พักเที่ยง ${now.getDate()} ${thaiMonths[now.getMonth()]}`;
}

export function NewGameModal({ open, onClose, onCreate }: NewGameModalProps) {
  const suggestion = todayThaiSuggestion();
  const [name, setName] = useState(suggestion);
  const quickNames = [suggestion, "Friday UNO", "Lunch UNO"];

  // Re-prefill with today's date every time the modal opens (the date may have changed since last time).
  useEffect(() => {
    if (open) setName(todayThaiSuggestion());
  }, [open]);

  const handleCreate = () => {
    onCreate(name.trim() || suggestion);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🍪 เริ่มเกมใหม่"
      footer={
        <button
          onClick={handleCreate}
          className="w-full h-14 rounded-2xl bg-uno-green text-white text-lg font-bold shadow-cookie-sm active:scale-95 transition-transform"
        >
          เริ่มเกม
        </button>
      }
    >
      <label className="block text-sm font-bold text-choc-500 mb-2">ชื่อเกม</label>
      <input
        autoFocus
        onFocus={(e) => e.target.select()}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={suggestion}
        className="w-full h-14 rounded-2xl border-2 border-cookie-300 bg-white px-4 text-base font-bold text-choc-800 placeholder:text-choc-300 focus:outline-none focus:border-uno-blue mb-4"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
        }}
      />
      <p className="text-xs font-bold text-choc-400 mb-2">แนะนำ</p>
      <div className="flex flex-wrap gap-2">
        {quickNames.map((n) => (
          <button
            key={n}
            onClick={() => setName(n)}
            className="px-3 py-2 rounded-xl bg-cookie-200 text-choc-700 text-sm font-bold active:scale-95 transition-transform"
          >
            {n}
          </button>
        ))}
      </div>
    </Modal>
  );
}
