export const Side = {
  Heads: "heads",
  Tails: "tails",
} as const;
export type Side = (typeof Side)[keyof typeof Side];

interface RoundBase {
  id: string;
  createdAt: string;
  address: string;
  choice: Side;
  amount: number;
  houseEdgeBps: number;
  clientSeed: string;
  serverSeedHash: string;
  nonce: number;
  txSignature: string;
  idempotencyKey: string;
}

export interface PendingRound extends RoundBase {
  status: "pending";
}

export interface SettledRound extends RoundBase {
  status: "settled";
  outcome: Side;
  won: boolean;
  payout: number;
  serverSeed: string;
}

export type Round = PendingRound | SettledRound;

export interface CreateFlipRequest {
  address: string;
  choice: Side;
  amount: number;
  clientSeed: string;
  txSignature: string;
  idempotencyKey: string;
}

export interface BalanceResponse {
  address: string;
  balance: number;
}

export const HOUSE_EDGE_BPS = 350;
