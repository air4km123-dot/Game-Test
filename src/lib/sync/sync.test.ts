import { describe, expect, it, vi } from "vitest";
import type { Game } from "../../types";
import { SyncEngine, type EngineHost } from "./engine";
import { createFirestoreRemote, decodeDoc, encodeDoc, SyncHttpError } from "./firestore";
import { mergeRemote } from "./merge";
import type { RemoteDoc, RemoteStore, Tombstones } from "./types";

function makeGame(id: string, updatedAt: number, name = id): Game {
  return {
    id,
    name,
    createdAt: updatedAt,
    updatedAt,
    finishedAt: null,
    status: "active",
    players: [{ id: `${id}-p`, name: "A", emoji: "🐶", color: "#ef4444", active: true }],
    rounds: [],
    settlementStatus: {},
  };
}

/** In-memory stand-in for the shared database. */
class FakeRemote implements RemoteStore {
  docs = new Map<string, RemoteDoc>();
  puts = 0;
  async list() {
    return [...this.docs.values()].map((d) => structuredClone(d));
  }
  async get(id: string) {
    const d = this.docs.get(id);
    return d ? structuredClone(d) : null;
  }
  async put(doc: RemoteDoc) {
    this.puts += 1;
    this.docs.set(doc.id, structuredClone(doc));
  }
}

/** One "device": its own local state, wired to the shared remote through an engine. */
class Device {
  games: Game[];
  tombstones: Tombstones = {};
  engine: SyncEngine;
  constructor(remote: RemoteStore, games: Game[] = []) {
    this.games = games;
    const host: EngineHost = {
      getGames: () => this.games,
      getTombstones: () => this.tombstones,
      applyRemote: (docs) => {
        const merged = mergeRemote(this.games, this.tombstones, docs);
        this.games = merged.games;
        this.tombstones = merged.tombstones;
      },
    };
    this.engine = new SyncEngine(remote, host);
  }
  edit(id: string, updatedAt: number, name: string) {
    this.games = this.games.map((g) => (g.id === id ? { ...g, name, updatedAt } : g));
  }
  remove(id: string, at: number) {
    this.games = this.games.filter((g) => g.id !== id);
    this.tombstones = { ...this.tombstones, [id]: at };
  }
  names() {
    return this.games.map((g) => g.name).sort();
  }
}

describe("mergeRemote", () => {
  it("adopts a remote game that is newer, keeps a local one that is newer", () => {
    const local = [makeGame("a", 100, "local-a"), makeGame("b", 300, "local-b")];
    const remote: RemoteDoc[] = [
      { id: "a", updatedAt: 200, deleted: false, game: makeGame("a", 200, "remote-a") },
      { id: "b", updatedAt: 200, deleted: false, game: makeGame("b", 200, "remote-b") },
    ];
    const { games } = mergeRemote(local, {}, remote);
    expect(Object.fromEntries(games.map((g) => [g.id, g.name]))).toEqual({ a: "remote-a", b: "local-b" });
  });

  it("applies a remote deletion unless the game was edited after it", () => {
    const remote: RemoteDoc[] = [{ id: "a", updatedAt: 200, deleted: true }];
    expect(mergeRemote([makeGame("a", 100)], {}, remote).games).toEqual([]);
    expect(mergeRemote([makeGame("a", 300)], {}, remote).games).toHaveLength(1);
  });

  it("does not resurrect a game we deleted after its last remote edit", () => {
    const remote: RemoteDoc[] = [{ id: "a", updatedAt: 100, deleted: false, game: makeGame("a", 100) }];
    const { games, tombstones } = mergeRemote([], { a: 200 }, remote);
    expect(games).toEqual([]);
    expect(tombstones.a).toBe(200);
  });

  it("unions games two devices created separately before they ever synced", () => {
    const remote: RemoteDoc[] = [{ id: "b", updatedAt: 50, deleted: false, game: makeGame("b", 50, "from-other-device") }];
    const { games } = mergeRemote([makeGame("a", 100, "mine")], {}, remote);
    expect(games.map((g) => g.name).sort()).toEqual(["from-other-device", "mine"]);
  });
});

