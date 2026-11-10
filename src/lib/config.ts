// How many days an auto-approved lead stays active before it expires.
// Override with the LEAD_EXPIRATION_DAYS env var; defaults to 60.
export const LEAD_EXPIRATION_DAYS = Number(process.env.LEAD_EXPIRATION_DAYS ?? "60");

// How many days a live lead can go without an update before it's flagged
// as stale for Cordon admins. Override with STALE_DEAL_DAYS; defaults to 10.
export const STALE_DEAL_DAYS = Number(process.env.STALE_DEAL_DAYS ?? "10");

// Where people send privacy requests (shown on /privacy). Set PRIVACY_CONTACT_EMAIL
// in the environment; if unset the notice points to their usual Cordon contact.
export const PRIVACY_CONTACT_EMAIL = process.env.PRIVACY_CONTACT_EMAIL ?? "";

// How many years a closed lead is kept before it's flagged for deletion
// (GDPR retention). Override with LEAD_RETENTION_YEARS; defaults to 2.
export const LEAD_RETENTION_YEARS = Number(process.env.LEAD_RETENTION_YEARS ?? "2");
