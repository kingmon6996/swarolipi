import { useState, ReactNode } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Globe,
  Inbox as InboxIcon,
  Star,
  Send,
  FileText,
  Trash2,
  Mic,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { useMessaging, MailFolder } from "@/hooks/useMessaging";

export type NavTab = "inbox" | "profile" | "human" | "identity" | "authorized-apps" | "settings";

interface DashboardLayoutProps {
  activeTab: NavTab;
  activeFolder?: MailFolder;
  children: ReactNode;
}

const MAIN_NAV_ITEMS = [
  { id: "profile", label: "Profile", path: "/profile", icon: User },
  { id: "human", label: "Human Verification", path: "/human-verification", icon: Mic },
  { id: "identity", label: "Identity Verification", path: "/identity-verification", icon: FileCheck },
  { id: "authorized-apps", label: "Authorized Apps", path: "/authorized-apps", icon: Globe },
];

const MOBILE_NAV_ITEMS = [
  { id: "inbox", label: "Inbox", path: "/inbox", icon: InboxIcon },
  { id: "profile", label: "Profile", path: "/profile", icon: User },
  { id: "human", label: "Verification", path: "/human-verification", icon: Mic },
  { id: "authorized-apps", label: "Apps", path: "/authorized-apps", icon: Globe },
  { id: "settings", label: "Settings", path: "/settings", icon: Settings },
];

