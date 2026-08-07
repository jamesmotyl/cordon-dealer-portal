import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { RegistrationState } from "@prisma/client";
import { isValidTransition } from "@/lib/leadTransitions";

const REGISTRATION_LABELS: Record<RegistrationState, string> = {
  PENDING: "Pending Cordon Review",
  CLEARED: "Cleared",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

// Cordon decides PENDING outcomes; EXPIRED is never a manually-selected
// target (see expireOverdueLeads).
function canPerformTransition(role: "DEALER" | "INTERNAL_ADMIN", to: RegistrationState): boolean {
  if (to === RegistrationState.EXPIRED) return false;
  return role === "INTERNAL_ADMIN";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const isOwningDealer = user.role !== "INTERNAL_ADMIN" && lead.dealerId === user.dealerId;
  if (user.role !== "INTERNAL_ADMIN" && !isOwningDealer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  const logEntries: { action: string; detail?: string }[] = [];

  if (body.registrationState && body.registrationState !== lead.registrationState) {
    const nextState = body.registrationState as RegistrationState;

    if (!isValidTransition(lead.registrationState, nextState)) {
      return NextResponse.json(
        {
          error: `Cannot move a lead from ${REGISTRATION_LABELS[lead.registrationState]} to ${
            REGISTRATION_LABELS[nextState] ?? nextState
          }`,
        },
        { status: 400 }
      );
    }
    if (!canPerformTransition(user.role, nextState)) {
      return NextResponse.json({ error: "Not allowed to make this change" }, { status: 403 });
    }

    data.registrationState = nextState;
    logEntries.push({
      action: "Registration status updated",
      detail: `${REGISTRATION_LABELS[lead.registrationState]} -> ${REGISTRATION_LABELS[nextState]}`,
    });
  }

  // Pipeline/quote/checklist tracking: free-choice, no transition rules —
  // dealers manage their own lead, admins manage any lead.
  const editableFields = [
    "legalName",
    "farm",
    "phone",
    "email",
    "leadGeneratorName",
    "registrationDate",
    "stage",
    "quoteStatus",
    "quotedAt",
    "quoteValueGbp",
    "roiToBeDiscussed",
    "productOptionsStatus",
    "solidHoppers",
    "liquidLines",
    "flowBoost",
    "buyingProcess",
    "finalApprover",
  ] as const;
  for (const field of editableFields) {
    if (field in body && body[field] !== (lead as Record<string, unknown>)[field]) {
      data[field] = body[field];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ lead });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.lead.update({
      where: { id: params.id },
      data,
    });

    for (const entry of logEntries) {
      await tx.activityLog.create({
        data: {
          leadId: lead.id,
          actorId: user.id,
          action: entry.action,
          detail: entry.detail,
        },
      });
    }

    return result;
  });

  return NextResponse.json({ lead: updated });
}
