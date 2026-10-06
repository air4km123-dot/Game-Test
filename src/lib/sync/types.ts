import type { Game } from "../../types";

/** One document in the shared store: a game, or a tombstone for a deleted game. */
export interface RemoteDoc {
  id: string;
  updatedAt: number;
  deleted: boolean;
  /** absent for tombstones */
  game?: Game;
}

export interface RemoteStore {
  list(): Promise<RemoteDoc[]>;
  get(id: string): Promise<RemoteDoc | null>;
  put(doc: RemoteDoc): Promise<void>;
}

export interface SyncConfig {
  apiKey: string;
  projectId: string;
  /** override for local testing; defaults to https://firestore.googleapis.com */
  baseUrl?: string;
}

export type Tombstones = Record<string, number>;
