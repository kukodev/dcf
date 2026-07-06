import { Router } from "express";
import { randomUUID } from "node:crypto";
import type { CreateFlipRequest, PendingRound } from "@dcf/shared";
import { HOUSE_EDGE_BPS, Side } from "@dcf/shared";
import { deriveOutcome, generateServerSeed, hashSeed } from "../domain/rng";
import { calcPayout } from "../domain/payout";
import {
  adjustBalance,
  getBalance,
  getEntry,
  getEntryByKey,
  listSettled,
  nextNonce,
  saveEntry,
  settleIfDue,
  type StoredRound,
} from "../domain/store";

const router = Router();
const CONFIRM_MS = 3000;

router.post("/flip", (req, res) => {
  const body = req.body as Partial<CreateFlipRequest>;
  const { address, choice, amount, clientSeed, txSignature, idempotencyKey } = body;

  if (
    typeof address !== "string" ||
    typeof idempotencyKey !== "string" ||
    typeof clientSeed !== "string" ||
    typeof txSignature !== "string" ||
    typeof amount !== "number" ||
    (choice !== Side.Heads && choice !== Side.Tails)
  ) {
    return res.status(400).json({ error: "Invalid flip request", code: "BAD_REQUEST" });
  }

  const existing = getEntryByKey(idempotencyKey);
  if (existing) {
    const samePayload =
      existing.round.address === address &&
      existing.round.amount === amount &&
      existing.round.choice === choice;
    if (!samePayload) {
      return res
        .status(409)
        .json({ error: "Idempotency key reused with a different payload", code: "IDEMPOTENCY_CONFLICT" });
    }
    return res.json(settleIfDue(existing, Date.now()).round);
  }

  if (amount <= 0) {
    return res.status(400).json({ error: "Amount must be positive", code: "BAD_REQUEST" });
  }

  if (getBalance(address) < amount) {
    return res.status(402).json({ error: "Insufficient balance", code: "INSUFFICIENT_BALANCE" });
  }

  const serverSeed = generateServerSeed();
  const nonce = nextNonce(address);
  const outcome = deriveOutcome(serverSeed, clientSeed, nonce);
  const won = outcome === choice;
  const payout = calcPayout(amount, won, HOUSE_EDGE_BPS);

  adjustBalance(address, -amount);

  const round: PendingRound = {
    id: randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
    address,
    choice,
    amount,
    houseEdgeBps: HOUSE_EDGE_BPS,
    clientSeed,
    serverSeedHash: hashSeed(serverSeed),
    nonce,
    txSignature,
    idempotencyKey,
  };

  const entry: StoredRound = { round, serverSeed, outcome, won, payout, settleAt: Date.now() + CONFIRM_MS };
  saveEntry(entry);
  res.json(round);
});

router.get("/flip/:id", (req, res) => {
  const entry = getEntry(req.params.id);
  if (!entry) return res.status(404).json({ error: "Round not found", code: "NOT_FOUND" });
  res.json(settleIfDue(entry, Date.now()).round);
});

router.get("/flips", (req, res) => {
  const address = String(req.query.address ?? "");
  if (!address) return res.status(400).json({ error: "address is required", code: "BAD_REQUEST" });
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  res.json(listSettled(address, limit));
});

router.get("/balance/:address", (req, res) => {
  res.json({ address: req.params.address, balance: getBalance(req.params.address) });
});

export default router;
