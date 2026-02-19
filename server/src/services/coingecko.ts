export async function fetchSimplePrice(params: {
  coinId: string;
  vsCurrency: string;
}): Promise<number> {
  const { coinId, vsCurrency } = params;

  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", coinId);
  url.searchParams.set("vs_currencies", vsCurrency);

  const res = await fetch(url.toString(), {
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`CoinGecko error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as Record<string, Record<string, number>>;
  const price = json?.[coinId]?.[vsCurrency];

  if (typeof price !== "number") {
    throw new Error(`Unexpected CoinGecko response: ${JSON.stringify(json)}`);
  }

  return price;
}
