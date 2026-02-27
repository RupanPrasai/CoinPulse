import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";
test("GET /health returns ok", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { ok: true });
});
test("GET /metrics exposes prometheus metrics", async () => {
    const app = createApp();
    await request(app).get("/health");
    const res = await request(app).get("/metrics");
    assert.equal(res.status, 200);
    assert.match(res.text, /http_requests_total/);
});
//# sourceMappingURL=monitoring.test.js.map