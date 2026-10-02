export type SenderType = "application" | "wallet";
export type TrustLevel = "verified_app" | "verified_wallet" | "unknown_wallet";
export type MailFolder = "inbox" | "starred" | "sent" | "drafts" | "bin";
export type FilterType = "all" | "unread" | "starred" | "applications" | "wallets";

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface MessageAction {
  label: string;
  type?: "navigate" | "verify_human" | "verify_identity" | "authorize_app";
  link?: string;
}

export interface Message {
  messageId: string;
  threadId: string;
  senderType: SenderType;
  senderAddress: string;
  senderName: string;
  senderApplicationId?: string;
  senderTrustLevel: TrustLevel;
  recipientAddress: string;
  recipientName?: string;
  subject: string;
  body: string;
  status: "inbox" | "sent" | "draft" | "bin";
  read: boolean;
  starred: boolean;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;
  attachments?: Attachment[];

  // Application specific fields
  applicationId?: string;
  messageType?: "verification_request" | "verification_status" | "general_notice" | "dapp_alert";
  action?: MessageAction;
  metadata?: Record<string, any>;
}

export interface DraftState {
  draftId?: string;
  recipientAddress: string;
  subject: string;
  body: string;
  attachments?: Attachment[];
}

export type MessagingListener = () => void;

const DEFAULT_CONNECTED_WALLET = "0x71A8...92F1";

export function getInitialSeedMessages(userWallet: string): Message[] {
  const now = Date.now();
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  const targetWallet = userWallet || DEFAULT_CONNECTED_WALLET;

  return [
    {
      messageId: "msg-seed-1",
      threadId: "thread-votedao",
      senderType: "application",
      senderAddress: "0x81A4...72BC",
      senderName: "VoteDAO",
      senderApplicationId: "demo-votedao",
      senderTrustLevel: "verified_app",
      recipientAddress: targetWallet,
      subject: "Human verification required",
      body: "VoteDAO requires proof that the connected wallet has completed human verification to participate in the upcoming Season 4 Governance Ballot.",
      status: "inbox",
      read: false,
      starred: false,
      deleted: false,
      createdAt: now - 25 * MINUTE,
      updatedAt: now - 25 * MINUTE,
      applicationId: "demo-votedao",
      messageType: "verification_request",
      action: {
        label: "Review Verification",
        type: "verify_human",
        link: "/human-verification",
      },
    },
    {
      messageId: "msg-seed-2",
      threadId: "thread-voxauth-system",
      senderType: "application",
      senderAddress: "0x0000...0000",
      senderName: "VoxAuth Verification Service",
      senderApplicationId: "voxauth-identity",
      senderTrustLevel: "verified_app",
      recipientAddress: targetWallet,
      subject: "Identity verification completed",
      body: "Your ZK identity verification credential has been successfully generated and recorded. Zero-knowledge identity proofs are now enabled for all authorized dApps.",
      status: "inbox",
      read: false,
      starred: true,
      deleted: false,
      createdAt: now - 2 * HOUR,
      updatedAt: now - 2 * HOUR,
      applicationId: "voxauth-identity",
      messageType: "verification_status",
      action: {
        label: "View Credentials",
        type: "verify_identity",
        link: "/identity-verification",
      },
    },
    {
      messageId: "msg-seed-3",
      threadId: "thread-marketplace",
      senderType: "application",
      senderAddress: "0x99B3...11D9",
      senderName: "Marketplace dApp",
      senderApplicationId: "marketplace-dapp",
      senderTrustLevel: "verified_app",
      recipientAddress: targetWallet,
      subject: "Welcome to VoxAuth Protocol",
      body: `Welcome to the VoxAuth decentralized identity network! Your wallet identity (${targetWallet}) is now connected. Explore active authorized applications and verification signals.`,
      status: "inbox",
      read: true,
      starred: false,
      deleted: false,
      createdAt: now - 1 * DAY,
      updatedAt: now - 1 * DAY,
      applicationId: "marketplace-dapp",
      messageType: "general_notice",
    },
    {
      messageId: "msg-seed-4",
      threadId: "thread-peer-81a4",
      senderType: "wallet",
      senderAddress: "0x81A4...72BC",
      senderName: "0x81A4...72BC",
      senderTrustLevel: "verified_wallet",
      recipientAddress: targetWallet,
      subject: "Hello from peer wallet",
      body: "Hello! Confirming our peer identity verification exchange on VoxAuth. Let me know once you submit your vote on VoteDAO.",
      status: "inbox",
      read: true,
      starred: true,
      deleted: false,
      createdAt: now - 3 * DAY,
      updatedAt: now - 3 * DAY,
    },
    {
      messageId: "msg-seed-5",
      threadId: "thread-peer-e934",
      senderType: "wallet",
      senderAddress: "0xE934...124A",
      senderName: "0xE934...124A",
      senderTrustLevel: "unknown_wallet",
      recipientAddress: targetWallet,
      subject: "Inquiry regarding ZK credential sharing",
      body: "Hello, I noticed your wallet identity active on the governance portal. Would love to discuss joint identity verification pools.",
      status: "inbox",
      read: false,
      starred: false,
      deleted: false,
      createdAt: now - 4 * DAY,
      updatedAt: now - 4 * DAY,
    },
    {
      messageId: "msg-seed-sent-1",
      threadId: "thread-votedao",
      senderType: "wallet",
      senderAddress: targetWallet,
      senderName: targetWallet,
      senderTrustLevel: "verified_wallet",
      recipientAddress: "0x81A4...72BC",
      recipientName: "VoteDAO",
      subject: "Verification status confirmation",
      body: "I have updated my voice human verification signal on VoxAuth. Please re-verify my wallet access badge.",
      status: "sent",
      read: true,
      starred: false,
      deleted: false,
      createdAt: now - 1 * DAY,
      updatedAt: now - 1 * DAY,
    },
    {
      messageId: "msg-seed-sent-2",
      threadId: "thread-peer-81a4",
      senderType: "wallet",
      senderAddress: targetWallet,
      senderName: targetWallet,
      senderTrustLevel: "verified_wallet",
      recipientAddress: "0x81A4...72BC",
      recipientName: "0x81A4...72BC",
      subject: "Re: Hello from peer wallet",
      body: "Thanks! Just completed the voice human verification check.",
      status: "sent",
      read: true,
      starred: false,
      deleted: false,
      createdAt: now - 2 * DAY,
      updatedAt: now - 2 * DAY,
    },
    {
      messageId: "msg-seed-draft-1",
      threadId: "thread-draft-1",
      senderType: "wallet",
      senderAddress: targetWallet,
      senderName: targetWallet,
      senderTrustLevel: "verified_wallet",
      recipientAddress: "0x3F91...991A",
      recipientName: "0x3F91...991A",
      subject: "Re: Governance proposal voting delegate",
      body: "Drafting reply regarding delegate weight assignment and human verification proof submission...",
      status: "draft",
      read: true,
      starred: false,
      deleted: false,
      createdAt: now - 5 * MINUTE,
      updatedAt: now - 5 * MINUTE,
    },
    {
      messageId: "msg-seed-bin-1",
      threadId: "thread-spam-1",
      senderType: "wallet",
      senderAddress: "0x1111...2222",
      senderName: "SpamDAO",
      senderTrustLevel: "unknown_wallet",
      recipientAddress: targetWallet,
      subject: "Unsolicited token offer",
      body: "Click here to claim free governance tokens.",
      status: "bin",
      read: true,
      starred: false,
      deleted: true,
      createdAt: now - 7 * DAY,
      updatedAt: now - 7 * DAY,
    },
  ];
}

