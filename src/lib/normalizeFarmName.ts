// No server-only imports here (no @prisma/client) so this is safe to use from
// client components too, unlike leadConflict.ts.
export function normalizeFarmName(farm: string): string {
  return farm.trim().toLowerCase();
}
