"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DueLead {
  id: string;
  farm: string;
  legalName: string;
  dealer: string;
  closed: string;
}

export default function RetentionDueList({ leads, years }: { leads: DueLead[]; years: number }) {
  const router = useRouter();
  const [rows, setRows] = useState(leads);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteLeads(targets: DueLead[], confirmText: string) {
    if (!confirm(confirmText)) return;
    setBusy(true);
    setError(null);

    const deleted: string[] = [];
    for (const lead of targets) {
      const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError(`Couldn't delete ${lead.farm} — stopped there.`);
        break;
      }
      deleted.push(lead.id);
    }

    setRows((prev) => prev.filter((r) => !deleted.includes(r.id)));
    setBusy(false);
    router.refresh();
  }

  if (rows.length === 0) return null;

  return (
    <div className="mb-8 card overflow-hidden border-navy-200">
      <div className="flex items-center justify-between gap-3 border-b border-navy-100 bg-navy-50 px-4 py-2">
        <div>
          <p className="text-sm font-semibold text-navy">
            Past retention — closed {years}+ years ago ({rows.length})
          </p>
          <p className="text-xs text-navy-400">
            Leads are kept for {years} years after they close. Review and delete these to stay within that policy.
          </p>
        </div>
        <button
          className="btn-outline whitespace-nowrap text-xs text-red-600"
          disabled={busy}
          onClick={() =>
            deleteLeads(rows, `Permanently delete all ${rows.length} leads listed here? This cannot be undone.`)
          }
        >
          Delete all
        </button>
      </div>
      {error && <p className="border-b border-navy-100 px-4 py-2 text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-4 py-3">Farm</th>
              <th className="px-4 py-3">Legal name</th>
              <th className="px-4 py-3">Dealer</th>
              <th className="px-4 py-3">Last updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => (
              <tr key={lead.id} className="border-b border-navy-50 last:border-0">
                <td className="px-4 py-3 font-medium text-navy">{lead.farm}</td>
                <td className="px-4 py-3 text-navy-600">{lead.legalName}</td>
                <td className="px-4 py-3 text-navy-600">{lead.dealer}</td>
                <td className="px-4 py-3 text-navy-400">{lead.closed}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="text-xs text-red-600 hover:underline"
                    disabled={busy}
                    onClick={() =>
                      deleteLeads([lead], `Permanently delete the lead for ${lead.farm}? This cannot be undone.`)
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
