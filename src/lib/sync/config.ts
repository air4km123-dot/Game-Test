import type { SyncConfig } from "./types";

/**
 * Everyone who opens the app shares this one data location (no login, no code).
 * It is a fixed random id so the path can't be guessed or enumerated from the
 * database side; it is NOT a secret — it ships in the bundle like the config.
 */
export const SHARED_GROUP_ID = "fe19e8be40477569d32d78eceaffdac712b18d0dfcdfbc5a146e7b75524d8a45";

/**
 * Both values are public Firebase web identifiers (safe to ship in the bundle;
 * access is controlled by firestore.rules). When they are missing the app runs
 * local-only exactly as before.
 */
export function readSyncConfig(): SyncConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  const baseUrl = import.meta.env.VITE_FIREBASE_API_BASE as string | undefined;
  if (!apiKey || !projectId) return null;
  return { apiKey, projectId, baseUrl: baseUrl || undefined };
}

export const syncConfig: SyncConfig | null = readSyncConfig();
