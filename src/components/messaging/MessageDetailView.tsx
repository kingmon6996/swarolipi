import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Star,
  Trash2,
  Reply,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Globe,
  Wallet,
  Clock,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Mic,
  Lock,
  Paperclip,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Message, useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface MessageDetailViewProps {
  message: Message;
  threadMessages: Message[];
  onBack: () => void;
  onOpenReply: (recipient: string, subject: string) => void;
}

export function MessageDetailView({
  message,
  threadMessages,
  onBack,
  onOpenReply,
}: MessageDetailViewProps) {
  const { toggleStar, deleteMessage, restoreMessage } = useMessaging();
  const { isAuthorized } = useAuth();
  const navigate = useNavigate();

  const [expandedThreadIds, setExpandedThreadIds] = useState<Record<string, boolean>>({
    [message.messageId]: true,
  });

  const isAppRevoked =
    message.applicationId && !isAuthorized(message.applicationId) && message.applicationId !== "swarolipi-identity";

  const formattedDate = new Date(message.createdAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const toggleThreadExpand = (id: string) => {
    setExpandedThreadIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleActionClick = (action: Message["action"]) => {
    if (!action) return;
    if (action.link) {
      navigate({ to: action.link as any });
    } else if (action.type === "verify_human") {
      navigate({ to: "/human-verification" });
    } else if (action.type === "verify_identity") {
      navigate({ to: "/identity-verification" });
    } else {
      toast.info(`Action: ${action.label}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Detail Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="size-4" /> Back to Messages
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => toggleStar(message.messageId)}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Star
              className={`size-4 ${message.starred ? "fill-amber-400 text-amber-400" : ""
                }`}
            />
            {message.starred ? "Starred" : "Star"}
          </Button>

          <Button
            onClick={() => onOpenReply(message.senderAddress, `Re: ${message.subject}`)}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold"
          >
            <Reply className="size-4" /> Reply
          </Button>

          {message.status === "bin" || message.deleted ? (
            <Button
              onClick={() => {
                restoreMessage(message.messageId);
                toast.success("Message Restored");
                onBack();
              }}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold text-primary"
            >
              Restore Message
            </Button>
          ) : (
            <Button
              onClick={() => {
                deleteMessage(message.messageId);
                toast.success("Moved to Bin");
                onBack();
              }}
              variant="destructive"
              size="sm"
              className="gap-1.5 text-xs font-semibold"
            >
              <Trash2 className="size-4" /> Move to Bin
            </Button>
          )}
        </div>
      </div>

      {/* Subject Line & Thread Count */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[0.65rem] font-extrabold uppercase tracking-widest text-primary">
            Wallet Identity Message
          </span>
          <h2 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl mt-0.5">
            {message.subject}
          </h2>
        </div>

        {threadMessages.length > 1 && (
          <span className="rounded-full bg-accent border border-border px-3 py-1 text-xs font-bold text-muted-foreground">
            {threadMessages.length} Messages in Thread
          </span>
        )}
      </div>

      {/* Section 18 & 23: Revoked App Banner & Unknown Sender Warning */}
      {isAppRevoked && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-700">
            <Ban className="size-4" />
            <span>{message.senderName} — Access Revoked</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Authorization for this dApp was revoked. Historical messages remain available in your inbox, but new interaction tokens are disabled.
          </p>
        </div>
      )}

      {message.senderTrustLevel === "unknown_wallet" && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-700">
            <AlertTriangle className="size-4" />
            <span>Unverified Sender Warning</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            This sender has not been verified by Swarolipi. Never share private keys, seed phrases, or unencrypted credential files.
          </p>
        </div>
      )}

      {/* Message Cards (Thread chronological rendering) */}
      <div className="space-y-4">
        {threadMessages.map((msg) => {
          const isExpanded = expandedThreadIds[msg.messageId] !== false;
          const msgDate = new Date(msg.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={msg.messageId}
              className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div
                onClick={() => toggleThreadExpand(msg.messageId)}
                className="flex items-center justify-between p-5 border-b border-border/60 cursor-pointer bg-card/60 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-bold text-base shadow-sm">
                    {msg.senderName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-foreground text-sm">
                        {msg.senderName}
                      </span>

                      {/* Section 18 Trust Badges */}
                      {msg.senderTrustLevel === "verified_app" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-950/40 px-2.5 py-0.5 text-[0.65rem] font-bold text-purple-300">
                          <ShieldCheck className="size-3 text-primary" /> Authorized Application
                        </span>
                      )}
                      {msg.senderTrustLevel === "verified_wallet" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[0.65rem] font-bold text-primary">
                          <CheckCircle2 className="size-3" /> Verified Wallet
                        </span>
                      )}
                      {msg.senderTrustLevel === "unknown_wallet" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-muted bg-muted/60 px-2.5 py-0.5 text-[0.65rem] font-bold text-muted-foreground">
                          Unknown Wallet
                        </span>
                      )}
                    </div>

                    {/* Section 7 Wallet-Based Addressing */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-mono">
                      <span>From: {msg.senderAddress}</span>
                      <span>•</span>
                      <span>To: {msg.recipientAddress}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{msgDate}</span>
                  {isExpanded ? (
                    <ChevronUp className="size-4 text-primary" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </div>
              </div>

              {/* Message Content Body */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-6 space-y-6"
                  >
                    {/* Text Body */}
                    <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                      {msg.body}
                    </div>

                    {/* Section 17 Structured Application Action Card */}
                    {msg.action && (
                      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
                        <div className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                          <ShieldCheck className="size-4 text-primary" />
                          <span>Swarolipi Action Request</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          This message requires an interactive identity response from your wallet.
                        </p>
                        <Button
                          onClick={() => handleActionClick(msg.action)}
                          variant="swarolipi"
                          size="sm"
                          className="gap-2 text-xs font-bold px-4"
                        >
                          {msg.action.type === "verify_human" ? (
                            <Mic className="size-3.5" />
                          ) : msg.action.type === "verify_identity" ? (
                            <FileCheck className="size-3.5" />
                          ) : (
                            <ExternalLink className="size-3.5" />
                          )}
                          {msg.action.label}
                        </Button>
                      </div>
                    )}

                    {/* Attachments Section */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="border-t border-border/60 pt-4 space-y-2">
                        <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                          Attached Proofs / Files ({msg.attachments.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center gap-2.5 rounded-xl border border-border bg-accent/40 px-3.5 py-2 text-xs font-mono"
                            >
                              <Paperclip className="size-3.5 text-primary" />
                              <span className="font-semibold text-foreground">{att.name}</span>
                              <span className="text-[0.65rem] text-muted-foreground">({att.size})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Security Notice (Section 24) */}
                    <div className="border-t border-border/40 pt-4 flex items-center justify-between text-[0.65rem] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Lock className="size-3 text-primary" /> Wallet identity bound • End-to-end ZK signal protected
                      </span>
                      <span>Message ID: {msg.messageId}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
