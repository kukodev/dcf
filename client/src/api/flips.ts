import type { BalanceResponse, CreateFlipRequest, Round, SettledRound } from "@dcf/shared";
import { request } from "./http";

export function createFlip(body: CreateFlipRequest): Promise<Round> {
  return request<Round>("/flip", { method: "POST", body: JSON.stringify(body) });
}

export function getFlip(id: string): Promise<Round> {
  return request<Round>(`/flip/${id}`);
}

export function listFlips(address: string, limit = 20): Promise<SettledRound[]> {
  return request<SettledRound[]>(`/flips?address=${encodeURIComponent(address)}&limit=${limit}`);
}

export function getBalance(address: string): Promise<BalanceResponse> {
  return request<BalanceResponse>(`/balance/${encodeURIComponent(address)}`);
}
