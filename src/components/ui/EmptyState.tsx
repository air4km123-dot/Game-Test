import type { ReactNode } from "react";

interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="text-6xl mb-4 animate-[wiggle_1.2s_ease_infinite]">{emoji}</div>
      <p className="text-base font-bold text-choc-700 mb-1">{title}</p>
      {description && <p className="text-sm text-choc-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
