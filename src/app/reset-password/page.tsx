"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong resetting your password.");
      return;
    }
    router.push("/login?notice=reset");
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <h1 className="text-base font-semibold text-navy">Choose a new password</h1>
        <div>
          <label className="label">New password</label>
          <input
            type="password"
            required
            minLength={8}
            autoFocus
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-xs text-navy-400">At least 8 characters.</p>
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input
            type="password"
            required
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting || !token} className="btn-primary w-full">
          {submitting ? "Saving…" : "Reset password"}
        </button>
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-navy-400 hover:text-navy hover:underline">
            Need a new link?
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
