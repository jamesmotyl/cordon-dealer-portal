"use client";

import { useState } from "react";
import CreateUserForm from "@/components/CreateUserForm";
import DealerUsersList from "@/components/DealerUsersList";

interface Dealer {
  id: string;
  name: string;
}

export default function UserManagement({ dealers }: { dealers: Dealer[] }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mb-8 space-y-4">
      <CreateUserForm dealers={dealers} onCreated={() => setRefreshKey((k) => k + 1)} />
      <DealerUsersList refreshKey={refreshKey} />
    </div>
  );
}
