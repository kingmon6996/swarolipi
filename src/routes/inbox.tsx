import { createFileRoute, useSearch } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { InboxView } from "@/components/messaging/InboxView";
import { MailFolder } from "@/hooks/useMessaging";

interface InboxSearch {
  folder?: MailFolder;
  appId?: string;
}

export const Route = createFileRoute("/inbox")({
  validateSearch: (search: Record<string, unknown>): InboxSearch => {
    return {
      folder: (search.folder as MailFolder) || "inbox",
      appId: (search.appId as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Inbox | Swarolipi Wallet Identity Messaging" },
      {
        name: "description",
        content: "Wallet-based inbox for Swarolipi. Communicate securely using your Web3 wallet identity.",
      },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  const search = useSearch({ from: "/inbox" });

  const activeFolder = search.folder || "inbox";
  const activeAppId = search.appId || null;

  return (
    <DashboardLayout activeTab="inbox" activeFolder={activeFolder}>
      <InboxView initialFolder={activeFolder} initialAppId={activeAppId} />
    </DashboardLayout>
  );
}
