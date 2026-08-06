import { RegistrationState } from "@prisma/client";

export { normalizeVineyardName } from "@/lib/normalizeVineyardName";

// Registration states that no longer represent a live exclusivity claim.
const INACTIVE_STATES: RegistrationState[] = [RegistrationState.REJECTED, RegistrationState.EXPIRED];

export interface ConflictCandidate {
  dealerId: string;
  registrationState: RegistrationState;
}

// True if another dealer already has a live claim on this vineyard, or Cordon
// is already working it internally.
export function hasLeadConflict(
  submittingDealerId: string,
  otherVineyardLeads: ConflictCandidate[],
  internalPipelineHit: boolean
): boolean {
  if (internalPipelineHit) return true;
  return otherVineyardLeads.some(
    (lead) => lead.dealerId !== submittingDealerId && !INACTIVE_STATES.includes(lead.registrationState)
  );
}
