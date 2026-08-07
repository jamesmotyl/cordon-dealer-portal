// Framework-free test cases for the lead conflict logic, run via `tsx tests/leadConflict.test.ts`.
// No test runner (jest/vitest) is installed in this project yet, so this uses plain
// node:assert rather than adding a new dependency.
import assert from "node:assert";
import { RegistrationState } from "@prisma/client";
import { hasLeadConflict } from "../src/lib/leadConflict";

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

test("same farm submitted twice by different dealers is a conflict", () => {
  const conflict = hasLeadConflict(
    "dealer-b",
    [{ dealerId: "dealer-a", registrationState: RegistrationState.CLEARED }],
    false
  );
  assert.strictEqual(conflict, true);
});

test("totally new farm with no existing leads or pipeline hit has no conflict", () => {
  const conflict = hasLeadConflict("dealer-a", [], false);
  assert.strictEqual(conflict, false);
});

test("farm already in Cordon's internal pipeline is a conflict even with no other dealer leads", () => {
  const conflict = hasLeadConflict("dealer-a", [], true);
  assert.strictEqual(conflict, true);
});

test("same dealer resubmitting their own farm is not a conflict with themselves", () => {
  const conflict = hasLeadConflict(
    "dealer-a",
    [{ dealerId: "dealer-a", registrationState: RegistrationState.CLEARED }],
    false
  );
  assert.strictEqual(conflict, false);
});

test("a rejected/expired lead from another dealer does not block a new submission", () => {
  const conflict = hasLeadConflict(
    "dealer-b",
    [{ dealerId: "dealer-a", registrationState: RegistrationState.REJECTED }],
    false
  );
  assert.strictEqual(conflict, false);
});

console.log(`\n${passed} test(s) passed.`);
