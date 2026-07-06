import { motion } from "framer-motion";
import type { RoundState } from "../game/machine";

const FACE: Record<string, string> = { heads: "H", tails: "T" };

interface Props {
  state: RoundState;
  onLanded: () => void;
}

export function Coin({ state, onLanded }: Props) {
  if (state.status === "committing") {
    return (
      <motion.div
        className="coin"
        animate={{ rotateY: 360 }}
        transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
      >
        <span>?</span>
      </motion.div>
    );
  }

  if (state.status === "animating") {
    const target = state.round.outcome === "heads" ? 0 : 180;
    return (
      <motion.div
        className="coin"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 360 * 4 + target }}
        transition={{ duration: 1.6, ease: [0.15, 0.85, 0.25, 1] }}
        onAnimationComplete={onLanded}
      >
        <span>{FACE[state.round.outcome]}</span>
      </motion.div>
    );
  }

  if (state.status === "resolved") {
    return (
      <div className={`coin landed ${state.round.won ? "win" : "loss"}`}>
        <span>{FACE[state.round.outcome]}</span>
      </div>
    );
  }

  return (
    <div className="coin">
      <span>?</span>
    </div>
  );
}
