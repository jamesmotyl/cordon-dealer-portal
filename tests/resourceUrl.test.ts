import assert from "node:assert/strict";
import { normalizeResourceUrl } from "../src/lib/resourceUrl";

// plain http(s) links pass through
assert.equal(normalizeResourceUrl("https://cordon.ai/brochure.pdf"), "https://cordon.ai/brochure.pdf");
assert.equal(normalizeResourceUrl("  http://example.com/a  "), "http://example.com/a");

// a bare host/path is treated as https
assert.equal(normalizeResourceUrl("drive.google.com/file/d/abc"), "https://drive.google.com/file/d/abc");

// anything that isn't http(s) is rejected — these get rendered as <a href>
assert.equal(normalizeResourceUrl("javascript:alert(1)"), null);
assert.equal(normalizeResourceUrl("JavaScript:alert(1)"), null);
assert.equal(normalizeResourceUrl("data:text/html,<script>alert(1)</script>"), null);
assert.equal(normalizeResourceUrl("file:///C:/secret.txt"), null);

// empty / garbage
assert.equal(normalizeResourceUrl(""), null);
assert.equal(normalizeResourceUrl("   "), null);
assert.equal(normalizeResourceUrl("http://"), null);

console.log("resourceUrl tests passed");
