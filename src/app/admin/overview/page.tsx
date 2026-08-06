import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";

const LIVE_STATES = ["PENDING", "CLEARED"] as const;
const WON_QUOTE_STATUSES = ["QUOTE_ACCEPTED", "INVOICED"] as const;

function formatGbp(amount: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(
    amount
  );
}

export default async function AdminOverviewPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "INTERNAL_ADMIN") redirect("/dealer");

  const [dealers, leads] = await Promise.all([
    prisma.dealer.findMany({ orderBy: { name: "asc" } }),
    prisma.lead.findMany({
      select: {
        dealerId: true,
        registrationState: true,
        quoteStatus: true,
        quoteValueGbp: true,
      },
    }),
  ]);

  const totalLeads = leads.length;
  const totalPending = leads.filter((l) => l.registrationState === "PENDING").length;
  const totalCleared = leads.filter((l) => l.registrationState === "CLEARED").length;
  const totalRejected = leads.filter((l) => l.registrationState === "REJECTED").length;

  const pipelineValue = leads
    .filter((l) => (LIVE_STATES as readonly string[]).includes(l.registrationState))
    .reduce((sum, l) => sum + (l.quoteValueGbp ?? 0), 0);

  const wonValue = leads
    .filter((l) => (WON_QUOTE_STATUSES as readonly string[]).includes(l.quoteStatus))
    .reduce((sum, l) => sum + (l.quoteValueGbp ?? 0), 0);

  const perDealer = dealers.map((dealer) => {
    const dealerLeads = leads.filter((l) => l.dealerId === dealer.id);
    return {
      dealer,
      total: dealerLeads.length,
      pending: dealerLeads.filter((l) => l.registrationState === "PENDING").length,
      cleared: dealerLeads.filter((l) => l.registrationState === "CLEARED").length,
      rejected: dealerLeads.filter((l) => l.registrationState === "REJECTED").length,
      pipelineValue: dealerLeads
        .filter((l) => (LIVE_STATES as readonly string[]).includes(l.registrationState))
        .reduce((sum, l) => sum + (l.quoteValueGbp ?? 0), 0),
      wonValue: dealerLeads
        .filter((l) => (WON_QUOTE_STATUSES as readonly string[]).includes(l.quoteStatus))
        .reduce((sum, l) => sum + (l.quoteValueGbp ?? 0), 0),
    };
  });

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-navy">Overview</h1>
            <p className="text-sm text-navy-400">
              Account summary and total pipeline across all dealers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="btn-outline whitespace-nowrap">
              Live lead list
            </Link>
            <Link href="/admin/conflicts" className="btn-outline whitespace-nowrap">
              Pending review
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-navy-400">Total leads</p>
            <p className="mt-1 text-2xl font-semibold text-navy">{totalLeads}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-navy-400">Pending review</p>
            <p className="mt-1 text-2xl font-semibold text-navy">{totalPending}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-navy-400">Pipeline value</p>
            <p className="mt-1 text-2xl font-semibold text-navy">{formatGbp(pipelineValue)}</p>
            <p className="text-xs text-navy-400">Quoted value on pending + cleared leads</p>
          </div>
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide text-navy-400">Won value</p>
            <p className="mt-1 text-2xl font-semibold text-navy">{formatGbp(wonValue)}</p>
            <p className="text-xs text-navy-400">Accepted quotes + invoiced</p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 bg-navy-50 text-xs uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-4 py-3">Dealer</th>
                <th className="px-4 py-3">Total leads</th>
                <th className="px-4 py-3">Pending</th>
                <th className="px-4 py-3">Cleared</th>
                <th className="px-4 py-3">Rejected</th>
                <th className="px-4 py-3">Pipeline value</th>
                <th className="px-4 py-3">Won value</th>
              </tr>
            </thead>
            <tbody>
              {perDealer.map((row) => (
                <tr key={row.dealer.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">{row.dealer.name}</td>
                  <td className="px-4 py-3 text-navy-600">{row.total}</td>
                  <td className="px-4 py-3 text-navy-600">{row.pending}</td>
                  <td className="px-4 py-3 text-navy-600">{row.cleared}</td>
                  <td className="px-4 py-3 text-navy-600">{row.rejected}</td>
                  <td className="px-4 py-3 text-navy-600">{formatGbp(row.pipelineValue)}</td>
                  <td className="px-4 py-3 text-navy-600">{formatGbp(row.wonValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </div>
  );
}
