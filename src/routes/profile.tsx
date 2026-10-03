import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProfileView } from "@/components/dashboard/ProfileView";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile | Swarolipi Digital Identity" },
      { name: "description", content: "Manage your wallet-bound profile digital identity and human verification status." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <DashboardLayout activeTab="profile">
      <ProfileView />
    </DashboardLayout>
  );
}
