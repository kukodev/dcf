import { useCallback, useEffect, useReducer, useRef } from "react";
import type { CreateFlipRequest, Round, SettledRound, Side } from "@dcf/shared";
import { createFlip, getFlip } from "../api/flips";
import { ApiError } from "../api/http";
import { useWallet, type TxApproval } from "../wallet/WalletProvider";
import { clearPendingId, loadPendingId, savePendingId } from "../lib/persistence";
import { delay } from "../lib/delay";
import { initialRoundState, roundReducer } from "./machine";

interface CommitArgs {
  address: string;
  choice: Side;
  amount: number;
}

interface FlipRequest {
  args: CommitArgs;
  clientSeed: string;
  idempotencyKey: string;
}

const DCF_PROGRAM = "DCFf1ipZK7Ln3Qw9r2Ty6Uv8Xa4Sb1Nc5Md0Pe7Rg2H";
const POLL_INTERVAL_MS = 600;
const CONFIRM_TIMEOUT_MS = 15000;
const SUBMIT_MS = 900;
const CONFIRMED_HOLD_MS = 800;
const ONCHAIN_FAIL_MS = 2600;

export function useRound() {
  const { signAndSend } = useWallet();
  const [state, dispatch] = useReducer(roundReducer, initialRoundState);
  const lastRequest = useRef<FlipRequest | null>(null);

  const pollUntilSettled = useCallback(async (id: string): Promise<SettledRound> => {
    const start = Date.now();
    while (true) {
      const round = await getFlip(id);
      if (round.status === "settled") return round;
      if (Date.now() - start > CONFIRM_TIMEOUT_MS) throw new Error("Timed out waiting for confirmation");
      await delay(POLL_INTERVAL_MS);
    }
  }, []);

  const confirmAndReveal = useCallback(
    async (id: string) => {
      const settled = await pollUntilSettled(id);
      dispatch({ type: "PHASE", phase: "confirmed" });
      await delay(CONFIRMED_HOLD_MS);
      dispatch({ type: "SETTLED", round: settled });
    },
    [pollUntilSettled]
  );

  const resume = useCallback(
    async (id: string) => {
      let round: Round;
      try {
        round = await getFlip(id);
      } catch {
        clearPendingId();
        dispatch({ type: "RESET" });
        return;
      }
      dispatch({ type: "HYDRATE", round });
      if (round.status === "settled") {
        clearPendingId();
        return;
      }
      try {
        await confirmAndReveal(id);
      } catch (err) {
        dispatch({ type: "FAIL", message: (err as Error).message, retryable: true });
      }
    },
    [confirmAndReveal]
  );

  useEffect(() => {
    const pendingId = loadPendingId();
    if (pendingId) resume(pendingId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = useCallback(
    async (req: FlipRequest) => {
      dispatch({ type: "COMMIT" });

      let approval: TxApproval;
      try {
        approval = await signAndSend({
          action: "Coin Flip",
          amount: req.args.amount,
          choice: req.args.choice,
          to: DCF_PROGRAM,
        });
      } catch (err) {
        dispatch({ type: "FAIL", message: (err as Error).message, retryable: true });
        return;
      }
      dispatch({ type: "PHASE", phase: "submitting", signature: approval.signature });
      await delay(SUBMIT_MS);

      if (approval.failOnChain) {
        dispatch({ type: "PHASE", phase: "confirming" });
        await delay(ONCHAIN_FAIL_MS);
        dispatch({ type: "FAIL", message: "Transaction failed on-chain — no funds moved", retryable: true });
        return;
      }

      const body: CreateFlipRequest = {
        ...req.args,
        clientSeed: req.clientSeed,
        txSignature: approval.signature,
        idempotencyKey: req.idempotencyKey,
      };

      let round: Round;
      try {
        round = await createFlip(body);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Network error — you can safely retry";
        dispatch({ type: "FAIL", message, retryable: !(err instanceof ApiError) || err.status >= 500 });
        return;
      }

      savePendingId(round.id);
      dispatch({ type: "PHASE", phase: "confirming", round });

      try {
        await confirmAndReveal(round.id);
      } catch (err) {
        dispatch({ type: "FAIL", message: (err as Error).message, retryable: true });
      }
    },
    [signAndSend, confirmAndReveal]
  );

  const commit = useCallback(
    (args: CommitArgs) => {
      const req: FlipRequest = { args, clientSeed: crypto.randomUUID(), idempotencyKey: crypto.randomUUID() };
      lastRequest.current = req;
      return run(req);
    },
    [run]
  );

  const retry = useCallback(() => {
    const pendingId = loadPendingId();
    if (pendingId) return resume(pendingId);
    if (lastRequest.current) return run(lastRequest.current);
  }, [resume, run]);

  const finishAnimation = useCallback(() => {
    dispatch({ type: "ANIMATION_DONE" });
    clearPendingId();
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, commit, retry, finishAnimation, reset };
}
