// Framework-free test cases, run via `tsx tests/retention.test.ts`.
import assert from "node:assert";
import { isPastRetention, retentionCutoff } from "../src/lib/retention";

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

const now = new Date("2026-11-10T00:00:00Z");
const threeYearsAgo = new Date("2023-11-10T00:00:00Z");
const justOverTwoYears = new Date("2024-11-09T00:00:00Z");
const justUnderTwoYears = new Date("2024-11-11T00:00:00Z");

test("cutoff is exactly N years before now", () => {
  assert.strictEqual(retentionCutoff(now, 2).toISOString(), "2024-11-10T00:00:00.000Z");
});

test("a closed-lost lead untouched for 3 years is past retention", () => {
  const lead = { stage: "CLOSED_LOST", registrationState: "CLEARED", updatedAt: threeYearsAgo };
  assert.strictEqual(isPastRetention(lead, now, 2), true);
});

test("closed-won and closed-not-yet leads are covered too", () => {
  for (const stage of ["CLOSED_WON", "CLOSED_NOT_YET"]) {
    assert.strictEqual(isPastRetention({ stage, registrationState: "CLEARED", updatedAt: threeYearsAgo }, now, 2), true);
  }
});

test("rejected and expired leads count as closed", () => {
  for (const registrationState of ["REJECTED", "EXPIRED"]) {
    const lead = { stage: "CLIENT_EXPRESSED_INTEREST", registrationState, updatedAt: threeYearsAgo };
    assert.strictEqual(isPastRetention(lead, now, 2), true);
  }
});

test("a live lead is never past retention, however old", () => {
  const lead = { stage: "CLIENT_QUALIFIED", registrationState: "CLEARED", updatedAt: threeYearsAgo };
  assert.strictEqual(isPastRetention(lead, now, 2), false);
});

test("a closed lead is kept until the full period has passed", () => {
  const stage = "CLOSED_LOST";
  assert.strictEqual(isPastRetention({ stage, registrationState: "CLEARED", updatedAt: justOverTwoYears }, now, 2), true);
  assert.strictEqual(isPastRetention({ stage, registrationState: "CLEARED", updatedAt: justUnderTwoYears }, now, 2), false);
});

console.log(`\n${passed} test(s) passed.`);
