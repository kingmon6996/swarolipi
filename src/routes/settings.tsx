import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SettingsView } from "@/components/dashboard/SettingsView";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Swarolipi Account & Security" },
      { name: "description", content: "Manage your account, privacy, security, and application preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <DashboardLayout activeTab="settings">
      <SettingsView />
    </DashboardLayout>
  );
}
