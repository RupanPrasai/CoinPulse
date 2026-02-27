export type CoinMetrics = {
  coinId: string;
  vsCurrency: string;
  windowPoints: number;
  latestPrice: number;
  movingAverage: number;
  pctChange: number;
  volatility: number;
  sampleCount: number;
  computedAt: string;
};

export type TimeseriesPoint = { price: number; collectedAt: string };

export type Timeseries = {
  coinId: string;
  vsCurrency: string;
  count: number;
  points: TimeseriesPoint[];
};

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON response: ${text.slice(0, 200)}`);
  }
}

export async function fetchMetrics(args: {
  coinId: string;
  vsCurrency: string;
  points: number;
}): Promise<CoinMetrics> {
  const url = `/api/coins/${encodeURIComponent(args.coinId)}/metrics?vsCurrency=${encodeURIComponent(
    args.vsCurrency
  )}&points=${encodeURIComponent(String(args.points))}`;

  const res = await fetch(url);
  if (res.ok) return readJson<CoinMetrics>(res);

  if (res.status === 404) throw new HttpError(404, "Metrics not computed yet.");
  throw new HttpError(res.status, `Metrics HTTP ${res.status}`);
}

export async function fetchTimeseries(args: {
  coinId: string;
  vsCurrency: string;
  limit: number;
}): Promise<Timeseries> {
  const url = `/api/coins/${encodeURIComponent(
    args.coinId
  )}/timeseries?vsCurrency=${encodeURIComponent(
    args.vsCurrency
  )}&limit=${encodeURIComponent(String(args.limit))}`;

  const res = await fetch(url);
  if (!res.ok) throw new HttpError(res.status, `Timeseries HTTP ${res.status}`);
  return readJson<Timeseries>(res);
}
