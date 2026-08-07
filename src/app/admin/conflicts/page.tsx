import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import Header from "@/components/Header";
import PendingConflictsBoard from "@/components/PendingConflictsBoard";

export const dynamic = "force-dynamic";

export default async function AdminConflictsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "INTERNAL_ADMIN") redirect("/dealer");

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-navy">Pending review</h1>
            <p className="text-sm text-navy-400">
              Leads awaiting a decision. Registrations for the same farm are grouped
              together — approving one automatically rejects the others.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="btn-outline whitespace-nowrap">
              Live lead list
            </Link>
            <Link href="/admin/overview" className="btn-outline whitespace-nowrap">
              Overview
            </Link>
          </div>
        </div>
        <PendingConflictsBoard />
      </main>
    </div>
  );
}
