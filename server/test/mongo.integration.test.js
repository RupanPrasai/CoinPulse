import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { createApp } from "../dist/app.js";
import { PriceSnapshot } from "../dist/models/PriceSnapshot.js";
import { CoinMetric } from "../dist/models/CoinMetrics.js";

test("DB-backed: GET /api/coins/:coinId/timeseries returns stored snapshots", async (t) => {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  t.after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  await PriceSnapshot.create([
    {
      coinId: "bitcoin",
      vsCurrency: "usd",
      price: 100,
      collectedAt: new Date("2026-02-01T00:00:00.000Z"),
      source: "coingecko",
    },
    {
      coinId: "bitcoin",
      vsCurrency: "usd",
      price: 110,
      collectedAt: new Date("2026-02-01T01:00:00.000Z"),
      source: "coingecko",
    },
  ]);

  const app = createApp();
  const res = await request(app).get(
    "/api/coins/bitcoin/timeseries?vsCurrency=usd&limit=5"
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.coinId, "bitcoin");
  assert.equal(res.body.vsCurrency, "usd");
  assert.equal(res.body.count, 2);
  assert.deepEqual(res.body.points.map((p) => p.price), [100, 110]);
});

test("DB-backed: GET /api/coins/:coinId/metrics returns stored metrics", async (t) => {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  t.after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  await CoinMetric.create({
    coinId: "bitcoin",
    vsCurrency: "usd",
    windowPoints: 12,
    latestPrice: 65571,
    movingAverage: 66819.1,
    pctChange: -2.55,
    volatility: 0.0089,
    sampleCount: 10,
    computedAt: new Date("2026-02-01T02:00:00.000Z"),
  });

  const app = createApp();
  const res = await request(app).get(
    "/api/coins/bitcoin/metrics?vsCurrency=usd&points=12"
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.coinId, "bitcoin");
  assert.equal(res.body.vsCurrency, "usd");
  assert.equal(res.body.windowPoints, 12);
  assert.equal(res.body.latestPrice, 65571);
});
