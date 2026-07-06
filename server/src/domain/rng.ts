import { createHash, createHmac, randomBytes } from "node:crypto";
import { Side } from "@dcf/shared";

export function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function hashSeed(seed: string): string {
  return createHash("sha256").update(seed).digest("hex");
}

export function deriveOutcome(serverSeed: string, clientSeed: string, nonce: number): Side {
  const digest = createHmac("sha256", serverSeed).update(`${clientSeed}:${nonce}`).digest();
  return digest[0] % 2 === 0 ? Side.Heads : Side.Tails;
}
