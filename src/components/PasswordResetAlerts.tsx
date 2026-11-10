import { prisma } from "@/lib/prisma";
import { RESET_ALERT_WINDOW_MS } from "@/lib/resetToken";
import { formatAgo } from "@/lib/timeAgo";
import PasswordResetAlertsList from "@/components/PasswordResetAlertsList";

// Admin-only banner (render it only on admin pages): everyone who has asked for
// a password reset recently and hasn't finished it. A request disappears once
// the user uses their link or an admin resets them, since both delete the token.
export default async function PasswordResetAlerts() {
  const tokens = await prisma.passwordResetToken.findMany({
    where: { createdAt: { gt: new Date(Date.now() - RESET_ALERT_WINDOW_MS) } },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true, dealer: { select: { name: true } } } } },
  });

  if (tokens.length === 0) return null;

  const now = new Date();
  return (
    <PasswordResetAlertsList
      requests={tokens.map((t) => ({
        userId: t.user.id,
        name: t.user.name,
        email: t.user.email,
        org: t.user.dealer?.name ?? "Cordon",
        ago: formatAgo(t.createdAt, now),
      }))}
    />
  );
}