export function DashboardLayout({ activeTab, activeFolder = "inbox", children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { walletAddress } = useWallet();
  const { profileName, profileImage, humanVerified, identityVerified } = useProfile();
  const { unreadCount, starredCount, sentCount, draftsCount, binCount } = useMessaging();
  const location = useLocation();

  const isInboxPage = location.pathname.startsWith("/inbox") || activeTab === "inbox";

  const MAILBOX_NAV_ITEMS: { id: MailFolder; label: string; path: string; icon: any; count: number }[] = [
    { id: "inbox", label: "Inbox", path: "/inbox?folder=inbox", icon: InboxIcon, count: unreadCount },
    { id: "starred", label: "Starred", path: "/inbox?folder=starred", icon: Star, count: starredCount },
    { id: "sent", label: "Sent", path: "/inbox?folder=sent", icon: Send, count: sentCount },
    { id: "drafts", label: "Drafts", path: "/inbox?folder=drafts", icon: DraftsIcon, count: draftsCount },
    { id: "bin", label: "Bin", path: "/inbox?folder=bin", icon: Trash2, count: binCount },
  ];

  function DraftsIcon(props: any) {
    return <FileText {...props} />;
  }

  const initialLetter = profileName ? profileName.charAt(0).toUpperCase() : "V";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="sticky top-0 h-screen shrink-0 hidden flex-col border-r border-purple-500/15 bg-card/60 backdrop-blur-xl md:flex z-30 overflow-y-auto"
      >
        {/* Sidebar Header */}
        <div className="flex h-20 items-center justify-between px-5 border-b border-purple-500/15">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-700 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] border border-white/20">
              <ShieldCheck className="size-5" />
            </span>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-display text-lg font-extrabold tracking-[0.16em] whitespace-nowrap"
                >
                  VOXAUTH
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="grid size-7 place-items-center rounded-lg border border-purple-500/15 bg-card/80 text-muted-foreground transition-colors hover:border-purple-500/30 hover:text-foreground"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 space-y-4 p-3 overflow-y-auto">
          <div className="space-y-1">
            {MAIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !isInboxPage;
              const isVerified =
                (item.id === "human" && humanVerified) ||
                (item.id === "identity" && identityVerified);

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className="relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200"
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktopActiveTab"
                      className="absolute inset-0 rounded-xl border border-purple-500/30 bg-purple-950/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 grid size-5 place-items-center ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    <Icon className="size-5" />
                  </span>
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`relative z-10 whitespace-nowrap flex-1 flex items-center justify-between gap-2 ${isActive ? "text-foreground font-bold" : "text-muted-foreground"
                          }`}
                      >
                        <span>{item.label}</span>
                        {isVerified && (
                          <span className="size-2 rounded-full bg-violet-400 shadow-[0_0_6px_#a855f7]" title="Verified" />
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>

          {/* USER REQUEST: Mailboxes directly present below Authorized Apps */}
          <div className="pt-2 border-t border-border/60 space-y-1">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="block px-3 text-[0.65rem] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5"
                >
                  Mailboxes
                </motion.span>
              )}
            </AnimatePresence>

            {MAILBOX_NAV_ITEMS.map((box) => {
              const Icon = box.icon;
              const isFolderActive = isInboxPage && activeFolder === box.id;

              return (
                <Link
                  key={box.id}
                  to={box.path}
                  className={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200 ${isFolderActive
                    ? "bg-accent/90 text-primary font-bold shadow-sm"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                    }`}
                >
                  {isFolderActive && (
                    <motion.div
                      layoutId="desktopActiveTab"
                      className="absolute inset-0 rounded-xl border border-purple-500/30 bg-purple-950/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 grid size-5 place-items-center ${isFolderActive ? "text-primary" : "text-muted-foreground"}`}>
                    <Icon className="size-4" />
                  </span>

                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`relative z-10 whitespace-nowrap flex-1 flex items-center justify-between gap-2 ${isFolderActive ? "text-foreground font-bold" : "text-muted-foreground"
                          }`}
                      >
                        <span>{box.label}</span>
                        {box.count > 0 && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${isFolderActive
                              ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                              : box.id === "inbox"
                                ? "bg-purple-950/50 text-purple-300 border border-purple-500/30"
                                : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {box.count}
                          </span>
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {collapsed && box.count > 0 && (
                    <span className="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-foreground shadow-[0_0_8px_rgba(139,92,246,0.5)]">
                      {box.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Settings Navigation ONLY */}
        <div className="border-t border-purple-500/15 p-3">
          <Link
            to="/settings"
            className="relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200"
          >
            {activeTab === "settings" && (
              <motion.div
                layoutId="desktopActiveTab"
                className="absolute inset-0 rounded-xl border border-purple-500/30 bg-purple-950/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className={`relative z-10 grid size-5 place-items-center ${activeTab === "settings" ? "text-primary" : "text-muted-foreground"}`}>
              <Settings className="size-5" />
            </span>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`relative z-10 whitespace-nowrap flex-1 flex items-center justify-between gap-2 ${activeTab === "settings" ? "text-foreground font-bold" : "text-muted-foreground"
                    }`}
                >
                  <span>Settings</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </motion.aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Responsive Header */}
        <header className="sticky top-0 z-20 shrink-0 flex h-20 items-center justify-between border-b border-purple-500/15 bg-background/80 px-5 sm:px-8 backdrop-blur-xl">
          <div>
            <span className="text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-primary">
              {isInboxPage
                ? `Wallet Messaging • ${activeFolder.toUpperCase()}`
                : activeTab === "profile"
                  ? "Digital Identity"
                  : activeTab === "human"
                    ? "Voice Verification"
                    : activeTab === "identity"
                      ? "Document Verification"
                      : activeTab === "authorized-apps"
                        ? "Connected Applications"
                        : "Account Settings"}
            </span>
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl capitalize">
              {isInboxPage
                ? `${activeFolder} Mailbox`
                : activeTab === "profile"
                  ? "Your Digital Identity"
                  : activeTab === "human"
                    ? "Human Verification"
                    : activeTab === "identity"
                      ? "Identity Verification"
                      : activeTab === "authorized-apps"
                        ? "Authorized Applications"
                        : "Settings & Security"}
            </h1>
          </div>

          {/* User Profile Avatar Badge */}
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="relative grid size-9 place-items-center overflow-hidden rounded-full border-2 border-purple-500/35 bg-purple-950/40 font-bold text-sm text-purple-200 shadow-[0_0_15px_rgba(139,92,246,0.25)] transition-transform hover:scale-105"
              title={profileName || "Digital Identity"}
            >
              {profileImage ? (
                <img src={profileImage} alt={profileName || "Avatar"} className="size-full object-cover" />
              ) : (
                initialLetter
              )}
            </Link>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 pb-28 md:pb-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {/* ================= MOBILE FLOATING DOCK ================= */}
      <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-3 md:hidden">
        <motion.nav
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          className="relative flex items-center gap-1 rounded-full border border-purple-500/25 bg-[#0b0b18]/90 p-1.5 shadow-[0_0_30px_rgba(139,92,246,0.25)] backdrop-blur-xl max-w-full overflow-x-auto"
        >
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isInboxPage ? item.id === "inbox" : activeTab === item.id;
            const isInbox = item.id === "inbox";

            return (
              <Link
                key={item.id}
                to={item.path}
                className="relative flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 grid size-4 place-items-center ${isActive ? "text-white" : "text-muted-foreground"}`}>
                  <Icon className="size-4" />
                </span>
                <span className={`relative z-10 text-[0.7rem] ${isActive ? "text-white" : "text-muted-foreground"}`}>
                  {item.label}
                </span>

                {isInbox && unreadCount > 0 && (
                  <span className={`relative z-10 grid size-4 place-items-center rounded-full text-[0.6rem] font-bold ${isActive ? "bg-white text-purple-900" : "bg-primary text-primary-foreground"
                    }`}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </motion.nav>
      </div>
    </div>
  );
}
