import { GROUP_MARKER_ID, type RemoteStore, type SyncConfig } from "./types";

const GROUP_KEY = "clearcookie:group:v1";
export const MIN_CODE_LENGTH = 6;

/** Case/space-insensitive so the code survives phone auto-capitalisation. */
export function normalizeGroupCode(code: string): string {
  return code.trim().toLowerCase();
}

/** The code itself never leaves the device — only this hash is used as the group's path. */
export async function hashGroupCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(`clearcookie-v1:${normalizeGroupCode(code)}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function groupExists(remote: RemoteStore): Promise<boolean> {
  return (await remote.list()).length > 0;
}

export async function createGroup(remote: RemoteStore): Promise<void> {
  await remote.put({ id: GROUP_MARKER_ID, updatedAt: Date.now(), deleted: true });
}

export function loadGroupId(): string | null {
  try {
    return localStorage.getItem(GROUP_KEY);
  } catch {
    return null;
  }
}

export function saveGroupId(groupId: string): void {
  try {
    localStorage.setItem(GROUP_KEY, groupId);
  } catch (err) {
    console.error("Failed to save group id", err);
  }
}

export function clearGroupId(): void {
  try {
    localStorage.removeItem(GROUP_KEY);
  } catch {
    // ignore
  }
}

export type { SyncConfig };
