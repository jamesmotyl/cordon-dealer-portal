"use client";

import { useState } from "react";

export default function AddLeadForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    company: "",
    region: "",
    phone: "",
    email: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong submitting this lead.");
      return;
    }

    setForm({ customerName: "", company: "", region: "", phone: "", email: "" });
    setOpen(false);
    onCreated();
  }

  if (!open) {
    return (
      <button className="btn-accent" onClick={() => setOpen(true)}>
        + Add new lead
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-2xl space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy">Submit a new lead</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-navy-400 hover:text-navy"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-navy-400">
        Leads with no conflicts are approved automatically. If the company is already
        registered by another dealer, or already in Cordon's internal pipeline, it's sent to
        Cordon for review instead.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Customer name *</label>
          <input
            required
            className="input"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Company *</label>
          <input
            required
            className="input"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Region</label>
          <input
            className="input"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-accent">
          {submitting ? "Submitting…" : "Submit lead"}
        </button>
      </div>
    </form>
  );
}
