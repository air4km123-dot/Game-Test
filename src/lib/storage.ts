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

const TOMBSTONE_KEY = "clearcookie:tombstones:v1";

/** Ids of deleted games with the time they were deleted, so a sync never brings them back. */
export function loadTombstones(): Record<string, number> {
  try {
    const raw = localStorage.getItem(TOMBSTONE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveTombstones(tombstones: Record<string, number>): void {
  try {
    localStorage.setItem(TOMBSTONE_KEY, JSON.stringify(tombstones));
  } catch (err) {
    console.error("Failed to save tombstones", err);
  }
}

export function saveGames(games: Game[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch (err) {
    console.error("Failed to save games to storage", err);
  }
}
