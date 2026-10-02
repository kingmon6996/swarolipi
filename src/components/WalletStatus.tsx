import { useState } from "react";
import { Check, Copy, LogOut, ShieldCheck } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";

export function formatAddress(address: string | null): string {
  if (!address) return "";
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletStatus({ onDisconnect }: { onDisconnect?: () => void }) {
  const { walletProvider, walletAddress, chain, isConnected, disconnectWallet } = useWallet();
  const [copied, setCopied] = useState(false);

  if (!isConnected || !walletAddress) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    if (onDisconnect) onDisconnect();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-purple-500/20 bg-card/60 p-2 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2 rounded-lg bg-purple-950/40 border border-purple-500/20 px-3 py-1.5 text-xs font-bold text-foreground">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-violet-400" />
        </span>
        <span className="capitalize">{walletProvider}</span>
        {chain && <span className="text-muted-foreground">• {chain}</span>}
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border border-purple-500/15 bg-card/80 px-3 py-1.5 text-xs font-mono font-semibold">
        <ShieldCheck className="size-3.5 text-primary" />
        <span>{formatAddress(walletAddress)}</span>
        <button
          onClick={copyAddress}
          className="ml-1 text-muted-foreground transition-colors hover:text-foreground"
          title="Copy address"
          aria-label="Copy public address"
        >
          {copied ? <Check className="size-3.5 text-violet-400" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDisconnect}
        className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Disconnect wallet"
      >
        <LogOut className="size-3.5" />
        <span>Disconnect</span>
      </Button>
    </div>
  );
}
