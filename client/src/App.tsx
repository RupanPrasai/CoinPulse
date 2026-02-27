import { useState } from "react";

type MetricsResponse = {
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

type TimeseriesPoint = { price: number; collectedAt: string };

type TimeseriesResponse = {
  coinId: string;
  vsCurrency: string;
  count: number;
  points: TimeseriesPoint[];
};

function App() {
  const [coinId, setCoinId] = useState("bitcoin");
  const [err, setErr] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [series, setSeries] = useState<TimeseriesResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMetrics(null);
    setSeries(null);

    const vsCurrency = "usd";
    const points = 12;
    const limit = 50;

    try {
      const [mRes, tRes] = await Promise.all([
        fetch(
          `/api/coins/${encodeURIComponent(
            coinId.trim()
          )}/metrics?vsCurrency=${vsCurrency}&points=${points}`
        ),
        fetch(
          `/api/coins/${encodeURIComponent(
            coinId.trim()
          )}/timeseries?vsCurrency=${vsCurrency}&limit=${limit}`
        ),
      ]);

      if (!tRes.ok) throw new Error(`Timeseries HTTP ${tRes.status}`);
      const tJson = (await tRes.json()) as TimeseriesResponse;
      setSeries(tJson);

      if (mRes.status === 404) {
        setErr(
          "Metrics not computed yet (run collector + analyzer, or wait for the next cycle)."
        );
        return;
      }
      if (!mRes.ok) throw new Error(`Metrics HTTP ${mRes.status}`);
      const mJson = (await mRes.json()) as MetricsResponse;
      setMetrics(mJson);
    } catch (e: any) {
      setErr(e?.message ?? "Request failed");
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>CoinPulse</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Coin ID (CoinGecko id)
          <input
            value={coinId}
            onChange={(e) => setCoinId(e.target.value)}
            placeholder="bitcoin"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <button type="submit" style={{ padding: 10 }}>
          Load
        </button>
      </form>

      {err && <p style={{ marginTop: 16 }}>Error: {err}</p>}

      {metrics && (
        <div style={{ marginTop: 18 }}>
          <h2 style={{ marginBottom: 8 }}>Derived Metrics</h2>
          <div style={{ padding: 12, background: "#f4f4f4" }}>
            <div>Coin: {metrics.coinId}</div>
            <div>
              Latest Price: {metrics.latestPrice} {metrics.vsCurrency}
            </div>
            <div>
              Moving Avg ({metrics.windowPoints}): {metrics.movingAverage}{" "}
              {metrics.vsCurrency}
            </div>
            <div>% Change: {metrics.pctChange}%</div>
            <div>Volatility: {metrics.volatility}</div>
            <div>Sample Count: {metrics.sampleCount}</div>
            <div>Computed At: {new Date(metrics.computedAt).toLocaleString()}</div>
          </div>
        </div>
      )}

      {series && (
        <div style={{ marginTop: 18 }}>
          <h2 style={{ marginBottom: 8 }}>Price Timeseries</h2>
          <div style={{ padding: 12, background: "#f4f4f4" }}>
            <div>
              Points: {series.count} ({series.vsCurrency})
            </div>
            <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th align="left">Time</th>
                  <th align="left">Price</th>
                </tr>
              </thead>
              <tbody>
                {series.points.map((p) => (
                  <tr key={p.collectedAt}>
                    <td style={{ padding: "6px 0" }}>
                      {new Date(p.collectedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "6px 0" }}>{p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
