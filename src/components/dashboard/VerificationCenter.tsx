import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Check, FileCheck, Mic, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useWallet } from "@/hooks/useWallet";
import { formatAddress } from "@/components/WalletStatus";

export function VerificationCenter() {
  const { walletAddress } = useWallet();
  const { humanVerified, identityVerified, identityCountry, identityDocumentType } = useProfile();

  return (
    <div className="space-y-8">
      {/* Verification Center Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-purple-500/20 bg-card/60 backdrop-blur-xl p-6 shadow-sm sm:p-8"
      >
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-bold text-purple-200">
            <span className="size-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#a855f7]" /> Identity Security Layers
          </span>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Verification Center
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Complete the verification layers required to establish your Swarolipi identity. Each verification layer provides an independent trust signal.
          </p>
        </div>

        {/* Status Bar Summary */}
        <div className="mt-6 flex flex-wrap gap-3 pt-6 border-t border-purple-500/15 text-xs font-bold">
          <div className="flex items-center gap-2 rounded-lg bg-purple-950/40 border border-purple-500/25 px-3 py-1.5 text-purple-200">
            <Check className="size-3.5 text-violet-400" /> Wallet Identity: {formatAddress(walletAddress)}
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 border ${humanVerified
              ? "bg-purple-500/15 border-purple-500/30 text-purple-200"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}
          >
            {humanVerified ? <Check className="size-3.5 text-violet-400" /> : <span className="size-2 rounded-full bg-amber-500" />}
            Human Signal: {humanVerified ? "Verified ✓" : "○ Pending"}
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 border ${identityVerified
              ? "bg-purple-500/15 border-purple-500/30 text-purple-200"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}
          >
            {identityVerified ? <Check className="size-3.5 text-violet-400" /> : <span className="size-2 rounded-full bg-amber-500" />}
            Document Identity: {identityVerified ? "Verified ✓" : "○ Pending"}
          </div>
        </div>
      </motion.div>

      {/* Two Main Cards Grid */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Card 1: Human Verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className={`relative overflow-hidden rounded-2xl border p-7 shadow-sm backdrop-blur-xl transition-all duration-300 ${humanVerified
            ? "border-purple-500/40 bg-card/70 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
            : "border-purple-500/15 bg-card/60 hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]"
            }`}
        >
          <div className="flex items-start justify-between">
            <span className="grid size-12 place-items-center rounded-2xl border border-purple-500/25 bg-purple-950/40 text-purple-300 shadow-sm">
              <Mic className="size-6" />
            </span>

            {humanVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-300">
                <Check className="size-3.5 text-violet-400" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
                <span className="size-1.5 rounded-full bg-amber-500" /> Not Verified
              </span>
            )}
          </div>

          <h3 className="mt-6 font-display text-xl font-extrabold text-foreground">
            Human Verification
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Verify that you are a real person through a dynamic voice challenge. Establishes a zero-knowledge human verification signal.
          </p>

          <div className="mt-8">
            <Link to="/human-verification">
              <Button
                variant={humanVerified ? "swarolipiOutline" : "swarolipi"}
                className="w-full gap-2 text-xs"
              >
                {humanVerified ? "View Verification Result" : "Start Human Verification"}
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Card 2: Identity Verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className={`relative overflow-hidden rounded-2xl border p-7 shadow-sm backdrop-blur-xl transition-all duration-300 ${identityVerified
            ? "border-purple-500/40 bg-card/70 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
            : "border-purple-500/15 bg-card/60 hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]"
            }`}
        >
          <div className="flex items-start justify-between">
            <span className="grid size-12 place-items-center rounded-2xl border border-purple-500/25 bg-purple-950/40 text-purple-300 shadow-sm">
              <FileCheck className="size-6" />
            </span>

            {identityVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-300">
                <Check className="size-3.5 text-violet-400" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
                <span className="size-1.5 rounded-full bg-amber-500" /> Not Verified
              </span>
            )}
          </div>

          <h3 className="mt-6 font-display text-xl font-extrabold text-foreground">
            Identity Verification
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Verify your identity using an accepted government-issued document (PAN Card, Aadhaar Card, Passport, Driver's License).
          </p>

          {identityVerified && (
            <p className="mt-3 text-xs font-semibold text-purple-300">
              Document: {identityDocumentType} ({identityCountry})
            </p>
          )}

          <div className="mt-8">
            <Link to="/identity-verification">
              <Button
                variant={identityVerified ? "swarolipiOutline" : "swarolipi"}
                className="w-full gap-2 text-xs"
              >
                {identityVerified ? "View Verification Result" : "Verify Identity"}
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
