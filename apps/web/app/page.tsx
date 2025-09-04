"use client";

import { useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";

export default function Page() {
  const users = useQuery(api.users.getMany);

  return (
    <div className="flex items-center justify-center min-h-svh">
      <p>apps/web</p>
      {JSON.stringify(users)}
    </div>
  )
}
