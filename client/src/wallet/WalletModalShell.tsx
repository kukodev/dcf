import type { ReactNode } from "react";
import { shortAddress } from "../lib/format";

interface Props {
  account: string | null;
  title: string;
  subtitle: string;
  children?: ReactNode;
  actions: ReactNode;
}

export function WalletModalShell({ account, title, subtitle, children, actions }: Props) {
  return (
    <div className="modal-overlay">
      <div className="wallet-modal">
        <div className="wm-head">
          <span className="wm-logo">👻 Phantom</span>
          {account && <span className="wm-account">{shortAddress(account)}</span>}
        </div>

        <h3 className="wm-title">{title}</h3>
        <p className="wm-sub">{subtitle}</p>

        {children}

        <div className="wm-actions">{actions}</div>

        <p className="wm-note">Simulated wallet — no real funds are involved.</p>
      </div>
    </div>
  );
}
