"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.newPassword !== form.confirm) {
      setError("New passwords don't match.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    });

    if (!res.ok) {
      setSubmitting(false);
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong changing your password.");
      return;
    }

    // The server has invalidated every session, so sign in again with the new one.
    await signOut({ callbackUrl: "/login?notice=changed" });
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4 p-5">
      <div>
        <label className="label">Current password</label>
        <input
          type="password"
          required
          className="input"
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
        />
      </div>
      <div>
        <label className="label">New password</label>
        <input
          type="password"
          required
          minLength={8}
          className="input"
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        />
        <p className="mt-1 text-xs text-navy-400">At least 8 characters.</p>
      </div>
      <div>
        <label className="label">Confirm new password</label>
        <input
          type="password"
          required
          className="input"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting} className="btn-accent">
        {submitting ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
