import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AuthorizedAppsView } from "@/components/dashboard/AuthorizedAppsView";

export const Route = createFileRoute("/authorized-apps")({
  head: () => ({
    meta: [
      { title: "Authorized Apps | Swarolipi Digital Identity" },
      { name: "description", content: "Manage third-party applications authorized to access your Swarolipi identity signals." },
    ],
  }),
  component: AuthorizedAppsPage,
});

function AuthorizedAppsPage() {
  return (
    <DashboardLayout activeTab="authorized-apps">
      <AuthorizedAppsView />
    </DashboardLayout>
  );
}
