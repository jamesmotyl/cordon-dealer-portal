import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validateNewPassword } from "@/lib/password";
import { hashResetToken, isResetTokenExpired } from "@/lib/resetToken";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}));

  const passwordError = validateNewPassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const record =
    typeof token === "string" && token
      ? await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(token) } })
      : null;

  if (!record || isResetTokenExpired(record.expiresAt)) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  // Using the link burns every outstanding link for the account and signs out
  // any existing sessions.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await bcrypt.hash(password, 10), sessionInvalidatedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
