import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Camera,
  Eye,
  UserCheck,
  UserX,
  Users,
  Wifi,
  WifiOff,
  Compass,
  Activity,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FaceTelemetry {
  faceCount: number;
  gaze: string;
  headMovement: string;
  yaw: number;
  pitch: number;
  blinks: number;
  blinkDetected: boolean;
  status: "SEARCHING" | "SUCCESS" | "MULTIPLE" | "ERROR";
  message?: string;
}

export function FaceDetectionPanel() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const frameIntervalRef = useRef<any>(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [encodingFrame, setEncodingFrame] = useState(false);

  const [telemetry, setTelemetry] = useState<FaceTelemetry>({
    faceCount: 0,
    gaze: "UNKNOWN",
    headMovement: "UNKNOWN",
    yaw: 0,
    pitch: 0,
    blinks: 0,
    blinkDetected: false,
    status: "SEARCHING",
  });

  const getWebSocketUrl = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5634";
    try {
      const url = new URL(backendUrl);
      const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProtocol}//${url.host}/face/ws`;
    } catch (e) {
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      return `${isHttps ? "wss:" : "ws:"}//localhost:5634/face/ws`;
    }
  };

  const startCameraAndSocket = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam access not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      connectWebSocket();
    } catch (err: any) {
      console.error("[FaceDetection] Camera error:", err);
      setCameraError(err?.message || "Webcam access denied or unavailable.");
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = getWebSocketUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      startFrameStreaming();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === "ERROR") {
          setTelemetry((prev) => ({
            ...prev,
            status: "ERROR",
            message: data.message || "Face detector error",
          }));
          return;
        }

        const head = data.head || {};
        const blink = data.blink || {};

        setTelemetry({
          faceCount: typeof data.face_count === "number" ? data.face_count : 0,
          gaze: data.gaze || "CENTER",
          headMovement: head.movement || "STILL",
          yaw: typeof head.yaw === "number" ? head.yaw : 0,
          pitch: typeof head.pitch === "number" ? head.pitch : 0,
          blinks: typeof blink.count === "number" ? blink.count : 0,
          blinkDetected: Boolean(blink.detected),
          status: data.status as any,
          message: data.message,
        });
      } catch (e) {
        console.warn("[FaceDetection] Invalid message frame:", e);
      }
    };

    ws.onerror = (err) => {
      console.warn("[FaceDetection] WebSocket error:", err);
      setWsConnected(false);
    };

    ws.onclose = () => {
      setWsConnected(false);
      stopFrameStreaming();
    };
  };

  const startFrameStreaming = () => {
    stopFrameStreaming();

    frameIntervalRef.current = setInterval(() => {
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !videoRef.current ||
        !canvasRef.current
      ) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(blob);
          }
        },
        "image/jpeg",
        0.7
      );
    }, 150);
  };

  const stopFrameStreaming = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  };

  useEffect(() => {
    startCameraAndSocket();

    return () => {
      stopFrameStreaming();
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getStatusBadge = () => {
    if (cameraError) {
      return {
        text: "CAMERA ERROR",
        bg: "bg-destructive/20 border-destructive/40 text-destructive",
        icon: <AlertTriangle className="size-3.5" />,
      };
    }

    if (!wsConnected) {
      return {
        text: "CONNECTING TRACKER...",
        bg: "bg-amber-500/20 border-amber-500/40 text-amber-400",
        icon: <RefreshCw className="size-3.5 animate-spin" />,
      };
    }

    if (telemetry.status === "SUCCESS" && telemetry.faceCount === 1) {
      return {
        text: "✓ ONE PERSON DETECTED",
        bg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400",
        icon: <UserCheck className="size-3.5" />,
      };
    }

    if (telemetry.status === "MULTIPLE" || telemetry.faceCount > 1) {
      return {
        text: "ONLY 1 PERSON ALLOWED",
        bg: "bg-destructive/20 border-destructive/40 text-destructive",
        icon: <UserX className="size-3.5" />,
      };
    }

    return {
      text: "SCANNING FOR FACE...",
      bg: "bg-amber-500/20 border-amber-500/40 text-amber-400",
      icon: <Camera className="size-3.5 animate-pulse" />,
    };
  };

  const badge = getStatusBadge();

  return (
    <div className="space-y-4">
      {/* ================= CAMERA VIEW CONTAINER ================= */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-black/80 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
        {/* Aspect Ratio Video Box */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover transform -scale-x-100"
          />
          <canvas ref={canvasRef} width={640} height={480} className="hidden" />

          {/* Futuristic Overlay Scanning HUD */}
          <div className="pointer-events-none absolute inset-0 border-[3px] border-purple-500/20 rounded-2xl">
            {/* Corner Markers */}
            <div className="absolute top-3 left-3 size-4 border-t-2 border-l-2 border-purple-400" />
            <div className="absolute top-3 right-3 size-4 border-t-2 border-r-2 border-purple-400" />
            <div className="absolute bottom-3 left-3 size-b-2 border-b-2 border-l-2 border-purple-400" />
            <div className="absolute bottom-3 right-3 size-b-2 border-b-2 border-r-2 border-purple-400" />

            {/* Live Animated Scanning Line */}
            {wsConnected && (
              <motion.div
                animate={{ y: ["0%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="h-0.5 w-full bg-gradient-to-r from-transparent via-purple-500/60 to-transparent shadow-[0_0_8px_#a855f7]"
              />
            )}
          </div>

          {/* Top Floating Status Pill */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.7rem] font-bold shadow-md backdrop-blur-md ${badge.bg}`}>
              {badge.icon} {badge.text}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-black/60 px-2.5 py-1 font-mono text-[0.65rem] font-medium text-muted-foreground backdrop-blur-md">
              {wsConnected ? (
                <>
                  <Wifi className="size-3 text-emerald-400" /> LIVE
                </>
              ) : (
                <>
                  <WifiOff className="size-3 text-destructive" /> OFFLINE
                </>
              )}
            </span>
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
              <div className="space-y-3">
                <AlertTriangle className="mx-auto size-8 text-destructive" />
                <p className="text-xs text-muted-foreground">{cameraError}</p>
                <Button size="sm" variant="swarolipiOutline" onClick={startCameraAndSocket}>
                  <RefreshCw className="mr-2 size-3.5" /> Retry Camera
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= FORMATTED TELEMETRY DATA PANEL ================= */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Activity className="size-4 text-purple-400" /> Face Detection Telemetry
          </span>
          <span className="font-mono text-[0.65rem] text-muted-foreground uppercase">
            Real-time Feed
          </span>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. People Count */}
          <div className="rounded-xl border border-border/60 bg-background/60 p-3 shadow-inner">
            <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider block">
              People Detected
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-lg font-extrabold text-foreground">
                {telemetry.faceCount}
              </span>
              <span className={`size-2.5 rounded-full ${telemetry.faceCount === 1 ? "bg-emerald-500 shadow-[0_0_6px_#10b981]" : "bg-amber-500"}`} />
            </div>
          </div>

          {/* 2. Eye Gaze */}
          <div className="rounded-xl border border-border/60 bg-background/60 p-3 shadow-inner">
            <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider block">
              Eye Gaze
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <Eye className="size-4 text-purple-400" />
              <span className="font-mono text-xs font-bold text-purple-300 uppercase">
                {telemetry.gaze}
              </span>
            </div>
          </div>

          {/* 3. Head Movement */}
          <div className="rounded-xl border border-border/60 bg-background/60 p-3 shadow-inner">
            <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider block">
              Head Movement
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <Compass className="size-4 text-indigo-400" />
              <span className="font-mono text-xs font-bold text-indigo-300 uppercase">
                {telemetry.headMovement}
              </span>
            </div>
          </div>

          {/* 4. Blinks */}
          <div className="rounded-xl border border-border/60 bg-background/60 p-3 shadow-inner">
            <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider block">
              Blinks Detected
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-lg font-extrabold text-foreground">
                {telemetry.blinks}
              </span>
              {telemetry.blinkDetected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="rounded bg-purple-500/30 px-1.5 py-0.5 text-[0.6rem] font-bold text-purple-300"
                >
                  BLINK
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* Head Pose Angles Bar */}
        <div className="rounded-xl border border-border/60 bg-background/40 p-2.5 text-xs flex items-center justify-between font-mono">
          <span className="text-muted-foreground">Head Angles:</span>
          <span className="text-purple-300 font-semibold">
            Yaw: {telemetry.yaw > 0 ? `+${telemetry.yaw.toFixed(1)}` : telemetry.yaw.toFixed(1)}°
          </span>
          <span className="text-indigo-300 font-semibold">
            Pitch: {telemetry.pitch > 0 ? `+${telemetry.pitch.toFixed(1)}` : telemetry.pitch.toFixed(1)}°
          </span>
        </div>
      </div>
    </div>
  );
}
