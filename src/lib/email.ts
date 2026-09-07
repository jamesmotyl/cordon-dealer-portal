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

export async function sendNewLeadAlert(lead: {
  id: string;
  farm: string;
  legalName: string;
  dealerName: string;
}) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) {
    console.log("POSTMARK_SERVER_TOKEN not set — skipping new-lead email alert.");
    return;
  }

  const to = await adminEmails();
  if (to.length === 0) return;

  const portalUrl = process.env.NEXTAUTH_URL ?? "";

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
        Subject: `New lead: ${lead.farm} (${lead.dealerName})`,
        TextBody: [
          `${lead.dealerName} submitted a new lead.`,
          ``,
          `Farm: ${lead.farm}`,
          `Legal name: ${lead.legalName}`,
          ``,
          portalUrl ? `Review it: ${portalUrl}/admin/conflicts` : undefined,
        ]
          .filter(Boolean)
          .join("\n"),
        MessageStream: "outbound",
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`Postmark send failed (${res.status}): ${body}`);
    }
  } catch (err) {
    // Never let an email failure block lead submission.
    console.error("Failed to send new-lead alert email:", err);
  }
}
