import { useState } from "react";
import { Side } from "@dcf/shared";
import { formatSol } from "../lib/format";

const AMOUNTS = [0.1, 0.25, 0.5, 1];

interface Props {
  balance: number;
  onFlip: (choice: Side, amount: number) => void;
}

export function BetControls({ balance, onFlip }: Props) {
  const [choice, setChoice] = useState<Side>(Side.Heads);
  const [amount, setAmount] = useState(AMOUNTS[0]);

  const tooPoor = amount > balance;

  return (
    <div className="bet">
      <div className="segmented sides">
        {Object.values(Side).map((side) => (
          <button key={side} className={choice === side ? "active" : ""} onClick={() => setChoice(side)}>
            {side}
          </button>
        ))}
      </div>

      <div className="segmented amounts">
        {AMOUNTS.map((value) => (
          <button
            key={value}
            className={amount === value ? "active" : ""}
            onClick={() => setAmount(value)}
            disabled={value > balance}
          >
            {value}
          </button>
        ))}
      </div>

      <button
        className="primary flip"
        disabled={tooPoor || balance <= 0}
        onClick={() => onFlip(choice, amount)}
      >
        {tooPoor ? "Insufficient balance" : `Flip for ${formatSol(amount)}`}
      </button>
    </div>
  );
}
