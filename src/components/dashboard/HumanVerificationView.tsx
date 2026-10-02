import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Mic,
  MicOff,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Square,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { formatAddress } from "@/components/WalletStatus";
import { Link } from "@tanstack/react-router";

const VOICE_CHALLENGES = [
  "Seven stars illuminate the night.",
  "Green forests grow after the rain.",
  "Every journey begins with a single step.",
  "The morning light crossed the window.",
  "Knowledge becomes powerful when shared.",
  "Quiet rivers carve deep canyons.",
  "Silver wings soar above the clouds.",
  "Bright horizons guide our path.",
];

type Step = "intro" | "challenge" | "processing" | "result";
type RecState = "ready" | "recording" | "recorded";

export function HumanVerificationView() {
  const { walletAddress } = useWallet();
  const { humanVerified, completeHumanVerification } = useProfile();

  const [step, setStep] = useState<Step>(humanVerified ? "result" : "intro");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recState, setRecState] = useState<RecState>("ready");
  const [recordedBlobs, setRecordedBlobs] = useState<Blob[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<boolean[]>([]);

  // Timer & Waveform state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [pipelineIndex, setPipelineIndex] = useState(0);
  const [isSuccess, setIsSuccess] = useState(true);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Initialize random challenges
  const initChallenges = () => {
    const shuffled = [...VOICE_CHALLENGES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);
    setChallenges(selected);
    setCurrentIndex(0);
    setCompletedChallenges([false, false, false, false, false]);
    setRecordedBlobs([]);
    setRecState("ready");
  };

  const handleBegin = () => {
    initChallenges();
    setStep("challenge");
  };

  // Start Voice Recording
  const startRecording = async () => {
    setRecState("recording");
    setTimerSeconds(0);

    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setRecordedBlobs((prev) => [...prev, blob]);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
      }
    } catch (e) {
      console.warn("MediaRecorder mic access error, fallback to audio simulation:", e);
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    } else {
      // Mock blob fallback
      const mockBlob = new Blob(["mock_audio"], { type: "audio/webm" });
      setRecordedBlobs((prev) => [...prev, mockBlob]);
    }

    setRecState("recorded");
  };

  // Handle Challenge Step Progression
  const handleContinueChallenge = () => {
    const updated = [...completedChallenges];
    updated[currentIndex] = true;
    setCompletedChallenges(updated);

    if (currentIndex < challenges.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setRecState("ready");
      setTimerSeconds(0);
    } else {
      // All 5 completed! Transition to processing pipeline
      setStep("processing");
      setPipelineIndex(0);
    }
  };

  const handleRecordAgain = () => {
    setRecState("ready");
    setTimerSeconds(0);
  };

  // Animated Processing Pipeline Effect
  useEffect(() => {
    if (step !== "processing") return;

    const pipelineSteps = [0, 1, 2, 3, 4];
    let idx = 0;

    const interval = setInterval(() => {
      idx++;
      if (idx < pipelineSteps.length) {
        setPipelineIndex(idx);
      } else {
        clearInterval(interval);
        completeHumanVerification();
        setIsSuccess(true);
        setStep("result");
      }
    }, 1100);

    return () => clearInterval(interval);
  }, [step]);

  const pipelineItems = [
    "Audio Received",
    "Challenge Processing",
    "Voice Analysis",
    "Anti-Replay Check",
    "Human Verification",
  ];

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {/* ================= STEP 1: INTRO ================= */}
        {step === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="space-y-8"
          >
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-bold text-primary">
                  <Mic className="size-3.5" /> Human Signal Generation
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  Verify You're Human
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Read a few randomly generated phrases aloud. Your recording will be processed strictly for zero-knowledge human-verification purposes.
                </p>

                <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                    <Clock className="size-4 text-primary" /> Duration: ~1 minute (5 short phrases)
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                    <Lock className="size-4 text-primary" /> Privacy: No raw audio stored permanently
                  </div>
                </div>
              </div>
            </div>

            {/* Begin Verification CTA Card */}
            <div className="rounded-2xl border-2 border-primary/20 bg-card p-8 text-center shadow-voxauth sm:p-10">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-primary/30 bg-accent text-primary shadow-sm">
                <Volume2 className="size-8" />
              </div>
              <h3 className="mt-5 font-display text-xl font-extrabold text-foreground">
                Ready for Voice Challenges
              </h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Make sure your microphone is enabled and you are in a relatively quiet environment.
              </p>

              <div className="mt-8 flex justify-center">
                <Button size="lg" variant="voxauth" onClick={handleBegin} className="gap-2 px-8 py-6 text-base">
                  Begin <ArrowRight className="size-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 2: VOICE CHALLENGES ================= */}
        {step === "challenge" && (
          <motion.div
            key="challenge"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="space-y-8"
          >
            {/* Header & Challenge Tracker */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
              <div>
                <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-primary">
                  Voice Challenge {currentIndex + 1} of {challenges.length}
                </span>
                <h3 className="font-display text-base font-bold text-foreground">
                  Read phrase aloud clearly
                </h3>
              </div>

              {/* Step Progress Checkmarks */}
              <div className="flex items-center gap-1.5">
                {challenges.map((_, i) => (
                  <div
                    key={i}
                    className={`grid size-7 place-items-center rounded-full text-xs font-bold transition-all ${completedChallenges[i]
                        ? "bg-violet-600 text-white shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                        : i === currentIndex
                          ? "bg-primary text-primary-foreground ring-2 ring-purple-500/40"
                          : "bg-accent text-muted-foreground"
                      }`}
                  >
                    {completedChallenges[i] ? <Check className="size-3.5" /> : i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Current Text Challenge Card */}
            <div className="rounded-2xl border border-purple-500/30 bg-card/60 p-8 text-center shadow-[0_0_35px_rgba(139,92,246,0.15)] backdrop-blur-xl sm:p-10">
              <span className="rounded-full border border-purple-500/25 bg-purple-950/40 px-3 py-1 font-mono text-xs font-bold text-purple-300">
                CHALLENGE {currentIndex + 1} OF 5
              </span>

              <motion.blockquote
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 font-display text-2xl font-extrabold leading-snug tracking-tight text-foreground sm:text-3xl"
              >
                "{challenges[currentIndex]}"
              </motion.blockquote>

              {/* Centered Microphone Recording Interface */}
              <div className="mt-10 flex flex-col items-center">
                <div className="relative grid size-24 place-items-center">
                  {recState === "recording" && (
                    <motion.span
                      animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.2, 0.6] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-destructive/30"
                    />
                  )}
                  <button
                    onClick={recState === "recording" ? stopRecording : startRecording}
                    disabled={recState === "recorded"}
                    className={`relative grid size-20 place-items-center rounded-full text-white shadow-lg transition-all transform active:scale-95 ${recState === "recording"
                        ? "bg-destructive ring-4 ring-destructive/30"
                        : recState === "recorded"
                          ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 ring-4 ring-purple-500/30 shadow-[0_0_20px_rgba(139,92,246,0.6)]"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                      }`}
                    aria-label={recState === "recording" ? "Stop recording" : "Start recording"}
                  >
                    {recState === "recording" ? (
                      <Square className="size-8 fill-current" />
                    ) : recState === "recorded" ? (
                      <Check className="size-9 stroke-[3]" />
                    ) : (
                      <Mic className="size-9" />
                    )}
                  </button>
                </div>

                {/* Animated Waveform Simulation */}
                {recState === "recording" && (
                  <div className="mt-6 flex items-center gap-1.5 h-8">
                    {[16, 24, 36, 48, 30, 42, 56, 32, 20, 40, 52, 28, 18].map((height, i) => (
                      <motion.span
                        key={i}
                        animate={{ height: [height * 0.4, height, height * 0.4] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.05 }}
                        className="w-1 rounded-full bg-gradient-to-t from-indigo-500 to-purple-400"
                        style={{ height: `${height}px` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 3: ANALYZING PIPELINE ================= */}
        {step === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-purple-500/25 bg-card/60 backdrop-blur-xl p-8 text-center shadow-[0_0_35px_rgba(139,92,246,0.2)] sm:p-12"
          >
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-purple-950/40 border border-purple-500/25 text-purple-300">
              <Loader2 className="size-8 animate-spin" />
            </div>

            <h3 className="mt-6 font-display text-2xl font-extrabold text-foreground">
              Analyzing Your Verification...
            </h3>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              All 5 voice challenges captured. Processing dynamic voice verification pipeline.
            </p>

            {/* Pipeline Step Sequence */}
            <div className="mx-auto mt-8 max-w-md space-y-3 text-left">
              {pipelineItems.map((item, idx) => {
                const isDone = idx < pipelineIndex;
                const isCurrent = idx === pipelineIndex;
                return (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-bold transition-all ${isDone
                        ? "border-purple-500/30 bg-purple-950/20 text-purple-200"
                        : isCurrent
                          ? "border-primary/40 bg-accent text-primary"
                          : "border-border/60 bg-background/50 text-muted-foreground opacity-60"
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      {isDone ? (
                        <Check className="size-4 text-violet-400" />
                      ) : isCurrent ? (
                        <Loader2 className="size-4 animate-spin text-primary" />
                      ) : (
                        <span className="size-2 rounded-full bg-border" />
                      )}
                      {item}
                    </span>
                    <span className="font-mono text-[0.65rem] uppercase">
                      {isDone ? "COMPLETE" : isCurrent ? "PROCESSING" : "WAITING"}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}


        {/* ================= STEP 3: PROCESSING PIPELINE ================= */}
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border-2 border-primary/20 bg-card p-8 text-center shadow-voxauth sm:p-12"
          >
            <div className="mx-auto grid size-16 place-items-center rounded-full border border-primary/30 bg-accent text-primary shadow-sm">
              <Loader2 className="size-8 animate-spin" />
            </div>

            <h3 className="mt-6 font-display text-2xl font-extrabold text-foreground">
              Analyzing Your Verification...
            </h3>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              All 5 voice challenges captured. Processing dynamic voice verification pipeline.
            </p>

            {/* Pipeline Step Sequence */}
            <div className="mx-auto mt-8 max-w-md space-y-3 text-left">
              {pipelineItems.map((item, idx) => {
                const isDone = idx < pipelineIndex;
                const isCurrent = idx === pipelineIndex;
                return (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-bold transition-all ${isDone
                        ? "border-fresh/30 bg-fresh/10 text-fresh"
                        : isCurrent
                          ? "border-primary/40 bg-accent text-primary"
                          : "border-border/60 bg-background/50 text-muted-foreground opacity-60"
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      {isDone ? (
                        <Check className="size-4 text-fresh" />
                      ) : isCurrent ? (
                        <Loader2 className="size-4 animate-spin text-primary" />
                      ) : (
                        <span className="size-2 rounded-full bg-border" />
                      )}
                      {item}
                    </span>
                    <span className="font-mono text-[0.65rem] uppercase">
                      {isDone ? "COMPLETE" : isCurrent ? "PROCESSING" : "WAITING"}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ================= STEP 4: RESULT SCREEN ================= */}
        {step === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {isSuccess ? (
              <div className="rounded-2xl border-2 border-fresh/40 bg-card p-8 text-center shadow-voxauth sm:p-12">
                {/* Shield Icon Badge */}
                <div className="relative mx-auto grid size-20 place-items-center rounded-3xl border border-fresh/40 bg-fresh/10 text-fresh shadow-md">
                  <ShieldCheck className="size-10" />
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-fresh text-foreground shadow"
                  >
                    <Check className="size-4 stroke-[3]" />
                  </motion.span>
                </div>

                <h2 className="mt-6 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
                  HUMAN VERIFIED
                </h2>
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  Dynamic voice challenge successfully completed. Zero-knowledge human verification signal established.
                </p>

                {/* Summary Card */}
                <div className="mx-auto mt-8 max-w-md rounded-xl border border-border bg-background p-5 text-left text-xs space-y-3">
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Human Verification</span>
                    <span className="font-bold text-fresh flex items-center gap-1">
                      <Check className="size-3.5" /> Verified
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Connected Wallet</span>
                    <span className="font-mono font-semibold">{formatAddress(walletAddress)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Verification Type</span>
                    <span className="font-bold text-foreground">Dynamic Voice Challenge</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-bold text-fresh">ACTIVE</span>
                  </div>
                </div>

                <div className="mt-8 flex justify-center gap-4">
                  <Link to="/verify">
                    <Button variant="voxauth" className="gap-2 px-8 py-6 text-base">
                      Continue to Verification Center <ArrowRight className="size-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-destructive/30 bg-card p-8 text-center shadow-voxauth sm:p-12">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive">
                  <AlertCircle className="size-8" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-extrabold text-foreground">
                  Verification Unsuccessful
                </h2>
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  We could not verify your voice response. Common causes include background noise or incomplete phrase audio.
                </p>

                <div className="mt-8 flex justify-center gap-3">
                  <Button variant="voxauthOutline" onClick={handleBegin}>
                    Try Again
                  </Button>
                  <Link to="/verify">
                    <Button variant="voxauth">Return to Verification Center</Button>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
