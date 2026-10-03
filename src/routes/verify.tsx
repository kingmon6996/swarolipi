import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VerificationCenter } from "@/components/dashboard/VerificationCenter";

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
  return (
    <DashboardLayout activeTab="human">
      <VerificationCenter />
    </DashboardLayout>
  );
}
