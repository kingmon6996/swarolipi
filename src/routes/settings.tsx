import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | VoxAuth Account & Security" },
      { name: "description", content: "Manage your account, privacy, security, and application preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 shadow-voxauth">
          <h2 className="font-display text-2xl font-extrabold text-foreground">Wallet Required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please connect your Web3 wallet to access account settings.
          </p>
          <Button variant="voxauth" className="mt-6 w-full" onClick={() => navigate({ to: "/" })}>
            Return to Home & Connect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout activeTab="settings">
      <SettingsView />
    </DashboardLayout>
  );
}
