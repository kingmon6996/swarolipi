import { createFileRoute } from "@tanstack/react-router";
import { SwarolipiLanding } from "@/components/swarolipi-landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swarolipi | Verify Wallets and Humans" },
      { name: "description", content: "Wallet authentication and privacy-conscious human verification for decentralized applications." },
      { property: "og:title", content: "Swarolipi | Verify Wallets and Humans" },
      { property: "og:description", content: "Verify wallet ownership, establish a human signal, and authorize anywhere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <SwarolipiLanding />;
}
