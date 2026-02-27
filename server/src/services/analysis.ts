export function movingAverage(prices: number[]): number {
  if (prices.length === 0) throw new Error("movingAverage requires at least 1 price");
  const sum = prices.reduce((a, b) => a + b, 0);
  return sum / prices.length;
}


export function pctChange(prices: number[]): number {
  if (prices.length < 2) return 0;
  const first = prices[0];
  const last = prices[prices.length - 1];
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}


export function volatility(prices: number[]): number {
  if (prices.length < 2) return 0;

  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    const curr = prices[i];
    if (prev === 0) continue;
    returns.push(curr / prev - 1);
  }
  if (returns.length === 0) return 0;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;

  return Math.sqrt(variance);
}
