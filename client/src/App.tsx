import { useCallback, useEffect, useState } from "react";
import type { Side, SettledRound } from "@dcf/shared";
import { useWallet } from "./wallet/WalletProvider";
import { useRound } from "./game/useRound";
import { getBalance, listFlips } from "./api/flips";
import { ConnectButton } from "./components/ConnectButton";
import { BetControls } from "./components/BetControls";
import { Coin } from "./components/Coin";
import { FlowPanel } from "./components/FlowPanel";
import { History } from "./components/History";
import { formatNet } from "./lib/format";

const HISTORY_LIMIT = 5;

export default function App() {
  const { status: walletStatus, address } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<SettledRound[]>([]);

  const refresh = useCallback(async (addr: string) => {
    const [bal, flips] = await Promise.all([getBalance(addr), listFlips(addr, HISTORY_LIMIT)]);
    setBalance(bal.balance);
    setHistory(flips);
  }, []);

  const { state, commit, retry, finishAnimation, reset } = useRound();

  useEffect(() => {
    if (address) refresh(address);
  }, [address, refresh]);

  useEffect(() => {
    if (address && state.status === "resolved") refresh(address);
  }, [state.status, address, refresh]);

  const connected = walletStatus === "connected" && !!address;

  const handleFlip = (choice: Side, amount: number) => {
    if (address) commit({ address, choice, amount });
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">◎ Degen Coin Flip</div>
        <ConnectButton balance={balance} />
      </header>

      <main className="stage">
        {connected ? (
          <>
            <div className="stage-slot">
              <Coin state={state} onLanded={finishAnimation} />

              {state.status === "resolved" && (
                <div className="flip-result">
                  <span className={`flip-net ${state.round.won ? "win" : "loss"}`}>
                    {formatNet(state.round)}
                  </span>
                  <button className="primary" onClick={reset}>
                    Play again
                  </button>
                </div>
              )}
            </div>

            {state.status === "idle" && (
              <BetControls balance={balance ?? 0} onFlip={handleFlip} />
            )}

            <section className="console">
              <h3 className="section-label">Onchain state</h3>
              <FlowPanel state={state} onRetry={retry} onReset={reset} />
            </section>
          </>
        ) : (
          <>
            <div className="stage-slot">
              <Coin state={state} onLanded={finishAnimation} />
            </div>
            <p className="hint">Connect a wallet to play.</p>
          </>
        )}
      </main>

      {connected && <History rounds={history} />}
    </div>
  );
}
