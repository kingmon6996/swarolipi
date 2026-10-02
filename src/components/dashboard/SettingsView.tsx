import { motion } from "motion/react";
import { Check, Lock, LogOut, ShieldCheck, Sun, User, Globe, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { formatAddress } from "@/components/WalletStatus";
import { useNavigate, Link } from "@tanstack/react-router";

export function SettingsView() {
  const { walletAddress, walletProvider, isConnected, disconnectWallet } = useWallet();
  const { profileName, profileImage } = useProfile();
  const { authorizedApps, revokeApp } = useAuth();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    disconnectWallet();
    navigate({ to: "/" });
  };

  const initialLetter = profileName ? profileName.charAt(0).toUpperCase() : "V";

  return (
    <div className="space-y-8">
      {/* 1. Account Overview Card */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <h2 className="font-display text-lg font-bold text-foreground">Account Information</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Current wallet-bound profile details and display attributes.
        </p>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center justify-between rounded-xl border border-border bg-background p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <div className="relative grid size-14 place-items-center overflow-hidden rounded-full border-2 border-border bg-accent font-display text-lg font-bold text-primary shadow-sm">
              {profileImage ? (
                <img src={profileImage} alt={profileName} className="size-full object-cover" />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>
            <div>
              <p className="font-display text-base font-bold text-foreground">{profileName || "Digital Identity"}</p>
              <p className="font-mono text-xs text-muted-foreground">{formatAddress(walletAddress)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-bold text-purple-300">
              Active Session
            </span>
          </div>
        </div>
      </motion.section>

      {/* 2. Authorized Applications Section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Authorized Applications</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Third-party dApps with active access to your VoxAuth identity signals.
            </p>
          </div>
          <Link to="/developer/demo">
            <Button variant="voxauthOutline" size="sm" className="gap-1.5 text-xs">
              Developer Demo <ExternalLink className="size-3.5" />
            </Button>
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {authorizedApps.length === 0 ? (
            <div className="rounded-xl border border-border bg-background p-6 text-center text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">No authorized applications yet.</p>
              <p className="mt-1">Third-party applications you approve will appear here.</p>
            </div>
          ) : (
            authorizedApps.map((app) => (
              <div
                key={app.applicationId}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-background p-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-extrabold text-sm shadow-sm">
                    {app.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-bold text-foreground">{app.name}</p>
                    <p className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                      <Globe className="size-3" /> {app.domain}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 font-bold text-purple-300 text-[0.68rem]">
                    <Check className="size-3 text-primary" /> Authorized
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeApp(app.applicationId)}
                    className="gap-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" /> Revoke Access
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.section>

      {/* 3. Security & Session Section */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <h2 className="font-display text-lg font-bold text-foreground">Security & Session</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Manage your active Web3 wallet connection and account session status.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3.5 text-xs">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-primary" />
              <div>
                <p className="font-bold text-foreground">Wallet Connection Status</p>
                <p className="text-muted-foreground">{isConnected ? "Connected & Active" : "Disconnected"}</p>
              </div>
            </div>
            <span className="rounded-md border border-purple-500/30 bg-purple-950/40 px-2.5 py-1 font-bold text-purple-300">
              Connected ✓
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3.5 text-xs">
            <div className="flex items-center gap-3">
              <User className="size-4 text-primary" />
              <div>
                <p className="font-bold text-foreground">Connected Provider</p>
                <p className="text-muted-foreground capitalize">{walletProvider || "Web3 Wallet"}</p>
              </div>
            </div>
            <span className="font-mono font-semibold text-muted-foreground">
              {formatAddress(walletAddress)}
            </span>
          </div>

          <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-foreground">Account Session</p>
              <p className="text-[0.7rem] text-muted-foreground">Disconnect your wallet and log out of VoxAuth</p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="gap-2 text-xs font-bold shadow-sm"
            >
              <LogOut className="size-4" /> Log Out / Disconnect
            </Button>
          </div>
        </div>
      </motion.section>

      {/* 4. Privacy Notice Card */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="rounded-2xl border border-primary/25 bg-cream/70 p-6 shadow-sm sm:p-8"
      >
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Lock className="size-5" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">Privacy Guarantee</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              <strong className="text-foreground">Your wallet remains under your control.</strong> VoxAuth never requests, accesses, or stores your private key, seed phrase, or wallet passwords.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
