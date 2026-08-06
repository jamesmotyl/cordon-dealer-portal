import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import Header from "@/components/Header";
import LeadsBoard from "@/components/LeadsBoard";

export const dynamic = "force-dynamic";

export default async function DealerPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "INTERNAL_ADMIN") redirect("/admin");

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-navy">Your leads</h1>
          <p className="text-sm text-navy-400">
            Track leads you've submitted, follow approval status, and update your active pipeline.
          </p>
        </div>
        <LeadsBoard role={user.role} />
      </main>
    </div>
  );
}
