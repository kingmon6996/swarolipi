import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { IdentityVerificationView } from "@/components/dashboard/IdentityVerificationView";

export const Route = createFileRoute("/identity-verification")({
  head: () => ({
    meta: [
      { title: "Identity Verification | Swarolipi Government Documents" },
      { name: "description", content: "Verify your identity using an accepted government-issued document." },
    ],
  }),
  component: IdentityVerificationPage,
});

function IdentityVerificationPage() {
  return (
    <DashboardLayout activeTab="identity">
      <IdentityVerificationView />
    </DashboardLayout>
  );
}
