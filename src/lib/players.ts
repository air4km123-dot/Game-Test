export const EMOJI_PRESETS = [
  "🐶", "🐱", "🐼", "🐸", "🐰", "🦊", "🐻", "🐨",
  "🐯", "🦁", "🐷", "🐮", "🐵", "🐔", "🐧", "🦄",
  "🐹", "🐭", "🦖", "🐙", "🦉", "🐝", "🐢", "🦋",
];

export interface ColorPreset {
  id: string;
  label: string;
  hex: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: "red", label: "แดง", hex: "#ef4444" },
  { id: "yellow", label: "เหลือง", hex: "#fbbf24" },
  { id: "green", label: "เขียว", hex: "#22c55e" },
  { id: "blue", label: "น้ำเงิน", hex: "#3b82f6" },
  { id: "purple", label: "ม่วง", hex: "#a855f7" },
  { id: "pink", label: "ชมพู", hex: "#ec4899" },
  { id: "teal", label: "ฟ้าอมเขียว", hex: "#14b8a6" },
  { id: "orange", label: "ส้ม", hex: "#fb923c" },
];

export interface DefaultRosterEntry {
  name: string;
  emoji: string;
  color: string;
}

/** Auto-added to every new game so the usual lunch crew doesn't need re-entering each time. */
export const DEFAULT_ROSTER: DefaultRosterEntry[] = [
  { name: "ออม", emoji: "🐶", color: "#ef4444" },
  { name: "เกล", emoji: "🐱", color: "#fbbf24" },
  { name: "กิ๊ฟ", emoji: "🐰", color: "#ec4899" },
  { name: "ต้น", emoji: "🐻", color: "#22c55e" },
  { name: "หนุ่ม", emoji: "🦊", color: "#3b82f6" },
  { name: "เมย์", emoji: "🐼", color: "#a855f7" },
  { name: "เจน", emoji: "🐨", color: "#14b8a6" },
];

export function randomEmoji(exclude: string[] = []): string {
  const pool = EMOJI_PRESETS.filter((e) => !exclude.includes(e));
  const list = pool.length > 0 ? pool : EMOJI_PRESETS;
  return list[Math.floor(Math.random() * list.length)];
}

export function randomColor(): string {
  return COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)].hex;
}

export function colorHex(colorId: string): string {
  return COLOR_PRESETS.find((c) => c.hex === colorId || c.id === colorId)?.hex ?? colorId;
}
