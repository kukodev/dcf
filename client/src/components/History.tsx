import type { SettledRound } from "@dcf/shared";
import { formatNet } from "../lib/format";

interface Props {
  rounds: SettledRound[];
}

export function History({ rounds }: Props) {
  if (rounds.length === 0) return null;

  return (
    <section className="history">
      <h3 className="section-label">Recent flips</h3>
      <ul>
        {rounds.map((round) => (
          <li key={round.id} className={round.won ? "win" : "loss"}>
            <span className="history-sides">
              {round.choice} → {round.outcome}
            </span>
            <span className="history-net">{formatNet(round)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
