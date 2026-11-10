import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { RegistrationState } from "@prisma/client";
import { canRenew } from "@/lib/leadTransitions";
import { normalizeFarmName } from "@/lib/normalizeFarmName";
import { LEAD_EXPIRATION_DAYS } from "@/lib/config";

// Gives a lead a fresh exclusivity window: either extending a CLEARED lead
// before it lapses, or reinstating one that has already EXPIRED. Reinstating is
// refused if another dealer has taken the farm in the meantime.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNAL_ADMIN") {
    return NextResponse.json({ error: "Only Cordon admins can renew exclusivity" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (!canRenew(lead.registrationState)) {
    return NextResponse.json(
      { error: `Cannot renew a lead in ${lead.registrationState} state` },
      { status: 400 }
    );
  }

  if (lead.registrationState === RegistrationState.EXPIRED) {
    const rival = await prisma.lead.findFirst({
      where: {
        id: { not: lead.id },
        dealerId: { not: lead.dealerId },
        registrationState: { in: [RegistrationState.PENDING, RegistrationState.CLEARED] },
        farm: { equals: normalizeFarmName(lead.farm), mode: "insensitive" },
      },
      include: { dealer: { select: { name: true } } },
    });
    if (rival) {
      return NextResponse.json(
        {
          error: `${rival.dealer.name} now has a ${rival.registrationState.toLowerCase()} claim on this farm. Resolve that first.`,
        },
        { status: 400 }
      );
    }
  }

  const expiresAt = new Date(Date.now() + LEAD_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
  const wasExpired = lead.registrationState === RegistrationState.EXPIRED;

  const renewed = await prisma.$transaction(async (tx) => {
    const updated = await tx.lead.update({
      where: { id: lead.id },
      data: { registrationState: RegistrationState.CLEARED, expiresAt },
    });

    await tx.activityLog.create({
      data: {
        leadId: lead.id,
        actorId: user.id,
        action: wasExpired ? "Exclusivity reinstated" : "Exclusivity renewed",
        detail: `Exclusive until ${expiresAt.toLocaleDateString("en-GB")}.`,
      },
    });

    return updated;
  });

  return NextResponse.json({ lead: renewed });
}
