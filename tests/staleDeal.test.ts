// Framework-free test cases, run via `tsx tests/staleDeal.test.ts`.
import assert from "node:assert";
import { isStaleDeal } from "../src/lib/staleDeal";

let passed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`PASS: ${name}`);
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

const now = new Date("2026-08-20T00:00:00Z");

test("a cleared lead updated 11 days ago is stale", () => {
  const updatedAt = new Date("2026-08-09T00:00:00Z");
  assert.strictEqual(isStaleDeal("CLEARED", updatedAt, now), true);
});

test("a pending lead updated 11 days ago is stale", () => {
  const updatedAt = new Date("2026-08-09T00:00:00Z");
  assert.strictEqual(isStaleDeal("PENDING", updatedAt, now), true);
});

test("a cleared lead updated 5 days ago is not stale", () => {
  const updatedAt = new Date("2026-08-15T00:00:00Z");
  assert.strictEqual(isStaleDeal("CLEARED", updatedAt, now), false);
});

test("a rejected lead updated 30 days ago is not stale (terminal state, nothing to act on)", () => {
  const updatedAt = new Date("2026-07-21T00:00:00Z");
  assert.strictEqual(isStaleDeal("REJECTED", updatedAt, now), false);
});

test("an expired lead updated 30 days ago is not stale (terminal state)", () => {
  const updatedAt = new Date("2026-07-21T00:00:00Z");
  assert.strictEqual(isStaleDeal("EXPIRED", updatedAt, now), false);
});

console.log(`\n${passed} test(s) passed.`);
