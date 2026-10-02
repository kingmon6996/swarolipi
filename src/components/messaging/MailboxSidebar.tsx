import { motion } from "motion/react";
import {
  Plus,
  Inbox,
  Star,
  Send,
  FileText,
  Trash2,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MailFolder, useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/hooks/useAuth";

interface MailboxSidebarProps {
  currentFolder: MailFolder;
  selectedAppId: string | null;
  onSelectFolder: (folder: MailFolder) => void;
  onSelectApp: (appId: string | null) => void;
  onOpenCompose: () => void;
}

export function MailboxSidebar({
  currentFolder,
  selectedAppId,
  onSelectFolder,
  onSelectApp,
  onOpenCompose,
}: MailboxSidebarProps) {
  const {
    unreadCount,
    starredCount,
    sentCount,
    draftsCount,
    binCount,
    messages,
  } = useMessaging();

  const { authorizedApps, isAuthorized } = useAuth();

  // Known demo applications list
  const knownApps = [
    {
      applicationId: "demo-votedao",
      name: "VoteDAO",
      domain: "votedao.example",
      identityRequests: ["Human Verification", "Wallet Ownership"],
    },
    {
      applicationId: "marketplace-dapp",
      name: "Marketplace dApp",
      domain: "marketplace.example",
      identityRequests: ["Wallet Ownership"],
    },
    {
      applicationId: "voxauth-identity",
      name: "VoxAuth Service",
      domain: "voxauth.io",
      identityRequests: ["Human Verification", "ID Verification"],
    },
  ];

  // Helper to find last message snippet for app
  const getLastAppMessage = (appId: string) => {
    const appMsgs = messages.filter(
      (m) =>
        m.applicationId === appId ||
        m.senderApplicationId === appId ||
        m.senderName.toLowerCase().includes(appId.toLowerCase())
    );
    if (appMsgs.length === 0) return "No messages yet.";
    return appMsgs[0].body.length > 38
      ? appMsgs[0].body.slice(0, 38) + "..."
      : appMsgs[0].body;
  };

  const FOLDERS: { id: MailFolder; label: string; icon: any; count: number }[] = [
    { id: "inbox", label: "Inbox", icon: Inbox, count: unreadCount },
    { id: "starred", label: "Starred", icon: Star, count: starredCount },
    { id: "sent", label: "Sent", icon: Send, count: sentCount },
    { id: "drafts", label: "Drafts", icon: FileText, count: draftsCount },
    { id: "bin", label: "Bin", icon: Trash2, count: binCount },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Primary Compose Button */}
      <Button
        onClick={onOpenCompose}
        variant="voxauth"
        className="w-full justify-center gap-2 font-display text-sm font-bold shadow-md hover:shadow-lg py-5 rounded-xl transition-all"
      >
        <Plus className="size-5" /> Compose
      </Button>

      {/* Folders List (Section 4) */}
      <div className="space-y-1">
        <span className="px-3 text-[0.65rem] font-extrabold uppercase tracking-widest text-muted-foreground">
          Mailboxes
        </span>
        <nav className="space-y-1 pt-1.5">
          {FOLDERS.map((folder) => {
            const Icon = folder.icon;
            const isSelected = currentFolder === folder.id && !selectedAppId;

            return (
              <button
                key={folder.id}
                onClick={() => {
                  onSelectApp(null);
                  onSelectFolder(folder.id);
                }}
                className={`relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${isSelected
                  ? "bg-accent text-primary font-bold shadow-sm"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                  />
                  <span>{folder.label}</span>
                </div>
                {folder.count > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${isSelected
                      ? "bg-primary text-primary-foreground"
                      : folder.id === "inbox"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Section 5: Authorized Apps Section */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between px-3">
          <span className="text-[0.65rem] font-extrabold uppercase tracking-widest text-muted-foreground">
            Authorized Applications
          </span>
          <span className="text-[0.65rem] font-bold text-primary">
            {authorizedApps.length} Connected
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {knownApps.map((app) => {
            const isAppAuth = isAuthorized(app.applicationId) || app.applicationId === "voxauth-identity";
            const isSelected = selectedAppId === app.applicationId;
            const lastMsg = getLastAppMessage(app.applicationId);

            return (
              <button
                key={app.applicationId}
                onClick={() => onSelectApp(isSelected ? null : app.applicationId)}
                className={`group text-left w-full rounded-xl border p-3 transition-all duration-200 ${isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/70 bg-card hover:border-primary/40 hover:bg-accent/30"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      {app.name.charAt(0)}
                    </span>
                    <span className="font-display font-bold text-xs text-foreground">
                      {app.name}
                    </span>
                  </div>

                  {isAppAuth ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-950/40 border border-purple-500/30 px-2 py-0.5 text-[0.6rem] font-bold text-purple-300">
                      <CheckCircle2 className="size-2.5 text-primary" /> Authorized
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[0.6rem] font-bold text-amber-600">
                      <AlertTriangle className="size-2.5" /> Revoked
                    </span>
                  )}
                </div>

                {/* Identity Requests Scope */}
                <div className="mt-2 text-[0.65rem] text-muted-foreground space-y-0.5">
                  <span className="block font-semibold text-foreground">Identity requests:</span>
                  <span className="block text-muted-foreground truncate font-mono">
                    {app.identityRequests.join(", ")}
                  </span>
                </div>

                {/* Last Message Snippet */}
                <div className="mt-2 pt-2 border-t border-border/40 text-[0.65rem]">
                  <span className="text-muted-foreground font-semibold">Last message:</span>
                  <p className="text-foreground italic truncate font-sans font-medium">"{lastMsg}"</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
