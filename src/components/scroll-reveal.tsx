import { ReactNode, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "motion/react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  delay?: number;
  duration?: number;
  staggerChildren?: number;
  once?: boolean;
  amount?: number | "some" | "all";
}

export function ScrollReveal({
  children,
  className = "",
  direction = "up",
  distance = 20,
  delay = 0,
  duration = 0.5,
  once = true,
  amount = "some",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "100px 0px 100px 0px" });

  const getInitialTransform = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      case "none":
      default:
        return { x: 0, y: 0 };
    }
  };

  const initialTransform = getInitialTransform();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...initialTransform }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, ...initialTransform }
      }
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function SectionReveal({ children, className = "", id }: SectionRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "100px 0px 100px 0px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

interface ParallaxElementProps {
  children?: ReactNode;
  speed?: number; // negative moves slower / opposite, positive moves faster
  className?: string;
}

export function ParallaxElement({ children, speed = 0.2, className = "" }: ParallaxElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-100 * speed, 100 * speed]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
