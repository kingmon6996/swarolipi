import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { InboxView } from "@/components/messaging/InboxView";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
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
      { title: "Inbox | VoxAuth Wallet Identity Messaging" },
      {
        name: "description",
        content: "Wallet-based inbox for VoxAuth. Communicate securely using your Web3 wallet identity.",
      },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  const { isConnected } = useWallet();
  const navigate = useNavigate();
  const search = useSearch({ from: "/inbox" });

  const activeFolder = search.folder || "inbox";
  const activeAppId = search.appId || null;

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 shadow-voxauth">
          <h2 className="font-display text-2xl font-extrabold text-foreground">Wallet Required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your wallet is your identity. Please connect your Web3 wallet to access your VoxAuth inbox.
          </p>
          <Button variant="voxauth" className="mt-6 w-full" onClick={() => navigate({ to: "/" })}>
            Return to Home & Connect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout activeTab="inbox" activeFolder={activeFolder}>
      <InboxView initialFolder={activeFolder} initialAppId={activeAppId} />
    </DashboardLayout>
  );
}
