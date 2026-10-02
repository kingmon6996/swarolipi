import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Globe,
  Loader2,
  Lock,
  ShieldCheck,
  User,
  Image as ImageIcon,
  Wallet,
  UserCheck,
  FileCheck,
  X,
  Info,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { useAuth, DEMO_VOTEDAO_APP, AuthRequest } from "@/hooks/useAuth";
import { formatAddress } from "@/components/WalletStatus";

type Phase = "review" | "processing" | "granted" | "denied";

interface PermissionDetail {
  id: string;
  shortLabel: string;
  shortValue: string;
  icon: any;
  fullDetail: string;
  dataScope: string;
  privacyNote: string;
}

export function AuthorizeView({ request = DEMO_VOTEDAO_APP }: { request?: AuthRequest }) {
  const { walletAddress, isConnected } = useWallet();
  const {
    profileName,
    profileImage,
    humanVerified,
    identityVerified,
    identityCountry,
  } = useProfile();

  const { authorizeApp } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("review");
  const [pipelineIndex, setPipelineIndex] = useState(0);
  const [selectedDetail, setSelectedDetail] = useState<PermissionDetail | null>(null);

  const handleAllow = () => {
    setPhase("processing");
    setPipelineIndex(0);

    const steps = [0, 1, 2, 3];
    let idx = 0;

    const interval = setInterval(() => {
      idx++;
      if (idx < steps.length) {
        setPipelineIndex(idx);
      } else {
        clearInterval(interval);
        authorizeApp(request);
        setPhase("granted");
      }
    }, 850);
  };

  const handleDeny = () => {
    setPhase("denied");
  };

  const handleReturnToApp = () => {
    navigate({ to: "/developer/demo", search: { authorized: "true" } as any });
  };

  const handleReturnToDashboard = () => {
    navigate({ to: "/dashboard" });
  };

  const initialLetter = profileName ? profileName.charAt(0).toUpperCase() : "V";

  const requestedPermissions: PermissionDetail[] = [
    {
      id: "name",
      shortLabel: "Name",
      shortValue: profileName || "Golden Sparrow",
      icon: User,
      fullDetail: "Allows VoteDAO to personalize your account and display your verified display name across governance proposals.",
      dataScope: "Display Name string",
      privacyNote: "You can update your display name anytime in your VoxAuth profile settings.",
    },
    {
      id: "avatar",
      shortLabel: "Profile image",
      shortValue: profileImage ? "Avatar set" : "Default avatar",
      icon: ImageIcon,
      fullDetail: "Allows VoteDAO to render your VoxAuth avatar image on public delegate cards and voting leaderboards.",
      dataScope: "Public avatar image URL",
      privacyNote: "Only the image URL is shared. No raw image files or device metadata are stored.",
    },
    {
      id: "wallet",
      shortLabel: "Wallet address",
      shortValue: formatAddress(walletAddress),
      icon: Wallet,
      fullDetail: "Confirms wallet control and public address using EIP-712 challenge signatures.",
      dataScope: "Public wallet address (0x...)",
      privacyNote: "Private keys, seed phrases, and wallet passwords are NEVER requested or accessible.",
    },
    {
      id: "human",
      shortLabel: "Human verification",
      shortValue: humanVerified ? "Verified Human" : "Pending",
      icon: UserCheck,
      fullDetail: "Provides a zero-knowledge signal confirming that your account is bound to a verified human voice challenge.",
      dataScope: "Boolean Human Verification Token (true / false)",
      privacyNote: "Raw voice recordings are processed locally on your device and never transmitted to external dApps.",
    },
    {
      id: "identity",
      shortLabel: "Identity verification",
      shortValue: identityVerified ? `Verified (${identityCountry || "ID"})` : "Pending",
      icon: FileCheck,
      fullDetail: "Confirms whether your account has passed government ID verification and the issuer country code.",
      dataScope: "Boolean Identity Verification Token & Issuer Country Code",
      privacyNote: "Government ID numbers, document images, and full legal names are NOT disclosed.",
    },
  ];

  const notSharedItems = [
    "Private keys or seed phrases",
    "Wallet passwords or funds",
    "Raw voice recording files",
    "Government ID numbers & documents",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-12 px-5 sm:px-8">
      {/* Main Unboxed Scroll Document Page */}
      <main className="max-w-xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* ================= PHASE 1: UN-BOXED SHORTLISTED PERMISSIONS DOCUMENT ================= */}
          {phase === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Brand Header */}
              <div className="flex items-center justify-between">
                <Link to="/" className="inline-flex items-center gap-2 font-display text-sm font-extrabold tracking-[0.16em]">
                  <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
                    <ShieldCheck className="size-4" />
                  </span>
                  VOXAUTH
                </Link>

                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  {profileName || formatAddress(walletAddress)}
                </span>
              </div>

              {/* Application Header Row */}
              <div className="flex items-center gap-3.5 pt-2">
                <span className="grid size-12 place-items-center rounded-xl bg-accent text-primary font-display font-extrabold text-xl border border-border/50 shrink-0">
                  {request.name.charAt(0)}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base font-extrabold text-foreground">{request.name}</h2>
                    {request.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-950/40 px-2 py-0.5 text-[0.65rem] font-bold text-foreground">
                        <ShieldCheck className="size-3 text-primary" /> Verified application
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 font-mono">
                    <Globe className="size-3" /> {request.domain}
                  </p>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-snug">
                  {request.name} wants to access your VoxAuth identity
                </h1>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Review the information requested by this application before continuing.
                </p>
              </div>

              <div className="border-t border-border/60" />

              {/* Shortlisted Permission List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Requested Information</span>
                  <span>Value</span>
                </div>

                <div className="space-y-2">
                  {requestedPermissions.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-card/60 transition-colors hover:border-primary/30"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-lg bg-accent text-primary shrink-0">
                            <ItemIcon className="size-4" />
                          </span>
                          <span className="text-xs font-bold text-foreground">{item.shortLabel}</span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-semibold text-foreground font-mono">
                            {item.shortValue}
                          </span>
                          <button
                            onClick={() => setSelectedDetail(item)}
                            className="grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                            title={`View details for ${item.shortLabel}`}
                            aria-label={`View details for ${item.shortLabel}`}
                          >
                            <Info className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border/60" />

              {/* Security Boundary Readout ("What isn't shared") */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Lock className="size-4 text-primary" />
                  <span>What isn't shared</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[0.72rem] text-muted-foreground">
                  {notSharedItems.map((item) => (
                    <div key={item} className="flex items-center gap-2 py-1.5 px-3 rounded-lg border border-purple-500/15 bg-card/60 backdrop-blur-sm">
                      <span className="size-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.7)] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/60" />

              {/* Action Bar */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="voxauthOutline"
                    onClick={handleDeny}
                    className="sm:flex-1 py-5 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="voxauth"
                    onClick={handleAllow}
                    className="sm:flex-1 py-5 text-xs gap-2"
                  >
                    Authorize access <ArrowRight className="size-4" />
                  </Button>
                </div>
                <p className="text-center text-[0.68rem] text-muted-foreground">
                  Your identity signal will be shared only with {request.name}. You can revoke access anytime in Settings.
                </p>
              </div>
            </motion.div>
          )}

          {/* ================= PHASE 2: PROCESSING PIPELINE ================= */}
          {phase === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center space-y-6"
            >
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-primary">
                <Loader2 className="size-7 animate-spin" />
              </div>

              <div>
                <h2 className="font-display text-2xl font-extrabold text-foreground">
                  Authorizing access...
                </h2>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Establishing identity authorization token for <strong className="text-foreground">{request.name}</strong>.
                </p>
              </div>

              <div className="space-y-2.5 max-w-md mx-auto text-left">
                {[
                  "Verifying Wallet Control Signature",
                  "Binding Human Signal Token",
                  "Signing Authorization Scope",
                  "Access Granted",
                ].map((step, idx) => {
                  const isDone = idx < pipelineIndex;
                  const isCurrent = idx === pipelineIndex;
                  return (
                    <div
                      key={step}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold transition-all ${isDone
                        ? "border-purple-500/30 bg-purple-950/25 text-foreground"
                        : isCurrent
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/40 bg-background/40 text-muted-foreground opacity-50"
                        }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {isDone ? (
                          <Check className="size-4 text-primary" />
                        ) : isCurrent ? (
                          <Loader2 className="size-4 animate-spin text-primary" />
                        ) : (
                          <span className="size-2 rounded-full bg-border" />
                        )}
                        {step}
                      </span>
                      <span className="text-[0.62rem] font-mono uppercase">
                        {isDone ? "OK" : isCurrent ? "BUSY" : "WAIT"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ================= PHASE 3: ACCESS GRANTED RESULT ================= */}
          {phase === "granted" && (
            <motion.div
              key="granted"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-10 text-center space-y-6 max-w-md mx-auto"
            >
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-purple-950/40 text-primary border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <ShieldCheck className="size-8" />
              </div>

              <div>
                <h2 className="font-display text-3xl font-extrabold text-foreground">
                  Access Granted
                </h2>
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  <strong className="text-foreground">{request.name}</strong> is now authorized to access your VoxAuth identity signals.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-purple-500/20 bg-card/80 backdrop-blur-xl p-5 text-left text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Application</span>
                  <span className="font-bold text-foreground">{request.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Connected Wallet</span>
                  <span className="font-mono font-bold text-foreground">{formatAddress(walletAddress)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Authorization Token</span>
                  <span className="font-bold text-purple-300">Active ✓</span>
                </div>
              </div>

              <Button variant="voxauth" onClick={handleReturnToApp} className="w-full gap-2 py-6 text-base">
                Return to {request.name} <ArrowRight className="size-5" />
              </Button>
            </motion.div>
          )}

          {/* ================= PHASE 4: ACCESS DENIED RESULT ================= */}
          {phase === "denied" && (
            <motion.div
              key="denied"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-10 text-center space-y-6 max-w-md mx-auto"
            >
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <X className="size-7" />
              </div>

              <div>
                <h2 className="font-display text-2xl font-extrabold text-foreground">
                  Authorization Cancelled
                </h2>
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  No identity information was shared with <strong className="text-foreground">{request.name}</strong>.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button variant="voxauth" onClick={handleReturnToApp} className="py-6 text-sm">
                  Return to {request.name}
                </Button>
                <Button variant="voxauthOutline" onClick={handleReturnToDashboard} className="py-6 text-sm">
                  Return to Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ================= INTERACTIVE (i) INFO DETAIL MODAL ================= */}
      <AnimatePresence>
        {selectedDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-voxauth space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
                    <selectedDetail.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">{selectedDetail.shortLabel}</h3>
                    <span className="font-mono text-xs font-semibold text-primary">{selectedDetail.shortValue}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs leading-relaxed">
                <div>
                  <p className="font-bold uppercase tracking-wider text-[0.65rem] text-muted-foreground mb-1">
                    Permission Purpose
                  </p>
                  <p className="text-foreground">{selectedDetail.fullDetail}</p>
                </div>

                <div className="rounded-xl border border-border/60 bg-background p-3">
                  <p className="font-bold uppercase tracking-wider text-[0.65rem] text-muted-foreground mb-0.5">
                    Data Disclosed to Application
                  </p>
                  <p className="font-mono text-xs font-semibold text-foreground">{selectedDetail.dataScope}</p>
                </div>

                <div className="rounded-xl border border-primary/20 bg-accent/40 p-3">
                  <p className="font-bold uppercase tracking-wider text-[0.65rem] text-primary mb-0.5">
                    Privacy Boundary Guarantee
                  </p>
                  <p className="text-muted-foreground">{selectedDetail.privacyNote}</p>
                </div>
              </div>

              <Button
                variant="voxauth"
                onClick={() => setSelectedDetail(null)}
                className="w-full py-5 text-xs font-bold"
              >
                Close
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
