import { STALE_DEAL_DAYS } from "@/lib/config";

// No @prisma/client import here (registrationState is typed as a plain union)
// so this is safe to use from client components too.
type LiveRegistrationState = "PENDING" | "CLEARED";
const LIVE_STATES: LiveRegistrationState[] = ["PENDING", "CLEARED"];

export function isStaleDeal(
  registrationState: string,
  updatedAt: string | Date,
  now: Date = new Date()
): boolean {
  if (!LIVE_STATES.includes(registrationState as LiveRegistrationState)) return false;
  const updated = typeof updatedAt === "string" ? new Date(updatedAt) : updatedAt;
  const daysSinceUpdate = (now.getTime() - updated.getTime()) / (24 * 60 * 60 * 1000);
  return daysSinceUpdate >= STALE_DEAL_DAYS;
}
