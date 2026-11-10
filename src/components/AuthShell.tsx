import Link from "next/link";
import CordonLogo from "@/components/CordonLogo";

// Centered logo + card layout shared by the signed-out pages (login, forgot
// and reset password).
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <CordonLogo className="mx-auto h-10 w-auto" />
          <p className="mt-2 text-sm text-navy-400">Dealer Portal</p>
        </div>
        {children}
        <p className="mt-6 text-center text-xs">
          <Link href="/privacy" className="text-navy-400 hover:text-navy hover:underline">
            Privacy notice
          </Link>
        </p>
      </div>
    </div>
  );
}