describe("SyncEngine across two devices", () => {
  it("a game made on device A shows up on a fresh device B", async () => {
    const remote = new FakeRemote();
    const a = new Device(remote, [makeGame("g1", 100, "Monday")]);
    await a.engine.syncAll();

    const b = new Device(remote);
    await b.engine.syncAll();
    expect(b.names()).toEqual(["Monday"]);
  });

  it("uploads existing local data the first time a group is joined", async () => {
    const remote = new FakeRemote();
    const a = new Device(remote, [makeGame("g1", 100), makeGame("g2", 200)]);
    await a.engine.syncAll();
    expect([...remote.docs.keys()].sort()).toEqual(["g1", "g2"]);
  });

  it("does not re-upload unchanged games", async () => {
    const remote = new FakeRemote();
    const a = new Device(remote, [makeGame("g1", 100)]);
    await a.engine.syncAll();
    const before = remote.puts;
    await a.engine.push();
    await a.engine.syncAll();
    expect(remote.puts).toBe(before);
    expect(a.engine.pendingCount()).toBe(0);
  });

  it("creates a brand-new game without a read-before-write", async () => {
    const remote = new FakeRemote();
    const getSpy = vi.spyOn(remote, "get");
    const a = new Device(remote, [makeGame("fresh", 100)]);
    await a.engine.syncAll();
    expect(getSpy).not.toHaveBeenCalled();
    expect(remote.docs.has("fresh")).toBe(true);
  });

  it("a game created and deleted before it ever synced leaves no trace remotely", async () => {
    const remote = new FakeRemote();
    const a = new Device(remote, []);
    await a.engine.syncAll();
    const before = remote.puts;
    a.remove("never-synced", 500);
    await a.engine.push();
    expect(remote.puts).toBe(before);
    expect(a.engine.pendingCount()).toBe(0);
  });

  it("an edit on B reaches A on its next pull", async () => {
    const remote = new FakeRemote();
    const a = new Device(remote, [makeGame("g1", 100, "v1")]);
    await a.engine.syncAll();
    const b = new Device(remote);
    await b.engine.syncAll();

    b.edit("g1", 200, "v2");
    await b.engine.push();
    await a.engine.pull();
    expect(a.names()).toEqual(["v2"]);
  });

  it("a deletion on A removes the game from B and it stays gone", async () => {
    const remote = new FakeRemote();
    const a = new Device(remote, [makeGame("g1", 100)]);
    await a.engine.syncAll();
    const b = new Device(remote);
    await b.engine.syncAll();

    a.remove("g1", 300);
    await a.engine.push();
    await b.engine.pull();
    expect(b.games).toEqual([]);

    await b.engine.syncAll();
    await a.engine.syncAll();
    expect(a.games).toEqual([]);
    expect(b.games).toEqual([]);
  });

  it("refuses to overwrite a newer remote copy with a stale local edit", async () => {
    const remote = new FakeRemote();
    const a = new Device(remote, [makeGame("g1", 100, "base")]);
    await a.engine.syncAll();
    const b = new Device(remote);
    await b.engine.syncAll();

    a.edit("g1", 500, "newer-from-A");
    await a.engine.push();

    // B never pulled A's change and saves an older edit
    b.edit("g1", 400, "stale-from-B");
    await b.engine.push();

    expect(remote.docs.get("g1")?.game?.name).toBe("newer-from-A");
    expect(b.names()).toEqual(["newer-from-A"]);
  });

  it("does not upload before the first successful pull", async () => {
    const remote = new FakeRemote();
    remote.docs.set("g1", { id: "g1", updatedAt: 900, deleted: false, game: makeGame("g1", 900, "remote") });
    const device = new Device(remote, [makeGame("g1", 100, "old-local")]);
    await device.engine.push(); // pulls first, so the older local copy must not win
    expect(remote.docs.get("g1")?.game?.name).toBe("remote");
    expect(device.names()).toEqual(["remote"]);
  });

  it("surfaces a failure and recovers on the next attempt", async () => {
    const remote = new FakeRemote();
    const a = new Device(remote, [makeGame("g1", 100)]);
    const list = vi.spyOn(remote, "list").mockRejectedValueOnce(new TypeError("offline"));
    await expect(a.engine.syncAll()).rejects.toThrow("offline");
    expect(a.engine.isReady()).toBe(false);
    list.mockRestore();
    await a.engine.syncAll();
    expect(remote.docs.has("g1")).toBe(true);
  });
});

describe("firestore REST client", () => {
  const cfg = { apiKey: "KEY", projectId: "proj" };

  it("round-trips a game and a tombstone through the wire format", () => {
    const game = makeGame("g1", 123, "ชื่อเกม");
    const wire = encodeDoc({ id: "g1", updatedAt: 123, deleted: false, game });
    expect(wire.fields.updatedAt).toEqual({ integerValue: "123" });
    const decoded = decodeDoc({ name: "projects/p/databases/(default)/documents/groups/x/games/g1", fields: wire.fields });
    expect(decoded).toEqual({ id: "g1", updatedAt: 123, deleted: false, game });

    const tomb = encodeDoc({ id: "g1", updatedAt: 9, deleted: true });
    expect(tomb.fields.data).toBeUndefined();
    expect(decodeDoc({ name: "x/g1", fields: tomb.fields })).toEqual({ id: "g1", updatedAt: 9, deleted: true });
  });

  it("list follows pagination and tolerates an empty group", async () => {
    const page = (ids: string[], next?: string) => ({
      documents: ids.map((id) => ({ name: `x/games/${id}`, ...encodeDoc({ id, updatedAt: 1, deleted: false, game: makeGame(id, 1) }) })),
      nextPageToken: next,
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(page(["a"], "t2"))))
      .mockResolvedValueOnce(new Response(JSON.stringify(page(["b"]))))
      .mockResolvedValueOnce(new Response("{}"));
    const remote = createFirestoreRemote(cfg, "gid", fetchMock as unknown as typeof fetch);
    expect((await remote.list()).map((d) => d.id)).toEqual(["a", "b"]);
    expect(fetchMock.mock.calls[1][0]).toContain("pageToken=t2");
    expect(await remote.list()).toEqual([]);
  });

  it("get returns null on 404 and put sends a PATCH to the group's path", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 404 }))
      .mockResolvedValueOnce(new Response("{}"));
    const remote = createFirestoreRemote(cfg, "gid", fetchMock as unknown as typeof fetch);
    expect(await remote.get("nope")).toBeNull();
    await remote.put({ id: "g1", updatedAt: 5, deleted: false, game: makeGame("g1", 5) });
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toContain("/projects/proj/databases/(default)/documents/groups/gid/games/g1?key=KEY");
    expect((init as RequestInit).method).toBe("PATCH");
  });

  it("throws SyncHttpError with the status on rejection", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 403 }));
    const remote = createFirestoreRemote(cfg, "gid", fetchMock as unknown as typeof fetch);
    await expect(remote.list()).rejects.toMatchObject({ name: "SyncHttpError", status: 403 });
    expect(new SyncHttpError(500, "x").status).toBe(500);
  });
});
