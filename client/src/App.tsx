import { useMemo, useState } from "react";
import { fetchMetrics, fetchTimeseries, HttpError, type CoinMetrics, type Timeseries } from "./api/coinpulse";

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export default function App() {
  const [coinId, setCoinId] = useState("bitcoin");
  const [vsCurrency, setVsCurrency] = useState("usd");
  const [points, setPoints] = useState(12);
  const [limit, setLimit] = useState(50);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<CoinMetrics | null>(null);
  const [series, setSeries] = useState<Timeseries | null>(null);

  const fmtPrice = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 8,
      }),
    []
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMetrics(null);
    setSeries(null);

    const c = coinId.trim().toLowerCase();
    const v = vsCurrency.trim().toLowerCase();
    const p = clampInt(points, 2, 500);
    const l = clampInt(limit, 1, 1000);

    if (!c) {
      setErr("Coin ID is required.");
      return;
    }

    setLoading(true);
    try {
      const [t, m] = await Promise.allSettled([
        fetchTimeseries({ coinId: c, vsCurrency: v, limit: l }),
        fetchMetrics({ coinId: c, vsCurrency: v, points: p }),
      ]);

      if (t.status === "fulfilled") {
        setSeries(t.value);
      } else {
        throw t.reason;
      }

      if (m.status === "fulfilled") {
        setMetrics(m.value);
      } else {
        const reason = m.reason;
        if (reason instanceof HttpError && reason.status === 404) {
          setErr(
            "Metrics not computed yet. Run collector + analyzer (or wait for the next scheduled collection)."
          );
        } else {
          throw reason;
        }
      }
    } catch (e: any) {
      setErr(e?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 860, margin: "40px auto", fontFamily: "system-ui" }}>
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

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <label>
            vsCurrency
            <input
              value={vsCurrency}
              onChange={(e) => setVsCurrency(e.target.value)}
              placeholder="usd"
              style={{ width: "100%", padding: 10, marginTop: 6 }}
            />
          </label>

          <label>
            Metrics window (points)
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              min={2}
              max={500}
              style={{ width: "100%", padding: 10, marginTop: 6 }}
            />
          </label>

          <label>
            Timeseries limit
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min={1}
              max={1000}
              style={{ width: "100%", padding: 10, marginTop: 6 }}
            />
          </label>
        </div>

        <button type="submit" style={{ padding: 10 }} disabled={loading}>
          {loading ? "Loading..." : "Load"}
        </button>
      </form>

      {err && <p style={{ marginTop: 16 }}>Error: {err}</p>}

      {metrics && (
        <section style={{ marginTop: 18 }}>
          <h2 style={{ marginBottom: 8 }}>Derived Metrics</h2>
          <div style={{ padding: 12, background: "#f4f4f4" }}>
            <div>
              <b>{metrics.coinId}</b> / {metrics.vsCurrency} (window={metrics.windowPoints}, used={metrics.sampleCount})
            </div>
            <div>Latest: {fmtPrice.format(metrics.latestPrice)}</div>
            <div>Moving Avg: {fmtPrice.format(metrics.movingAverage)}</div>
            <div>% Change: {metrics.pctChange.toFixed(4)}%</div>
            <div>Volatility: {metrics.volatility.toFixed(8)}</div>
            <div>Used Points: {metrics.sampleCount}</div>
            <div>Computed At: {new Date(metrics.computedAt).toLocaleString()}</div>
          </div>
        </section>
      )}

      {series && (
        <section style={{ marginTop: 18 }}>
          <h2 style={{ marginBottom: 8 }}>Price Timeseries</h2>
          <div style={{ padding: 12, background: "#f4f4f4" }}>
            <div>
              Points: {series.count} ({series.vsCurrency})
            </div>

            {series.count === 0 ? (
              <p style={{ marginTop: 10 }}>
                No snapshots yet. Run the collector (and make sure Mongo is connected).
              </p>
            ) : (
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
                      <td style={{ padding: "6px 0" }}>{fmtPrice.format(p.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
