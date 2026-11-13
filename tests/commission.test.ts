// Framework-free test cases, run via `tsx tests/commission.test.ts`.
import assert from "node:assert";
import {
  calculateCommission,
  commissionStatus,
  parseRestrictedUpdate,
  showsInvoice,
  stripCommission,
} from "../src/lib/commission";

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

test("invoice details only show once the quote is accepted or invoiced", () => {
  assert.strictEqual(showsInvoice("QUOTE_ACCEPTED"), true);
  assert.strictEqual(showsInvoice("INVOICED"), true);
  for (const s of ["PRE_QUOTE", "NEEDS_QUOTE", "QUOTE_SENT", "QUOTE_DECLINED"]) {
    assert.strictEqual(showsInvoice(s), false);
  }
});

test("commission is the rate applied to the net invoiced amount", () => {
  assert.strictEqual(calculateCommission(20000, 5), 1000);
  assert.strictEqual(calculateCommission(20000, 10), 2000);
});

test("commission is rounded to the penny", () => {
  assert.strictEqual(calculateCommission(1234.56, 5), 61.73);
});

test("commission can't be calculated without both a rate and an amount", () => {
  assert.strictEqual(calculateCommission(null, 5), null);
  assert.strictEqual(calculateCommission(20000, null), null);
  assert.strictEqual(calculateCommission(undefined, undefined), null);
});

test("commission is not due until the customer has paid", () => {
  assert.strictEqual(commissionStatus({ paidAt: null, commissionPaidAt: null }), "NOT_DUE");
});

test("commission is due once the customer has paid, until it is paid out", () => {
  assert.strictEqual(commissionStatus({ paidAt: new Date(), commissionPaidAt: null }), "DUE");
});

test("commission is settled once paid out", () => {
  assert.strictEqual(commissionStatus({ paidAt: new Date(), commissionPaidAt: new Date() }), "PAID");
});

test("stripCommission removes only the commission fields", () => {
  const lead = { farm: "Kenton Park", paidAt: "x", commission: 100, commissionRatePercent: 5, commissionPaidAt: null };
  const stripped = stripCommission(lead) as Record<string, unknown>;
  assert.deepStrictEqual(Object.keys(stripped).sort(), ["farm", "paidAt"]);
  assert.strictEqual(lead.commission, 100); // original untouched
});

test("a valid invoice + commission update is parsed and every touched field reported", () => {
  const r = parseRestrictedUpdate({
    invoiceNumber: "  INV-1 ",
    invoicedAt: "2026-11-01",
    invoiceNetGbp: 20000,
    paidAt: "2026-11-10",
    commissionRatePercent: 5,
    commission: 1000,
    commissionPaidAt: null,
  });
  assert.strictEqual(r.error, undefined);
  assert.strictEqual(r.data.invoiceNumber, "INV-1");
  assert.ok(r.data.paidAt instanceof Date);
  assert.strictEqual(r.data.commissionPaidAt, null);
  assert.strictEqual(r.touched.length, 7);
});

test("an empty body touches nothing", () => {
  const r = parseRestrictedUpdate({ farm: "x", stage: "CLOSED_WON" });
  assert.deepStrictEqual(r.touched, []);
  assert.deepStrictEqual(r.data, {});
});

test("blank values clear a field", () => {
  const r = parseRestrictedUpdate({ invoiceNumber: "", paidAt: "", invoiceNetGbp: "" });
  assert.strictEqual(r.data.invoiceNumber, null);
  assert.strictEqual(r.data.paidAt, null);
  assert.strictEqual(r.data.invoiceNetGbp, null);
});

test("bad dates and amounts are rejected", () => {
  assert.ok(parseRestrictedUpdate({ paidAt: "not a date" }).error);
  assert.ok(parseRestrictedUpdate({ invoiceNetGbp: -5 }).error);
  assert.ok(parseRestrictedUpdate({ invoiceNetGbp: "lots" }).error);
  assert.ok(parseRestrictedUpdate({ commission: Number.NaN }).error);
  assert.ok(parseRestrictedUpdate({ commissionRatePercent: 150 }).error);
  assert.ok(parseRestrictedUpdate({ invoiceNumber: 42 }).error);
});

console.log(`\n${passed} test(s) passed.`);
