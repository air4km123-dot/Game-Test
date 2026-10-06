import { describe, expect, it } from "vitest";
import type { Game, Player, Round } from "../types";
import { computeDashboard, dateKey, roundDateBounds } from "./dashboard";

const at = (month: number, day: number, hour = 12) => new Date(2026, month - 1, day, hour).getTime();

function player(id: string, name: string, emoji = "🐶"): Player {
  return { id, name, emoji, color: "#ef4444", active: true };
}

function round(id: string, ts: number, playerIds: string[], winnerId: string): Round {
  return { id, roundNumber: 1, playerIds, winnerId, cookiePerLoser: 5, createdAt: ts };
}

function game(id: string, players: Player[], rounds: Round[]): Game {
  return {
    id,
    name: id,
    createdAt: 0,
    updatedAt: 0,
    finishedAt: null,
    status: "active",
    players,
    rounds,
    settlementStatus: {},
  };
}

// Day 1 (Oct 5): A,B,C — A wins.   Day 2 (Oct 6): A,B — B wins. Different game, new player ids.
const day1 = game(
  "g1",
  [player("a1", "A"), player("b1", "B"), player("c1", "C")],
  [round("r1", at(10, 5), ["a1", "b1", "c1"], "a1")],
);
const day2 = game(
  "g2",
  [player("a2", "A"), player("b2", "B")],
  [round("r2", at(10, 6), ["a2", "b2"], "b2")],
);

describe("computeDashboard", () => {
  it("merges the same name across games and totals every round", () => {
    const { rows, roundCount, gameCount, dayCount } = computeDashboard([day1, day2]);
    const byName = Object.fromEntries(rows.map((r) => [r.name, r]));
    // A: +10 (won 3 players) then -5; B: -5 then +5; C: -5
    expect(byName.A).toMatchObject({ played: 2, won: 1, received: 10, given: 5, net: 5 });
    expect(byName.B).toMatchObject({ played: 2, won: 1, received: 5, given: 5, net: 0 });
    expect(byName.C).toMatchObject({ played: 1, won: 0, received: 0, given: 5, net: -5 });
    expect([roundCount, gameCount, dayCount]).toEqual([2, 2, 2]);
  });

  it("net balances across all players always sum to zero", () => {
    const { rows } = computeDashboard([day1, day2]);
    expect(rows.reduce((s, r) => s + r.net, 0)).toBe(0);
  });

  it("sorts as a podium: highest net first, then wins", () => {
    const { rows } = computeDashboard([day1, day2]);
    expect(rows.map((r) => r.name)).toEqual(["A", "B", "C"]);
  });

  it("filters by an inclusive date range", () => {
    const only1 = computeDashboard([day1, day2], { from: "2026-10-05", to: "2026-10-05" });
    expect(only1.roundCount).toBe(1);
    expect(only1.rows.find((r) => r.name === "A")?.net).toBe(10);
    expect(only1.rows.find((r) => r.name === "C")?.net).toBe(-5);

    const only2 = computeDashboard([day1, day2], { from: "2026-10-06" });
    expect(only2.rows.map((r) => r.name).sort()).toEqual(["A", "B"]);
    expect(only2.rows.find((r) => r.name === "B")?.net).toBe(5);
  });

  it("treats a reversed range as the same range", () => {
    const a = computeDashboard([day1, day2], { from: "2026-10-05", to: "2026-10-06" });
    const b = computeDashboard([day1, day2], { from: "2026-10-06", to: "2026-10-05" });
    expect(b).toEqual(a);
  });

  it("returns nothing when no round falls in range", () => {
    const empty = computeDashboard([day1, day2], { from: "2027-01-01" });
    expect(empty.rows).toEqual([]);
    expect(empty.roundCount).toBe(0);
  });

  it("splits one game across days by each round's own date", () => {
    const multi = game(
      "g3",
      [player("x", "X"), player("y", "Y")],
      [round("m1", at(10, 1), ["x", "y"], "x"), round("m2", at(10, 3), ["x", "y"], "x")],
    );
    expect(computeDashboard([multi], { from: "2026-10-01", to: "2026-10-02" }).rows[0].net).toBe(5);
    expect(computeDashboard([multi]).rows[0].net).toBe(10);
  });
});

describe("date helpers", () => {
  it("dateKey uses the local calendar date", () => {
    expect(dateKey(at(1, 9, 0))).toBe("2026-01-09");
    expect(dateKey(at(12, 31, 23))).toBe("2026-12-31");
  });

  it("roundDateBounds finds earliest and latest round dates", () => {
    expect(roundDateBounds([day1, day2])).toEqual({ min: "2026-10-05", max: "2026-10-06" });
    expect(roundDateBounds([])).toEqual({ min: null, max: null });
  });
});
