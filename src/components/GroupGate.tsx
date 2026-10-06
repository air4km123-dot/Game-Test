import { useState } from "react";
import { createFirestoreRemote } from "../lib/sync/firestore";
import {
  MIN_CODE_LENGTH,
  createGroup,
  groupExists,
  hashGroupCode,
  normalizeGroupCode,
} from "../lib/sync/group";
import type { SyncConfig } from "../lib/sync/types";

interface GroupGateProps {
  config: SyncConfig;
  localGameCount: number;
  onJoined: (groupId: string) => void;
  onSkip: () => void;
}

type Step = "enter" | "checking" | "confirm-create";

export function GroupGate({ config, localGameCount, onJoined, onSkip }: GroupGateProps) {
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("enter");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const submit = async () => {
    if (normalizeGroupCode(code).length < MIN_CODE_LENGTH) {
      setError(`รหัสต้องมีอย่างน้อย ${MIN_CODE_LENGTH} ตัวอักษร`);
      return;
    }
    setError(null);
    setStep("checking");
    try {
      const id = await hashGroupCode(code);
      const exists = await groupExists(createFirestoreRemote(config, id));
      if (exists) {
        onJoined(id);
      } else {
        setPendingId(id);
        setStep("confirm-create");
      }
    } catch (err) {
      console.error(err);
      setError("เชื่อมต่อฐานข้อมูลไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่");
      setStep("enter");
    }
  };

  const create = async () => {
    if (!pendingId) return;
    setStep("checking");
    try {
      await createGroup(createFirestoreRemote(config, pendingId));
      onJoined(pendingId);
    } catch (err) {
      console.error(err);
      setError("สร้างกลุ่มไม่สำเร็จ ลองใหม่อีกครั้ง");
      setStep("enter");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-cookie-100">
      <div className="text-6xl mb-2">🍪</div>
      <h1 className="text-2xl font-display font-extrabold text-choc-800">เคลียร์คุกกี้</h1>
      <p className="text-sm text-choc-500 font-bold mb-6">หนี้คุกกี้ต้องเคลียร์</p>

      <div className="w-full max-w-sm rounded-3xl bg-white border border-cookie-200 shadow-cookie p-5">
        {step === "confirm-create" ? (
          <>
            <p className="font-bold text-choc-800 mb-1">ยังไม่มีกลุ่มรหัสนี้</p>
            <p className="text-sm text-choc-500 mb-3">
              สร้างกลุ่มใหม่ด้วยรหัสนี้ไหม? ถ้าพิมพ์รหัสผิด ให้กด "แก้รหัส"
            </p>
            {localGameCount > 0 && (
              <p className="text-sm font-bold text-uno-blue bg-uno-blue/10 rounded-xl px-3 py-2 mb-3">
                เกมในเครื่องนี้ {localGameCount} เกม จะถูกอัปโหลดเข้ากลุ่มนี้
              </p>
            )}
            <div className="flex gap-2.5">
              <button
                onClick={() => setStep("enter")}
                className="flex-1 h-12 rounded-2xl bg-cookie-200 text-choc-700 font-bold active:scale-95 transition-transform"
              >
                แก้รหัส
              </button>
              <button
                onClick={create}
                className="flex-1 h-12 rounded-2xl bg-uno-green text-white font-bold active:scale-95 transition-transform"
              >
                สร้างกลุ่มใหม่
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="block text-sm font-bold text-choc-600 mb-1.5">รหัสกลุ่ม</label>
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && step === "enter") void submit();
              }}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="เช่น cookie2026"
              className="w-full h-14 rounded-2xl border-2 border-cookie-300 bg-white px-4 text-base font-bold text-choc-800 placeholder:text-choc-300 focus:outline-none focus:border-uno-blue"
            />
            <p className="text-xs text-choc-400 mt-2 mb-4">
              ใช้รหัสเดียวกันทุกเครื่องเพื่อเห็นข้อมูลเดียวกัน · อย่างน้อย {MIN_CODE_LENGTH} ตัวอักษร
            </p>
            {error && (
              <p className="text-sm font-bold text-uno-red-dark bg-uno-red/10 rounded-xl px-3 py-2 mb-3">{error}</p>
            )}
            <button
              onClick={submit}
              disabled={step === "checking"}
              className="w-full h-14 rounded-2xl bg-uno-green text-white text-lg font-bold shadow-cookie-sm active:scale-95 transition-transform disabled:opacity-50"
            >
              {step === "checking" ? "กำลังตรวจสอบ…" : "เข้าสู่กลุ่ม"}
            </button>
            <button
              onClick={onSkip}
              className="w-full mt-3 text-xs font-bold text-choc-400 underline underline-offset-2 active:opacity-60"
            >
              ข้ามไปก่อน (ใช้เฉพาะเครื่องนี้ ไม่ซิงค์)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
