import { motion, useReducedMotion } from "motion/react";
import { ReactNode } from "react";

interface AnimatedTextProps {
  text?: string;
  children?: ReactNode;
  mode?: "line" | "words" | "characters";
  className?: string;
  delay?: number;
  stagger?: number;
  highlightWords?: string[];
  animateOnMount?: boolean;
}

export function AnimatedText({
  text,
  mode = "line",
  className = "",
  delay = 0,
  stagger = 0.04,
  highlightWords = [],
  animateOnMount = false,
}: AnimatedTextProps) {
  const reduced = useReducedMotion();

  if (reduced || !text) {
    return <span className={className}>{text}</span>;
  }

  // 1. Line mode (Masked upward slide reveal)
  if (mode === "line") {
    const animationProps = animateOnMount
      ? { animate: { y: 0, opacity: 1 } }
      : { whileInView: { y: 0, opacity: 1 }, viewport: { once: true, margin: "100px 0px 100px 0px" } };

    return (
      <span className={`block overflow-hidden py-1 ${className}`}>
        <motion.span
          initial={{ y: "40px", opacity: 0 }}
          {...animationProps}
          transition={{
            duration: 0.6,
            delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="block"
        >
          {text}
        </motion.span>
      </span>
    );
  }

  // 2. Words mode (Sequential word reveal)
  if (mode === "words") {
    const words = text.split(" ");
    return (
      <span className={`inline-wrap ${className}`}>
        {words.map((word, index) => {
          const isHighlight = highlightWords.some(
            (hw) => hw.toLowerCase() === word.replace(/[^a-zA-Z]/g, "").toLowerCase()
          );

          const animationProps = animateOnMount
            ? { animate: { y: 0, opacity: 1, filter: "blur(0px)" } }
            : { whileInView: { y: 0, opacity: 1, filter: "blur(0px)" }, viewport: { once: true, amount: 0.1 } };

          return (
            <span key={index} className="inline-block overflow-hidden pb-[0.04em] mr-[0.25em]">
              <motion.span
                initial={{ y: "100%", opacity: 0, filter: "blur(6px)" }}
                {...animationProps}
                transition={{
                  duration: 0.6,
                  delay: delay + index * stagger,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`inline-block ${isHighlight ? "text-primary font-bold" : ""}`}
              >
                {word}
              </motion.span>
            </span>
          );
        })}
      </span>
    );
  }

  // 3. Characters mode (Character-by-character reveal for key words)
  if (mode === "characters") {
    const letters = Array.from(text);
    return (
      <span className={`inline-flex flex-wrap ${className}`}>
        {letters.map((char, index) => {
          const animationProps = animateOnMount
            ? { animate: { opacity: 1, y: 0, scale: 1 } }
            : { whileInView: { opacity: 1, y: 0, scale: 1 }, viewport: { once: true, amount: 0.1 } };

          return (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 14, scale: 0.8 }}
              {...animationProps}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 24,
                delay: delay + index * (stagger * 0.7),
              }}
              className="inline-block"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          );
        })}
      </span>
    );
  }

  return <span className={className}>{text}</span>;
}
