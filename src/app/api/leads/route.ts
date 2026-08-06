import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { RegistrationState } from "@prisma/client";
import { LEAD_EXPIRATION_DAYS } from "@/lib/config";
import { hasLeadConflict, normalizeCompanyName } from "@/lib/leadConflict";
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
  const { customerName, company, region, phone, email } = body;

  if (!customerName || !company) {
    return NextResponse.json({ error: "Customer name and company are required" }, { status: 400 });
  }

  const normalizedCompany = normalizeCompanyName(company);

  const [otherCompanyLeads, internalPipelineHit] = await Promise.all([
    prisma.lead.findMany({
      where: { company: { equals: normalizedCompany, mode: "insensitive" } },
      select: { dealerId: true, registrationState: true },
    }),
    prisma.internalPipelineEntry.findFirst({
      where: { company: { equals: normalizedCompany, mode: "insensitive" } },
    }),
  ]);

  const conflict = hasLeadConflict(user.dealerId, otherCompanyLeads, !!internalPipelineHit);

  const now = new Date();
  const expiresAt = conflict
    ? null
    : new Date(now.getTime() + LEAD_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

  const lead = await prisma.$transaction(async (tx) => {
    const created = await tx.lead.create({
      data: {
        customerName,
        company,
        region: region || null,
        phone: phone || null,
        email: email || null,
        dealerId: user.dealerId as string,
        leadGeneratorName: user.name,
        registrationState: conflict ? RegistrationState.PENDING : RegistrationState.CLEARED,
        expiresAt,
      },
    });

    await tx.activityLog.create({
      data: {
        leadId: created.id,
        actorId: user.id,
        action: conflict ? "Lead submitted - flagged for admin review" : "Lead submitted - auto-approved",
        detail: conflict
          ? `${company} conflicts with an existing lead or internal pipeline entry; sent to Cordon for review.`
          : `${company} had no conflicts; approved automatically, expires ${expiresAt?.toDateString()}.`,
      },
    });

    return created;
  });

  return NextResponse.json({ lead }, { status: 201 });
}
