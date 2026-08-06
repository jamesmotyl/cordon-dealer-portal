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
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-navy">Pending review</h1>
          <p className="text-sm text-navy-400">
            Leads awaiting a decision. Registrations for the same company are grouped
            together — approving one automatically rejects the others.
          </p>
        </div>
        <PendingConflictsBoard />
      </main>
    </div>
  );
}
