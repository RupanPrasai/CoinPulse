import { useState } from 'react'

type EchoResponse = {
  received: any;
  serverTime: string;
};

function App() {
  const [coinId, setCoinId] = useState('bitcoin');
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<EchoResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setResult(null);

    try {
      const res = await fetch("/api/echo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coinId, notes }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e: any) {
      setErr(e?.message ?? "Request failed");
    }

  };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>CoinPulse</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }} >
        <label>
          Coin ID
          <input
            value={coinId}
            onChange={(e) => setCoinId(e.target.value)}
            placeholder='bitcoin'
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          Notes
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='optional'
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <button type='submit' style={{ padding: 10 }}>
          Submit
        </button>
      </form>

      {err && <p style={{ marginTop: 16 }}>Error: {err}</p>}

      {result && (
        <pre style={{ marginTop: 16, padding: 12, background: "#f4f4f4" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default App
