import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { Role } from "@prisma/client";

// Admin-only check for who is currently set up to receive new-lead alerts
// (sendNewLeadAlert emails every INTERNAL_ADMIN user).
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNAL_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admins = await prisma.user.findMany({
    where: { role: Role.INTERNAL_ADMIN },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ admins });
}
