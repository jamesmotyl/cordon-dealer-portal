import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { RESET_COOLDOWN_MS, generateResetToken, resetTokenExpiry } from "@/lib/resetToken";

// Always answers the same way whether or not the email matches an account, so
// this can't be used to find out who has one.
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  const normalised = String(email ?? "").toLowerCase().trim();

  if (normalised) {
    const user = await prisma.user.findUnique({ where: { email: normalised } });

    if (user) {
      const recent = await prisma.passwordResetToken.findFirst({
        where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESET_COOLDOWN_MS) } },
      });

      if (!recent) {
        const { token, tokenHash } = generateResetToken();
        // One live link per account — a new request replaces any earlier one.
        await prisma.$transaction([
          prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
          prisma.passwordResetToken.create({
            data: { userId: user.id, tokenHash, expiresAt: resetTokenExpiry() },
          }),
        ]);

        const baseUrl = process.env.NEXTAUTH_URL ?? "";
        await sendPasswordResetEmail(user, `${baseUrl}/reset-password?token=${token}`);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
