"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * True when scroll scenes should run as pinned/scrubbed scenes: a wide, tall enough viewport
 * and no reduced-motion preference. Narrow or reduced viewports get static,
 * ordered content instead.
 */
export function useSceneMode(minWidth = 900) {
  const reduce = useReducedMotion();
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px) and (min-height: 680px)`);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [minWidth]);
  return wide && !reduce;
}
