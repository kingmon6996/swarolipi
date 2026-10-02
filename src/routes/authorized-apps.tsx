import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AuthorizedAppsView } from "@/components/dashboard/AuthorizedAppsView";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/authorized-apps")({
  head: () => ({
    meta: [
      { title: "Authorized Apps | VoxAuth Digital Identity" },
      { name: "description", content: "Manage third-party applications authorized to access your VoxAuth identity signals." },
    ],
  }),
  component: AuthorizedAppsPage,
});

function AuthorizedAppsPage() {
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 shadow-voxauth">
          <h2 className="font-display text-2xl font-extrabold text-foreground">Wallet Required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please connect your Web3 wallet to manage authorized applications.
          </p>
          <Button variant="voxauth" className="mt-6 w-full" onClick={() => navigate({ to: "/" })}>
            Return to Home & Connect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout activeTab="authorized-apps">
      <AuthorizedAppsView />
    </DashboardLayout>
  );
}
