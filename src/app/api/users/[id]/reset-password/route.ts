import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generatePassword(length = 14) {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[crypto.randomInt(PASSWORD_CHARS.length)];
  }
  return password;
}

// Admin-triggered reset: no email required. Generates a new temp password,
// returns it once for the admin to relay directly, same pattern as account
// creation. Also invalidates the user's existing sessions.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNAL_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const newPassword = generatePassword();
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: params.id },
    data: { passwordHash, sessionInvalidatedAt: new Date() },
  });

  return NextResponse.json({ password: newPassword });
}
