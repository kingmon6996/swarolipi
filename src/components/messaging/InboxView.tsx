import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Star,
  Trash2,
  Inbox,
  Send,
  FileText,
  Paperclip,
  CheckSquare,
  Square,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Plus,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MailFolder,
  FilterType,
  Message,
  useMessaging,
} from "@/hooks/useMessaging";
import { MessageDetailView } from "@/components/messaging/MessageDetailView";
import { ComposeModal } from "@/components/messaging/ComposeModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface InboxViewProps {
  initialFolder?: MailFolder;
  initialAppId?: string | null;
}

export function InboxView({ initialFolder = "inbox", initialAppId = null }: InboxViewProps) {
  const {
    messages,
    inboxMessages,
    starredMessages,
    sentMessages,
    draftMessages,
    binMessages,
    sentStats,
    markAsRead,
    toggleStar,
    deleteMessage,
    restoreMessage,
    emptyBin,
    activeWallet,
  } = useMessaging();

  // Navigation & Filter States
  const [currentFolder, setCurrentFolder] = useState<MailFolder>(initialFolder);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(initialAppId);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isThreaded, setIsThreaded] = useState(false);

  // Sync initialFolder from route search params
  useEffect(() => {
    setCurrentFolder(initialFolder);
    setSelectedMessageId(null);
  }, [initialFolder]);

  useEffect(() => {
    setSelectedAppId(initialAppId);
    setSelectedMessageId(null);
  }, [initialAppId]);

  // Selection & Detail View States
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<Message | null>(null);

  // 1. Determine base folder dataset
  const baseFolderMessages = useMemo(() => {
    if (selectedAppId) {
      return messages.filter(
        (m) =>
          !m.deleted &&
          (m.applicationId === selectedAppId ||
            m.senderApplicationId === selectedAppId ||
            m.senderName.toLowerCase().includes(selectedAppId.toLowerCase()))
      );
    }

    switch (currentFolder) {
      case "inbox":
        return inboxMessages;
      case "starred":
        return starredMessages;
      case "sent":
        return sentMessages;
      case "drafts":
        return draftMessages;
      case "bin":
        return binMessages;
      default:
        return inboxMessages;
    }
  }, [currentFolder, selectedAppId, messages, inboxMessages, starredMessages, sentMessages, draftMessages, binMessages]);

  // 2. Apply Search & Category Filters
  const filteredMessages = useMemo(() => {
    let result = baseFolderMessages;

    if (activeFilter === "unread") {
      result = result.filter((m) => !m.read);
    } else if (activeFilter === "starred") {
      result = result.filter((m) => m.starred);
    } else if (activeFilter === "applications") {
      result = result.filter((m) => m.senderType === "application");
    } else if (activeFilter === "wallets") {
      result = result.filter((m) => m.senderType === "wallet");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.senderName.toLowerCase().includes(q) ||
          m.senderAddress.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q) ||
          m.body.toLowerCase().includes(q) ||
          (m.applicationId && m.applicationId.toLowerCase().includes(q))
      );
    }

    return result;
  }, [baseFolderMessages, activeFilter, searchQuery]);

  // 3. Handle Message Row Click
  const handleMessageClick = (msg: Message) => {
    if (msg.status === "draft") {
      setEditingDraft(msg);
      setIsComposeOpen(true);
    } else {
      if (!msg.read) {
        markAsRead(msg.messageId);
      }
      setSelectedMessageId(msg.messageId);
    }
  };

  // 4. Threading Grouping
  const displayThreads = useMemo(() => {
    if (!isThreaded) return filteredMessages.map((m) => [m]);

    const groups: Record<string, Message[]> = {};
    filteredMessages.forEach((m) => {
      const key = m.threadId || m.messageId;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });

    return Object.values(groups);
  }, [filteredMessages, isThreaded]);

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (checkedIds.size === filteredMessages.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(filteredMessages.map((m) => m.messageId)));
    }
  };

  const toggleCheck = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(checkedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCheckedIds(next);
  };

  const handleBulkDelete = () => {
    checkedIds.forEach((id) => deleteMessage(id));
    toast.success(`Moved ${checkedIds.size} message(s) to Bin`);
    setCheckedIds(new Set());
  };

  const handleBulkMarkRead = () => {
    checkedIds.forEach((id) => markAsRead(id));
    toast.success(`Marked ${checkedIds.size} message(s) as read`);
    setCheckedIds(new Set());
  };

  const handleOpenReply = (recipient: string, subject: string) => {
    setEditingDraft(null);
    setIsComposeOpen(true);
  };

  // Selected Message for Detail View
  const selectedMessage = useMemo(() => {
    if (!selectedMessageId) return null;
    return messages.find((m) => m.messageId === selectedMessageId) || null;
  }, [selectedMessageId, messages]);

  const threadMessagesForDetail = useMemo(() => {
    if (!selectedMessage) return [];
    return messages.filter(
      (m) => m.threadId === selectedMessage.threadId && !m.deleted
    );
  }, [selectedMessage, messages]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Compose Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false);
          setEditingDraft(null);
        }}
        initialDraft={editingDraft}
      />

      {/* Top Header Action Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Primary Compose Button */}
          <Button
            onClick={() => {
              setEditingDraft(null);
              setIsComposeOpen(true);
            }}
            variant="swarolipi"
            size="lg"
            className="w-full sm:w-auto gap-2 font-display text-sm font-bold shadow-md hover:shadow-lg px-6 py-2.5 rounded-xl transition-all"
          >
            <Plus className="size-4" /> Compose Message
          </Button>

          {/* Search Bar Input */}
          <div className="relative flex-1 w-full max-w-xl">
            <Search className="absolute left-3.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages by sender, wallet address, subject, or app..."
              className="pl-10 text-xs h-9 bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Threading Toggle */}
          <Button
            onClick={() => setIsThreaded(!isThreaded)}
            variant={isThreaded ? "swarolipi" : "outline"}
            size="sm"
            className="gap-1.5 text-xs font-semibold whitespace-nowrap w-full sm:w-auto"
          >
            <Layers className="size-3.5" />
            {isThreaded ? "Threads On" : "Group Threads"}
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.65rem] font-bold text-muted-foreground mr-1 uppercase tracking-wider">
              Filter:
            </span>
            {(["all", "unread", "starred", "applications", "wallets"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors capitalize ${activeFilter === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          {selectedAppId && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary">
                Filtered by App: {selectedAppId}
              </span>
              <button
                onClick={() => setSelectedAppId(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline font-semibold"
              >
                View All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Mail View (Full Width) */}
      <div className="w-full space-y-4">
        {/* Detail View Mode */}
        {selectedMessage ? (
          <MessageDetailView
            message={selectedMessage}
            threadMessages={threadMessagesForDetail}
            onBack={() => setSelectedMessageId(null)}
            onOpenReply={handleOpenReply}
          />
        ) : (
          /* Mailbox List Mode */
          <div className="space-y-4">
            {/* Sent Statistics Banner */}
            {currentFolder === "sent" && !selectedAppId && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">
                    <Send className="size-4" />
                  </span>
                  <div>
                    <h4 className="font-display font-bold text-foreground text-sm">
                      Sent Messages Overview
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      All communications dispatched from your connected wallet identity ({activeWallet}).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="rounded-xl border border-border/80 bg-card px-3.5 py-1.5 text-center">
                    <span className="text-muted-foreground block text-[0.65rem] font-bold">
                      Messages Sent
                    </span>
                    <span className="font-display font-extrabold text-foreground text-base">
                      {sentStats.totalSent}
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-card px-3.5 py-1.5 text-center">
                    <span className="text-muted-foreground block text-[0.65rem] font-bold">
                      Unique Recipients
                    </span>
                    <span className="font-display font-extrabold text-primary text-base">
                      {sentStats.totalRecipients}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Bin Action Header */}
            {currentFolder === "bin" && !selectedAppId && (
              <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Trash2 className="size-4 text-destructive" />
                  <span>
                    Messages in Bin: <strong className="text-foreground">{binMessages.length}</strong>
                  </span>
                </div>

                {binMessages.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1.5 text-xs font-bold">
                        <Trash2 className="size-3.5" /> Empty Bin
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Empty Bin permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all {binMessages.length} message(s) in your bin. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            emptyBin();
                            toast.success("Bin Emptied");
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Empty Bin
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}

            {/* Bulk Action Controls */}
            {checkedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-primary/30 bg-accent/60 p-2.5 flex items-center justify-between text-xs"
              >
                <span className="font-bold text-foreground pl-2">
                  {checkedIds.size} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button onClick={handleBulkMarkRead} variant="outline" size="sm" className="text-xs font-semibold">
                    Mark as Read
                  </Button>
                  <Button onClick={handleBulkDelete} variant="destructive" size="sm" className="text-xs font-bold">
                    Delete Selected
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Messages Table Container */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Header Row */}
              <div className="flex items-center justify-between border-b border-border/60 bg-accent/30 px-4 py-2.5 text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-3">
                  <button onClick={toggleSelectAll} className="hover:text-foreground">
                    {checkedIds.size === filteredMessages.length && filteredMessages.length > 0 ? (
                      <CheckSquare className="size-4 text-primary" />
                    ) : (
                      <Square className="size-4" />
                    )}
                  </button>
                  <span>
                    {selectedAppId ? `${selectedAppId} History` : currentFolder.toUpperCase()} ({filteredMessages.length})
                  </span>
                </div>
                <span>Timestamp</span>
              </div>

              {/* Empty States */}
              {filteredMessages.length === 0 ? (
                <div className="p-12 text-center text-xs space-y-3">
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent text-primary">
                    {currentFolder === "starred" ? (
                      <Star className="size-6" />
                    ) : currentFolder === "sent" ? (
                      <Send className="size-6" />
                    ) : currentFolder === "drafts" ? (
                      <FileText className="size-6" />
                    ) : currentFolder === "bin" ? (
                      <Trash2 className="size-6" />
                    ) : (
                      <Inbox className="size-6" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-foreground text-base">
                      {currentFolder === "starred"
                        ? "No starred messages yet."
                        : currentFolder === "sent"
                          ? "You haven't sent any messages yet."
                          : currentFolder === "drafts"
                            ? "No saved drafts."
                            : currentFolder === "bin"
                              ? "Your bin is empty."
                              : "Your inbox is clear."}
                    </h4>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Messages bound to your wallet identity will appear here cleanly.
                    </p>
                  </div>
                  {currentFolder === "inbox" && (
                    <Button
                      onClick={() => setIsComposeOpen(true)}
                      variant="swarolipi"
                      size="sm"
                      className="gap-1.5 text-xs font-bold mt-2"
                    >
                      <Plus className="size-3.5" /> Compose Message
                    </Button>
                  )}
                </div>
              ) : (
                /* Message Rows List */
                <div className="divide-y divide-border/60">
                  {displayThreads.map((thread) => {
                    const msg = thread[0];
                    const isUnread = !msg.read && msg.status === "inbox";
                    const isChecked = checkedIds.has(msg.messageId);

                    const formattedTime = new Date(msg.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={msg.messageId}
                        onClick={() => handleMessageClick(msg)}
                        className={`group flex items-center justify-between gap-3 p-4 cursor-pointer transition-all duration-150 ${isUnread
                          ? "bg-accent/25 hover:bg-accent/60"
                          : "bg-card hover:bg-accent/40"
                          } ${isChecked ? "bg-primary/5" : ""}`}
                      >
                        {/* Left Controls & Sender Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            onClick={(e) => toggleCheck(msg.messageId, e)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {isChecked ? (
                              <CheckSquare className="size-4 text-primary" />
                            ) : (
                              <Square className="size-4" />
                            )}
                          </button>

                          {/* Star Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(msg.messageId);
                            }}
                            className="text-muted-foreground hover:text-amber-400 transition-colors"
                            title={msg.starred ? "Unstar" : "Star"}
                          >
                            <Star
                              className={`size-4 transition-transform group-hover:scale-110 ${msg.starred
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/60"
                                }`}
                            />
                          </button>

                          {/* Unread Indicator Dot */}
                          {isUnread && (
                            <span className="size-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] shrink-0" title="Unread" />
                          )}

                          {/* Sender Info */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 shrink-0 min-w-[140px]">
                              <span
                                className={`font-display text-xs truncate ${isUnread ? "font-extrabold text-foreground" : "font-semibold text-foreground/90"
                                  }`}
                              >
                                {msg.status === "sent" ? `To: ${msg.recipientAddress}` : msg.senderName}
                              </span>

                              {/* Trust Badges */}
                              {msg.senderTrustLevel === "verified_app" && (
                                <ShieldCheck className="size-3.5 text-primary shrink-0" title="Verified App" />
                              )}
                              {msg.senderTrustLevel === "verified_wallet" && (
                                <CheckCircle2 className="size-3.5 text-primary shrink-0" title="Verified Wallet" />
                              )}
                            </div>

                            {/* Subject & Preview Snippet */}
                            <div className="flex items-center gap-2 min-w-0 truncate text-xs">
                              <span
                                className={`truncate ${isUnread ? "font-bold text-foreground" : "font-normal text-muted-foreground"
                                  }`}
                              >
                                {msg.subject}
                              </span>
                              <span className="text-muted-foreground/60 hidden lg:inline">-</span>
                              <span className="text-muted-foreground/70 truncate hidden lg:inline font-sans">
                                {msg.body}
                              </span>

                              {thread.length > 1 && (
                                <span className="rounded-full bg-accent px-1.5 py-0.5 text-[0.6rem] font-bold text-primary shrink-0">
                                  {thread.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Meta & Quick Actions */}
                        <div className="flex items-center gap-3 shrink-0 text-xs">
                          {msg.attachments && msg.attachments.length > 0 && (
                            <Paperclip className="size-3.5 text-muted-foreground" title="Attachment" />
                          )}

                          <span className="font-mono text-[0.7rem] text-muted-foreground">
                            {formattedTime}
                          </span>

                          {/* Hover Actions */}
                          <div className="hidden group-hover:flex items-center gap-1">
                            {currentFolder === "bin" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  restoreMessage(msg.messageId);
                                  toast.success("Restored Message");
                                }}
                                className="p-1 text-muted-foreground hover:text-primary transition-colors"
                                title="Restore"
                              >
                                <RotateCcw className="size-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMessage(msg.messageId);
                                  toast.success("Moved to Bin");
                                }}
                                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
