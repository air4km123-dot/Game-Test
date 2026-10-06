import type { Game } from "../types";
import { COOKIE_PER_LOSER } from "./calculations";

export interface DashboardRow {
  /** normalized name — the same person across different games shares this key */
  key: string;
  name: string;
  emoji: string;
  color: string;
  played: number;
  won: number;
  received: number;
  given: number;
  net: number;
}

export interface DashboardResult {
  rows: DashboardRow[];
  roundCount: number;
  gameCount: number;
  dayCount: number;
}

export interface DateRange {
  /** inclusive, local date as YYYY-MM-DD; empty/undefined = unbounded */
  from?: string;
  to?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar date of a timestamp as YYYY-MM-DD. */
export function dateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Earliest and latest local date that has at least one round, across all games. */
export function roundDateBounds(games: Game[]): { min: string | null; max: string | null } {
  let min: string | null = null;
  let max: string | null = null;
  for (const game of games) {
    for (const round of game.rounds) {
      const key = dateKey(round.createdAt);
      if (min === null || key < min) min = key;
      if (max === null || key > max) max = key;
    }
  }
  return { min, max };
}

/**
 * Cumulative cookie standings across every game, restricted to rounds whose
 * local date falls inside the range. Players are merged by name, since each
 * game creates its own player ids. Derived on the fly — nothing is stored.
 */
export function computeDashboard(games: Game[], range: DateRange = {}): DashboardResult {
  let lo = range.from || "";
  let hi = range.to || "";
  if (lo && hi && lo > hi) [lo, hi] = [hi, lo];

  const rows = new Map<string, DashboardRow & { lastSeen: number }>();
  const days = new Set<string>();
  const gamesWithRounds = new Set<string>();
  let roundCount = 0;

  for (const game of games) {
    for (const round of game.rounds) {
      const key = dateKey(round.createdAt);
      if (lo && key < lo) continue;
      if (hi && key > hi) continue;

      roundCount += 1;
      days.add(key);
      gamesWithRounds.add(game.id);

      for (const playerId of round.playerIds) {
        const player = game.players.find((p) => p.id === playerId);
        if (!player) continue;

        const rowKey = normalizeName(player.name);
        let row = rows.get(rowKey);
        if (!row) {
          row = {
            key: rowKey,
            name: player.name.trim(),
            emoji: player.emoji,
            color: player.color,
            played: 0,
            won: 0,
            received: 0,
            given: 0,
            net: 0,
            lastSeen: round.createdAt,
          };
          rows.set(rowKey, row);
        }

        // show the most recent emoji/color this person used
        if (round.createdAt >= row.lastSeen) {
          row.lastSeen = round.createdAt;
          row.emoji = player.emoji;
          row.color = player.color;
          row.name = player.name.trim();
        }

        row.played += 1;
        if (playerId === round.winnerId) {
          row.won += 1;
          row.received += (round.playerIds.length - 1) * COOKIE_PER_LOSER;
        } else {
          row.given += COOKIE_PER_LOSER;
        }
        row.net = row.received - row.given;
      }
    }
  }

  const sorted = [...rows.values()]
    .map(({ lastSeen: _lastSeen, ...row }) => row)
    .sort(
      (a, b) =>
        b.net - a.net || b.won - a.won || a.played - b.played || a.name.localeCompare(b.name, "th"),
    );

  return { rows: sorted, roundCount, gameCount: gamesWithRounds.size, dayCount: days.size };
}
