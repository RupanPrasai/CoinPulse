import "dotenv/config";
import { connectDb } from "../db.js";
import { PriceSnapshot } from "../models/PriceSnapshot.js";
import { fetchSimplePrice } from "../services/coingecko.js";

async function main() {
  const coinId = process.env.COLLECT_COIN_ID ?? "bitcoin";
  const vsCurrency = process.env.COLLECT_VS_CURRENCY ?? "usd";

  await connectDb();

  const price = await fetchSimplePrice({ coinId, vsCurrency });

  const doc = await PriceSnapshot.create({
    coinId,
    vsCurrency,
    price,
    collectedAt: new Date(),
    source: "coingecko",
  });

  console.log(
    `[collector] saved snapshot: ${doc.coinId} ${doc.vsCurrency}=${doc.price} at ${doc.collectedAt.toISOString()}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[collector] failed:", err);
    process.exit(1);
  });
