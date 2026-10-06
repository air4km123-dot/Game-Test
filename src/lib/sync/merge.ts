import type { Game } from "../../types";
import type { RemoteDoc, Tombstones } from "./types";

/**
 * Last-write-wins merge, per game, by updatedAt. Pure: returns new state.
 * Deletions are tombstones so a deleted game does not come back from another device.
 */
export function mergeRemote(
  games: Game[],
  tombstones: Tombstones,
  remote: RemoteDoc[],
): { games: Game[]; tombstones: Tombstones } {
  const byId = new Map(games.map((g) => [g.id, g]));
  const tombs: Tombstones = { ...tombstones };

  for (const doc of remote) {
    const local = byId.get(doc.id);
    const localTomb = tombs[doc.id];

    if (doc.deleted) {
      // someone deleted it; it only survives if we edited it afterwards
      if (local && local.updatedAt > doc.updatedAt) continue;
      byId.delete(doc.id);
      tombs[doc.id] = Math.max(localTomb ?? 0, doc.updatedAt);
      continue;
    }

    if (!doc.game) continue;
    // we deleted it after the remote copy was last edited: keep the deletion
    if (localTomb !== undefined && localTomb >= doc.updatedAt) continue;

    if (!local || doc.updatedAt > local.updatedAt) {
      byId.set(doc.id, doc.game);
      delete tombs[doc.id];
    }
  }

  const merged = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
  return { games: merged, tombstones: tombs };
}
