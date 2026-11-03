import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNAL_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.resource.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  await prisma.resource.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
