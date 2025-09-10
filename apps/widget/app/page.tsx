"use client";

import { use } from "react";

import { WidgetView } from "@/modules/widget/ui/views/widget-view";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

const Page = ({ searchParams }: Props) => {
  const params = use(searchParams);
  const raw = params.organizationId ?? params.organizationid;
  const organizationId = typeof raw === "string" && raw.length > 0 ? raw : null;

  return <WidgetView organizationId={organizationId} />;
};

export default Page;
