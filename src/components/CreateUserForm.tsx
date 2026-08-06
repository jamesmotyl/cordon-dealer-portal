"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Dealer {
  id: string;
  name: string;
}

export default function CreateUserForm({ dealers }: { dealers: Dealer[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    dealerId: dealers[0]?.id ?? "",
    role: "DEALER_USER",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong creating this user.");
      return;
    }

    setSuccess(`${form.name} created — share their email and password with them directly.`);
    setForm({ name: "", email: "", password: "", dealerId: dealers[0]?.id ?? "", role: "DEALER_USER" });
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn-outline whitespace-nowrap" onClick={() => setOpen(true)}>
        + Add dealer user
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-2xl space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy">Add a dealer user</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-navy-400 hover:text-navy"
        >
          Cancel
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Name *</label>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Email *</label>
          <input
            required
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Temporary password *</label>
          <input
            required
            minLength={8}
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Dealer *</label>
          <select
            required
            className="input"
            value={form.dealerId}
            onChange={(e) => setForm({ ...form, dealerId: e.target.value })}
          >
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Role</label>
          <select
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="DEALER_USER">Dealer user</option>
            <option value="DEALER_ADMIN">Dealer admin</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-accent">
          {submitting ? "Creating…" : "Create user"}
        </button>
      </div>
    </form>
  );
}
