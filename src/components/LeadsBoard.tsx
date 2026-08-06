"use client";

import React, { useCallback, useEffect, useState } from "react";
import { type RegistrationState } from "@prisma/client";
import { REGISTRATION_LABELS, RegistrationBadge, StageBadge, QuoteBadge } from "@/components/Badges";
import LeadDetail from "@/components/LeadDetail";
import AddLeadForm from "@/components/AddLeadForm";
import { type LeadWithRelations } from "@/types/lead";

type Role = "DEALER_USER" | "DEALER_ADMIN" | "INTERNAL_ADMIN";

interface Dealer {
  id: string;
  name: string;
}

export default function LeadsBoard({ role }: { role: Role }) {
  const [leads, setLeads] = useState<LeadWithRelations[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAdmin = role === "INTERNAL_ADMIN";
  const [dealerFilter, setDealerFilter] = useState("");
  const [registrationFilter, setRegistrationFilter] = useState("");

  const loadLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (isAdmin) {
      if (dealerFilter) params.set("dealerId", dealerFilter);
      if (registrationFilter) params.set("registrationState", registrationFilter);
    }
    const res = await fetch(`/api/leads?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setLeads(data.leads);
    }
    setLoading(false);
  }, [isAdmin, dealerFilter, registrationFilter]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/dealers")
        .then((res) => (res.ok ? res.json() : { dealers: [] }))
        .then((data) => setDealers(data.dealers));
    }
  }, [isAdmin]);

  const pendingCount = leads.filter((l) => l.registrationState === "PENDING").length;

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div>
          <AddLeadForm onCreated={loadLeads} />
        </div>
      )}

      {isAdmin && (
        <div className="card flex flex-wrap items-end gap-3 p-4">
          <div>
            <label className="label">Dealer</label>
            <select
              className="input"
              value={dealerFilter}
              onChange={(e) => setDealerFilter(e.target.value)}
            >
              <option value="">All dealers</option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Registration</label>
            <select
              className="input"
              value={registrationFilter}
              onChange={(e) => setRegistrationFilter(e.target.value)}
            >
              <option value="">All registration states</option>
              {(Object.keys(REGISTRATION_LABELS) as RegistrationState[]).map((s) => (
                <option key={s} value={s}>
                  {REGISTRATION_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          {pendingCount > 0 && (
            <button
              className="btn-accent ml-auto"
              onClick={() => setRegistrationFilter("PENDING")}
            >
              {pendingCount} pending review
            </button>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-100 bg-navy-50 text-xs uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-4 py-3">Vineyard</th>
              {isAdmin && <th className="px-4 py-3">Dealer</th>}
              <th className="px-4 py-3">Registration</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Quote</th>
              <th className="px-4 py-3">Last updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy-400">
                  Loading leads…
                </td>
              </tr>
            )}
            {!loading && leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-navy-400">
                  No leads yet.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <React.Fragment key={lead.id}>
                <tr
                  className="cursor-pointer border-b border-navy-50 last:border-0 hover:bg-navy-50/60"
                  onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy">{lead.company || "—"}</p>
                    <p className="text-xs text-navy-400">{lead.customerName}</p>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-navy-600">{lead.dealer.name}</td>
                  )}
                  <td className="px-4 py-3">
                    <RegistrationBadge state={lead.registrationState} />
                  </td>
                  <td className="px-4 py-3">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td className="px-4 py-3">
                    <QuoteBadge status={lead.quoteStatus} />
                  </td>
                  <td className="px-4 py-3 text-navy-400">
                    {new Date(lead.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right text-navy-400">
                    {expandedId === lead.id ? "▲" : "▼"}
                  </td>
                </tr>
                {expandedId === lead.id && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="p-0">
                      <LeadDetail lead={lead} role={role} onUpdated={loadLeads} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
