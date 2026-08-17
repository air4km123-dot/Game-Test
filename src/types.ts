export interface Player {
  id: string;
  name: string;
  emoji: string;
  color: string;
  active: boolean;
}

export interface Round {
  id: string;
  roundNumber: number;
  playerIds: string[];
  winnerId: string;
  cookiePerLoser: 5;
  createdAt: number;
}

export interface SettlementEntry {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  settled: boolean;
}

export type GameStatus = "active" | "finished";

export interface Game {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  finishedAt: number | null;
  status: GameStatus;
  players: Player[];
  rounds: Round[];
  /** settlement settled-state, keyed by `${fromPlayerId}->${toPlayerId}`, survives recalculation as long as the pair still exists */
  settlementStatus: Record<string, boolean>;
}

export interface PlayerStats {
  playerId: string;
  played: number;
  won: number;
  received: number;
  given: number;
  net: number;
}
