import { useEffect, useRef } from "react";

export function FluidCursor() {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if device is touch or mobile
    const isTouch = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    if (isTouch) return;

    const orb = orbRef.current;
    if (!orb) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let scaleX = 1;
    let scaleY = 1;
    let currentAngle = 0;
    let isVisible = false;
    let isOverForbiddenSection = false;
    let currentOpacity = 0;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        currentX = targetX;
        currentY = targetY;
      }

      // Hide inside Hero (#top, .hero), Header (header), and Footer (footer)
      const target = e.target as HTMLElement | null;
      if (target) {
        const forbidden = target.closest("#top, footer, header, .hero, [data-no-cursor='true']");
        isOverForbiddenSection = !!forbidden;
      }
    };

    const handleMouseLeave = () => {
      isVisible = false;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    const updateCursor = () => {
      // Lerp position towards target
      const lerpAmount = 0.18;
      const dx = targetX - currentX;
      const dy = targetY - currentY;

      currentX += dx * lerpAmount;
      currentY += dy * lerpAmount;

      // Calculate speed and velocity direction angle
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      }

      // Stretch along direction based on speed/distance, return to circle when stopped
      const targetScaleX = 1 + Math.min(dist * 0.012, 0.65);
      const targetScaleY = Math.max(0.6, 1 - Math.min(dist * 0.006, 0.35));

      scaleX += (targetScaleX - scaleX) * 0.15;
      scaleY += (targetScaleY - scaleY) * 0.15;

      // Opacity lerp (hidden over Hero/Footer or outside window)
      const targetOpacity = isVisible && !isOverForbiddenSection ? 0.9 : 0;
      currentOpacity += (targetOpacity - currentOpacity) * 0.15;

      if (orb) {
        orb.style.opacity = currentOpacity.toFixed(3);
        if (currentOpacity > 0.01) {
          orb.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) rotate(${currentAngle}deg) scale(${scaleX}, ${scaleY})`;
        }
      }

      animationFrameId = requestAnimationFrame(updateCursor);
    };

    animationFrameId = requestAnimationFrame(updateCursor);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={orbRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-40 size-10 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(255,255,255,0.9),0_0_20px_rgba(168,85,247,0.5)] transition-opacity duration-150 ease-out opacity-0"
      style={{
        willChange: "transform, opacity",
      }}
    />
  );
}
