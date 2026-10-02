import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { HumanVerificationView } from "@/components/dashboard/HumanVerificationView";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/human-verification")({
  head: () => ({
    meta: [
      { title: "Human Verification | Swarolipi Voice Challenges" },
      { name: "description", content: "Complete dynamic voice challenges to establish your human verification signal." },
    ],
  }),
  component: HumanVerificationPage,
});

function HumanVerificationPage() {
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 shadow-swarolipi">
          <h2 className="font-display text-2xl font-extrabold text-foreground">Wallet Required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please connect your Web3 wallet to access Swarolipi human verification.
          </p>
          <Button variant="swarolipi" className="mt-6 w-full" onClick={() => navigate({ to: "/" })}>
            Return to Home & Connect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout activeTab="human">
      <HumanVerificationView />
    </DashboardLayout>
  );
}
