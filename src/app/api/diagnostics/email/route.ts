import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

// Admin-only check for whether the email env vars are actually configured in
// this deployment — never exposes the key itself, just presence/value of the
// non-secret bits, to debug "nothing sent, no error" reports quickly.
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "INTERNAL_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    resendApiKeyConfigured: !!process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM ?? null,
  });
}
