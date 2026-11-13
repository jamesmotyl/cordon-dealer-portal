"use client";

import { useState } from "react";
import { showsInvoice } from "@/lib/commission";
import { formatDate, formatGbp, toDateInput } from "@/lib/format";
import { patchLeadFields } from "@/lib/leadApi";
import { type LeadWithRelations } from "@/types/lead";

// Invoice details are typed in by a Cordon admin once the quote is accepted;
// the dealer sees them read-only. Cordon invoices the customer directly, and
// "paid" means Cordon has received cleared payment.
export default function InvoiceDetails({
  lead,
  isAdmin,
  onUpdated,
}: {
  lead: LeadWithRelations;
  isAdmin: boolean;
  onUpdated: () => void;
}) {
  const [invoiceNumber, setInvoiceNumber] = useState(lead.invoiceNumber ?? "");
  const [invoicedAt, setInvoicedAt] = useState(toDateInput(lead.invoicedAt));
  const [invoiceNetGbp, setInvoiceNetGbp] = useState(lead.invoiceNetGbp?.toString() ?? "");
  const [paidAt, setPaidAt] = useState(toDateInput(lead.paidAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!showsInvoice(lead.quoteStatus)) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    const err = await patchLeadFields(lead.id, {
      invoiceNumber: invoiceNumber || null,
      invoicedAt: invoicedAt || null,
      invoiceNetGbp: invoiceNetGbp === "" ? null : Number(invoiceNetGbp),
      paidAt: paidAt || null,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onUpdated();
  }

  if (!isAdmin) {
    return (
      <div className="rounded-sm border border-navy-100 bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-navy">Invoice</p>
        {lead.invoiceNumber || lead.invoicedAt ? (
          <p className="text-sm text-navy-600">
            {lead.invoiceNumber ?? "Invoiced"}
            {lead.invoicedAt && <> &middot; issued {formatDate(lead.invoicedAt)}</>}
            {lead.invoiceNetGbp != null && <> &middot; {formatGbp(lead.invoiceNetGbp)} (excl. VAT)</>}
            {" · "}
            <span className={lead.paidAt ? "font-medium text-green-700" : "text-navy-400"}>
              {lead.paidAt ? `Paid ${formatDate(lead.paidAt)}` : "Awaiting payment"}
            </span>
          </p>
        ) : (
          <p className="text-sm text-navy-400">Cordon hasn&rsquo;t issued the invoice yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-navy-100 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-navy">Invoice</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Invoice number</label>
          <input className="input" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
        </div>
        <div>
          <label className="label">Invoice date</label>
          <input type="date" className="input" value={invoicedAt} onChange={(e) => setInvoicedAt(e.target.value)} />
        </div>
        <div>
          <label className="label">Net amount (GBP, excl. VAT)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input"
            value={invoiceNetGbp}
            onChange={(e) => setInvoiceNetGbp(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Paid on</label>
          <input type="date" className="input" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </div>
      </div>
      <p className="mt-2 text-xs text-navy-400">
        Net = the sale price excluding VAT, discounts, shipping and support fees. &ldquo;Paid on&rdquo; is when
        Cordon received cleared payment from the customer.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex justify-end">
        <button className="btn-primary" disabled={saving} onClick={handleSave}>
          Save invoice details
        </button>
      </div>
    </div>
  );
}
