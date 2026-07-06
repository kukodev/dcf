export function calcPayout(amount: number, won: boolean, houseEdgeBps: number): number {
  if (!won) return 0;
  const gross = amount * 2 * (1 - houseEdgeBps / 10000);
  return Math.round(gross * 1e6) / 1e6;
}
