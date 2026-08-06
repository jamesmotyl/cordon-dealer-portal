// How many days an auto-approved lead stays active before it expires.
// Override with the LEAD_EXPIRATION_DAYS env var; defaults to 60.
export const LEAD_EXPIRATION_DAYS = Number(process.env.LEAD_EXPIRATION_DAYS ?? "60");
