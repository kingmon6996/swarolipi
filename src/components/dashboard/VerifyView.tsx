import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check, Mic, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { formatAddress } from "@/components/WalletStatus";

export function VerifyView() {
  const { walletAddress, isConnected } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-purple-500/20 bg-card/60 backdrop-blur-xl p-6 shadow-sm sm:p-8"
      >
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-bold text-purple-200">
            <span className="size-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#a855f7]" /> Step 2: Human Verification
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Verify Your Humanity
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Your wallet is connected. Complete Swarolipi human verification to create your privacy-conscious verification credential.
          </p>
        </div>
      </motion.div>

      {/* Status Breakdown Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Wallet Ownership */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-6 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-purple-300">01</span>
            <span className="grid size-8 place-items-center rounded-full bg-violet-600 text-white font-bold shadow-[0_0_10px_rgba(139,92,246,0.5)]">
              <Check className="size-4" />
            </span>
          </div>
          <h3 className="mt-6 text-lg font-bold text-foreground">Wallet Ownership</h3>
          <p className="mt-1 text-xs text-muted-foreground">Connected to {formatAddress(walletAddress)}</p>
          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-300">
            ✓ Connected
          </div>
        </motion.div>

        {/* Card 2: Human Verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-amber-400">02</span>
            <span className="grid size-8 place-items-center rounded-full bg-amber-500/20 text-amber-400 font-bold">
              ○
            </span>
          </div>
          <h3 className="mt-6 text-lg font-bold text-foreground">Human Verification</h3>
          <p className="mt-1 text-xs text-muted-foreground">Voice challenge & biometric proof</p>
          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 px-3 py-1 text-xs font-bold text-amber-400">
            ○ Not Verified
          </div>
        </motion.div>

        {/* Card 3: Credential Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-2xl border border-purple-500/15 bg-card/60 p-6 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-muted-foreground">03</span>
            <span className="grid size-8 place-items-center rounded-full bg-accent text-muted-foreground font-bold">
              ○
            </span>
          </div>
          <h3 className="mt-6 text-lg font-bold text-foreground">Swarolipi Credential</h3>
          <p className="mt-1 text-xs text-muted-foreground">Reusable authorization token</p>
          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-muted-foreground">
            ○ Not Available
          </div>
        </motion.div>
      </div>

      {/* Primary Action Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="rounded-2xl border border-purple-500/30 bg-card/60 p-8 text-center shadow-[0_0_35px_rgba(139,92,246,0.2)] backdrop-blur-xl sm:p-10"
      >
        <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-purple-500/30 bg-purple-950/40 text-purple-300 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <Mic className="size-8" />
        </div>
        <h3 className="mt-5 font-display text-2xl font-extrabold text-foreground">
          Ready for Human Registration
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Once initiated, you will complete a quick voice challenge to establish your unique, zero-knowledge human verification signal.
        </p>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            variant="swarolipi"
            onClick={() => setModalOpen(true)}
            className="gap-2 text-base px-8 py-6"
          >
            Begin Verification <ArrowRight className="size-5" />
          </Button>
        </div>
      </motion.div>

      {/* Preview Modal for Verification Flow */}
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
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-purple-500/25 bg-[#0b0b18]/95 p-6 shadow-[0_0_40px_rgba(139,92,246,0.3)] backdrop-blur-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-purple-950/40 border border-purple-500/25 text-purple-300">
                    <Mic className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">Human Verification Flow</h3>
                    <p className="text-xs text-muted-foreground">Module 5 Feature Boundary</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-5 space-y-3 rounded-xl border border-purple-500/15 bg-card/60 p-4 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Upcoming in Module 5:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Nonce Generation & Message Signing</li>
                  <li>Voice Challenge & Audio Sample Recording</li>
                  <li>Zero-Knowledge Human Signal Generation</li>
                  <li>Swarolipi Verifiable Credential Issuance</li>
                </ul>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="swarolipi" onClick={() => setModalOpen(false)}>
                  Got It
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
