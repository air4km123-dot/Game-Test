import type { Game } from "../../types";
import type { RemoteDoc, RemoteStore, Tombstones } from "./types";

export interface EngineHost {
  getGames(): Game[];
  getTombstones(): Tombstones;
  /** merge remote docs into local state (last-write-wins) */
  applyRemote(docs: RemoteDoc[]): void;
}

type Pending = { id: string; updatedAt: number; game?: Game };

/**
 * Pull on open / focus, push after local edits. Tracks the last remote version
 * seen per game so only changed games are uploaded, and before overwriting a
 * game it checks nobody saved a newer copy in the meantime. Operations are
 * serialized so a pull and a push never interleave.
 */
export class SyncEngine {
  private remote: RemoteStore;
  private host: EngineHost;
  private versions: Record<string, number> = {};
  private ready = false;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(remote: RemoteStore, host: EngineHost) {
    this.remote = remote;
    this.host = host;
  }

  /** True once the first pull has succeeded (uploading before that could clobber newer remote data). */
  isReady(): boolean {
    return this.ready;
  }

  pendingCount(): number {
    return this.collectPending().length;
  }

  /** Download everything and merge into local state. */
  pull(): Promise<void> {
    return this.enqueue(() => this.doPull());
  }

  /** Upload local changes (pulls first if we have never pulled). */
  push(): Promise<void> {
    return this.enqueue(async () => {
      if (!this.ready) await this.doPull();
      await this.doPush();
    });
  }

  /** Pull, then push whatever is still newer locally. */
  syncAll(): Promise<void> {
    return this.enqueue(async () => {
      await this.doPull();
      await this.doPush();
    });
  }

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = this.queue.then(job, job);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async doPull(): Promise<void> {
    const docs = await this.remote.list();
    for (const doc of docs) this.versions[doc.id] = doc.updatedAt;
    this.host.applyRemote(docs);
    this.ready = true;
  }

  private collectPending(): Pending[] {
    const pending: Pending[] = [];
    for (const game of this.host.getGames()) {
      if (game.updatedAt > (this.versions[game.id] ?? 0)) {
        pending.push({ id: game.id, updatedAt: game.updatedAt, game });
      }
    }
    for (const [id, deletedAt] of Object.entries(this.host.getTombstones())) {
      // a game that never reached the shared store has nothing to delete there
      const known = this.versions[id];
      if (known !== undefined && deletedAt > known) pending.push({ id, updatedAt: deletedAt });
    }
    return pending;
  }

  private async doPush(): Promise<void> {
    for (const item of this.collectPending()) {
      // Someone saved a newer copy since our last pull: take theirs instead of overwriting it.
      // Skipped for ids the shared store has never seen — ids are random UUIDs, so a brand-new
      // game can't collide, and this saves a read (and a 404) per new game.
      if (this.versions[item.id] !== undefined) {
        const current = await this.remote.get(item.id);
        if (current && current.updatedAt > item.updatedAt) {
          this.versions[item.id] = current.updatedAt;
          this.host.applyRemote([current]);
          continue;
        }
      }
      await this.remote.put({
        id: item.id,
        updatedAt: item.updatedAt,
        deleted: !item.game,
        game: item.game,
      });
      this.versions[item.id] = item.updatedAt;
    }
  }
}
