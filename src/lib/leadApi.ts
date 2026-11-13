// Client-side helper: PATCH a few fields of a lead, returning an error message
// (or null on success) for the caller to display.
export async function patchLeadFields(leadId: string, body: Record<string, unknown>): Promise<string | null> {
  const res = await fetch(`/api/leads/${leadId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data.error || "Update failed.";
}
