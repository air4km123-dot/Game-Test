import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGames } from "./GamesContext";
import { GroupGate } from "../components/GroupGate";
import { SyncEngine } from "../lib/sync/engine";
import { createFirestoreRemote, SyncHttpError } from "../lib/sync/firestore";
import { clearGroupId, loadGroupId, saveGroupId } from "../lib/sync/group";
import { syncConfig } from "../lib/sync/config";

export type SyncStatus = "syncing" | "synced" | "offline" | "error";

interface SyncContextValue {
  /** false when no Firebase config was built in: the app is local-only */
  enabled: boolean;
  status: SyncStatus;
  lastSyncedAt: number | null;
  errorMessage: string | null;
  syncNow: () => void;
  /** resolves false (and stays in the group) if the final upload failed */
  leaveGroup: () => Promise<boolean>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

const RETRY_MS = 45_000;

function describeError(err: unknown): { status: SyncStatus; message: string } {
  if (err instanceof SyncHttpError) {
    if (err.status === 403) return { status: "error", message: "ฐานข้อมูลไม่อนุญาต (ตรวจ Firestore rules)" };
    return { status: "error", message: `ซิงค์ไม่สำเร็จ (รหัส ${err.status})` };
  }
  return { status: "offline", message: "ออฟไลน์ — จะซิงค์ให้เมื่อต่อเน็ต" };
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const { games, tombstones, applyRemote, clearAll } = useGames();
  const [groupId, setGroupId] = useState<string | null>(() => loadGroupId());
  // "skip" lasts only until the page is reloaded, so the gate comes back next time
  const [skipped, setSkipped] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("syncing");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // the engine reads the freshest local state through refs, not stale closures
  const gamesRef = useRef(games);
  const tombstonesRef = useRef(tombstones);
  useEffect(() => {
    gamesRef.current = games;
    tombstonesRef.current = tombstones;
  }, [games, tombstones]);

  const engineRef = useRef<SyncEngine | null>(null);

  const run = useCallback(async (job: (engine: SyncEngine) => Promise<void>) => {
    const engine = engineRef.current;
    if (!engine) return;
    setStatus("syncing");
    try {
      await job(engine);
      setStatus("synced");
      setErrorMessage(null);
      setLastSyncedAt(Date.now());
    } catch (err) {
      const { status: s, message } = describeError(err);
      setStatus(s);
      setErrorMessage(message);
    }
  }, []);

  // (re)create the engine when a group is joined; pull on open, focus and reconnect
  useEffect(() => {
    if (!syncConfig || !groupId) {
      engineRef.current = null;
      return;
    }
    const engine = new SyncEngine(createFirestoreRemote(syncConfig, groupId), {
      getGames: () => gamesRef.current,
      getTombstones: () => tombstonesRef.current,
      applyRemote,
    });
    engineRef.current = engine;
    void run((e) => e.syncAll());

    const refresh = () => {
      if (document.visibilityState === "visible") void run((e) => e.syncAll());
    };
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
      engineRef.current = null;
    };
  }, [groupId, applyRemote, run]);

  // push shortly after local edits settle (only when something actually changed)
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const timer = setTimeout(() => {
      if (!engine.isReady() || engine.pendingCount() > 0) void run((e) => e.push());
    }, 700);
    return () => clearTimeout(timer);
  }, [games, tombstones, groupId, run]);

  // keep retrying while offline / failing
  useEffect(() => {
    if (status !== "offline" && status !== "error") return;
    const timer = setInterval(() => void run((e) => e.syncAll()), RETRY_MS);
    return () => clearInterval(timer);
  }, [status, run]);

  const syncNow = useCallback(() => void run((e) => e.syncAll()), [run]);

  // Leaving wipes this device's copy, so first make sure everything is safely uploaded.
  const leaveGroup = useCallback(async (): Promise<boolean> => {
    const engine = engineRef.current;
    if (engine) {
      try {
        await engine.syncAll();
      } catch {
        return false;
      }
    }
    clearGroupId();
    clearAll();
    setGroupId(null);
    setLastSyncedAt(null);
    return true;
  }, [clearAll]);

  const value = useMemo<SyncContextValue>(
    () => ({
      enabled: !!syncConfig && !!groupId,
      status,
      lastSyncedAt,
      errorMessage,
      syncNow,
      leaveGroup,
    }),
    [groupId, status, lastSyncedAt, errorMessage, syncNow, leaveGroup],
  );

  if (syncConfig && !groupId && !skipped) {
    return (
      <GroupGate
        config={syncConfig}
        localGameCount={games.length}
        onJoined={(id) => {
          saveGroupId(id);
          setGroupId(id);
        }}
        onSkip={() => setSkipped(true)}
      />
    );
  }

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within SyncProvider");
  return ctx;
}
