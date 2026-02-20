import test from "node:test";
import assert from "node:assert/strict";
import { fetchSimplePrice } from "../dist/services/coingecko.js";

test("fetchSimplePrice returns numeric price from CoinGecko response", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return { bitcoin: { usd: 12345 } };
    },
  });

  try {
    const price = await fetchSimplePrice({ coinId: "bitcoin", vsCurrency: "usd" });
    assert.equal(price, 12345);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
