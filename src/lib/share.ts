import type { Game, Player, SettlementEntry } from "../types";
import { playerById } from "./calculations";

export function buildShareText(
  game: Game,
  balances: Record<string, number>,
  settlements: SettlementEntry[],
): string {
  const lines: string[] = [];
  lines.push("🍪 เคลียร์คุกกี้");
  lines.push("หนี้คุกกี้ต้องเคลียร์");
  lines.push(game.name);
  lines.push("");
  lines.push("ยอดสุทธิ");

  const sortedPlayers = [...game.players].sort(
    (a, b) => (balances[b.id] ?? 0) - (balances[a.id] ?? 0),
  );
  for (const p of sortedPlayers) {
    const net = balances[p.id] ?? 0;
    const sign = net > 0 ? "+" : "";
    lines.push(`${p.emoji} ${p.name} ${sign}${net} 🍪`);
  }

  lines.push("");
  if (settlements.length > 0) {
    lines.push("ต้องเคลียร์");
    for (const s of settlements) {
      const from = playerById(game.players, s.fromPlayerId);
      const to = playerById(game.players, s.toPlayerId);
      lines.push(
        `${from?.emoji ?? ""} ${from?.name ?? "?"} → ${to?.emoji ?? ""} ${to?.name ?? "?"} ${s.amount} 🍪`,
      );
    }
    lines.push("");
  }

  lines.push(`ทั้งหมด ${game.rounds.length} รอบ`);

  return lines.join("\n");
}

export async function shareOrCopy(text: string, title = "เคลียร์คุกกี้"): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "failed";
      }
      // fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

export function playerDisplayName(player: Player | undefined): string {
  if (!player) return "?";
  return `${player.emoji} ${player.name}`;
}
