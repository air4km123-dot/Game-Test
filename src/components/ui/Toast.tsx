import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  subMessage?: string;
  emoji?: string;
  onDone: () => void;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export function Toast({
  message,
  subMessage,
  emoji = "🎉",
  onDone,
  duration,
  actionLabel,
  onAction,
}: ToastProps) {
  const effectiveDuration = duration ?? (actionLabel ? 4500 : 2200);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, effectiveDuration);
    return () => clearTimeout(t);
  }, [message, effectiveDuration, onDone]);

  if (!message) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] w-[92%] max-w-[440px] animate-pop">
      <div className="flex items-center gap-3 rounded-2xl bg-choc-800 text-cookie-50 shadow-cookie px-4 py-3">
        <span className="text-2xl animate-[bounce-cookie_0.6s_ease]">{emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm leading-tight truncate">{message}</p>
          {subMessage && <p className="text-xs text-cookie-200/90 leading-tight mt-0.5">{subMessage}</p>}
        </div>
        {actionLabel && onAction && (
          <button
            onClick={() => {
              onAction();
              onDone();
            }}
            className="shrink-0 h-8 px-3 rounded-xl bg-cookie-50/15 text-cookie-50 text-xs font-bold active:scale-95 transition-transform"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
