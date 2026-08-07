import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { RegistrationState } from "@prisma/client";
import { hasLeadConflict, normalizeFarmName } from "@/lib/leadConflict";
import { expireOverdueLeads } from "@/lib/leadTransitions";

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

  return NextResponse.json({ leads });
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

  const normalizedFarm = normalizeFarmName(farm);

  // Still computed for context in the activity log, but no longer decides
  // the outcome — every lead requires a Cordon admin decision now.
  const [otherFarmLeads, internalPipelineHit] = await Promise.all([
    prisma.lead.findMany({
      where: { farm: { equals: normalizedFarm, mode: "insensitive" } },
      select: { dealerId: true, registrationState: true },
    }),
    prisma.internalPipelineEntry.findFirst({
      where: { farm: { equals: normalizedFarm, mode: "insensitive" } },
    }),
  ]);
  const conflict = hasLeadConflict(user.dealerId, otherFarmLeads, !!internalPipelineHit);

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
        detail: conflict
          ? `${farm} conflicts with an existing lead or internal pipeline entry — flagged for Cordon review.`
          : `${farm} submitted for Cordon review.`,
      },
    });

    return created;
  });

  return NextResponse.json({ lead }, { status: 201 });
}
