import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { RegistrationState } from "@prisma/client";
import { isValidTransition } from "@/lib/leadTransitions";
import { normalizeCompanyName } from "@/lib/normalizeCompanyName";
import { LEAD_EXPIRATION_DAYS } from "@/lib/config";

// Clears one PENDING lead's exclusivity check and, if other dealers submitted
// the same vineyard while it was pending, rejects those siblings in the same
// transaction, recording who decided, when, and which lead won on every
// affected record.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNAL_ADMIN") {
    return NextResponse.json({ error: "Only Cordon admins can approve leads" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (!isValidTransition(lead.registrationState, RegistrationState.CLEARED)) {
    return NextResponse.json(
      { error: `Cannot approve a lead in ${lead.registrationState} state` },
      { status: 400 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + LEAD_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const approved = await tx.lead.update({
      where: { id: lead.id },
      data: {
        registrationState: RegistrationState.CLEARED,
        approvedById: user.id,
        approvedAt: now,
        expiresAt,
      },
    });

    await tx.activityLog.create({
      data: {
        leadId: approved.id,
        actorId: user.id,
        action: "Approved",
        detail: "Cleared for this dealer's exclusivity on this vineyard.",
      },
    });

    const siblings = lead.company
      ? await tx.lead.findMany({
          where: {
            id: { not: lead.id },
            registrationState: RegistrationState.PENDING,
            company: { equals: normalizeCompanyName(lead.company), mode: "insensitive" },
          },
        })
      : [];

    for (const sibling of siblings) {
      await tx.lead.update({
        where: { id: sibling.id },
        data: {
          registrationState: RegistrationState.REJECTED,
          approvedById: user.id,
          approvedAt: now,
          resolvedByLeadId: approved.id,
        },
      });

      await tx.activityLog.create({
        data: {
          leadId: sibling.id,
          actorId: user.id,
          action: "Rejected - conflicting registration",
          detail: `${lead.company} was approved for a different dealer instead.`,
        },
      });
    }

    return { approved, rejectedCount: siblings.length };
  });

  return NextResponse.json({ lead: result.approved, rejectedCount: result.rejectedCount });
}
