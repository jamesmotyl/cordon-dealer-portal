"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

export default function AdminUsersList({ refreshKey }: { refreshKey?: number }) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/diagnostics/admins");
    if (res.ok) {
      const data = await res.json();
      setAdmins(data.admins);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function deleteAdmin(id: string, name: string) {
    if (!confirm(`Permanently delete the admin account for ${name}? This cannot be undone.`)) return;
    setBusyId(id);
    setMessage(null);
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Failed to delete admin.");
      return;
    }
    setMessage(`${name} has been removed.`);
    load();
  }

  if (loading) return null;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-navy-100 bg-navy-50 px-4 py-2">
        <p className="text-sm font-semibold text-navy">Cordon admin users</p>
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
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-b border-navy-50 last:border-0">
                <td className="px-4 py-3 font-medium text-navy">{a.name}</td>
                <td className="px-4 py-3 text-navy-600">{a.email}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="btn-outline text-xs text-red-600"
                    disabled={busyId === a.id}
                    onClick={() => deleteAdmin(a.id, a.name)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
