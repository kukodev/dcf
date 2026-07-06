import { useState } from "react";
import type { Round } from "@dcf/shared";
import type { RoundState, TxPhase } from "../game/machine";
import { TX_STEPS } from "../game/machine";
import { formatSol } from "../lib/format";

const PHASE_MESSAGE: Record<TxPhase, string> = {
  signing: "Approve the transaction in your wallet…",
  submitting: "Broadcasting to the network…",
  confirming: "Confirming on-chain…",
  confirmed: "Confirmed",
};

type StepStatus = "done" | "active" | "error" | "pending";
type Tone = "idle" | "pending" | "success" | "error";

interface FlowView {
  steps: StepStatus[];
  tone: Tone;
  status: string;
  message: string;
  signature: string | null;
  round: Round | null;
  retryable: boolean;
  errored: boolean;
}

const STATUS_LABEL: Record<Tone, string> = {
  idle: "Ready",
  pending: "Pending",
  success: "Confirmed",
  error: "Failed",
};

function phaseIndex(phase: TxPhase): number {
  return TX_STEPS.findIndex((step) => step.phase === phase);
}

function buildView(state: RoundState): FlowView {
  const all = (stepStatus: StepStatus): StepStatus[] => TX_STEPS.map(() => stepStatus);

  switch (state.status) {
    case "idle":
      return {
        steps: all("pending"),
        tone: "idle",
        status: STATUS_LABEL.idle,
        message: "Place a bet to start a round",
        signature: null,
        round: null,
        retryable: false,
        errored: false,
      };
    case "committing": {
      const activeIndex = phaseIndex(state.phase);
      return {
        steps: TX_STEPS.map((_, index) => (index < activeIndex ? "done" : index === activeIndex ? "active" : "pending")),
        tone: "pending",
        status: STATUS_LABEL.pending,
        message: PHASE_MESSAGE[state.phase],
        signature: state.signature,
        round: state.round,
        retryable: false,
        errored: false,
      };
    }
    case "animating":
      return {
        steps: all("done"),
        tone: "pending",
        status: STATUS_LABEL.pending,
        message: "Revealing result…",
        signature: state.round.txSignature,
        round: state.round,
        retryable: false,
        errored: false,
      };
    case "resolved":
      return {
        steps: all("done"),
        tone: "success",
        status: STATUS_LABEL.success,
        message: "Settled on-chain",
        signature: state.round.txSignature,
        round: state.round,
        retryable: false,
        errored: false,
      };
    case "error": {
      const activeIndex = phaseIndex(state.phase);
      return {
        steps: TX_STEPS.map((_, index) => (index < activeIndex ? "done" : index === activeIndex ? "error" : "pending")),
        tone: "error",
        status: STATUS_LABEL.error,
        message: state.message,
        signature: state.signature,
        round: state.round,
        retryable: state.retryable,
        errored: true,
      };
    }
  }
}

function dotContent(status: StepStatus, index: number): string {
  if (status === "done") return "✓";
  if (status === "error") return "✕";
  return String(index + 1);
}

interface Props {
  state: RoundState;
  onRetry: () => void;
  onReset: () => void;
}

export function FlowPanel({ state, onRetry, onReset }: Props) {
  const [showFair, setShowFair] = useState(false);
  const view = buildView(state);
  const settled = state.status === "resolved" ? state.round : null;

  return (
    <div className={`flow tone-${view.tone}`}>
      <div className="flow-head">
        <span className="flow-title">
          {view.round ? `${formatSol(view.round.amount)} on ${view.round.choice}` : "Coin flip"}
        </span>
        <span className="flow-badge">{view.status}</span>
      </div>

      <ol className="tx-steps">
        {TX_STEPS.map((step, index) => (
          <li key={step.phase} className={view.steps[index]}>
            <span className="dot">{dotContent(view.steps[index], index)}</span>
            <span className="tx-step-label">{step.label}</span>
          </li>
        ))}
      </ol>

      <p className="tx-message">{view.message}</p>

      <div className="tx-sig-row">
        {view.signature && (
          <code className="tx-sig">
            {view.signature.slice(0, 8)}…{view.signature.slice(-8)}
          </code>
        )}
        {settled && (
          <button className="link" onClick={() => setShowFair((s) => !s)}>
            {showFair ? "Hide" : "Verify"}
          </button>
        )}
      </div>

      {settled && showFair && (
        <dl className="fair">
          <div>
            <dt>Server seed hash</dt>
            <dd>{settled.serverSeedHash}</dd>
          </div>
          <div>
            <dt>Server seed</dt>
            <dd>{settled.serverSeed}</dd>
          </div>
          <div>
            <dt>Client seed</dt>
            <dd>{settled.clientSeed}</dd>
          </div>
          <div>
            <dt>Nonce</dt>
            <dd>{settled.nonce}</dd>
          </div>
        </dl>
      )}

      {view.errored && (
        <div className="tx-actions">
          {view.retryable && (
            <button className="ghost" onClick={onRetry}>
              Retry
            </button>
          )}
          <button className="ghost" onClick={onReset}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
