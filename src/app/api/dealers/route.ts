import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNAL_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, region } = body;

  if (!name) {
    return NextResponse.json({ error: "Dealer name is required" }, { status: 400 });
  }

  const existing = await prisma.dealer.findFirst({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "A dealer with that name already exists" }, { status: 400 });
  }

  const dealer = await prisma.dealer.create({
    data: { name, region: region || null, status: "ACTIVE" },
  });

  return NextResponse.json({ dealer }, { status: 201 });
}
