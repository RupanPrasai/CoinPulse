import test from "node:test";
import assert from "node:assert/strict";
import { movingAverage, pctChange, volatility } from "../dist/services/analysis.js";

test("movingAverage computes mean", () => {
    assert.equal(movingAverage([1, 2, 3]), 2);
});

test("pctChange computes percent change", () => {
    assert.equal(pctChange([100, 110]), 10);
});

test("volatility is 0 for constant prices", () => {
    assert.equal(volatility([100, 100, 100]), 0);
});
