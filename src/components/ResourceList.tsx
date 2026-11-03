"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface ResourceItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  url: string;
}

function ResourceRow({ resource, canDelete }: { resource: ResourceItem; canDelete: boolean }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remove "${resource.title}" for all dealers?`)) return;
    setDeleting(true);
    const res = await fetch(`/api/resources/${resource.id}`, { method: "DELETE" });
    if (!res.ok) {
      setDeleting(false);
      alert("Couldn't remove this resource.");
      return;
    }
    router.refresh();
  }

  return (
    <li className="flex items-start justify-between gap-4 px-5 py-3">
      <div className="min-w-0">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-navy hover:text-accent hover:underline"
        >
          {resource.title}
        </a>
        {resource.description && <p className="mt-0.5 text-sm text-navy-400">{resource.description}</p>}
      </div>
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 text-xs text-navy-400 hover:text-red-600"
        >
          {deleting ? "Removing…" : "Remove"}
        </button>
      )}
    </li>
  );
}

export default function ResourceList({
  resources,
  canDelete,
}: {
  resources: ResourceItem[];
  canDelete: boolean;
}) {
  if (resources.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-navy-400">
        {canDelete
          ? "No resources yet — add the first one to share it with every dealer."
          : "Cordon hasn't added any sales materials yet. Check back soon."}
      </div>
    );
  }

  const byCategory = new Map<string, ResourceItem[]>();
  for (const r of resources) {
    byCategory.set(r.category, [...(byCategory.get(r.category) ?? []), r]);
  }

  return (
    <div className="space-y-6">
      {Array.from(byCategory.entries()).map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">{category}</h2>
          <ul className="card divide-y divide-navy-100">
            {items.map((r) => (
              <ResourceRow key={r.id} resource={r} canDelete={canDelete} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