class MessagingService {
  private listeners: Set<MessagingListener> = new Set();

  public subscribe(listener: MessagingListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private getStorageKey(walletAddress: string | null): string {
    const walletKey = (walletAddress || DEFAULT_CONNECTED_WALLET).toLowerCase();
    return `voxauth_messages_${walletKey}`;
  }

  public getMessages(walletAddress: string | null): Message[] {
    if (typeof window === "undefined") return [];
    const key = this.getStorageKey(walletAddress);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not load messages:", e);
    }

    // Initialize with seed data if not present
    const seeds = getInitialSeedMessages(walletAddress || DEFAULT_CONNECTED_WALLET);
    try {
      localStorage.setItem(key, JSON.stringify(seeds));
    } catch (e) {
      console.warn("Could not save initial seed messages:", e);
    }
    return seeds;
  }

  public saveMessages(walletAddress: string | null, messages: Message[]): void {
    if (typeof window === "undefined") return;
    const key = this.getStorageKey(walletAddress);
    try {
      localStorage.setItem(key, JSON.stringify(messages));
      this.notify();
    } catch (e) {
      console.warn("Could not save messages:", e);
    }
  }

  public markAsRead(walletAddress: string | null, messageId: string): void {
    const messages = this.getMessages(walletAddress);
    const updated = messages.map((msg) =>
      msg.messageId === messageId ? { ...msg, read: true, updatedAt: Date.now() } : msg
    );
    this.saveMessages(walletAddress, updated);
  }

