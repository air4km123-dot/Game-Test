import type { SyncConfig } from "./types";

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
