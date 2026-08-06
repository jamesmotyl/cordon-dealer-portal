import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import Header from "@/components/Header";
import LeadsBoard from "@/components/LeadsBoard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "INTERNAL_ADMIN") redirect("/dealer");

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-navy">Live lead list</h1>
            <p className="text-sm text-navy-400">
              Full visibility across all dealers. Review new submissions and manage the approval workflow.
            </p>
          </div>
          <Link href="/admin/conflicts" className="btn-outline whitespace-nowrap">
            Pending review
          </Link>
        </div>
        <LeadsBoard role="INTERNAL_ADMIN" />
      </main>
    </div>
  );
}
