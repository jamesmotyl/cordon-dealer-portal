import { getSessionUser } from "@/lib/session";
import CordonLogo from "@/components/CordonLogo";
import SignOutButton from "@/components/SignOutButton";

export default async function Header() {
  const user = await getSessionUser();

  return (
    <header className="border-b border-navy-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <CordonLogo className="text-lg" />
          <span className="hidden text-navy-300 sm:inline">/</span>
          <span className="hidden text-sm font-medium text-navy-400 sm:inline">
            Portal &middot; {user?.role === "INTERNAL_ADMIN" ? "Admin" : "Dealer"} Portal
          </span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-navy">{user.name}</p>
              <p className="text-xs text-navy-400">
                {user.role === "INTERNAL_ADMIN" ? "Cordon Admin" : "Dealer"}
              </p>
            </div>
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  );
}
