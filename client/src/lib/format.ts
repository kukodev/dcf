import type { SettledRound } from "@dcf/shared";

export function formatSol(n: number): string {
  return `${n.toFixed(3)} SOL`;
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function formatNet(round: SettledRound): string {
  const net = round.won ? round.payout - round.amount : -round.amount;
  return `${net >= 0 ? "+" : "−"}${formatSol(Math.abs(net))}`;
}
