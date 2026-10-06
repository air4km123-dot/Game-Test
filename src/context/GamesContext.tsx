import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Game, Player, Round } from "../types";
import { generateId } from "../lib/id";
import { loadGames, loadTombstones, saveGames, saveTombstones } from "../lib/storage";
import { renumberRounds, settlementKey } from "../lib/calculations";
import { DEFAULT_ROSTER } from "../lib/players";
import { mergeRemote } from "../lib/sync/merge";
import type { RemoteDoc, Tombstones } from "../lib/sync/types";

interface NewPlayerInput {
  name: string;
  emoji: string;
  color: string;
}

interface RoundInput {
  playerIds: string[];
  winnerId: string;
}

export type RemovePlayerResult = "removed" | "has-history";

interface GamesContextValue {
  games: Game[];
  /** ids of deleted games (with deletion time), kept so syncing never resurrects them */
  tombstones: Tombstones;
  /** merge games fetched from the shared store into local state (last write wins) */
  applyRemote: (docs: RemoteDoc[]) => void;
  /** wipe local games — used when leaving a sync group */
  clearAll: () => void;
  activeGames: Game[];
  finishedGames: Game[];
  createGame: (name: string) => Game;
  deleteGame: (gameId: string) => void;
  finishGame: (gameId: string) => void;
  reopenGame: (gameId: string) => void;
  renameGame: (gameId: string, name: string) => void;
  getGame: (gameId: string) => Game | undefined;
  addPlayer: (gameId: string, input: NewPlayerInput) => Player;
  updatePlayer: (gameId: string, playerId: string, updates: Partial<Omit<Player, "id">>) => void;
  setPlayerActive: (gameId: string, playerId: string, active: boolean) => void;
  removePlayer: (gameId: string, playerId: string) => RemovePlayerResult;
  addRound: (gameId: string, input: RoundInput) => Round;
  editRound: (gameId: string, roundId: string, input: RoundInput) => void;
  deleteRound: (gameId: string, roundId: string) => void;
  toggleSettlement: (gameId: string, fromPlayerId: string, toPlayerId: string) => void;
}

const GamesContext = createContext<GamesContextValue | null>(null);

function touch(game: Game): Game {
  return { ...game, updatedAt: Date.now() };
}

