"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ResetRequest {
  userId: string;
  name: string;
  email: string;
  org: string;
  ago: string;
}

export default function PasswordResetAlertsList({ requests }: { requests: ResetRequest[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(requests);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function resetPassword(userId: string) {
    setBusyId(userId);
    setError(null);
    const res = await fetch(`/api/users/${userId}/reset-password`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      setError("Failed to reset password.");
      return;
    }
    const data = await res.json();
    setNewPasswords((prev) => ({ ...prev, [userId]: data.password }));
  }

  function done(userId: string) {
    setRows((prev) => prev.filter((r) => r.userId !== userId));
    router.refresh();
  }

  if (rows.length === 0) return null;

  return (
    <div className="mb-8 card overflow-hidden border-orange-300">
      <div className="border-b border-orange-200 bg-orange-100 px-4 py-2">
        <p className="text-sm font-semibold text-navy">Password reset requests</p>
      </div>
      {error && <p className="border-b border-navy-100 px-4 py-2 text-sm text-red-600">{error}</p>}
      <ul className="divide-y divide-navy-50">
        {rows.map((r) => (
          <li key={r.userId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-navy">
                {r.name} <span className="font-normal text-navy-400">&middot; {r.org}</span>
              </p>
              <p className="text-xs text-navy-400">
                {r.email} &middot; requested {r.ago}
              </p>
              {newPasswords[r.userId] && (
                <p className="mt-1 text-sm text-navy-700">
                  New password: <span className="font-mono font-semibold">{newPasswords[r.userId]}</span> — send
                  this to them directly.
                </p>
              )}
            </div>
            {newPasswords[r.userId] ? (
              <button className="btn-outline text-xs" onClick={() => done(r.userId)}>
                Done
              </button>
            ) : (
              <button
                className="btn-outline text-xs"
                disabled={busyId === r.userId}
                onClick={() => resetPassword(r.userId)}
              >
                {busyId === r.userId ? "Resetting…" : "Reset password"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
