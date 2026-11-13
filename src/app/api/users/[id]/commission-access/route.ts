import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// Admin-only: lets a dealer user see commission on their own company's leads.
// Cordon admins always can, so there's nothing to switch for them.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNAL_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { allowed } = await req.json().catch(() => ({}));
  if (typeof allowed !== "boolean") {
    return NextResponse.json({ error: "allowed must be true or false" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role !== Role.DEALER) {
    return NextResponse.json({ error: "Cordon admins can always see commission" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: params.id }, data: { canViewCommission: allowed } });

  return NextResponse.json({ ok: true, canViewCommission: allowed });
}
