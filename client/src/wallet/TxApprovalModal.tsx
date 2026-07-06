import { useState } from "react";
import type { TxRequest } from "./WalletProvider";
import { WalletModalShell } from "./WalletModalShell";
import { formatSol, shortAddress } from "../lib/format";
import { delay } from "../lib/delay";

const SIGN_MS = 1300;

interface Props {
  request: TxRequest;
  account: string;
  onApprove: (failOnChain: boolean) => void;
  onDecline: () => void;
}

export function TxApprovalModal({ request, account, onApprove, onDecline }: Props) {
  const [failOnChain, setFailOnChain] = useState(false);
  const [signing, setSigning] = useState(false);

  const confirm = async () => {
    setSigning(true);
    await delay(SIGN_MS);
    onApprove(failOnChain);
  };

  return (
    <WalletModalShell
      account={account}
      title="Approve Transaction"
      subtitle="Degen Coin Flip wants you to approve a transaction"
      actions={
        <>
          <button className="ghost" onClick={onDecline} disabled={signing}>
            Reject
          </button>
          <button className="primary" onClick={confirm} disabled={signing}>
            {signing ? "Signing…" : "Confirm"}
          </button>
        </>
      }
    >
      <dl className="wm-rows">
        <div>
          <dt>Action</dt>
          <dd>{request.action}</dd>
        </div>
        <div>
          <dt>Bet</dt>
          <dd className="wm-cap">
            {formatSol(request.amount)} on {request.choice}
          </dd>
        </div>
        <div>
          <dt>To program</dt>
          <dd>{shortAddress(request.to)}</dd>
        </div>
        <div>
          <dt>Network fee</dt>
          <dd>~0.000005 SOL</dd>
        </div>
      </dl>

      <label className="wm-sim">
        <input
          type="checkbox"
          checked={failOnChain}
          disabled={signing}
          onChange={(e) => setFailOnChain(e.target.checked)}
        />
        Simulate on-chain failure
      </label>
    </WalletModalShell>
  );
}
