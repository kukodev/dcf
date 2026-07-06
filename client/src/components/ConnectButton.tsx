import { useWallet } from "../wallet/WalletProvider";
import { formatSol, shortAddress } from "../lib/format";

interface Props {
  balance: number | null;
}

export function ConnectButton({ balance }: Props) {
  const { status, address, connect, disconnect } = useWallet();

  const onConnect = () => {
    connect().catch(() => {});
  };

  if (status === "connected" && address) {
    return (
      <div className="wallet">
        {balance !== null && <span className="balance">{formatSol(balance)}</span>}
        <button className="ghost wallet-btn" onClick={disconnect}>
          <span className="wallet-addr">{shortAddress(address)}</span>
          <span className="wallet-disconnect">Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <button className="primary" onClick={onConnect} disabled={status === "connecting"}>
      {status === "connecting" ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
