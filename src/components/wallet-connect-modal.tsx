import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { WalletOption, WalletProviderInfo } from "@/components/WalletOption";
import metamaskIcon from "@/assets/metamask.png";
import phantomIcon from "@/assets/phantom.png";
import walletConnectIcon from "@/assets/walletconnect.png";

export const WALLET_PROVIDERS: WalletProviderInfo[] = [
  {
    id: "metamask",
    name: "MetaMask",
    description: "Connect with MetaMask EVM wallet",
    icon: metamaskIcon,
    downloadUrl: "https://metamask.io/download/",
  },
  {
    id: "phantom",
    name: "Phantom",
    description: "Connect with Phantom Solana wallet",
    icon: phantomIcon,
    downloadUrl: "https://phantom.app/download",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    description: "Scan QR code with any Web3 mobile app",
    icon: walletConnectIcon,
    downloadUrl: "https://walletconnect.com/",
  },
];

const spring = { type: "spring", stiffness: 380, damping: 32, mass: 0.9 } as const;

export function WalletConnectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    walletProvider,
    walletAddress,
    chain,
    connectionStatus,
    error,
    isConnected,
    connectWallet,
    disconnectWallet,
    isProviderInstalled,
  } = useWallet();

  const { profileName } = useProfile();
  const navigate = useNavigate();

  const [selectedProvider, setSelectedProvider] = useState<WalletProviderInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    if (walletProvider) {
      const found = WALLET_PROVIDERS.find((p) => p.id === walletProvider);
      if (found) setSelectedProvider(found);
    }

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, walletProvider]);

  const handleSelectProvider = async (provider: WalletProviderInfo) => {
    setSelectedProvider(provider);
    if (!isProviderInstalled(provider.id) && provider.id !== "walletconnect") {
      return;
    }
    await connectWallet(provider.id);
  };

  const handleRetry = async () => {
    if (selectedProvider) {
      await connectWallet(selectedProvider.id);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setSelectedProvider(null);
  };

  const handleContinue = () => {
    onClose();
    navigate({ to: "/dashboard" });
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isNotInstalled =
    selectedProvider &&
    !isProviderInstalled(selectedProvider.id) &&
    selectedProvider.id !== "walletconnect" &&
    connectionStatus !== "connecting" &&
    !isConnected;

  const isConnecting = connectionStatus === "connecting";
  const isRejected = connectionStatus === "rejected" || connectionStatus === "error";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Connect your wallet"
        >
          {/* Backdrop */}
          <motion.button
            aria-label="Close dialog"
            className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 24 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={
              reduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 12, transition: { duration: 0.18 } }
            }
            transition={spring}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-purple-500/25 bg-[#0b0b18]/95 shadow-[0_0_50px_-10px_rgba(124,58,237,0.35)] backdrop-blur-2xl"
          >
            <div className="p-6 sm:p-7">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-xl font-extrabold tracking-tight">
                    {isConnected ? "Wallet Connected" : "Connect your wallet"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isConnected
                      ? `Connected as ${profileName || "Digital Identity"}.`
                      : "Select your Web3 wallet provider to continue with VoxAuth."}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Body Content */}
              <AnimatePresence mode="wait">
                {/* 1. SELECTION STATE */}
                {!isConnected && !selectedProvider && (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: reduced ? 0 : -14 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mt-6 space-y-2.5">
                      {WALLET_PROVIDERS.map((provider, i) => (
                        <WalletOption
                          key={provider.id}
                          provider={provider}
                          index={i}
                          isInstalled={isProviderInstalled(provider.id)}
                          onSelect={handleSelectProvider}
                        />
                      ))}
                    </div>

                    <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-purple-500/15 bg-purple-950/20 px-3.5 py-3">
                      <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <p className="text-xs leading-5 text-muted-foreground">
                        Your wallet remains under your control. VoxAuth never requests or accesses private keys, seed phrases, or funds.
                      </p>
                    </div>

                    <p className="mt-5 text-center text-xs text-muted-foreground">
                      New to Web3 wallets?{" "}
                      <a
                        href="#how-it-works"
                        onClick={onClose}
                        className="story-link font-semibold text-primary"
                      >
                        Learn about wallet authentication →
                      </a>
                    </p>
                  </motion.div>
                )}

                {/* 2. NOT INSTALLED STATE */}
                {isNotInstalled && selectedProvider && (
                  <motion.div
                    key="not-installed"
                    initial={{ opacity: 0, x: reduced ? 0 : 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.25 }}
                    className="mt-6"
                  >
                    <div className="flex flex-col items-center rounded-xl border border-border bg-card px-5 py-7 text-center shadow-sm">
                      <span className="grid size-14 place-items-center overflow-hidden rounded-2xl border border-border/70 bg-background p-2">
                        <img
                          src={selectedProvider.icon}
                          alt={`${selectedProvider.name} logo`}
                          className="size-9 object-contain grayscale"
                        />
                      </span>
                      <p className="mt-3 text-base font-bold text-foreground">
                        {selectedProvider.name} isn't installed.
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground max-w-xs leading-relaxed">
                        To connect with {selectedProvider.name}, please install the browser extension or select another wallet.
                      </p>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <Button
                        variant="voxauthOutline"
                        className="flex-1 text-xs"
                        onClick={() => setSelectedProvider(null)}
                      >
                        Choose another
                      </Button>
                      <a
                        href={selectedProvider.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1"
                      >
                        <Button variant="voxauth" className="w-full gap-1.5 text-xs">
                          Install {selectedProvider.name} <ExternalLink className="size-3.5" />
                        </Button>
                      </a>
                    </div>
                  </motion.div>
                )}

                {/* 3. CONNECTING STATE */}
                {isConnecting && selectedProvider && (
                  <motion.div
                    key="connecting"
                    initial={{ opacity: 0, x: reduced ? 0 : 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.25 }}
                    className="mt-6"
                  >
                    <div className="flex flex-col items-center rounded-xl border border-border bg-card px-5 py-7 text-center shadow-sm">
                      <div className="relative grid size-16 place-items-center">
                        <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
                        <span className="grid size-14 place-items-center overflow-hidden rounded-2xl border border-primary/30 bg-background p-2.5 shadow-sm">
                          <img
                            src={selectedProvider.icon}
                            alt={`${selectedProvider.name} logo`}
                            className="size-9 object-contain"
                          />
                        </span>
                      </div>

                      <p className="mt-4 text-sm font-bold text-foreground">
                        Connecting to {selectedProvider.name}...
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <Loader2 className="size-4 animate-spin text-primary" />
                        Awaiting signature confirmation from wallet...
                      </div>
                    </div>

                    <div className="mt-5">
                      <Button
                        variant="voxauthOutline"
                        className="w-full"
                        onClick={() => setSelectedProvider(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* 4. REJECTED / ERROR STATE */}
                {isRejected && !isConnecting && selectedProvider && (
                  <motion.div
                    key="rejected"
                    initial={{ opacity: 0, x: reduced ? 0 : 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -14 }}
                    transition={{ duration: 0.25 }}
                    className="mt-6"
                  >
                    <div className="flex flex-col items-center rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-7 text-center shadow-sm">
                      <span className="grid size-14 place-items-center rounded-2xl border border-destructive/30 bg-background text-destructive shadow-sm">
                        <X className="size-7" />
                      </span>

                      <p className="mt-3 text-base font-bold text-foreground">
                        Wallet connection was cancelled.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                        {error || "The request was rejected or closed from your wallet extension."}
                      </p>
                    </div>

                    <div className="mt-5 flex gap-3">
                      <Button
                        variant="voxauthOutline"
                        className="flex-1"
                        onClick={() => setSelectedProvider(null)}
                      >
                        Back
                      </Button>
                      <Button
                        variant="voxauth"
                        className="flex-1 gap-2"
                        onClick={handleRetry}
                      >
                        <RefreshCw className="size-3.5" /> Try Again
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* 5. CONNECTED STATE */}
                {isConnected && walletAddress && (
                  <motion.div
                    key="connected"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-6"
                  >
                    <div className="relative flex flex-col items-center rounded-2xl border border-purple-500/30 bg-card/60 p-6 text-center shadow-[0_0_30px_rgba(139,92,246,0.2)] backdrop-blur-xl">
                      {/* Animated Provider Icon */}
                      <span className="relative grid size-16 place-items-center overflow-hidden rounded-2xl border border-purple-500/30 bg-background/80 p-3 shadow-md">
                        {selectedProvider?.icon ? (
                          <img
                            src={selectedProvider.icon}
                            alt={`${selectedProvider.name} logo`}
                            className="size-9 object-contain"
                          />
                        ) : (
                          <ShieldCheck className="size-9 text-violet-400" />
                        )}
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.2 }}
                          className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full bg-violet-600 text-white ring-2 ring-card"
                        >
                          <ShieldCheck className="size-3.5" />
                        </motion.span>
                      </span>

                      {/* Connection Indicator */}
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-bold text-purple-300"
                      >
                        <span className="relative flex size-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                          <span className="relative inline-flex size-2 rounded-full bg-violet-400" />
                        </span>
                        Wallet Connected
                      </motion.div>

                      {/* Revealed Public Address */}
                      <div className="mt-4 w-full overflow-hidden rounded-xl border border-purple-500/20 bg-background/80 px-4 py-3.5 shadow-inner">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="inline-flex items-center rounded-md bg-purple-950/50 border border-purple-500/30 px-2 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-[0.12em] text-purple-300">
                            Public Address
                          </span>
                          {chain && (
                            <span className="text-[0.65rem] font-semibold text-muted-foreground">
                              {chain}
                            </span>
                          )}
                        </div>

                        <motion.div
                          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(6px)" }}
                          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{ delay: 0.35, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                          className="flex items-center justify-between gap-2"
                        >
                          <p className="font-mono text-sm font-semibold tracking-wide text-foreground break-all text-left">
                            {walletAddress}
                          </p>
                          <button
                            onClick={copyAddress}
                            className="grid size-8 shrink-0 place-items-center rounded-lg border border-purple-500/20 bg-card/80 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            title="Copy address"
                          >
                            {copied ? <Check className="size-4 text-violet-400" /> : <Copy className="size-4" />}
                          </button>
                        </motion.div>
                      </div>

                      {/* Disconnect Action */}
                      <button
                        onClick={handleDisconnect}
                        className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <LogOut className="size-3.5" /> Disconnect Wallet
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 flex gap-3">
                      <Button
                        variant="voxauthOutline"
                        className="flex-1"
                        onClick={handleDisconnect}
                      >
                        Change Wallet
                      </Button>
                      <Button
                        variant="voxauth"
                        className="flex-1 gap-1.5"
                        onClick={handleContinue}
                      >
                        Dashboard <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
