import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VerificationCenter } from "@/components/dashboard/VerificationCenter";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verification Center | Swarolipi Trust Layers" },
      { name: "description", content: "Overview of your Swarolipi human verification and document identity verification layers." },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 shadow-swarolipi">
          <h2 className="font-display text-2xl font-extrabold text-foreground">Wallet Required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please connect your Web3 wallet to access the Swarolipi Verification Center.
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
      <VerificationCenter />
    </DashboardLayout>
  );
}
