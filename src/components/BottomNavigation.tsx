export type GameTab = "play" | "history" | "summary";

interface BottomNavigationProps {
  active: GameTab | null;
  onChange: (tab: GameTab) => void;
}

const TABS: { id: GameTab; label: string; emoji: string }[] = [
  { id: "play", label: "เล่น", emoji: "🎮" },
  { id: "history", label: "ประวัติ", emoji: "📜" },
  { id: "summary", label: "สรุป", emoji: "🍪" },
];

export function BottomNavigation({ active, onChange }: BottomNavigationProps) {
  return (
    <nav className="shrink-0 bg-cookie-50 border-t border-cookie-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative active:scale-95 transition-transform"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-uno-green" />
              )}
              <span className={`text-xl ${isActive ? "scale-110" : "opacity-60"} transition-transform`}>
                {tab.emoji}
              </span>
              <span
                className={`text-[11px] font-bold ${isActive ? "text-uno-green-dark" : "text-choc-400"}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
