import type { Round, SettledRound } from "@dcf/shared";

export const TX_STEPS = [
  { phase: "signing", label: "Sign" },
  { phase: "submitting", label: "Submit" },
  { phase: "confirming", label: "Confirm" },
  { phase: "confirmed", label: "Done" },
] as const;

export type TxPhase = (typeof TX_STEPS)[number]["phase"];

export type RoundState =
  | { status: "idle" }
  | { status: "committing"; phase: TxPhase; signature: string | null; round: Round | null }
  | { status: "animating"; round: SettledRound }
  | { status: "resolved"; round: SettledRound }
  | {
      status: "error";
      phase: TxPhase;
      message: string;
      retryable: boolean;
      signature: string | null;
      round: Round | null;
    };

export type RoundEvent =
  | { type: "COMMIT" }
  | { type: "PHASE"; phase: TxPhase; signature?: string; round?: Round }
  | { type: "SETTLED"; round: SettledRound }
  | { type: "ANIMATION_DONE" }
  | { type: "HYDRATE"; round: Round }
  | { type: "FAIL"; message: string; retryable: boolean }
  | { type: "RESET" };

export const initialRoundState: RoundState = { status: "idle" };

function hydrate(round: Round): RoundState {
  return round.status === "settled"
    ? { status: "resolved", round }
    : { status: "committing", phase: "confirming", signature: round.txSignature, round };
}

export function roundReducer(state: RoundState, event: RoundEvent): RoundState {
  if (event.type === "RESET") return { status: "idle" };
  if (event.type === "HYDRATE") return hydrate(event.round);

  switch (state.status) {
    case "idle":
    case "error":
      if (event.type === "COMMIT")
        return { status: "committing", phase: "signing", signature: null, round: null };
      return state;

    case "committing":
      if (event.type === "PHASE")
        return {
          status: "committing",
          phase: event.phase,
          signature: event.signature ?? state.signature,
          round: event.round ?? state.round,
        };
      if (event.type === "SETTLED") return { status: "animating", round: event.round };
      if (event.type === "FAIL")
        return {
          status: "error",
          phase: state.phase,
          message: event.message,
          retryable: event.retryable,
          signature: state.signature,
          round: state.round,
        };
      return state;

    case "animating":
      if (event.type === "ANIMATION_DONE") return { status: "resolved", round: state.round };
      return state;

    case "resolved":
      return state;
  }
}
