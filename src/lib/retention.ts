import type { LeadStage, RegistrationState } from "@prisma/client";
import { LEAD_RETENTION_YEARS } from "@/lib/config";

// A lead is "closed" once its pipeline stage is a closed one, or it has left the
// live registration states (lost a conflict, or its exclusivity lapsed).
// Type-only Prisma import, so this stays safe to use from client components.
export const CLOSED_STAGES: LeadStage[] = ["CLOSED_WON", "CLOSED_NOT_YET", "CLOSED_LOST"];
export const CLOSED_REGISTRATION_STATES: RegistrationState[] = ["REJECTED", "EXPIRED"];

export function isLeadClosed(stage: string, registrationState: string): boolean {
  return (
    CLOSED_STAGES.includes(stage as LeadStage) ||
    CLOSED_REGISTRATION_STATES.includes(registrationState as RegistrationState)
  );
}

export function retentionCutoff(now: Date = new Date(), years: number = LEAD_RETENTION_YEARS): Date {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years);
  return cutoff;
}

// There's no separate "closed on" date, so updatedAt stands in for it: a closed
// lead is rarely edited, and the clock restarting after an admin edit only
// delays deletion, never brings it forward.
export function isPastRetention(
  lead: { stage: string; registrationState: string; updatedAt: Date },
  now: Date = new Date(),
  years: number = LEAD_RETENTION_YEARS
): boolean {
  return (
    isLeadClosed(lead.stage, lead.registrationState) &&
    lead.updatedAt.getTime() <= retentionCutoff(now, years).getTime()
  );
}
