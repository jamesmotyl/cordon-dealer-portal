import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

// Sets sessionInvalidatedAt so the next request from any of this user's
// existing sessions gets rejected by the JWT callback (see src/lib/auth.ts),
// even though the JWT itself remains technically valid until it expires.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNAL_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.user.update({
    where: { id: params.id },
    data: { sessionInvalidatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
