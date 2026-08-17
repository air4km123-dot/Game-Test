interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-choc-800/55 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-3xl bg-cookie-50 shadow-cookie p-6 animate-pop text-center">
        <div className="text-4xl mb-2">{danger ? "⚠️" : "🍪"}</div>
        <h3 className="text-lg font-bold text-choc-800 font-display mb-1">{title}</h3>
        {description && <p className="text-sm text-choc-500 mb-5">{description}</p>}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-2xl bg-cookie-200 text-choc-700 font-bold active:scale-95 transition-transform"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-12 rounded-2xl text-white font-bold active:scale-95 transition-transform ${
              danger ? "bg-uno-red" : "bg-uno-green"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
