const PENDING_KEY = "dcf.pendingRoundId";

export function savePendingId(id: string): void {
  localStorage.setItem(PENDING_KEY, id);
}

export function loadPendingId(): string | null {
  return localStorage.getItem(PENDING_KEY);
}

export function clearPendingId(): void {
  localStorage.removeItem(PENDING_KEY);
}
