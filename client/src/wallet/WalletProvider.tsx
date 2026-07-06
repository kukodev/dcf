import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Side } from "@dcf/shared";
import { ConnectApprovalModal } from "./ConnectApprovalModal";
import { TxApprovalModal } from "./TxApprovalModal";

type WalletStatus = "disconnected" | "connecting" | "connected";

export class WalletRejectedError extends Error {
  constructor(message = "Request rejected in wallet") {
    super(message);
    this.name = "WalletRejectedError";
  }
}

export interface TxRequest {
  action: string;
  amount: number;
  choice: Side;
  to: string;
}

export interface TxApproval {
  signature: string;
  failOnChain: boolean;
}

interface WalletContextValue {
  status: WalletStatus;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signAndSend: (request: TxRequest) => Promise<TxApproval>;
}

type Modal = { kind: "connect"; account: string } | { kind: "tx"; request: TxRequest } | null;

const ADDRESS_KEY = "dcf.address";
const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const WalletContext = createContext<WalletContextValue | null>(null);

function base58(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => BASE58[byte % BASE58.length]).join("");
}

interface Props {
  children: ReactNode;
}

export function WalletProvider({ children }: Props) {
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const connectResolver = useRef<{ resolve: () => void; reject: (e: Error) => void } | null>(null);
  const txResolver = useRef<{ resolve: (a: TxApproval) => void; reject: (e: Error) => void } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(ADDRESS_KEY);
    if (stored) {
      setAddress(stored);
      setStatus("connected");
    }
  }, []);

  const connect = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      const account = localStorage.getItem(ADDRESS_KEY) ?? base58(44);
      connectResolver.current = { resolve, reject };
      setStatus("connecting");
      setModal({ kind: "connect", account });
    });
  }, []);

  const approveConnect = useCallback((account: string) => {
    localStorage.setItem(ADDRESS_KEY, account);
    setAddress(account);
    setStatus("connected");
    connectResolver.current?.resolve();
    connectResolver.current = null;
    setModal(null);
  }, []);

  const declineConnect = useCallback(() => {
    setStatus("disconnected");
    connectResolver.current?.reject(new WalletRejectedError());
    connectResolver.current = null;
    setModal(null);
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(ADDRESS_KEY);
    setAddress(null);
    setStatus("disconnected");
  }, []);

  const signAndSend = useCallback((request: TxRequest) => {
    return new Promise<TxApproval>((resolve, reject) => {
      txResolver.current = { resolve, reject };
      setModal({ kind: "tx", request });
    });
  }, []);

  const approveTx = useCallback((failOnChain: boolean) => {
    txResolver.current?.resolve({ signature: base58(88), failOnChain });
    txResolver.current = null;
    setModal(null);
  }, []);

  const declineTx = useCallback(() => {
    txResolver.current?.reject(new WalletRejectedError("Transaction rejected in wallet"));
    txResolver.current = null;
    setModal(null);
  }, []);

  const value = useMemo(
    () => ({ status, address, connect, disconnect, signAndSend }),
    [status, address, connect, disconnect, signAndSend]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
      {modal?.kind === "connect" && (
        <ConnectApprovalModal account={modal.account} onApprove={approveConnect} onDecline={declineConnect} />
      )}
      {modal?.kind === "tx" && address && (
        <TxApprovalModal request={modal.request} account={address} onApprove={approveTx} onDecline={declineTx} />
      )}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
