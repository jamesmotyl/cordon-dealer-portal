import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Cordon Dealer Portal <onboarding@resend.dev>";

// Lazy client: don't throw at import time if the key isn't configured yet —
// callers just skip sending (see sendNewLeadAlert).
function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// All current admins, not a hardcoded address list — anyone with
// INTERNAL_ADMIN automatically gets alerts, including future admins.
async function adminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: Role.INTERNAL_ADMIN },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

export async function sendNewLeadAlert(lead: {
  id: string;
  farm: string;
  legalName: string;
  dealerName: string;
}) {
  const client = getClient();
  if (!client) {
    console.log("RESEND_API_KEY not set — skipping new-lead email alert.");
    return;
  }

  const to = await adminEmails();
  if (to.length === 0) return;

  const portalUrl = process.env.NEXTAUTH_URL ?? "";

  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: `New lead: ${lead.farm} (${lead.dealerName})`,
      text: [
        `${lead.dealerName} submitted a new lead.`,
        ``,
        `Farm: ${lead.farm}`,
        `Legal name: ${lead.legalName}`,
        ``,
        portalUrl ? `Review it: ${portalUrl}/admin/conflicts` : undefined,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  } catch (err) {
    // Never let an email failure block lead submission.
    console.error("Failed to send new-lead alert email:", err);
  }
}
