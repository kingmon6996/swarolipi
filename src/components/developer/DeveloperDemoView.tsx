import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCheck,
  Globe,
  Lock,
  Mic,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  User,
  Vote,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { useAuth, DEMO_VOTEDAO_APP } from "@/hooks/useAuth";
import { formatAddress } from "@/components/WalletStatus";

export function DeveloperDemoView() {
  const { walletAddress, isConnected } = useWallet();
  const {
    profileName,
    profileImage,
    humanVerified,
    identityVerified,
    identityCountry,
  } = useProfile();

  const { isAuthorized, revokeApp } = useAuth();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [votedOption, setVotedOption] = useState<string | null>(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  const isVoteDAOAuthorized = isAuthorized("demo-votedao");

  const handleReviewAndAuthorize = () => {
    setModalOpen(false);
    navigate({ to: "/authorize" });
  };

  const handleCastVote = (option: string) => {
    setVotedOption(option);
    setVoteSubmitted(true);
  };

  const handleResetDemo = () => {
    revokeApp("demo-votedao");
    setVoteSubmitted(false);
    setVotedOption(null);
  };

  const initialLetter = profileName ? profileName.charAt(0).toUpperCase() : "V";

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-8">
      {/* Top Banner & Header Navigation */}
      <div className="mx-auto max-w-6xl mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="size-3.5" /> Developer Integration Demo
          </span>
          <h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl text-foreground">
            Third-Party Application Authorization
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Demonstrates how an external application (VoteDAO) requests and consumes authorized VoxAuth identity signals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="voxauthOutline" size="sm">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Split Screen Demo + Data Flow Visualization */}
      <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-12">
        {/* Left Column (7 cols): VoteDAO Mock Application Interface */}
        <div className="lg:col-span-7 space-y-6">
          {/* VoteDAO Mock App Frame */}
          <div className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-voxauth">
            {/* App Top Nav */}
            <div className="flex items-center justify-between border-b border-border/70 bg-accent/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-extrabold text-base shadow-sm">
                  V
                </span>
                <div>
                  <h2 className="font-display text-base font-extrabold text-foreground">VoteDAO</h2>
                  <p className="text-[0.68rem] text-muted-foreground font-mono">votedao.example</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                <span className="text-foreground">Proposals</span>
                <span>Governance</span>
                <span>Treasury</span>
              </div>
            </div>

            {/* App Body Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Proposal Header */}
              <div className="rounded-xl border border-border bg-background p-5">
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider text-primary">
                  Proposal #42 • Active
                </span>
                <h3 className="mt-3 font-display text-xl font-extrabold text-foreground">
                  Allocate Community Treasury for Zero-Knowledge Identity Grants
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  This proposal allocates 250,000 VOTE tokens to fund privacy-preserving identity verification infrastructure integrations across decentralized ecosystem dApps.
                </p>
              </div>

              {/* State 1: Verification Required (UNAUTHORIZED) */}
              {!isVoteDAOAuthorized && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-6 text-center"
                >
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold">
                    <Lock className="size-6" />
                  </div>
                  <h4 className="mt-4 font-display text-lg font-bold text-foreground">
                    Human Verification Required to Vote
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                    VoteDAO requires voters to prove wallet ownership and human verification through VoxAuth before submitting ballots.
                  </p>

                  <div className="mt-6 flex justify-center">
                    <Button variant="voxauth" onClick={() => setModalOpen(true)} className="gap-2 px-6">
                      Continue with VoxAuth <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* State 2: Verified & Authorized (AUTHORIZED) */}
              {isVoteDAOAuthorized && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Authorized Identity Badge */}
                  <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-md p-5">
                    <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                        <ShieldCheck className="size-4" />
                        <span>✓ Verified Human Identity</span>
                      </div>
                      <button
                        onClick={handleResetDemo}
                        className="text-[0.68rem] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="size-3" /> Revoke Auth
                      </button>
                    </div>

                    {/* Authorized Signals Breakdown */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="rounded-lg border border-border/80 bg-background/80 p-2.5">
                        <span className="text-[0.65rem] text-muted-foreground block">Identity</span>
                        <span className="font-bold text-foreground truncate block">{profileName || "Digital Identity"}</span>
                      </div>
                      <div className="rounded-lg border border-border/80 bg-background/80 p-2.5">
                        <span className="text-[0.65rem] text-muted-foreground block">Wallet</span>
                        <span className="font-mono font-semibold text-foreground truncate block">{formatAddress(walletAddress)}</span>
                      </div>
                      <div className="rounded-lg border border-border/80 bg-background/80 p-2.5">
                        <span className="text-[0.65rem] text-muted-foreground block">Human Status</span>
                        <span className="font-bold text-purple-400 block">✓ Verified</span>
                      </div>
                      <div className="rounded-lg border border-border/80 bg-background/80 p-2.5">
                        <span className="text-[0.65rem] text-muted-foreground block">Document Identity</span>
                        <span className="font-bold text-purple-400 block">{identityVerified ? "✓ Verified" : "○ Pending"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Voting Ballot Form */}
                  <div className="rounded-xl border border-purple-500/15 bg-card/80 backdrop-blur-md p-5">
                    <h4 className="font-display text-base font-bold text-foreground mb-3">
                      Cast Your Ballot
                    </h4>

                    {voteSubmitted ? (
                      <div className="rounded-xl border border-purple-500/40 bg-purple-950/30 p-5 text-center shadow-lg shadow-purple-950/30">
                        <div className="mx-auto grid size-12 place-items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold mb-3 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                          <Check className="size-6 stroke-[3]" />
                        </div>
                        <h5 className="font-display text-lg font-extrabold text-foreground">
                          Ballot Successfully Submitted!
                        </h5>
                        <p className="mt-1 text-xs text-muted-foreground">
                          You voted <strong className="text-foreground">{votedOption}</strong> on Proposal #42 using your authorized VoxAuth human identity.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Button
                          variant="voxauthOutline"
                          onClick={() => handleCastVote("In Favor")}
                          className="h-auto py-3.5 flex-col items-center gap-1 hover:border-purple-500 hover:bg-purple-950/40"
                        >
                          <span className="font-bold">FOR</span>
                          <span className="text-[0.68rem] text-muted-foreground">In Favor of Proposal</span>
                        </Button>
                        <Button
                          variant="voxauthOutline"
                          onClick={() => handleCastVote("Against")}
                          className="h-auto py-3.5 flex-col items-center gap-1 hover:border-destructive hover:bg-destructive/10"
                        >
                          <span className="font-bold">AGAINST</span>
                          <span className="text-[0.68rem] text-muted-foreground">Reject Proposal</span>
                        </Button>
                        <Button
                          variant="voxauthOutline"
                          onClick={() => handleCastVote("Abstain")}
                          className="h-auto py-3.5 flex-col items-center gap-1 hover:border-purple-500/50"
                        >
                          <span className="font-bold">ABSTAIN</span>
                          <span className="text-[0.68rem] text-muted-foreground">Abstain Vote</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Data Flow Diagram & Security Architecture */}
        <div className="lg:col-span-5 space-y-6">
          {/* Data Flow Visualization Diagram */}
          <div className="rounded-2xl border border-purple-500/15 bg-card/80 backdrop-blur-xl p-6 shadow-sm">
            <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-primary">
              Signal Flow Architecture
            </span>
            <h3 className="mt-2 font-display text-lg font-bold text-foreground">
              Identity Authorization Pipeline
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              How third-party dApps receive verified identity signals without accessing sensitive credentials.
            </p>

            {/* Visual Pipeline Sequence */}
            <div className="mt-6 space-y-2.5">
              {[
                { label: "USER WALLET", desc: "User connects wallet identity", active: true },
                { label: "VOXAUTH IDENTITY", desc: "Digital identity & human verification signals", active: true },
                { label: "REQUESTED PERMISSIONS", desc: "VoteDAO requests Name, Wallet, Human Status", active: true },
                { label: "USER APPROVAL", desc: "Explicit Allow / Deny confirmation", active: isVoteDAOAuthorized },
                { label: "AUTHORIZED SIGNALS", desc: "Verifiable authorization token issued", active: isVoteDAOAuthorized },
                { label: "VOTEDAO APP", desc: "Governance voting unlocked", active: isVoteDAOAuthorized },
              ].map((step, idx) => (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-xs transition-all ${step.active
                    ? "border-purple-500/30 bg-purple-950/25 text-foreground shadow-sm shadow-purple-950/20"
                    : "border-border/60 bg-background/50 text-muted-foreground opacity-60"
                    }`}
                >
                  <span className={`grid size-6 place-items-center rounded-full font-bold text-[0.65rem] ${step.active ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]" : "bg-accent text-muted-foreground"}`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs">{step.label}</p>
                    <p className="text-[0.68rem] text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy & Scope Notice */}
          <div className="rounded-2xl border border-purple-500/20 bg-purple-950/15 backdrop-blur-md p-6 shadow-sm text-xs text-muted-foreground">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 size-4 text-primary shrink-0" />
              <div>
                <p className="font-bold text-foreground">Zero-Knowledge Signal Delivery</p>
                <p className="mt-1 leading-relaxed">
                  Third-party applications like VoteDAO only receive authorized verification signals (e.g. `humanVerified: true`). They never receive private keys, seed phrases, raw voice recordings, or government ID numbers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VoxAuth Handoff Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-purple-500/25 bg-[#0b0b18]/95 p-6 shadow-2xl shadow-purple-950/50 backdrop-blur-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-display font-extrabold text-lg shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                    V
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">VoteDAO Request</h3>
                    <p className="text-xs text-muted-foreground font-mono">votedao.example</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-5 space-y-2 rounded-xl border border-purple-500/20 bg-background/60 p-4 text-xs">
                <p className="font-semibold text-foreground mb-2">Requested Permissions:</p>
                <div className="flex items-center gap-2 text-purple-300 font-bold"><Check className="size-3.5 text-primary" /> Profile Display Name</div>
                <div className="flex items-center gap-2 text-purple-300 font-bold"><Check className="size-3.5 text-primary" /> Profile Image</div>
                <div className="flex items-center gap-2 text-purple-300 font-bold"><Check className="size-3.5 text-primary" /> Connected Wallet Address</div>
                <div className="flex items-center gap-2 text-purple-300 font-bold"><Check className="size-3.5 text-primary" /> Human Verification Status</div>
                <div className="flex items-center gap-2 text-purple-300 font-bold"><Check className="size-3.5 text-primary" /> Identity Verification Status</div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="voxauthOutline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="voxauth" onClick={handleReviewAndAuthorize} className="gap-1.5">
                  Review & Authorize <ArrowRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
