import type { Game, Player, PlayerStats, Round, SettlementEntry } from "../types";

export const COOKIE_PER_LOSER = 5;

/** Net cookie delta for every player who has ever appeared in the game, derived from rounds only. */
export function computeBalances(players: Player[], rounds: Round[]): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const p of players) balances[p.id] = 0;

  for (const round of rounds) {
    const losers = round.playerIds.filter((id) => id !== round.winnerId);
    if (!(round.winnerId in balances)) balances[round.winnerId] = 0;
    balances[round.winnerId] += losers.length * COOKIE_PER_LOSER;
    for (const loserId of losers) {
      if (!(loserId in balances)) balances[loserId] = 0;
      balances[loserId] -= COOKIE_PER_LOSER;
    }
  }

  return balances;
}

export function computePlayerStats(players: Player[], rounds: Round[]): PlayerStats[] {
  return players.map((player) => {
    let played = 0;
    let won = 0;
    let received = 0;
    let given = 0;

    for (const round of rounds) {
      if (!round.playerIds.includes(player.id)) continue;
      played += 1;
      if (round.winnerId === player.id) {
        won += 1;
        received += (round.playerIds.length - 1) * COOKIE_PER_LOSER;
      } else {
        given += COOKIE_PER_LOSER;
      }
    }

    return {
      playerId: player.id,
      played,
      won,
      received,
      given,
      net: received - given,
    };
  });
}

/**
 * Greedy debtor/creditor matching. Not guaranteed to minimize transaction
 * count, but always resolves every player to exactly zero — clarity over
 * optimality, per spec.
 */
export function computeSettlements(
  balances: Record<string, number>,
  settlementStatus: Record<string, boolean> = {},
): SettlementEntry[] {
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < 0)
    .map(([id, v]) => ({ id, amount: -v }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0)
    .map(([id, v]) => ({ id, amount: v }))
    .sort((a, b) => b.amount - a.amount);

  const result: SettlementEntry[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      const key = settlementKey(debtor.id, creditor.id);
      result.push({
        fromPlayerId: debtor.id,
        toPlayerId: creditor.id,
        amount,
        settled: settlementStatus[key] ?? false,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) i += 1;
    if (creditor.amount === 0) j += 1;
  }

  return result;
}

export function settlementKey(fromPlayerId: string, toPlayerId: string): string {
  return `${fromPlayerId}->${toPlayerId}`;
}

export function sumBalances(balances: Record<string, number>): number {
  return Object.values(balances).reduce((sum, v) => sum + v, 0);
}

/** Recompute round numbers sequentially (1-based) after an edit/delete, ordered by creation time. */
export function renumberRounds(rounds: Round[]): Round[] {
  return [...rounds]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((round, index) => ({ ...round, roundNumber: index + 1 }));
}

export function activePlayers(players: Player[]): Player[] {
  return players.filter((p) => p.active);
}

export function playerById(players: Player[], id: string): Player | undefined {
  return players.find((p) => p.id === id);
}

export function isPlayerInAnyRound(rounds: Round[], playerId: string): boolean {
  return rounds.some((r) => r.playerIds.includes(playerId));
}

export interface GameDerived {
  balances: Record<string, number>;
  stats: PlayerStats[];
  settlements: SettlementEntry[];
}

export function deriveGame(game: Game): GameDerived {
  const balances = computeBalances(game.players, game.rounds);
  const stats = computePlayerStats(game.players, game.rounds);
  const settlements = computeSettlements(balances, game.settlementStatus);
  return { balances, stats, settlements };
}
