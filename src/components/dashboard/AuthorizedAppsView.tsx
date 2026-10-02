import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink,
  Check,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function AuthorizedAppsView() {
  const { authorizedApps, revokeApp } = useAuth();
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const handleRevoke = (appId: string, appName: string) => {
    revokeApp(appId);
    toast.success("Authorization Revoked", {
      description: `${appName} can no longer access your Swarolipi identity signals.`,
    });
  };

  // Sort applications alphabetically (A-Z) by app name
  const sortedApps = [...authorizedApps].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-accent text-primary">
                <Globe className="size-4" />
              </span>
              <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
                Authorized Applications
              </h2>
              <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-bold text-primary">
                {authorizedApps.length} Active
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm max-w-2xl">
              Third-party decentralized applications with active access to your Swarolipi zero-knowledge identity signals. You can review permission scopes or revoke access anytime.
            </p>
          </div>

          <Link to="/developer/demo">
            <Button variant="swarolipiOutline" size="sm" className="gap-1.5 text-xs whitespace-nowrap">
              Test Developer Demo <ExternalLink className="size-3.5" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Applications List - One by One Format (Alphabetically Sorted) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="space-y-4"
      >
        {sortedApps.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-xs space-y-4 shadow-sm">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-primary">
              <Globe className="size-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-foreground">No Authorized Applications</h3>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                You haven't granted identity access to any third-party applications yet. Try out our Developer Demo dApp to test the authorization flow.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/developer/demo">
                <Button variant="swarolipi" size="sm" className="gap-1.5 text-xs">
                  Authorize Demo dApp <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          sortedApps.map((app) => {
            const isExpanded = expandedAppId === app.applicationId;
            const formattedDate = new Date(app.authorizedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={app.applicationId}
                className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-all duration-200"
              >
                {/* One by One Item Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                  <div className="flex items-center gap-4">
                    <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-extrabold text-lg shadow-sm">
                      {app.name.charAt(0)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-foreground text-base">{app.name}</h4>
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-950/40 px-2.5 py-0.5 text-[0.65rem] font-bold text-purple-300">
                          Active ✓
                        </span>
                      </div>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 font-mono">
                        <Globe className="size-3.5" /> {app.domain}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedAppId(isExpanded ? null : app.applicationId)
                      }
                      className="gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <span>{isExpanded ? "Hide Details" : "Show Details"}</span>
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-primary" />
                      ) : (
                        <ChevronDown className="size-4 text-primary" />
                      )}
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevoke(app.applicationId, app.name)}
                      className="gap-1.5 text-xs font-bold px-4"
                    >
                      <Trash2 className="size-3.5" /> Revoke
                    </Button>
                  </div>
                </div>

                {/* Dropdown Arrow Details Area */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t border-border/60 bg-accent/30 p-5 sm:p-6 space-y-5 text-xs"
                    >
                      <div>
                        <p className="font-bold text-muted-foreground uppercase tracking-wider text-[0.65rem] mb-2">
                          Granted Identity Signals
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {app.grantedPermissions.map((perm) => (
                            <span
                              key={perm}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/30 px-3 py-1 font-bold text-purple-300 text-xs"
                            >
                              <ShieldCheck className="size-3.5 text-primary" /> {perm.toUpperCase()} VERIFIED
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
                        <div className="rounded-xl border border-border/70 bg-card p-3.5">
                          <span className="font-bold text-foreground block text-xs mb-1">Authorization Timestamp</span>
                          <span className="font-mono text-xs text-foreground">{formattedDate}</span>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-card p-3.5">
                          <span className="font-bold text-foreground block text-xs mb-1">Token Scope</span>
                          <span className="font-mono text-xs text-foreground">Zero-Knowledge Verification Token</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/40">
                        <span className="text-[0.7rem] text-muted-foreground leading-relaxed">
                          Revoking authorization instantly invalidates this application's token and revokes future signal requests. Access can be revoked using the main Revoke button above.
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
