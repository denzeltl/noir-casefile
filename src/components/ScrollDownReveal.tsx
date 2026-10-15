"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";

interface ScrollDownRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  distance?: number;
}

export default function ScrollDownReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 24,
}: ScrollDownRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasRevealed, setHasRevealed] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setHasRevealed(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    // Use IntersectionObserver to track scroll entrance
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Entered viewport while scrolling DOWN: reveal!
          setHasRevealed(true);
        } else {
          // Only reset if element exited through the BOTTOM of the viewport
          // (i.e. user scrolled all the way back UP past this element).
          // If it exited through the TOP (user scrolled past it downwards),
          // DO NOT RESET! It stays revealed so scrolling back UP does NOT re-trigger animations.
          if (entry.boundingClientRect.top > 0) {
            setHasRevealed(false);
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduceMotion]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const initialVariant =
    direction === "up"
      ? { opacity: 0, y: distance }
      : direction === "left"
      ? { opacity: 0, x: -distance }
      : direction === "right"
      ? { opacity: 0, x: distance }
      : { opacity: 0 };

  const targetVariant =
    direction === "up"
      ? { opacity: 1, y: 0 }
      : direction === "left"
      ? { opacity: 1, x: 0 }
      : direction === "right"
      ? { opacity: 1, x: 0 }
      : { opacity: 1 };

  return (
    <motion.div
      ref={ref}
      initial={initialVariant}
      animate={hasRevealed ? targetVariant : initialVariant}
      transition={{
        duration: 0.45,
        delay: hasRevealed ? delay : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
