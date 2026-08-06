// Framework-free test cases, run via `tsx tests/leadTransitions.test.ts`.
import assert from "node:assert";
import { RegistrationState } from "@prisma/client";
import { isValidTransition, isPastExpiry } from "../src/lib/leadTransitions";

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

test("pending -> cleared is valid", () => {
  assert.strictEqual(isValidTransition(RegistrationState.PENDING, RegistrationState.CLEARED), true);
});

test("pending -> rejected is valid", () => {
  assert.strictEqual(isValidTransition(RegistrationState.PENDING, RegistrationState.REJECTED), true);
});

test("cleared -> expired is valid", () => {
  assert.strictEqual(isValidTransition(RegistrationState.CLEARED, RegistrationState.EXPIRED), true);
});

test("rejected -> pending is invalid (terminal state can't reopen)", () => {
  assert.strictEqual(isValidTransition(RegistrationState.REJECTED, RegistrationState.PENDING), false);
});

test("pending -> expired is invalid (can't skip the review step)", () => {
  assert.strictEqual(isValidTransition(RegistrationState.PENDING, RegistrationState.EXPIRED), false);
});

test("expired -> cleared is invalid (terminal state can't reopen)", () => {
  assert.strictEqual(isValidTransition(RegistrationState.EXPIRED, RegistrationState.CLEARED), false);
});

test("same-state transition is invalid (not a real transition)", () => {
  assert.strictEqual(isValidTransition(RegistrationState.CLEARED, RegistrationState.CLEARED), false);
});

test("a cleared lead past its expires_at is due to expire", () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  assert.strictEqual(isPastExpiry(RegistrationState.CLEARED, yesterday), true);
});

test("a cleared lead not yet at its expires_at is not due to expire", () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  assert.strictEqual(isPastExpiry(RegistrationState.CLEARED, tomorrow), false);
});

test("a rejected lead past its old expires_at does not get reopened to expired", () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  assert.strictEqual(isPastExpiry(RegistrationState.REJECTED, yesterday), false);
});

console.log(`\n${passed} test(s) passed.`);
