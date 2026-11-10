import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import Header from "@/components/Header";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-navy">Your account</h1>
          <p className="text-sm text-navy-400">
            {user.name} &middot; {user.email}
          </p>
        </div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">Change password</h2>
        <ChangePasswordForm />
      </main>
    </div>
  );
}
