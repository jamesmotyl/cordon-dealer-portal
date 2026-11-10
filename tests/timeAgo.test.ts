import assert from "node:assert/strict";
import { formatAgo } from "../src/lib/timeAgo";

const now = new Date("2026-11-10T12:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms);
const MIN = 60 * 1000;

assert.equal(formatAgo(ago(0), now), "just now");
assert.equal(formatAgo(ago(59 * 1000), now), "just now");
assert.equal(formatAgo(ago(1 * MIN), now), "1 min ago");
assert.equal(formatAgo(ago(59 * MIN), now), "59 min ago");
assert.equal(formatAgo(ago(60 * MIN), now), "1 h ago");
assert.equal(formatAgo(ago(23 * 60 * MIN + 59 * MIN), now), "23 h ago");
assert.equal(formatAgo(ago(24 * 60 * MIN), now), "1 d ago");

console.log("timeAgo tests passed");
