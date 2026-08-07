import { RegistrationState, PrismaClient, Prisma } from "@prisma/client";

// Cordon's exclusivity-check lifecycle: pending -> cleared/rejected,
// cleared -> expired. Terminal states have no valid next state. EXPIRED is
// reachable from CLEARED but is never a user-selected target — it's only
// ever set by expireOverdueLeads below.
const VALID_TRANSITIONS: Record<RegistrationState, RegistrationState[]> = {
  PENDING: [RegistrationState.CLEARED, RegistrationState.REJECTED],
  CLEARED: [RegistrationState.EXPIRED],
  REJECTED: [],
  EXPIRED: [],
};

export function isValidTransition(from: RegistrationState, to: RegistrationState): boolean {
  if (from === to) return false;
  return VALID_TRANSITIONS[from].includes(to);
}

// States that still represent a live, unresolved exclusivity claim and can
// therefore time out.
const EXPIRABLE_STATES: RegistrationState[] = [RegistrationState.CLEARED];

export function isPastExpiry(
  registrationState: RegistrationState,
  expiresAt: Date | null,
  now: Date = new Date()
): boolean {
  if (!expiresAt || !EXPIRABLE_STATES.includes(registrationState)) return false;
  return expiresAt.getTime() <= now.getTime();
}

// "Check on every load" expiry sweep: flips any overdue cleared lead to
// EXPIRED, freeing the farm up for other dealers. Cheap enough to run
// inline on GET rather than needing a real scheduler (e.g. Vercel Cron).
export async function expireOverdueLeads(
  tx: PrismaClient | Prisma.TransactionClient
): Promise<number> {
  const result = await tx.lead.updateMany({
    where: {
      registrationState: { in: EXPIRABLE_STATES },
      expiresAt: { lte: new Date() },
    },
    data: { registrationState: RegistrationState.EXPIRED },
  });
  return result.count;
}
