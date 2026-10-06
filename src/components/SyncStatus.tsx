import { useState } from "react";
import { useSync, type SyncStatus as Status } from "../context/SyncContext";
import { Modal } from "./ui/Modal";
import { ConfirmDialog } from "./ui/ConfirmDialog";

const CHIP: Record<Status, { label: string; className: string }> = {
  syncing: { label: "☁️ กำลังซิงค์…", className: "bg-uno-blue/15 text-uno-blue-dark" },
  synced: { label: "☁️ ซิงค์แล้ว", className: "bg-uno-green/15 text-uno-green-dark" },
  offline: { label: "📴 ออฟไลน์", className: "bg-uno-yellow/30 text-uno-yellow-dark" },
  error: { label: "⚠️ ซิงค์ไม่ได้", className: "bg-uno-red/15 text-uno-red-dark" },
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

/** Small status pill for the header; tap for details, manual sync and leaving the group. */
export function SyncChip() {
  const { enabled, status, lastSyncedAt, errorMessage, syncNow, leaveGroup } = useSync();
  const [open, setOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaveError, setLeaveError] = useState(false);

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
            ข้อมูลเกมถูกเก็บในกลุ่มของคุณ เปิดแอปจากเครื่องไหนก็ใส่รหัสกลุ่มเดียวกันเพื่อเห็นข้อมูลเดียวกัน
          </p>
          <button
            onClick={() => syncNow()}
            className="w-full h-14 rounded-2xl bg-uno-blue text-white font-bold active:scale-95 transition-transform"
          >
            🔄 ซิงค์ตอนนี้
          </button>
          <button
            onClick={() => {
              setLeaveError(false);
              setOpen(false);
              setConfirmLeave(true);
            }}
            className="w-full h-14 rounded-2xl bg-uno-red/10 text-uno-red-dark font-bold active:scale-95 transition-transform"
          >
            ออกจากกลุ่ม
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmLeave}
        title="ออกจากกลุ่มนี้?"
        description={
          leaveError
            ? "อัปโหลดข้อมูลล่าสุดไม่สำเร็จ ถ้าออกตอนนี้ข้อมูลที่ยังไม่ขึ้นระบบจะหาย ต่อเน็ตแล้วลองใหม่"
            : "ข้อมูลในเครื่องนี้จะถูกล้าง แต่ข้อมูลในกลุ่มยังอยู่ ใส่รหัสเดิมเพื่อกลับมาดูได้"
        }
        confirmLabel="ออกจากกลุ่ม"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={async () => {
          const ok = await leaveGroup();
          if (ok) setConfirmLeave(false);
          else setLeaveError(true);
        }}
      />
    </>
  );
}
