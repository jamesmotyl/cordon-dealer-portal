import crypto from "crypto";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
// Minimum gap between reset emails for one account, so the form can't be used
// to spam someone's inbox.
export const RESET_COOLDOWN_MS = 60 * 1000;

// How long a reset request stays visible to admins as an alert — longer than
// the link itself, so a request whose link expired unused is still noticed.
export const RESET_ALERT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// The raw token goes in the emailed link; only its hash is stored.
export function generateResetToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, tokenHash: hashResetToken(token) };
}

export function resetTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MS);
}

export function isResetTokenExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
