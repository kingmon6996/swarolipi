import { createFileRoute } from "@tanstack/react-router";
import { AuthorizeView } from "@/components/auth/AuthorizeView";

export const Route = createFileRoute("/authorize")({
  head: () => ({
    meta: [
      { title: "Authorize Application | VoxAuth Identity Layer" },
      { name: "description", content: "Review and grant identity permissions requested by third-party applications." },
    ],
  }),
  component: AuthorizePage,
});

function AuthorizePage() {
  return <AuthorizeView />;
}
