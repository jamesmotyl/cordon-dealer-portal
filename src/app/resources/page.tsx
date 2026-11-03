import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import Header from "@/components/Header";
import AddResourceForm from "@/components/AddResourceForm";
import ResourceList from "@/components/ResourceList";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "INTERNAL_ADMIN";
  const resources = await prisma.resource.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: { id: true, title: true, description: true, category: true, url: true },
  });
  const categories = Array.from(new Set(resources.map((r) => r.category)));

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-navy">Sales resources</h1>
            <p className="text-sm text-navy-400">
              Brochures, pricing and other materials to help you sell Loop.
            </p>
          </div>
          {isAdmin && <AddResourceForm categories={categories} />}
        </div>
        <ResourceList resources={resources} canDelete={isAdmin} />
      </main>
    </div>
  );
}
