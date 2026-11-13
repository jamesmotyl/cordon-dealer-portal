import { prisma } from "@/lib/prisma";
import { stripCommission } from "@/lib/commission";

// Cordon admins always see commission; a dealer user only if an admin has
// switched it on for them. Looked up fresh each time, so revoking access takes
// effect immediately rather than when their session next renews.
export async function canViewCommission(user: { id: string; role: string }): Promise<boolean> {
  if (user.role === "INTERNAL_ADMIN") return true;
  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { canViewCommission: true } });
  return !!row?.canViewCommission;
}

// Every lead sent to a browser goes through this, so the commission fields only
// ever leave the server for people allowed to see them — not just hidden in the UI.
export async function redactLeads<T extends object>(user: { id: string; role: string }, leads: T[]) {
  return (await canViewCommission(user)) ? leads : leads.map((lead) => stripCommission(lead));
}

export async function redactLead<T extends object>(user: { id: string; role: string }, lead: T) {
  return (await redactLeads(user, [lead]))[0];
}
