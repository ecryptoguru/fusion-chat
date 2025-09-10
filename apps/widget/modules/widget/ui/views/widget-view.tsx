"use client";

import { useAtomValue } from "jotai";
import { WidgetAuthScreen } from "@/modules/widget/ui/screens/widget-auth-screen";
import { screenAtom } from "@/modules/widget/atoms/widget-atoms";

interface Props {
  organizationId: string | null;
};

export const WidgetView = ({ organizationId }: Props) => {
  const screen = useAtomValue(screenAtom);

  const screenComponents = {
    loading: <p>TODO: Loading</p>,
    error: <p>TODO: Error</p>,
    auth: <WidgetAuthScreen />,
    voice: <p>TODO: Voice</p>,
    inbox: <p>TODO: Inbox</p>,
    selection: <p>TODO: Selection</p>,
    chat: <p>TODO: Chat</p>,
    contact: <p>TODO: Contact</p>,
  }

  return (
    // TODO: Confirm whether or not "min-h-screen" and "min-w-screen" is needed
    <main className="min-h-screen min-w-screen flex h-full w-full flex-col overflow-hidden rounded-xl border bg-muted">
      {screenComponents[screen]}
    </main>
  );
};
