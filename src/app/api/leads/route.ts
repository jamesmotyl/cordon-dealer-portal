import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { RegistrationState } from "@prisma/client";
import { expireOverdueLeads } from "@/lib/leadTransitions";
import { sendNewLeadAlert } from "@/lib/email";
import { redactLead, redactLeads } from "@/lib/commissionAccess";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await expireOverdueLeads(prisma);

  const { searchParams } = new URL(req.url);
  const dealerId = searchParams.get("dealerId") || undefined;
  const registrationState = searchParams.get("registrationState") as RegistrationState | null;

  const where: Record<string, unknown> = {};

  if (user.role !== "INTERNAL_ADMIN") {
    where.dealerId = user.dealerId;
  } else if (dealerId) {
    where.dealerId = dealerId;
  }

  if (registrationState) where.registrationState = registrationState;

  const leads = await prisma.lead.findMany({
    where,
    include: {
      dealer: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true, role: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leads: await redactLeads(user, leads) });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "INTERNAL_ADMIN" || !user.dealerId) {
    return NextResponse.json({ error: "Only dealer users can submit leads" }, { status: 403 });
  }

  const body = await req.json();
  const { legalName, farm, phone, email } = body;

  if (!legalName || !farm) {
    return NextResponse.json({ error: "Legal name and farm are required" }, { status: 400 });
  }

  const dealer = await prisma.dealer.findUnique({ where: { id: user.dealerId }, select: { name: true } });

  // Every lead requires a Cordon admin decision. The activity log is visible to
  // the dealer, so it never hints at other dealers' claims on the same farm —
  // admins spot same-farm leads on the Pending review screen instead.
  const lead = await prisma.$transaction(async (tx) => {
    const created = await tx.lead.create({
      data: {
        legalName,
        farm,
        phone: phone || null,
        email: email || null,
        dealerId: user.dealerId as string,
        leadGeneratorName: user.name,
        registrationState: RegistrationState.PENDING,
      },
    });

    await tx.activityLog.create({
      data: {
        leadId: created.id,
        actorId: user.id,
        action: "Lead submitted",
        detail: `${farm} submitted for Cordon review.`,
      },
    });

    return created;
  });

  await sendNewLeadAlert({
    id: lead.id,
    farm: lead.farm,
    legalName: lead.legalName,
    dealerName: dealer?.name ?? "Unknown dealer",
  });

  return NextResponse.json({ lead: await redactLead(user, lead) }, { status: 201 });
}
