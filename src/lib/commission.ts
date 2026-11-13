// Invoice + commission rules. No @prisma/client or database imports, so this is
// safe to use from client components as well as API routes.

// Per the Vinescapes MOU (Art. 5): 5% where they recommended and introduced the
// lead, 10% where they also supported the customer with ROI and configuration.
export const COMMISSION_RATES = [
  { percent: 5, label: "5% — recommended and introduced" },
  { percent: 10, label: "10% — also ROI and configuration support" },
] as const;

export const INVOICE_FIELDS = ["invoiceNumber", "invoicedAt", "invoiceNetGbp", "paidAt"] as const;
// Only visible to Cordon admins and people explicitly given commission access.
export const COMMISSION_FIELDS = ["commission", "commissionRatePercent", "commissionPaidAt"] as const;

type CommissionField = (typeof COMMISSION_FIELDS)[number];

// Invoice details only matter once the customer has said yes.
export function showsInvoice(quoteStatus: string): boolean {
  return quoteStatus === "QUOTE_ACCEPTED" || quoteStatus === "INVOICED";
}

// Percentage of the net invoiced amount, rounded to the penny.
export function calculateCommission(
  netGbp: number | null | undefined,
  ratePercent: number | null | undefined
): number | null {
  if (netGbp == null || ratePercent == null) return null;
  return Math.round(netGbp * ratePercent) / 100;
}

export type CommissionStatus = "NOT_DUE" | "DUE" | "PAID";

// Commission falls due once Cordon has received cleared payment from the
// customer, and is settled when it has been paid out to the dealer.
export function commissionStatus(lead: {
  paidAt: unknown | null;
  commissionPaidAt: unknown | null;
}): CommissionStatus {
  if (lead.commissionPaidAt) return "PAID";
  return lead.paidAt ? "DUE" : "NOT_DUE";
}

export function stripCommission<T extends object>(lead: T): Omit<T, CommissionField> {
  const copy = { ...lead } as Record<string, unknown>;
  for (const field of COMMISSION_FIELDS) delete copy[field];
  return copy as Omit<T, CommissionField>;
}

function parseDate(value: unknown): Date | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseAmount(value: unknown, max = Infinity): number | null | undefined {
  if (value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(n) && n >= 0 && n <= max ? n : undefined;
}

export interface RestrictedUpdate {
  data: Record<string, unknown>;
  touched: string[]; // which restricted fields the request tried to set
  error?: string;
}

// Validates the invoice + commission fields of a lead PATCH body. Everything
// here is admin-only to write; the caller enforces that using `touched`.
export function parseRestrictedUpdate(body: Record<string, unknown>): RestrictedUpdate {
  const data: Record<string, unknown> = {};
  const touched: string[] = [];

  const dateFields = ["invoicedAt", "paidAt", "commissionPaidAt"] as const;
  const amountFields = [
    ["invoiceNetGbp", Infinity],
    ["commission", Infinity],
    ["commissionRatePercent", 100],
  ] as const;

  if ("invoiceNumber" in body) {
    touched.push("invoiceNumber");
    const raw = body.invoiceNumber;
    if (raw !== null && typeof raw !== "string") return { data, touched, error: "Invoice number must be text" };
    data.invoiceNumber = typeof raw === "string" && raw.trim() ? raw.trim() : null;
  }

  for (const field of dateFields) {
    if (!(field in body)) continue;
    touched.push(field);
    const parsed = parseDate(body[field]);
    if (parsed === undefined) return { data, touched, error: `${field} is not a valid date` };
    data[field] = parsed;
  }

  for (const [field, max] of amountFields) {
    if (!(field in body)) continue;
    touched.push(field);
    const parsed = parseAmount(body[field], max);
    if (parsed === undefined) return { data, touched, error: `${field} must be a number of 0 or more` };
    data[field] = parsed;
  }

  return { data, touched };
}
