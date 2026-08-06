// No server-only imports here (no @prisma/client) so this is safe to use from
// client components too, unlike leadConflict.ts.
export function normalizeCompanyName(company: string): string {
  return company.trim().toLowerCase();
}
