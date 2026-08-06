// How many days an auto-approved lead stays active before it expires.
// Override with the LEAD_EXPIRATION_DAYS env var; defaults to 60.
export const LEAD_EXPIRATION_DAYS = Number(process.env.LEAD_EXPIRATION_DAYS ?? "60");

// How many days a live lead can go without an update before it's flagged
// as stale for Cordon admins. Override with STALE_DEAL_DAYS; defaults to 10.
export const STALE_DEAL_DAYS = Number(process.env.STALE_DEAL_DAYS ?? "10");
