import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { Role } from "@prisma/client";

const CREATABLE_ROLES: Role[] = [Role.DEALER_USER, Role.DEALER_ADMIN];

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNAL_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, dealerId, role } = body;

  if (!name || !email || !password || !dealerId) {
    return NextResponse.json(
      { error: "Name, email, password, and dealer are required" },
      { status: 400 }
    );
  }
  if (!CREATABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
  if (!dealer) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      dealerId,
      role,
    },
    select: { id: true, name: true, email: true, role: true, dealerId: true },
  });

  return NextResponse.json({ user: created }, { status: 201 });
}
