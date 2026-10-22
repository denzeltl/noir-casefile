"use client";

import { motion, type HTMLMotionProps } from "motion/react";

/**
 * Flow reveal: a section's parts arrive once, in reading order, as it scrolls
 * into view (14px rise + fade, 620ms, 70ms apart). Reduced motion keeps the fade
 * only (MotionConfig reducedMotion="user" on the page).
 */
const group = { show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, transform: "translateY(14px)" },
  show: {
    opacity: 1,
    transform: "translateY(0px)",
    transition: { duration: 0.62, ease: [0.23, 1, 0.32, 1] as const },
  },
};

export function RevealGroup(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={group}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      {...props}
    />
  );
}

export const revealItem = item;
/** For a column inside a RevealGroup whose own children should stagger in. */
export const revealColumn = group;
