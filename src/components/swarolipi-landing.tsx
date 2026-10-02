import Dither from "./Dither";
import { useEffect, useState, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  KeyRound,
  Lock,
  Menu,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
  Zap,
  CheckCircle2,
  FileCheck,
  Layers,
  FileKey,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { WalletConnectModal } from "@/components/wallet-connect-modal";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { formatAddress } from "@/components/WalletStatus";
import { AnimatedText } from "@/components/animated-text";
import { ScrollReveal, SectionReveal, ParallaxElement } from "@/components/scroll-reveal";
import { ShinyButton } from "@/components/ui/shiny-button";

const navItems = ["Product", "How It Works", "Security", "Developers"];

const ecosystemCompanies = [
  { name: "VoteDAO", category: "Governance & Voting", icon: "🏛️", domain: "votedao.eth" },
  { name: "Uniswap", category: "DeFi Protocol", icon: "🦄", domain: "uniswap.org" },
  { name: "Aave", category: "Lending Market", icon: "👻", domain: "aave.com" },
  { name: "Chainlink", category: "Oracle Network", icon: "⬡", domain: "chain.link" },
  { name: "Polygon", category: "L2 Scaling", icon: "💜", domain: "polygon.technology" },
  { name: "Arbitrum", category: "L2 Rollup", icon: "💙", domain: "arbitrum.io" },
  { name: "Optimism", category: "Collective L2", icon: "🔴", domain: "optimism.io" },
  { name: "Solana", category: "L1 Network", icon: "⚡", domain: "solana.com" },
  { name: "Lens Protocol", category: "Social Graph", icon: "🌿", domain: "lens.xyz" },
  { name: "Farcaster", category: "Social Protocol", icon: "🔮", domain: "farcaster.xyz" },
  { name: "ENS", category: "Identity Domains", icon: "🌐", domain: "ens.domains" },
  { name: "Safe", category: "Multi-Sig Vaults", icon: "🔒", domain: "safe.global" },
  { name: "Gitcoin", category: "Public Goods Grants", icon: "🟢", domain: "gitcoin.co" },
  { name: "OpenSea", category: "Digital Assets", icon: "⛵", domain: "opensea.io" },
  { name: "Compound", category: "Money Market", icon: "📈", domain: "compound.finance" },
  { name: "Stargate", category: "Cross-Chain Liquidity", icon: "✨", domain: "stargate.finance" },
];

const cards = [
  {
    number: "01",
    title: "Wallet Ownership",
    body: "Prove that the user controls the wallet using zero-knowledge identity anchors without revealing sensitive keys.",
    icon: KeyRound,
  },
  {
    number: "02",
    title: "Human Verification",
    body: "Establish a reusable human-verification signal through dynamic voice challenges and liveness verification.",
    icon: UserCheck,
  },
  {
    number: "03",
    title: "Authorization Layer",
    body: "Allow third-party applications to consume verified identity status seamlessly with explicit user consent.",
    icon: Zap,
  },
];

const securityPoints = [
  {
    title: "No Custody",
    body: "Swarolipi never holds or requests your funds, assets, or account management capabilities.",
    icon: Lock,
  },
  {
    title: "No Seed Phrases",
    body: "Your mnemonic seed phrases and private keys remain strictly on your local device.",
    icon: FileKey,
  },
  {
    title: "No Private Keys",
    body: "Only public addresses and cryptographic challenge signatures are used for ownership verification.",
    icon: ShieldCheck,
  },
  {
    title: "Independent Layers",
    body: "Wallet custody, human verification, and application authorization operate as decoupled security tiers.",
    icon: Layers,
  },
];

export function SwarolipiLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const drawerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<(HTMLElement | null)[]>([]);

  const { walletAddress, isConnected } = useWallet();
  const { profileName, profileImage } = useProfile();
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  // Lenis Smooth Scroll Setup
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // GSAP Sideways Drawer Animation
  const openDrawer = () => {
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (!drawerRef.current || !overlayRef.current) {
      setDrawerOpen(false);
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => setDrawerOpen(false),
    });
    tl.to(drawerRef.current, { xPercent: 100, duration: 0.35, ease: "power3.in" })
      .to(overlayRef.current, { opacity: 0, duration: 0.25, ease: "power2.in" }, "<");
  };

  useEffect(() => {
    if (drawerOpen && drawerRef.current && overlayRef.current) {
      const validItems = menuItemsRef.current.filter(Boolean);
      const tl = gsap.timeline();
      tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" })
        .fromTo(drawerRef.current, { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: "power3.out" }, "<")
        .fromTo(
          validItems,
          { opacity: 0, x: 40 },
          { opacity: 1, x: 0, duration: 0.35, stagger: 0.08, ease: "power2.out" },
          "-=0.2"
        );
    }
  }, [drawerOpen]);

  // Parallax Hooks
  const { scrollYProgress } = useScroll();

  const heroY = useTransform(
    scrollYProgress,
    [0, 0.3],
    [0, reduced ? 0 : 50]
  );

  const bgOrbY1 = useTransform(
    scrollYProgress,
    [0, 0.4],
    [0, reduced ? 0 : -90]
  );

  const bgOrbY2 = useTransform(
    scrollYProgress,
    [0, 0.4],
    [0, reduced ? 0 : 70]
  );

  const openWallet = () => {
    closeDrawer();
    setWalletOpen(true);
  };

  const goToDashboard = () => {
    closeDrawer();
    navigate({ to: "/dashboard" });
  };

  const goToDeveloperDemo = () => {
    closeDrawer();
    navigate({ to: "/developer/demo" });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    const onMouseMove = (e: MouseEvent) => {
      if (!reduced) {
        setMousePos({
          x: (e.clientX / window.innerWidth - 0.5) * 24,
          y: (e.clientY / window.innerHeight - 0.5) * 24,
        });
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [reduced]);

  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ================= TOP HEADER (Visible when at top) ================= */}
      <motion.header
        animate={{
          y: scrolled ? -100 : 0,
          opacity: scrolled ? 0 : 1,
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="fixed inset-x-0 top-0 z-40 border-b border-transparent bg-transparent transition-all duration-500"
      >
        <nav className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 sm:px-8" aria-label="Main navigation">
          <a href="#top" className="flex items-center gap-2" aria-label="Swarolipi home">
            <img src="/brand.png" alt="Swarolipi" className="h-[120px] w-auto object-contain drop-shadow-[0_0_12px_rgba(139,92,246,0.4)]" />
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {isConnected && walletAddress ? (
              <Button variant="swarolipi" size="sm" onClick={goToDashboard} className="gap-2 text-xs">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={profileName || "Profile"}
                    className="size-5 rounded-full object-cover border border-primary-foreground/30"
                  />
                ) : (
                  <span className="grid size-5 place-items-center rounded-full bg-primary-foreground/20 text-[0.65rem] font-extrabold text-primary-foreground border border-primary-foreground/30">
                    {profileName ? profileName.charAt(0).toUpperCase() : "V"}
                  </span>
                )}
                <span>Dashboard</span>
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button variant="swarolipi" className="hidden md:inline-flex" onClick={openWallet}>
                Connect Wallet <ArrowRight />
              </Button>
            )}
          </div>
        </nav>
      </motion.header>

      {/* ================= CIRCULAR BLACK HAMBURGER BUTTON (Visible when scrolled) ================= */}
      <motion.button
        initial={false}
        animate={{
          scale: scrolled ? 1 : 0,
          opacity: scrolled ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        onClick={openDrawer}
        className={`fixed top-6 right-[39px] z-50 flex size-14 items-center justify-center rounded-full bg-black/90 border border-purple-500/40 shadow-[0_0_30px_rgba(139,92,246,0.6)] backdrop-blur-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer group ${scrolled ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-label="Open menu drawer"
      >
        <img
          src="/icon.png"
          alt="Swarolipi Icon"
          className="size-8 object-contain transition-transform duration-300 group-hover:rotate-12"
        />
        <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border border-white/20 text-white shadow-sm">
          <Menu className="size-3" />
        </span>
      </motion.button>

      {/* ================= GSAP SIDEWAYS MENU DRAWER ================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop Overlay */}
          <div
            ref={overlayRef}
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity cursor-pointer"
          />

          {/* Sideways Drawer Panel */}
          <div
            ref={drawerRef}
            className="relative z-10 flex h-full w-full max-w-md flex-col justify-between border-l border-purple-500/20 bg-background/95 p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-purple-500/15 pb-6">
              <a href="#top" onClick={closeDrawer} className="flex items-center gap-2">
                <img src="/brand.png" alt="Swarolipi" className="h-10 w-auto object-contain" />
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeDrawer}
                className="rounded-full border border-purple-500/20 text-muted-foreground hover:bg-purple-950/40 hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </Button>
            </div>

            {/* Nav Links Staggered */}
            <div className="my-auto space-y-6 py-8">
              <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-primary">
                Navigation
              </p>
              {navItems.map((item, idx) => (
                <a
                  key={item}
                  ref={(el) => { menuItemsRef.current[idx] = el; }}
                  href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
                  onClick={closeDrawer}
                  className="group flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-2xl font-extrabold text-foreground transition-all hover:border-purple-500/30 hover:bg-purple-950/30 hover:text-purple-300"
                >
                  <span>{item}</span>
                  <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-purple-300" />
                </a>
              ))}
            </div>

            {/* Footer Action inside Drawer */}
            <div
              ref={(el) => { menuItemsRef.current[navItems.length] = el; }}
              className="border-t border-purple-500/15 pt-6 space-y-3"
            >
              {isConnected && walletAddress ? (
                <Button variant="swarolipi" className="w-full gap-2 text-sm py-6" onClick={goToDashboard}>
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={profileName || "Profile"}
                      className="size-6 rounded-full object-cover border border-primary-foreground/30"
                    />
                  ) : (
                    <span className="grid size-6 place-items-center rounded-full bg-primary-foreground/20 text-xs font-extrabold text-primary-foreground border border-primary-foreground/30">
                      {profileName ? profileName.charAt(0).toUpperCase() : "V"}
                    </span>
                  )}
                  <span>Go to Dashboard</span>
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button variant="swarolipi" className="w-full gap-2 text-sm py-6" onClick={openWallet}>
                  Connect Wallet <ArrowRight className="size-4" />
                </Button>
              )}
              <p className="text-center text-[0.7rem] font-medium text-muted-foreground">
                No custody · No seed phrases · No private keys
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= HERO SECTION WITH DITHER BACKGROUND ================= */}
      <section id="top" className="hero relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pb-24 pt-36 text-center sm:px-8">
        {/* ── LAYER 0: Dither WebGL animated background ── */}
        <div className="hero-background absolute inset-0 z-0 w-full h-full pointer-events-none">
          <Dither
            waveColor={[0.6588235294117647, 0.3333333333333333, 0.9686274509803922]}
            disableAnimation={false}
            enableMouseInteraction
            mouseRadius={0.3}
            colorNum={4}
            waveAmplitude={0.26}
            waveFrequency={3}
            waveSpeed={0.06}
            backgroundColor={[0, 0, 0]}
          />
        </div>

        {/* ── LAYER 1: Minimal vignette — keep dither pixel texture visible ── */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* ── LAYER 10: Hero content ── */}
        <div className="hero-content relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center">
          {/* Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.55 }}
            className="mx-auto max-w-4xl text-center text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Every wallet has a story. Not every story has a human.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg"
          >
            Wallet-based authentication and privacy-conscious human verification for decentralized applications.
          </motion.p>

          {/* CTA Buttons with Subtle Physics */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            className="mt-8 flex w-full max-w-md flex-col justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row"
          >
            {isConnected && walletAddress ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" variant="swarolipi" onClick={goToDashboard} className="gap-2 shadow-md w-full sm:w-auto">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={profileName || "Profile"}
                      className="size-5 rounded-full object-cover border border-primary-foreground/30"
                    />
                  ) : (
                    <span className="grid size-5 place-items-center rounded-full bg-primary-foreground/20 text-[0.65rem] font-extrabold text-primary-foreground border border-primary-foreground/30">
                      {profileName ? profileName.charAt(0).toUpperCase() : "V"}
                    </span>
                  )}
                  <span>Go to Dashboard</span>
                  <ArrowRight />
                </Button>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" variant="swarolipi" onClick={openWallet} className="gap-2 shadow-md w-full sm:w-auto">
                  Connect Wallet <ArrowRight />
                </Button>
              </motion.div>
            )}
            <ShinyButton onClick={goToDeveloperDemo} className="w-full sm:w-auto">
              Explore Developer Platform
            </ShinyButton>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-5 text-xs font-medium text-muted-foreground"
          >
            No custody · No seed phrases · No private keys
          </motion.p>
        </div>

        {/* Ecosystem Company Marquee */}
        <div className="relative z-10 w-full mt-6">
          <EcosystemCompanyMarquee />
        </div>
      </section>

      {/* ================= EDITORIAL ABOUT SECTION ================= */}
      <SectionReveal id="product" className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">About Swarolipi</span>
          </div>

          <h2 className="mx-auto max-w-4xl font-display text-3xl font-extrabold leading-tight sm:text-6xl text-foreground">
            <AnimatedText
              text="Your wallet is your digital identity."
              mode="line"
              delay={0.1}
            />
            <AnimatedText
              text="Swarolipi adds the human layer."
              mode="line"
              delay={0.25}
              className="bg-gradient-to-r from-indigo-300 via-purple-300 to-violet-400 bg-clip-text text-transparent mt-1"
            />
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Decoupled cryptographic proof that connects wallet ownership with verified human signals without surrendering user custody or exposing sensitive PII.
          </p>

          <div className="mt-16 grid gap-6 text-left md:grid-cols-3">
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <ScrollReveal
                  key={card.number}
                  direction="up"
                  delay={i * 0.12}
                  distance={35}
                >
                  <motion.article
                    whileHover={reduced ? {} : { y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="group relative h-full overflow-hidden rounded-2xl border border-purple-500/15 bg-card/60 backdrop-blur-xl p-7 shadow-sm transition-all duration-300 hover:border-purple-500/40 hover:bg-card/85 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.25)] sm:p-9"
                  >
                    <div className="mb-8 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary">{card.number}</span>
                      <span className="grid size-11 place-items-center rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-300 transition-transform duration-300 group-hover:scale-110 group-hover:border-purple-400/40 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        <Icon className="size-5" />
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-foreground">{card.title}</h3>
                    <p className="mt-3 leading-relaxed text-sm text-muted-foreground">{card.body}</p>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </motion.article>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </SectionReveal>

      {/* ================= PRODUCT TRANSITION SECTION ================= */}
      <section id="how-it-works" className="relative px-5 py-28 text-center sm:px-8 sm:py-36 overflow-hidden">
        <ParallaxElement speed={0.25} className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-60">
          <div className="size-[650px] rounded-full bg-gradient-to-tr from-indigo-600/25 via-purple-600/20 to-violet-500/20 blur-[130px]" />
        </ParallaxElement>

        <div className="mx-auto max-w-4xl">
          <ScrollReveal direction="up" distance={25}>
            <AnimatedText
              text="Verify once."
              mode="line"
              className="font-display text-4xl font-extrabold leading-none tracking-tight sm:text-7xl text-foreground"
            />
            <AnimatedText
              text="Authorize anywhere."
              mode="line"
              delay={0.15}
              className="font-display text-4xl font-extrabold leading-none tracking-tight sm:text-7xl bg-gradient-to-r from-indigo-300 via-purple-300 to-violet-400 bg-clip-text text-transparent mt-2"
            />
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.3} distance={20}>
            <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              Wallet authentication tells applications who controls a digital identity. Swarolipi adds a human-verification layer that applications can use when authorization requires more than wallet ownership.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ================= SECURITY SECTION ================= */}
      <SectionReveal id="security" className="px-5 py-24 sm:px-8 sm:py-32 border-t border-purple-500/15">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Architecture Boundary</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-5xl text-foreground">
              Built around trust, not custody.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              Swarolipi is designed with strict privacy boundaries separating wallet custody, human verification, and application authorization.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {securityPoints.map((pt, i) => {
              const Icon = pt.icon;
              return (
                <ScrollReveal key={pt.title} direction="up" delay={i * 0.1} distance={30}>
                  <motion.div
                    whileHover={reduced ? {} : { y: -5 }}
                    className="h-full rounded-2xl border border-purple-500/15 bg-card/60 backdrop-blur-xl p-6 shadow-sm transition-all hover:border-purple-500/40 hover:bg-card/80 hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.2)]"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-300 mb-4">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="text-base font-bold text-foreground">{pt.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{pt.body}</p>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </SectionReveal>

      {/* ================= FINAL CTA SECTION ================= */}
      <section className="relative px-5 py-24 text-center sm:px-8 sm:py-32 border-t border-purple-500/15 overflow-hidden">
        <ParallaxElement speed={-0.15} className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-purple-950/20 to-indigo-950/30" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-purple-600/10 blur-[140px] -z-10" />

        <div className="mx-auto max-w-3xl">
          <ScrollReveal direction="up" distance={30}>
            <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
              <AnimatedText text="Verify once." mode="line" />
              <AnimatedText text="Authorize anywhere." mode="line" delay={0.15} className="bg-gradient-to-r from-indigo-300 via-purple-300 to-violet-400 bg-clip-text text-transparent mt-1" />
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.25} distance={20}>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Connect your wallet and create your Swarolipi digital identity today.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.4} distance={20}>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {isConnected ? (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" variant="swarolipi" onClick={goToDashboard} className="gap-2 shadow-md w-full sm:w-auto">
                    Go to Dashboard <ArrowRight />
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" variant="swarolipi" onClick={openWallet} className="gap-2 shadow-md w-full sm:w-auto">
                    Connect Wallet <ArrowRight />
                  </Button>
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" variant="swarolipiOutline" onClick={goToDeveloperDemo} className="w-full sm:w-auto">
                  Explore Developer Platform
                </Button>
              </motion.div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================= PARALLAX FOOTER ================= */}
      <footer id="developers" className="relative border-t border-purple-500/15 bg-card/40 backdrop-blur-xl pt-16 pb-12 overflow-hidden">
        {/* Oversized Low Opacity Background Typography */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center opacity-[0.03] select-none text-purple-400">
          <span className="font-display text-[20vw] font-extrabold tracking-tighter leading-none">
            Swarolipi
          </span>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-purple-500/15">
            <ScrollReveal direction="up" delay={0.05}>
              <div>
                <span className="font-display text-lg font-extrabold tracking-[0.16em] text-foreground">
                  Swarolipi
                </span>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Private by design. Verifiable by nature. Reusable wallet identity infrastructure.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.12}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Product</p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li><a href="#top" className="hover:text-foreground transition-colors">Wallet Verification</a></li>
                  <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Human Signal Engine</a></li>
                  <li><a href="#security" className="hover:text-foreground transition-colors">Zero-Knowledge Credentials</a></li>
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.18}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Developers</p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li><Link to="/developer/demo" className="hover:text-foreground transition-colors flex items-center gap-1"><Code2 className="size-3 text-primary" /> Developer Demo</Link></li>
                  <li><Link to="/developer/demo" className="hover:text-foreground transition-colors">Integration Guide</Link></li>
                  <li><Link to="/developer/demo" className="hover:text-foreground transition-colors">Zero-Knowledge Tokens</Link></li>
                </ul>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.24}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Security & Trust</p>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li><span>Privacy Guarantee</span></li>
                  <li><span>Terms of Service</span></li>
                  <li><span>Security Boundaries</span></li>
                </ul>
              </div>
            </ScrollReveal>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left text-xs text-muted-foreground">
            <span>© 2026 Swarolipi Identity Infrastructure. All rights reserved.</span>
            <span className="font-semibold text-foreground">No custody · No seed phrases · No private keys</span>
          </div>
        </div>
      </footer>

      <WalletConnectModal open={walletOpen} onClose={() => setWalletOpen(false)} />
    </main>
  );
}

// Ecosystem Company Marquee Component featuring numerous protocols & dApps
function EcosystemCompanyMarquee() {
  const firstRow = ecosystemCompanies.slice(0, Math.ceil(ecosystemCompanies.length / 2));
  const secondRow = ecosystemCompanies.slice(Math.ceil(ecosystemCompanies.length / 2));

  return (
    <div className="mt-10 w-full max-w-7xl mx-auto px-4" aria-label="Ecosystem applications marquee">
      <div className="text-center mb-6">
        <span className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-primary">
          Ecosystem & Partners
        </span>
        <h3 className="mt-1.5 font-display text-lg font-extrabold tracking-tight text-foreground sm:text-2xl">
          Integrates with Leading Protocols, DAOs & Web3 Applications
        </h3>
      </div>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-2">
        <Marquee pauseOnHover className="[--duration:40s] [--gap:1rem]">
          {firstRow.map((company) => (
            <CompanyCard key={company.name} {...company} />
          ))}
        </Marquee>

        <Marquee reverse pauseOnHover className="mt-2.5 [--duration:40s] [--gap:1rem]">
          {secondRow.map((company) => (
            <CompanyCard key={company.name} {...company} />
          ))}
        </Marquee>

        <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r z-10" />
        <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l z-10" />
      </div>
    </div>
  );
}

function CompanyCard({
  name,
  category,
  icon,
  domain,
}: {
  name: string;
  category: string;
  icon: string;
  domain: string;
}) {
  return (
    <div className="relative flex w-60 items-center gap-3 rounded-2xl border border-purple-500/15 bg-card/60 p-3.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-purple-500/40 hover:bg-card/85 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] cursor-pointer group">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple-950/40 border border-purple-500/20 text-base shadow-sm group-hover:scale-105 group-hover:border-purple-400/40 transition-transform">
        {icon}
      </span>
      <div className="flex flex-col min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          <span className="font-display font-extrabold text-xs text-foreground truncate">{name}</span>
          <span className="inline-flex items-center rounded-full bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.2 text-[0.55rem] font-bold text-purple-300">
            Verified
          </span>
        </div>
        <span className="text-[0.7rem] font-semibold text-muted-foreground truncate">{category}</span>
        <span className="text-[0.62rem] font-mono text-muted-foreground/80 truncate">{domain}</span>
      </div>
    </div>
  );
}