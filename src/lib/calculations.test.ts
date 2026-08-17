import { describe, expect, it } from "vitest";
import type { Player, Round } from "../types";
import { computeBalances, computeSettlements, sumBalances } from "./calculations";

function makePlayers(ids: string[]): Player[] {
  return ids.map((id) => ({ id, name: id, emoji: "🐶", color: "#ef4444", active: true }));
}

function makeRound(roundNumber: number, playerIds: string[], winnerId: string): Round {
  return { id: `r${roundNumber}`, roundNumber, playerIds, winnerId, cookiePerLoser: 5, createdAt: roundNumber };
}

describe("computeBalances", () => {
  it("Test A: single round, 4 players, A wins", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const rounds = [makeRound(1, ["A", "B", "C", "D"], "A")];
    const balances = computeBalances(players, rounds);
    expect(balances).toEqual({ A: 15, B: -5, C: -5, D: -5 });
    expect(sumBalances(balances)).toBe(0);
  });

  it("Test B: two rounds, 3 players, A then B win", () => {
    const players = makePlayers(["A", "B", "C"]);
    const rounds = [makeRound(1, ["A", "B", "C"], "A"), makeRound(2, ["A", "B", "C"], "B")];
    const balances = computeBalances(players, rounds);
    expect(balances).toEqual({ A: 5, B: 5, C: -10 });
    expect(sumBalances(balances)).toBe(0);
  });

  it("Test C: player D joins on round 2 and wins", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const rounds = [
      makeRound(1, ["A", "B", "C"], "A"),
      makeRound(2, ["A", "B", "C", "D"], "D"),
    ];
    const balances = computeBalances(players, rounds);
    expect(balances).toEqual({ A: 5, B: -10, C: -10, D: 15 });
    expect(sumBalances(balances)).toBe(0);
  });

  it("Test D: player B leaves on round 2", () => {
    const players = makePlayers(["A", "B", "C", "D"]);
    const rounds = [
      makeRound(1, ["A", "B", "C", "D"], "A"),
      makeRound(2, ["A", "C", "D"], "C"),
    ];
    const balances = computeBalances(players, rounds);
    expect(balances).toEqual({ A: 10, B: -5, C: 5, D: -10 });
    expect(sumBalances(balances)).toBe(0);
  });

  it("5-player round invariant: winner +20, others -5 each, sums to 0", () => {
    const players = makePlayers(["A", "B", "C", "D", "E"]);
    const rounds = [makeRound(1, ["A", "B", "C", "D", "E"], "A")];
    const balances = computeBalances(players, rounds);
    expect(balances).toEqual({ A: 20, B: -5, C: -5, D: -5, E: -5 });
    expect(sumBalances(balances)).toBe(0);
  });
});

describe("computeSettlements", () => {
  it("matches the spec example: A+30 B+10 C-20 D-20 -> C->A20, D->A10, D->B10", () => {
    const balances = { A: 30, B: 10, C: -20, D: -20 };
    const settlements = computeSettlements(balances);
    expect(settlements).toEqual([
      { fromPlayerId: "C", toPlayerId: "A", amount: 20, settled: false },
      { fromPlayerId: "D", toPlayerId: "A", amount: 10, settled: false },
      { fromPlayerId: "D", toPlayerId: "B", amount: 10, settled: false },
    ]);
  });

  it("every settlement resolves all players to zero", () => {
    const balances = { A: 15, B: -5, C: -5, D: -5 };
    const settlements = computeSettlements(balances);
    const net: Record<string, number> = {};
    for (const s of settlements) {
      net[s.fromPlayerId] = (net[s.fromPlayerId] ?? 0) - s.amount;
      net[s.toPlayerId] = (net[s.toPlayerId] ?? 0) + s.amount;
    }
    for (const [id, bal] of Object.entries(balances)) {
      expect(net[id] ?? 0).toBe(bal);
    }
  });

  it("returns no rows when everyone is already at zero", () => {
    const settlements = computeSettlements({ A: 0, B: 0 });
    expect(settlements).toEqual([]);
  });

  it("preserves settled status across recalculation by from->to key", () => {
    const balances = { A: 30, B: 10, C: -20, D: -20 };
    const status = { "C->A": true };
    const settlements = computeSettlements(balances, status);
    expect(settlements.find((s) => s.fromPlayerId === "C" && s.toPlayerId === "A")?.settled).toBe(true);
    expect(settlements.find((s) => s.fromPlayerId === "D" && s.toPlayerId === "A")?.settled).toBe(false);
  });
});
