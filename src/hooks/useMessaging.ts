import { useEffect, useState, useMemo } from "react";
import { useWallet } from "@/hooks/useWallet";
import {
  messagingService,
  Message,
  MailFolder,
  FilterType,
  DraftState,
  Attachment,
} from "@/services/messagingService";

export type { Message, MailFolder, FilterType, DraftState, Attachment };

export function useMessaging() {
  const { walletAddress } = useWallet();
  const activeWallet = walletAddress || "0x71A8...92F1";

  const [messages, setMessages] = useState<Message[]>(() =>
    messagingService.getMessages(activeWallet)
  );

  useEffect(() => {
    setMessages(messagingService.getMessages(activeWallet));

    const unsubscribe = messagingService.subscribe(() => {
      setMessages(messagingService.getMessages(activeWallet));
    });
    return unsubscribe;
  }, [activeWallet]);

  // Calculations for sidebar counts
  const inboxMessages = useMemo(
    () => messages.filter((m) => m.status === "inbox" && !m.deleted),
    [messages]
  );

  const unreadCount = useMemo(
    () => inboxMessages.filter((m) => !m.read).length,
    [inboxMessages]
  );

  const starredMessages = useMemo(
    () => messages.filter((m) => m.starred && !m.deleted),
    [messages]
  );

  const sentMessages = useMemo(
    () => messages.filter((m) => m.status === "sent" && !m.deleted),
    [messages]
  );

  const draftMessages = useMemo(
    () => messages.filter((m) => m.status === "draft" && !m.deleted),
    [messages]
  );

  const binMessages = useMemo(
    () => messages.filter((m) => m.status === "bin" || m.deleted),
    [messages]
  );

  // Sent stats computation (Section 12)
  const sentStats = useMemo(() => {
    const totalSent = sentMessages.length;
    const uniqueRecipients = new Set(sentMessages.map((m) => m.recipientAddress.toLowerCase())).size;
    return {
      totalSent,
      totalRecipients: uniqueRecipients,
    };
  }, [sentMessages]);

  return {
    messages,
    inboxMessages,
    starredMessages,
    sentMessages,
    draftMessages,
    binMessages,
    unreadCount,
    inboxCount: unreadCount, // Alias for badge display
    starredCount: starredMessages.length,
    sentCount: sentMessages.length,
    draftsCount: draftMessages.length,
    binCount: binMessages.length,
    sentStats,
    activeWallet,

    markAsRead: (messageId: string) => messagingService.markAsRead(activeWallet, messageId),
    markAsUnread: (messageId: string) => messagingService.markAsUnread(activeWallet, messageId),
    toggleStar: (messageId: string) => messagingService.toggleStar(activeWallet, messageId),
    deleteMessage: (messageId: string) => messagingService.deleteMessage(activeWallet, messageId),
    restoreMessage: (messageId: string) => messagingService.restoreMessage(activeWallet, messageId),
    deletePermanently: (messageId: string) => messagingService.deletePermanently(activeWallet, messageId),
    emptyBin: () => messagingService.emptyBin(activeWallet),
    sendMessage: (recipient: string, subject: string, body: string, attachments?: Attachment[], existingDraftId?: string) =>
      messagingService.sendMessage(activeWallet, recipient, subject, body, attachments, existingDraftId),
    saveDraft: (draft: DraftState) => messagingService.saveDraft(activeWallet, draft),
    discardDraft: (draftId: string) => messagingService.discardDraft(activeWallet, draftId),
  };
}
