import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-choc-800/50 backdrop-blur-[2px] animate-[pop_0.2s_ease]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[480px] max-h-[88svh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-cookie-50 shadow-cookie animate-pop overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-lg font-bold text-choc-800 font-display">{title}</h2>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-cookie-200 text-choc-600 text-lg active:scale-90 transition-transform"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-4 grow">{children}</div>
        {footer && <div className="px-5 pb-5 pt-2 shrink-0 border-t border-cookie-200/70">{footer}</div>}
      </div>
    </div>
  );
}
