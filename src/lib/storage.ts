import type { Game } from "../types";

const STORAGE_KEY = "clearcookie:games:v1";

export function loadGames(): Game[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Game[];
  } catch (err) {
    console.error("Failed to load games from storage", err);
    return [];
  }
}

export function saveGames(games: Game[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch (err) {
    console.error("Failed to save games to storage", err);
  }
}
