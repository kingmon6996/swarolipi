import { createFileRoute } from "@tanstack/react-router";
import { DeveloperDemoView } from "@/components/developer/DeveloperDemoView";

export const Route = createFileRoute("/developer/demo")({
  head: () => ({
    meta: [
      { title: "VoteDAO Developer Demo | Swarolipi Integration" },
      { name: "description", content: "Interactive demonstration of third-party dApp identity verification with Swarolipi." },
    ],
  }),
  component: DeveloperDemoPage,
});

function DeveloperDemoPage() {
  return <DeveloperDemoView />;
}
