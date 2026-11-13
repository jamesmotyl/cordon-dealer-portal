"use client";

import { useState } from "react";
import { COMMISSION_RATES, calculateCommission, commissionStatus, showsInvoice } from "@/lib/commission";
import { formatDate, formatGbp, toDateInput } from "@/lib/format";
import { patchLeadFields } from "@/lib/leadApi";
import { type LeadWithRelations } from "@/types/lead";

const STATUS_TEXT = {
  NOT_DUE: { label: "Not due — customer hasn't paid yet", className: "text-navy-400" },
  DUE: { label: "Due — customer has paid", className: "font-medium text-orange-700" },
  PAID: { label: "Paid out", className: "font-medium text-green-700" },
} as const;

// Only rendered for people the API has given commission fields to (Cordon
// admins, plus dealer users an admin has switched it on for); everyone else
// never receives them. Only Cordon admins can edit.
export default function CommissionDetails({
  lead,
  isAdmin,
  onUpdated,
}: {
  lead: LeadWithRelations;
  isAdmin: boolean;
  onUpdated: () => void;
}) {
  const [rate, setRate] = useState(lead.commissionRatePercent?.toString() ?? "");
  const [commission, setCommission] = useState(lead.commission?.toString() ?? "");
  const [commissionPaidAt, setCommissionPaidAt] = useState(toDateInput(lead.commissionPaidAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!("commissionRatePercent" in lead) || !showsInvoice(lead.quoteStatus)) return null;

  const status = commissionStatus({ paidAt: lead.paidAt, commissionPaidAt: lead.commissionPaidAt ?? null });
  const suggested = calculateCommission(lead.invoiceNetGbp, rate === "" ? null : Number(rate));

  async function handleSave() {
    setSaving(true);
    setError(null);
    const err = await patchLeadFields(lead.id, {
      commissionRatePercent: rate === "" ? null : Number(rate),
      commission: commission === "" ? null : Number(commission),
      commissionPaidAt: commissionPaidAt || null,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onUpdated();
  }

  return (
    <div className="rounded-sm border border-orange-200 bg-orange-50/40 p-4">
      <p className="text-sm font-semibold text-navy">Commission</p>
      <p className="mb-3 text-xs text-navy-400">Only visible to Cordon and people given commission access.</p>

      {!isAdmin ? (
        <p className="text-sm text-navy-600">
          {lead.commissionRatePercent != null && <>{lead.commissionRatePercent}% &middot; </>}
          {lead.commission != null ? formatGbp(lead.commission) : "Amount not set"}
          {" · "}
          <span className={STATUS_TEXT[status].className}>{STATUS_TEXT[status].label}</span>
          {lead.commissionPaidAt && <> ({formatDate(lead.commissionPaidAt)})</>}
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Rate</label>
              <select className="input" value={rate} onChange={(e) => setRate(e.target.value)}>
                <option value="">Not set</option>
                {COMMISSION_RATES.map((r) => (
                  <option key={r.percent} value={r.percent}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Commission (GBP)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
              />
              {suggested != null && String(suggested) !== commission && (
                <button
                  type="button"
                  className="mt-1 text-xs text-orange-600 hover:underline"
                  onClick={() => setCommission(String(suggested))}
                >
                  Use {rate}% of {formatGbp(lead.invoiceNetGbp ?? 0)} = {formatGbp(suggested)}
                </button>
              )}
            </div>
            <div>
              <label className="label">Paid out on</label>
              <input
                type="date"
                className="input"
                value={commissionPaidAt}
                onChange={(e) => setCommissionPaidAt(e.target.value)}
              />
            </div>
          </div>
          <p className={`mt-2 text-sm ${STATUS_TEXT[status].className}`}>{STATUS_TEXT[status].label}</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-3 flex justify-end">
            <button className="btn-primary" disabled={saving} onClick={handleSave}>
              Save commission
            </button>
          </div>
        </>
      )}
    </div>
  );
}
