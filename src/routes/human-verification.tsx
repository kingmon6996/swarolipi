import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { HumanVerificationView } from "@/components/dashboard/HumanVerificationView";

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
  return (
    <DashboardLayout activeTab="human">
      <HumanVerificationView />
    </DashboardLayout>
  );
}
