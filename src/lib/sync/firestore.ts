import type { Game } from "../../types";
import type { RemoteDoc, RemoteStore, SyncConfig } from "./types";

/** Error carrying the HTTP status so callers can tell "offline" from "rejected". */
export class SyncHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "SyncHttpError";
    this.status = status;
  }
}

interface FirestoreFields {
  data?: { stringValue: string };
  updatedAt?: { integerValue: string };
  deleted?: { booleanValue: boolean };
}

interface FirestoreDocument {
  name: string;
  fields?: FirestoreFields;
}

export function encodeDoc(doc: RemoteDoc): { fields: FirestoreFields } {
  const fields: FirestoreFields = {
    updatedAt: { integerValue: String(doc.updatedAt) },
    deleted: { booleanValue: doc.deleted },
  };
  if (!doc.deleted && doc.game) fields.data = { stringValue: JSON.stringify(doc.game) };
  return { fields };
}

export function decodeDoc(raw: FirestoreDocument): RemoteDoc | null {
  const id = raw.name.slice(raw.name.lastIndexOf("/") + 1);
  const f = raw.fields;
  if (!f?.updatedAt) return null;
  const updatedAt = Number(f.updatedAt.integerValue);
  const deleted = f.deleted?.booleanValue ?? false;
  if (deleted || !f.data) return { id, updatedAt, deleted: true };
  try {
    return { id, updatedAt, deleted: false, game: JSON.parse(f.data.stringValue) as Game };
  } catch {
    return null; // unreadable doc: ignore rather than break the whole sync
  }
}

/**
 * Firestore over plain REST (no SDK). Data lives at groups/{groupId}/games/{gameId},
 * where groupId is the hash of the shared passcode — see firestore.rules.
 */
export function createFirestoreRemote(
  cfg: SyncConfig,
  groupId: string,
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): RemoteStore {
  const root = (cfg.baseUrl ?? "https://firestore.googleapis.com").replace(/\/$/, "");
  const base = `${root}/v1/projects/${encodeURIComponent(
    cfg.projectId,
  )}/databases/(default)/documents/groups/${groupId}/games`;
  const key = `key=${encodeURIComponent(cfg.apiKey)}`;

  async function request(url: string, init?: RequestInit): Promise<Response> {
    const res = await fetchImpl(url, init);
    if (!res.ok && res.status !== 404) {
      throw new SyncHttpError(res.status, `Firestore ${res.status}`);
    }
    return res;
  }

  return {
    async list() {
      const docs: RemoteDoc[] = [];
      let pageToken = "";
      do {
        const url = `${base}?pageSize=300&${key}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
        const res = await request(url);
        const body = (await res.json()) as { documents?: FirestoreDocument[]; nextPageToken?: string };
        for (const raw of body.documents ?? []) {
          const doc = decodeDoc(raw);
          if (doc) docs.push(doc);
        }
        pageToken = body.nextPageToken ?? "";
      } while (pageToken);
      return docs;
    },

    async get(id) {
      const res = await request(`${base}/${encodeURIComponent(id)}?${key}`);
      if (res.status === 404) return null;
      return decodeDoc((await res.json()) as FirestoreDocument);
    },

    async put(doc) {
      await request(`${base}/${encodeURIComponent(doc.id)}?${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encodeDoc(doc)),
      });
    },
  };
}
