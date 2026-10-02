import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Paperclip,
  Send,
  Save,
  Trash2,
  CheckCircle2,
  Globe,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMessaging, Message, Attachment, DraftState } from "@/hooks/useMessaging";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDraft?: Message | null;
}

const POPULAR_RECIPIENTS = [
  { label: "VoteDAO", address: "demo-votedao", type: "app" },
  { label: "Marketplace dApp", address: "marketplace-dapp", type: "app" },
  { label: "Peer Wallet 1", address: "0x81A4...72BC", type: "wallet" },
  { label: "Peer Wallet 2", address: "0xE934...124A", type: "wallet" },
];

export function ComposeModal({ isOpen, onClose, initialDraft }: ComposeModalProps) {
  const { sendMessage, saveDraft, discardDraft } = useMessaging();
  const { authorizedApps } = useAuth();

  const [draftId, setDraftId] = useState<string | undefined>(initialDraft?.messageId);
  const [recipient, setRecipient] = useState(initialDraft?.recipientAddress || "");
  const [subject, setSubject] = useState(initialDraft?.subject || "");
  const [body, setBody] = useState(initialDraft?.body || "");
  const [attachments, setAttachments] = useState<Attachment[]>(initialDraft?.attachments || []);

  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initialDraft when prop changes
  useEffect(() => {
    if (initialDraft) {
      setDraftId(initialDraft.messageId);
      setRecipient(initialDraft.recipientAddress || "");
      setSubject(initialDraft.subject || "");
      setBody(initialDraft.body || "");
      setAttachments(initialDraft.attachments || []);
    } else if (isOpen && !draftId) {
      setRecipient("");
      setSubject("");
      setBody("");
      setAttachments([]);
    }
  }, [initialDraft, isOpen]);

  // Section 10: Autosave Drafts
  useEffect(() => {
    if (!isOpen) return;
    if (!recipient && !subject && !body && attachments.length === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const draftData: DraftState = {
        draftId,
        recipientAddress: recipient,
        subject,
        body,
        attachments,
      };
      const savedMsg = saveDraft(draftData);
      if (savedMsg && savedMsg.messageId) {
        setDraftId(savedMsg.messageId);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [recipient, subject, body, attachments, isOpen]);

  const handleSend = () => {
    if (!recipient.trim()) {
      toast.error("Recipient Required", {
        description: "Please specify a wallet address or VoxAuth application ID.",
      });
      return;
    }
    if (!body.trim()) {
      toast.error("Message Body Required", {
        description: "Please enter a message before sending.",
      });
      return;
    }

    sendMessage(recipient.trim(), subject.trim(), body.trim(), attachments, draftId);
    toast.success("Message Sent", {
      description: `Message successfully delivered to ${recipient}`,
    });
    handleClose();
  };

  const handleManualSave = () => {
    const savedMsg = saveDraft({
      draftId,
      recipientAddress: recipient,
      subject,
      body,
      attachments,
    });
    setDraftId(savedMsg.messageId);
    setIsSaved(true);
    toast.success("Draft Saved", { description: "Your message draft was saved." });
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleDiscard = () => {
    if (draftId) {
      discardDraft(draftId);
      toast.info("Draft Discarded");
    }
    handleClose();
  };

  const handleClose = () => {
    setDraftId(undefined);
    setRecipient("");
    setSubject("");
    setBody("");
    setAttachments([]);
    setIsMinimized(false);
    setIsMaximized(false);
    onClose();
  };

  const handleAddMockAttachment = () => {
    const mockFiles: Attachment[] = [
      { id: `att-${Date.now()}-1`, name: "ZK-Identity-Proof.json", size: "4.2 KB", type: "application/json" },
      { id: `att-${Date.now()}-2`, name: "Verification-Credential.pdf", size: "128 KB", type: "application/pdf" },
      { id: `att-${Date.now()}-3`, name: "Wallet-Signature.sig", size: "512 B", type: "text/plain" },
    ];
    const newAtt = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setAttachments((prev) => [...prev, newAtt]);
    toast.success("Attachment Added", { description: `${newAtt.name} attached.` });
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-end md:p-6 p-0">
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{
            y: 0,
            opacity: 1,
            scale: 1,
            height: isMinimized ? "auto" : isMaximized ? "90vh" : "540px",
            width: isMaximized ? "92vw" : "560px",
          }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className={`pointer-events-auto flex flex-col rounded-2xl border border-border bg-card shadow-voxauth overflow-hidden w-full max-w-full md:max-w-[560px] ${isMaximized ? "md:max-w-none" : ""
            }`}
        >
          {/* Compose Header Bar */}
          <div className="flex items-center justify-between bg-accent/60 px-4 py-3 border-b border-border/70 select-none">
            <div className="flex items-center gap-2">
              <span className="grid size-6 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
                <Send className="size-3.5" />
              </span>
              <h3 className="font-display text-sm font-bold text-foreground">
                {draftId ? "Edit Draft" : "New Wallet Message"}
              </h3>

              {/* Section 10 Animated Autosave Badge */}
              <AnimatePresence>
                {isSaved && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    className="inline-flex items-center gap-1 rounded-full bg-fresh/10 border border-fresh/30 px-2 py-0.5 text-[0.65rem] font-bold text-fresh"
                  >
                    <CheckCircle2 className="size-3" /> Draft saved
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <Minus className="size-4" />
              </button>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="hidden md:block p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                title={isMaximized ? "Restore size" : "Maximize"}
              >
                {isMaximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
              <button
                onClick={handleClose}
                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-background/80 transition-colors"
                title="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Minimized Content Preview */}
          {isMinimized ? (
            <div
              onClick={() => setIsMinimized(false)}
              className="p-3 bg-card cursor-pointer hover:bg-accent/40 transition-colors flex items-center justify-between text-xs"
            >
              <span className="font-semibold text-foreground truncate">
                {subject || recipient || "New Message"}
              </span>
              <span className="text-[0.65rem] text-primary font-bold">Click to expand</span>
            </div>
          ) : (
            /* Main Form Area */
            <div className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto">
              {/* To Address Input & Autocomplete */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-muted-foreground">To (Wallet / Application ID)</label>
                  <span className="text-[0.65rem] text-muted-foreground font-mono">Wallet Identity</span>
                </div>
                <div className="relative">
                  <Input
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="e.g. 0x81A4...72BC or VoteDAO"
                    className="font-mono text-xs pr-10"
                  />
                  <Wallet className="absolute right-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* Quick Recipient Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[0.65rem] text-muted-foreground font-medium">Quick select:</span>
                  {authorizedApps.map((app) => (
                    <button
                      key={app.applicationId}
                      type="button"
                      onClick={() => setRecipient(app.name)}
                      className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-accent/60 px-2 py-0.5 text-[0.65rem] font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Globe className="size-2.5" /> {app.name}
                    </button>
                  ))}
                  {POPULAR_RECIPIENTS.map((rec) => (
                    <button
                      key={rec.address}
                      type="button"
                      onClick={() => setRecipient(rec.address)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {rec.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Input */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line..."
                  className="text-xs"
                />
              </div>

              {/* Message Body Input */}
              <div className="flex-1 flex flex-col min-h-[160px]">
                <label className="block text-xs font-bold text-muted-foreground mb-1">Message</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your wallet-addressed message here..."
                  className="flex-1 text-xs leading-relaxed resize-none p-3"
                />
              </div>

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-border/60">
                  <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">
                    Attachments ({attachments.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-accent/30 px-2.5 py-1 text-xs font-mono"
                      >
                        <Paperclip className="size-3 text-primary" />
                        <span className="text-foreground truncate max-w-[140px]">{att.name}</span>
                        <span className="text-[0.65rem] text-muted-foreground">{att.size}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border/70">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSend}
                    variant="voxauth"
                    size="sm"
                    className="gap-2 text-xs font-bold px-4"
                  >
                    <Send className="size-3.5" /> Send Message
                  </Button>

                  <Button
                    type="button"
                    onClick={handleAddMockAttachment}
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    title="Attach proof or document"
                  >
                    <Paperclip className="size-3.5" /> Attach Proof
                  </Button>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    onClick={handleManualSave}
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    title="Save Draft"
                  >
                    <Save className="size-3.5" /> Save Draft
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDiscard}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:bg-destructive/10"
                    title="Discard Draft"
                  >
                    <Trash2 className="size-3.5" /> Discard
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
