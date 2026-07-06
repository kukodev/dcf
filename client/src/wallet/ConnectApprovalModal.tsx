import { useState } from "react";
import { WalletModalShell } from "./WalletModalShell";
import { shortAddress } from "../lib/format";
import { delay } from "../lib/delay";

const CONNECT_MS = 1000;

interface Props {
  account: string;
  onApprove: (account: string) => void;
  onDecline: () => void;
}

export function ConnectApprovalModal({ account, onApprove, onDecline }: Props) {
  const [connecting, setConnecting] = useState(false);

  const confirm = async () => {
    setConnecting(true);
    await delay(CONNECT_MS);
    onApprove(account);
  };

  return (
    <WalletModalShell
      account={account}
      title="Connect"
      subtitle="Degen Coin Flip wants to connect to your wallet"
      actions={
        <>
          <button className="ghost" onClick={onDecline} disabled={connecting}>
            Cancel
          </button>
          <button className="primary" onClick={confirm} disabled={connecting}>
            {connecting ? "Connecting…" : "Connect"}
          </button>
        </>
      }
    >
      <dl className="wm-rows">
        <div>
          <dt>Account</dt>
          <dd>{shortAddress(account)}</dd>
        </div>
        <div>
          <dt>Permissions</dt>
          <dd>View balance &amp; request approvals</dd>
        </div>
      </dl>
    </WalletModalShell>
  );
}