  public markAsUnread(walletAddress: string | null, messageId: string): void {
    const messages = this.getMessages(walletAddress);
    const updated = messages.map((msg) =>
      msg.messageId === messageId ? { ...msg, read: false, updatedAt: Date.now() } : msg
    );
    this.saveMessages(walletAddress, updated);
  }

  public toggleStar(walletAddress: string | null, messageId: string): void {
    const messages = this.getMessages(walletAddress);
    const updated = messages.map((msg) =>
      msg.messageId === messageId ? { ...msg, starred: !msg.starred, updatedAt: Date.now() } : msg
    );
    this.saveMessages(walletAddress, updated);
  }

  public deleteMessage(walletAddress: string | null, messageId: string): void {
    const messages = this.getMessages(walletAddress);
    const updated = messages.map((msg) =>
      msg.messageId === messageId
        ? { ...msg, status: "bin" as const, deleted: true, updatedAt: Date.now() }
        : msg
    );
    this.saveMessages(walletAddress, updated);
  }

  public restoreMessage(walletAddress: string | null, messageId: string): void {
    const messages = this.getMessages(walletAddress);
    const updated = messages.map((msg) => {
      if (msg.messageId === messageId) {
        // Restore to sent if recipient was another wallet, else inbox
        const newStatus = msg.senderAddress.toLowerCase() === (walletAddress || DEFAULT_CONNECTED_WALLET).toLowerCase() ? "sent" : "inbox";
        return { ...msg, status: newStatus, deleted: false, updatedAt: Date.now() };
      }
      return msg;
    });
    this.saveMessages(walletAddress, updated);
  }

  public deletePermanently(walletAddress: string | null, messageId: string): void {
    const messages = this.getMessages(walletAddress);
    const updated = messages.filter((msg) => msg.messageId !== messageId);
    this.saveMessages(walletAddress, updated);
  }

  public emptyBin(walletAddress: string | null): void {
    const messages = this.getMessages(walletAddress);
    const updated = messages.filter((msg) => msg.status !== "bin" && !msg.deleted);
    this.saveMessages(walletAddress, updated);
  }

  public sendMessage(
    walletAddress: string | null,
    recipient: string,
    subject: string,
    body: string,
    attachments?: Attachment[],
    existingDraftId?: string
  ): Message {
    const sender = walletAddress || DEFAULT_CONNECTED_WALLET;
    const now = Date.now();
    const messages = this.getMessages(walletAddress);

    // If sending an existing draft, remove draft first
    const filtered = existingDraftId
      ? messages.filter((m) => m.messageId !== existingDraftId)
      : messages;

    const newMessage: Message = {
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      threadId: `thread-${recipient.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`,
      senderType: "wallet",
      senderAddress: sender,
      senderName: sender,
      senderTrustLevel: "verified_wallet",
      recipientAddress: recipient,
      subject: subject || "(no subject)",
      body,
      status: "sent",
      read: true,
      starred: false,
      deleted: false,
      createdAt: now,
      updatedAt: now,
      attachments,
    };

    this.saveMessages(walletAddress, [newMessage, ...filtered]);
    return newMessage;
  }

  public saveDraft(
    walletAddress: string | null,
    draft: DraftState
  ): Message {
    const sender = walletAddress || DEFAULT_CONNECTED_WALLET;
    const now = Date.now();
    const messages = this.getMessages(walletAddress);

    if (draft.draftId) {
      // Update existing draft
      const updated = messages.map((m) => {
        if (m.messageId === draft.draftId) {
          return {
            ...m,
            recipientAddress: draft.recipientAddress,
            subject: draft.subject,
            body: draft.body,
            attachments: draft.attachments,
            updatedAt: now,
          };
        }
        return m;
      });
      this.saveMessages(walletAddress, updated);
      return updated.find((m) => m.messageId === draft.draftId)!;
    } else {
      // Create new draft
      const newDraft: Message = {
        messageId: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        threadId: `thread-draft-${Date.now()}`,
        senderType: "wallet",
        senderAddress: sender,
        senderName: sender,
        senderTrustLevel: "verified_wallet",
        recipientAddress: draft.recipientAddress,
        subject: draft.subject || "(no subject)",
        body: draft.body,
        status: "draft",
        read: true,
        starred: false,
        deleted: false,
        createdAt: now,
        updatedAt: now,
        attachments: draft.attachments,
      };
      this.saveMessages(walletAddress, [newDraft, ...messages]);
      return newDraft;
    }
  }

  public discardDraft(walletAddress: string | null, draftId: string): void {
    if (!draftId) return;
    this.deletePermanently(walletAddress, draftId);
  }
}

export const messagingService = new MessagingService();
