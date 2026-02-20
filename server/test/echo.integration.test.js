import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../dist/app.js";

test("POST /api/echo echoes payload", async () => {
  const app = createApp();

  const payload = { message: "hello" };

  const res = await request(app).post("/api/echo").send(payload);

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.received, payload);
  assert.equal(typeof res.body.serverTime, "string");
  assert.ok(res.body.serverTime.length > 0);
});
