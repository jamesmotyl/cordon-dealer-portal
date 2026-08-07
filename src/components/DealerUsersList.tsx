"use client";

import { useEffect, useState } from "react";

interface DealerUser {
  id: string;
  name: string;
  email: string;
  sessionInvalidatedAt: string | null;
  dealer: { id: string; name: string } | null;
}

export default function DealerUsersList({ refreshKey }: { refreshKey?: number }) {
  const [users, setUsers] = useState<DealerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function resetPassword(id: string, name: string) {
    setBusyId(id);
    setMessage(null);
    const res = await fetch(`/api/users/${id}/reset-password`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      setMessage("Failed to reset password.");
      return;
    }
    const data = await res.json();
    setMessage(`New password for ${name}: ${data.password} — share this with them directly.`);
  }

  async function forceLogout(id: string, name: string) {
    setBusyId(id);
    setMessage(null);
    const res = await fetch(`/api/users/${id}/force-logout`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      setMessage("Failed to force logout.");
      return;
    }
    setMessage(`${name} has been logged out — their next request will require signing in again.`);
    load();
  }

  if (loading) return null;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-navy-100 bg-navy-50 px-4 py-2">
        <p className="text-sm font-semibold text-navy">Dealer users</p>
      </div>
      {message && (
        <p className="border-b border-navy-100 bg-navy-50/60 px-4 py-2 text-sm text-navy-700">
          {message}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-100 bg-navy-50 text-xs uppercase tracking-wide text-navy-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Dealer</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy-400">
                  No dealer users yet.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-navy-50 last:border-0">
                <td className="px-4 py-3 font-medium text-navy">{u.name}</td>
                <td className="px-4 py-3 text-navy-600">{u.email}</td>
                <td className="px-4 py-3 text-navy-600">{u.dealer?.name ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn-outline text-xs"
                      disabled={busyId === u.id}
                      onClick={() => resetPassword(u.id, u.name)}
                    >
                      Reset password
                    </button>
                    <button
                      className="btn-outline text-xs"
                      disabled={busyId === u.id}
                      onClick={() => forceLogout(u.id, u.name)}
                    >
                      Force logout
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
