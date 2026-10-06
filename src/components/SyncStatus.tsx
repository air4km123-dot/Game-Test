import { useState } from "react";
import { useSync, type SyncStatus as Status } from "../context/SyncContext";
import { Modal } from "./ui/Modal";

const CHIP: Record<Status, { label: string; className: string }> = {
  syncing: { label: "☁️ กำลังซิงค์…", className: "bg-uno-blue/15 text-uno-blue-dark" },
  synced: { label: "☁️ ซิงค์แล้ว", className: "bg-uno-green/15 text-uno-green-dark" },
  offline: { label: "📴 ออฟไลน์", className: "bg-uno-yellow/30 text-uno-yellow-dark" },
  error: { label: "⚠️ ซิงค์ไม่ได้", className: "bg-uno-red/15 text-uno-red-dark" },
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

/** Small status pill for the header; tap for details and a manual sync. */
export function SyncChip() {
  const { enabled, status, lastSyncedAt, errorMessage, syncNow } = useSync();
  const [open, setOpen] = useState(false);

  if (!enabled) return null;
  const chip = CHIP[status];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`ml-auto shrink-0 h-8 px-3 rounded-full text-xs font-bold active:scale-95 transition-transform ${chip.className}`}
      >
        {chip.label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="☁️ ซิงค์ข้อมูล">
        <div className="flex flex-col gap-3 pb-2">
          <div className={`rounded-2xl px-4 py-3 font-bold ${chip.className}`}>
            {chip.label}
            {lastSyncedAt && status === "synced" && (
              <span className="font-normal"> · ล่าสุด {formatTime(lastSyncedAt)}</span>
            )}
          </div>
          {errorMessage && status !== "synced" && (
            <p className="text-sm text-choc-500 px-1">{errorMessage}</p>
          )}
          <p className="text-xs text-choc-400 px-1">
            ข้อมูลเกมซิงค์กับฐานข้อมูลกลาง เปิดแอปจากเครื่องไหนก็เห็นข้อมูลชุดเดียวกัน
          </p>
          <button
            onClick={() => syncNow()}
            className="w-full h-14 rounded-2xl bg-uno-blue text-white font-bold active:scale-95 transition-transform"
          >
            🔄 ซิงค์ตอนนี้
          </button>
        </div>
      </Modal>
    </>
  );
}
