import assert from "node:assert/strict";
import {
  RESET_TOKEN_TTL_MS,
  generateResetToken,
  hashResetToken,
  isResetTokenExpired,
  resetTokenExpiry,
} from "../src/lib/resetToken";
import { validateNewPassword } from "../src/lib/password";

// the stored hash is what the raw token hashes to, and is not the token itself
const { token, tokenHash } = generateResetToken();
assert.equal(hashResetToken(token), tokenHash);
assert.notEqual(token, tokenHash);
assert.equal(token.length, 64);

// every token is different
assert.notEqual(generateResetToken().token, token);

// a different token never matches
assert.notEqual(hashResetToken(token + "x"), tokenHash);

// expiry: valid just before the window ends, expired at and after it
const now = new Date("2026-11-10T12:00:00Z");
const expiresAt = resetTokenExpiry(now);
assert.equal(expiresAt.getTime() - now.getTime(), RESET_TOKEN_TTL_MS);
assert.equal(isResetTokenExpired(expiresAt, new Date(expiresAt.getTime() - 1)), false);
assert.equal(isResetTokenExpired(expiresAt, expiresAt), true);
assert.equal(isResetTokenExpired(expiresAt, new Date(expiresAt.getTime() + 1)), true);

// password rules
assert.equal(validateNewPassword("12345678"), null);
assert.notEqual(validateNewPassword("1234567"), null);
assert.notEqual(validateNewPassword(""), null);
assert.notEqual(validateNewPassword(undefined), null);

console.log("resetToken tests passed");
