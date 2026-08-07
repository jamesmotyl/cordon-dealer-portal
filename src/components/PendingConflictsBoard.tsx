"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeFarmName } from "@/lib/normalizeFarmName";

interface PendingLead {
  id: string;
  legalName: string;
  farm: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
  dealer: { id: string; name: string };
}

interface ConflictGroup {
  key: string;
  leads: PendingLead[];
}

export default function PendingConflictsBoard() {
  const [groups, setGroups] = useState<ConflictGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/leads?registrationState=PENDING");
    if (res.ok) {
      const data = await res.json();
      const leads: PendingLead[] = data.leads;

      const byFarm = new Map<string, PendingLead[]>();
      for (const lead of leads) {
        const key = normalizeFarmName(lead.farm);
        byFarm.set(key, [...(byFarm.get(key) ?? []), lead]);
      }
      const nextGroups = Array.from(byFarm.entries())
        .map(([key, groupLeads]) => ({ key, leads: groupLeads }))
        .sort((a, b) => a.leads[0].farm.localeCompare(b.leads[0].farm));

      setGroups(nextGroups);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(leadId: string) {
    setBusyId(leadId);
    setError(null);
    const res = await fetch(`/api/leads/${leadId}/approve`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Approval failed.");
      return;
    }
    load();
  }

  async function reject(leadId: string) {
    setBusyId(leadId);
    setError(null);
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationState: "REJECTED" }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Reject failed.");
      return;
    }
    load();
  }

  if (loading) {
    return <p className="text-sm text-navy-400">Loading pending leads…</p>;
  }

  if (groups.length === 0) {
    return <p className="text-sm text-navy-400">Nothing pending review right now.</p>;
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {groups.map((group) => (
        <div key={group.key} className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-navy-100 bg-navy-50 px-4 py-2">
            <p className="text-sm font-semibold text-navy">{group.leads[0].farm}</p>
            {group.leads.length > 1 && (
              <span className="rounded-sm border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                {group.leads.length} conflicting registrations
              </span>
            )}
          </div>

          <div
            className={`grid gap-px bg-navy-100 ${group.leads.length > 1 ? "sm:grid-cols-2" : ""}`}
          >
            {group.leads.map((lead) => (
              <div key={lead.id} className="space-y-3 bg-white p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-navy-400">Dealer</p>
                  <p className="text-sm font-medium text-navy">{lead.dealer.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-navy-400">Submitted</p>
                  <p className="text-sm text-navy-600">
                    {new Date(lead.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-navy-400">Customer</p>
                  <p className="text-sm text-navy-600">{lead.legalName}</p>
                  {lead.phone && <p className="text-sm text-navy-400">{lead.phone}</p>}
                  {lead.email && <p className="text-sm text-navy-400">{lead.email}</p>}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    className="btn-accent"
                    disabled={busyId === lead.id}
                    onClick={() => approve(lead.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-outline"
                    disabled={busyId === lead.id}
                    onClick={() => reject(lead.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