export function GamesProvider({ children }: { children: ReactNode }) {
  // games and tombstones live in one state so a sync merge updates both atomically
  const [store, setStore] = useState<{ games: Game[]; tombstones: Tombstones }>(() => ({
    games: loadGames(),
    tombstones: loadTombstones(),
  }));
  const { games, tombstones } = store;

  const setGames = useCallback((updater: (prev: Game[]) => Game[]) => {
    setStore((s) => ({ ...s, games: updater(s.games) }));
  }, []);

  useEffect(() => {
    saveGames(games);
  }, [games]);

  useEffect(() => {
    saveTombstones(tombstones);
  }, [tombstones]);

  const applyRemote = useCallback((docs: RemoteDoc[]) => {
    setStore((s) => mergeRemote(s.games, s.tombstones, docs));
  }, []);

  const clearAll = useCallback(() => {
    setStore({ games: [], tombstones: {} });
  }, []);

  const updateGame = useCallback((gameId: string, updater: (game: Game) => Game) => {
    setGames((prev) => prev.map((g) => (g.id === gameId ? touch(updater(g)) : g)));
  }, [setGames]);

  const createGame = useCallback((name: string): Game => {
    const now = Date.now();
    const game: Game = {
      id: generateId(),
      name: name.trim() || "เกม UNO",
      createdAt: now,
      updatedAt: now,
      finishedAt: null,
      status: "active",
      players: DEFAULT_ROSTER.map((entry) => ({
        id: generateId(),
        name: entry.name,
        emoji: entry.emoji,
        color: entry.color,
        active: true,
      })),
      rounds: [],
      settlementStatus: {},
    };
    setGames((prev) => [game, ...prev]);
    return game;
  }, [setGames]);

  const deleteGame = useCallback((gameId: string) => {
    setStore((s) => ({
      games: s.games.filter((g) => g.id !== gameId),
      tombstones: { ...s.tombstones, [gameId]: Date.now() },
    }));
  }, []);

  const finishGame = useCallback(
    (gameId: string) => {
      updateGame(gameId, (g) => ({ ...g, status: "finished", finishedAt: Date.now() }));
    },
    [updateGame],
  );

  const reopenGame = useCallback(
    (gameId: string) => {
      updateGame(gameId, (g) => ({ ...g, status: "active", finishedAt: null }));
    },
    [updateGame],
  );

  const renameGame = useCallback(
    (gameId: string, name: string) => {
      updateGame(gameId, (g) => ({ ...g, name: name.trim() || g.name }));
    },
    [updateGame],
  );

  const getGame = useCallback((gameId: string) => games.find((g) => g.id === gameId), [games]);

  const addPlayer = useCallback(
    (gameId: string, input: NewPlayerInput): Player => {
      const player: Player = {
        id: generateId(),
        name: input.name.trim() || "ผู้เล่น",
        emoji: input.emoji,
        color: input.color,
        active: true,
      };
      updateGame(gameId, (g) => ({ ...g, players: [...g.players, player] }));
      return player;
    },
    [updateGame],
  );

  const updatePlayer = useCallback(
    (gameId: string, playerId: string, updates: Partial<Omit<Player, "id">>) => {
      updateGame(gameId, (g) => ({
        ...g,
        players: g.players.map((p) => (p.id === playerId ? { ...p, ...updates } : p)),
      }));
    },
    [updateGame],
  );

  const setPlayerActive = useCallback(
    (gameId: string, playerId: string, active: boolean) => {
      updateGame(gameId, (g) => ({
        ...g,
        players: g.players.map((p) => (p.id === playerId ? { ...p, active } : p)),
      }));
    },
    [updateGame],
  );

  const removePlayer = useCallback(
    (gameId: string, playerId: string): RemovePlayerResult => {
      const game = games.find((g) => g.id === gameId);
      if (!game) return "removed";
      const hasHistory = game.rounds.some((r) => r.playerIds.includes(playerId));
      if (hasHistory) return "has-history";
      updateGame(gameId, (g) => ({ ...g, players: g.players.filter((p) => p.id !== playerId) }));
      return "removed";
    },
    [games, updateGame],
  );

  const addRound = useCallback(
    (gameId: string, input: RoundInput): Round => {
      const game = games.find((g) => g.id === gameId);
      const roundNumber = (game?.rounds.length ?? 0) + 1;
      const round: Round = {
        id: generateId(),
        roundNumber,
        playerIds: input.playerIds,
        winnerId: input.winnerId,
        cookiePerLoser: 5,
        createdAt: Date.now(),
      };
      updateGame(gameId, (g) => ({ ...g, rounds: renumberRounds([...g.rounds, round]) }));
      return round;
    },
    [games, updateGame],
  );

  const editRound = useCallback(
    (gameId: string, roundId: string, input: RoundInput) => {
      updateGame(gameId, (g) => ({
        ...g,
        rounds: renumberRounds(
          g.rounds.map((r) =>
            r.id === roundId ? { ...r, playerIds: input.playerIds, winnerId: input.winnerId } : r,
          ),
        ),
      }));
    },
    [updateGame],
  );

  const deleteRound = useCallback(
    (gameId: string, roundId: string) => {
      updateGame(gameId, (g) => ({
        ...g,
        rounds: renumberRounds(g.rounds.filter((r) => r.id !== roundId)),
      }));
    },
    [updateGame],
  );

  const toggleSettlement = useCallback(
    (gameId: string, fromPlayerId: string, toPlayerId: string) => {
      const key = settlementKey(fromPlayerId, toPlayerId);
      updateGame(gameId, (g) => ({
        ...g,
        settlementStatus: { ...g.settlementStatus, [key]: !g.settlementStatus[key] },
      }));
    },
    [updateGame],
  );

  const activeGames = useMemo(
    () => games.filter((g) => g.status === "active").sort((a, b) => b.updatedAt - a.updatedAt),
    [games],
  );
  const finishedGames = useMemo(
    () =>
      games
        .filter((g) => g.status === "finished")
        .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0)),
    [games],
  );

  const value: GamesContextValue = {
    games,
    tombstones,
    applyRemote,
    clearAll,
    activeGames,
    finishedGames,
    createGame,
    deleteGame,
    finishGame,
    reopenGame,
    renameGame,
    getGame,
    addPlayer,
    updatePlayer,
    setPlayerActive,
    removePlayer,
    addRound,
    editRound,
    deleteRound,
    toggleSettlement,
  };

  return <GamesContext.Provider value={value}>{children}</GamesContext.Provider>;
}

export function useGames(): GamesContextValue {
  const ctx = useContext(GamesContext);
  if (!ctx) throw new Error("useGames must be used within GamesProvider");
  return ctx;
}
