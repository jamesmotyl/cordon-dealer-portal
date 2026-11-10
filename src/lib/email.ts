import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Cordon Dealer Portal <alerts@cordon.ai>";
const POSTMARK_SEND_URL = "https://api.postmarkapp.com/email";

// All current admins, not a hardcoded address list — anyone with
// INTERNAL_ADMIN automatically gets alerts, including future admins.
async function adminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: Role.INTERNAL_ADMIN },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

// Never throws: an email failure must not block whatever triggered it.
async function sendEmail(to: string[], subject: string, textBody: string) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) {
    console.log(`POSTMARK_SERVER_TOKEN not set — skipping email "${subject}".`);
    return;
  }

  try {
    const res = await fetch(POSTMARK_SEND_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify({
        From: FROM_ADDRESS,
        To: to.join(","),
        Subject: subject,
        TextBody: textBody,
        MessageStream: "outbound",
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`Postmark send failed for "${subject}" (${res.status}): ${body}`);
    }
  } catch (err) {
    console.error(`Failed to send email "${subject}":`, err);
  }
}

export async function sendNewLeadAlert(lead: {
  id: string;
  farm: string;
  legalName: string;
  dealerName: string;
}) {
  const to = await adminEmails();
  if (to.length === 0) return;

  const portalUrl = process.env.NEXTAUTH_URL ?? "";

  await sendEmail(
    to,
    `New lead: ${lead.farm} (${lead.dealerName})`,
    [
      `${lead.dealerName} submitted a new lead.`,
      ``,
      `Farm: ${lead.farm}`,
      `Legal name: ${lead.legalName}`,
      ``,
      portalUrl ? `Review it: ${portalUrl}/admin/conflicts` : undefined,
    ]
      .filter(Boolean)
      .join("\n")
  );
}

// Backup for when the user's own reset email doesn't land (spam, typo'd inbox,
// provider hiccup): tells admins so they can reset the password by hand.
export async function sendPasswordResetAlert(user: { name: string; email: string }, orgName: string) {
  const to = await adminEmails();
  if (to.length === 0) return;

  const portalUrl = process.env.NEXTAUTH_URL ?? "";

  await sendEmail(
    to,
    `Password reset requested: ${user.name} (${orgName})`,
    [
      `${user.name} <${user.email}> asked to reset their password. They've been emailed a reset link.`,
      ``,
      `If they can't get it to work, reset it by hand with the "Reset password" button next to them on the Users list, then send them the new password directly.`,
      ``,
      portalUrl ? `Users list: ${portalUrl}/admin/overview` : undefined,
    ]
      .filter(Boolean)
      .join("\n")
  );
}

export async function sendPasswordResetEmail(user: { name: string; email: string }, resetUrl: string) {
  await sendEmail(
    [user.email],
    "Reset your Cordon Dealer Portal password",
    [
      `Hi ${user.name},`,
      ``,
      `Someone asked to reset the password for your Cordon Dealer Portal account. Use this link to choose a new one (it works once and expires in 1 hour):`,
      ``,
      resetUrl,
      ``,
      `If you didn't ask for this, you can ignore this email — your password hasn't changed.`,
    ].join("\n")
  );
}
