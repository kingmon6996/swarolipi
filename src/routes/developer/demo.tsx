import { createFileRoute } from "@tanstack/react-router";
import { DeveloperDemoView } from "@/components/developer/DeveloperDemoView";

export const Route = createFileRoute("/developer/demo")({
  head: () => ({
    meta: [
      { title: "VoteDAO Developer Demo | VoxAuth Integration" },
      { name: "description", content: "Interactive demonstration of third-party dApp identity verification with VoxAuth." },
    ],
  }),
  component: DeveloperDemoPage,
});

function DeveloperDemoPage() {
  return <DeveloperDemoView />;
}
