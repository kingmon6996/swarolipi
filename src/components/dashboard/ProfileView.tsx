import { useState, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Check,
  Copy,
  Info,
  ShieldCheck,
  Trash2,
  User,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Globe,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { formatAddress } from "@/components/WalletStatus";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function ProfileView() {
  const { walletAddress, walletProvider, isConnected } = useWallet();
  const {
    profileName,
    profileImage,
    humanVerified,
    identityVerified,
    identityCountry,
    isNewConnection,
    updateName,
    updateAvatar,
    dismissWelcome,
  } = useProfile();

  const { authorizedApps, revokeApp } = useAuth();
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const [inputName, setInputName] = useState(profileName);
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if profileName changes from service
  if (inputName === "" && profileName !== "") {
    setInputName(profileName);
  }

  const handleRevoke = (appId: string, appName: string) => {
    revokeApp(appId);
    toast.success("Authorization Revoked", {
      description: `${appName} can no longer access your VoxAuth identity signals.`,
    });
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) {
      toast.error("Please enter a valid display name.");
      return;
    }
    updateName(inputName.trim());
    toast.success("Identity updated", {
      description: "Your display name has been updated.",
    });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please upload an image file (PNG, JPG, WEBP, GIF).");
      toast.error("Invalid file type.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must be smaller than 5MB.");
      toast.error("Image file too large (max 5MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateAvatar(dataUrl);
        toast.success("Profile image updated");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    updateAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Profile image removed");
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const initialLetter = profileName ? profileName.charAt(0).toUpperCase() : "V";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* 1. Welcome Banner for Initial Connection */}
      <AnimatePresence>
        {isNewConnection && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="relative overflow-hidden rounded-2xl border border-primary/25 bg-accent/70 p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="size-5" />
              </span>
              <div className="flex-1 pr-6">
                <h3 className="font-display text-base font-extrabold text-foreground sm:text-lg">
                  Welcome to VoxAuth
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  We've created your initial wallet-bound identity alias (<span className="font-bold text-foreground">{profileName}</span>). You can customize your name and avatar anytime.
                </p>
              </div>
              <button
                onClick={dismissWelcome}
                className="absolute right-4 top-4 grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                aria-label="Dismiss banner"
              >
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Top Stretched Profile Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full overflow-hidden rounded-2xl border-2 border-border bg-card p-6 text-center shadow-voxauth sm:p-8"
      >
        <div className="mesh-background absolute inset-0 opacity-30 pointer-events-none" />

        <div className="relative z-10 mx-auto flex flex-col items-center max-w-2xl">
          {/* Avatar Display */}
          <div className="relative grid size-28 place-items-center overflow-hidden rounded-full border-4 border-background bg-accent text-3xl font-extrabold font-display text-primary shadow-md">
            {profileImage ? (
              <img src={profileImage} alt={profileName} className="size-full object-cover" />
            ) : (
              <span>{initialLetter}</span>
            )}
          </div>

          {/* Identity Name & Verified Badge */}
          <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {profileName || "Digital Identity"}
          </h2>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" /> Verified Wallet Identity
          </p>

          {/* Connected Wallet Address Box */}
          <div className="mt-5 w-full rounded-xl border border-border bg-background px-4 py-3 shadow-inner">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-muted-foreground text-center">
              Connected Wallet Address
            </p>
            <div className="mt-1 flex items-center justify-center gap-3">
              <p className="font-mono text-xs font-semibold tracking-wide text-foreground break-all text-center">
                {walletAddress}
              </p>
              <button
                onClick={copyAddress}
                className="grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Copy address"
              >
                {copied ? <Check className="size-3.5 text-violet-400" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* Verification Status Badges */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-xs">
            {/* Wallet Status */}
            <div className="flex items-center justify-between sm:justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/40 px-3.5 py-3 font-bold text-purple-300">
              <span className="flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-violet-400" />
                </span>
                Wallet Connected
              </span>
              <Check className="size-4" />
            </div>

            {/* Human Verification Status */}
            <div className={`flex items-center justify-between sm:justify-center gap-2 rounded-xl border px-3.5 py-3 font-bold ${humanVerified
              ? "border-purple-500/30 bg-purple-950/40 text-purple-300"
              : "border-amber-500/25 bg-amber-500/10 text-amber-400"
              }`}>
              <span>Human Verification</span>
              <span className="text-[0.65rem] uppercase tracking-wider">
                {humanVerified ? "✓ Verified" : "○ Pending"}
              </span>
            </div>

            {/* Identity Verification Status */}
            <div className={`flex items-center justify-between sm:justify-center gap-2 rounded-xl border px-3.5 py-3 font-bold ${identityVerified
              ? "border-purple-500/30 bg-purple-950/40 text-purple-300"
              : "border-amber-500/25 bg-amber-500/10 text-amber-400"
              }`}>
              <span>Identity Verification</span>
              <span className="text-[0.65rem] uppercase tracking-wider">
                {identityVerified ? `✓ Verified (${identityCountry || "ID"})` : "○ Pending"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Middle Stretched Edit Digital Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <h3 className="font-display text-xl font-bold text-foreground">Edit Digital Identity</h3>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Customize your display name and profile avatar bound to your wallet identity.
        </p>

        {/* Profile Avatar Upload */}
        <div className="mt-6 pt-5 border-t border-border/60">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Profile Image
          </label>

          <div className="mt-3 flex flex-wrap items-center gap-5">
            <div className="relative grid size-20 place-items-center overflow-hidden rounded-full border-2 border-border bg-accent text-2xl font-bold font-display text-primary shadow-sm shrink-0">
              {profileImage ? (
                <img src={profileImage} alt="Avatar preview" className="size-full object-cover" />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload">
                <Button
                  type="button"
                  variant="voxauthOutline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="size-3.5" /> Upload Image
                </Button>
              </label>

              {profileImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleRemoveImage}
                >
                  <Trash2 className="size-3.5" /> Remove
                </Button>
              )}
            </div>
          </div>
          {imageError && <p className="mt-2 text-xs text-destructive">{imageError}</p>}
        </div>

        {/* Name Input Form */}
        <form onSubmit={handleSaveName} className="mt-6 pt-5 border-t border-border/60 space-y-4">
          <div>
            <label htmlFor="name-input" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Display Name
            </label>
            <input
              id="name-input"
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Enter your display name"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="voxauth" className="px-6 gap-2">
              <Check className="size-4" /> Save Changes
            </Button>
          </div>
        </form>
      </motion.div>

      {/* 4. Bottom Stretched Profile Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <h3 className="font-display text-xl font-bold text-foreground">Profile Overview</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Detailed cryptographic and verification properties linked to this account.
        </p>

        <div className="mt-6 space-y-3 divide-y divide-border/60 text-xs sm:text-sm">
          <div className="flex justify-between py-2.5">
            <span className="text-muted-foreground">Wallet Provider</span>
            <span className="font-bold capitalize text-foreground">{walletProvider || "Web3 Wallet"}</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-muted-foreground">Wallet Address</span>
            <span className="font-mono font-semibold text-foreground">{formatAddress(walletAddress)}</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-muted-foreground">Wallet Ownership</span>
            <span className="font-bold text-purple-400">Connected ✓</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-muted-foreground">Profile Avatar</span>
            <span className="font-semibold text-foreground">{profileImage ? "Custom Upload" : "Default Alias Avatar"}</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-muted-foreground">Human Verification</span>
            <span className={`font-bold ${humanVerified ? "text-purple-400" : "text-amber-600 dark:text-amber-400"}`}>
              {humanVerified ? "✓ Verified Human" : "○ Pending"}
            </span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-muted-foreground">Identity Verification</span>
            <span className={`font-bold ${identityVerified ? "text-purple-400" : "text-amber-600 dark:text-amber-400"}`}>
              {identityVerified ? `✓ Verified (${identityCountry || "ID"})` : "○ Pending"}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
