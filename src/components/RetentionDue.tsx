import { prisma } from "@/lib/prisma";
import { LEAD_RETENTION_YEARS } from "@/lib/config";
import { CLOSED_REGISTRATION_STATES, CLOSED_STAGES, retentionCutoff } from "@/lib/retention";
import RetentionDueList from "@/components/RetentionDueList";

// Admin-only (render it only on admin pages): closed leads kept longer than the
// retention period. Nothing is deleted automatically — an admin reviews and
// deletes them from here.
export default async function RetentionDue() {
  const leads = await prisma.lead.findMany({
    where: {
      updatedAt: { lte: retentionCutoff() },
      OR: [
        { stage: { in: CLOSED_STAGES } },
        { registrationState: { in: CLOSED_REGISTRATION_STATES } },
      ],
    },
    orderBy: { updatedAt: "asc" },
    select: { id: true, farm: true, legalName: true, updatedAt: true, dealer: { select: { name: true } } },
  });

  if (leads.length === 0) return null;

  return (
    <RetentionDueList
      years={LEAD_RETENTION_YEARS}
      leads={leads.map((l) => ({
        id: l.id,
        farm: l.farm,
        legalName: l.legalName,
        dealer: l.dealer.name,
        closed: l.updatedAt.toLocaleDateString("en-GB"),
      }))}
    />
  );
}
