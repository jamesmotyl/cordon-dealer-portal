import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNAL_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dealers = await prisma.dealer.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ dealers });
}
