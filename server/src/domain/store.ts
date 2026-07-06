import type { Round, SettledRound, Side } from "@dcf/shared";

const STARTING_BALANCE = 10;

export interface StoredRound {
  round: Round;
  serverSeed: string;
  outcome: Side;
  won: boolean;
  payout: number;
  settleAt: number;
}

const entries = new Map<string, StoredRound>();
const idByKey = new Map<string, string>();
const balances = new Map<string, number>();
const nonces = new Map<string, number>();

export function getBalance(address: string): number {
  if (!balances.has(address)) balances.set(address, STARTING_BALANCE);
  return balances.get(address)!;
}

export function adjustBalance(address: string, delta: number): number {
  const next = getBalance(address) + delta;
  balances.set(address, next);
  return next;
}

export function nextNonce(address: string): number {
  const n = (nonces.get(address) ?? 0) + 1;
  nonces.set(address, n);
  return n;
}

export function saveEntry(entry: StoredRound): void {
  entries.set(entry.round.id, entry);
  idByKey.set(entry.round.idempotencyKey, entry.round.id);
}

export function getEntry(id: string): StoredRound | undefined {
  return entries.get(id);
}

export function getEntryByKey(key: string): StoredRound | undefined {
  const id = idByKey.get(key);
  return id ? entries.get(id) : undefined;
}

export function settleIfDue(entry: StoredRound, now: number): StoredRound {
  if (entry.round.status === "settled" || now < entry.settleAt) return entry;

  const settled: SettledRound = {
    ...entry.round,
    status: "settled",
    outcome: entry.outcome,
    won: entry.won,
    payout: entry.payout,
    serverSeed: entry.serverSeed,
  };

  if (entry.payout > 0) adjustBalance(settled.address, entry.payout);

  const updated: StoredRound = { ...entry, round: settled };
  entries.set(settled.id, updated);
  return updated;
}

export function listSettled(address: string, limit: number): SettledRound[] {
  return [...entries.values()]
    .map((entry) => entry.round)
    .filter((round): round is SettledRound => round.status === "settled" && round.address === address)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
