import type { Player, PlayerStats as PlayerStatsType } from "../types";

interface PlayerStatsProps {
  players: Player[];
  stats: PlayerStatsType[];
}

export function PlayerStats({ players, stats }: PlayerStatsProps) {
  const rows = players
    .map((p) => ({ player: p, stat: stats.find((s) => s.playerId === p.id) }))
    .filter((r) => r.stat)
    .sort((a, b) => (b.stat!.net ?? 0) - (a.stat!.net ?? 0));

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map(({ player, stat }) => {
        const s = stat!;
        const netColor = s.net > 0 ? "text-uno-green-dark" : s.net < 0 ? "text-uno-red-dark" : "text-choc-400";
        return (
          <div key={player.id} className="rounded-2xl bg-white border border-cookie-200 p-3.5">
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-2xl">{player.emoji}</span>
              <span className="font-bold text-choc-800 flex-1 truncate">{player.name}</span>
              <span className={`font-extrabold ${netColor}`}>
                {s.net > 0 ? "+" : ""}
                {s.net} 🍪
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="rounded-xl bg-cookie-100 py-1.5">
                <p className="text-[10px] text-choc-400 font-bold">เล่น</p>
                <p className="text-sm font-bold text-choc-700">{s.played}</p>
              </div>
              <div className="rounded-xl bg-cookie-100 py-1.5">
                <p className="text-[10px] text-choc-400 font-bold">ชนะ</p>
                <p className="text-sm font-bold text-choc-700">{s.won}</p>
              </div>
              <div className="rounded-xl bg-uno-green/10 py-1.5">
                <p className="text-[10px] text-uno-green-dark font-bold">ได้รับ</p>
                <p className="text-sm font-bold text-uno-green-dark">{s.received}</p>
              </div>
              <div className="rounded-xl bg-uno-red/10 py-1.5">
                <p className="text-[10px] text-uno-red-dark font-bold">ให้ไป</p>
                <p className="text-sm font-bold text-uno-red-dark">{s.given}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
