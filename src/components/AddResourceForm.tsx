"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SUGGESTED_CATEGORIES = ["Brochures", "Pricing", "Case studies", "Technical specs", "Presentations"];

const EMPTY_FORM = { title: "", url: "", category: "", description: "" };

export default function AddResourceForm({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const categoryOptions = Array.from(new Set([...categories, ...SUGGESTED_CATEGORIES]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong adding this resource.");
      return;
    }

    setForm(EMPTY_FORM);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn-accent whitespace-nowrap" onClick={() => setOpen(true)}>
        + Add resource
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-2xl space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy">Add a resource</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-navy-400 hover:text-navy">
          Cancel
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Title *</label>
          <input
            required
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Category</label>
          <input
            className="input"
            list="resource-categories"
            placeholder="General"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <datalist id="resource-categories">
            {categoryOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Link *</label>
          <input
            required
            className="input"
            placeholder="https://drive.google.com/…"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <p className="mt-1 text-xs text-navy-400">
            Make sure the link is shared so dealers can open it without signing in.
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <input
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-accent">
          {submitting ? "Adding…" : "Add resource"}
        </button>
      </div>
    </form>
  );
}
