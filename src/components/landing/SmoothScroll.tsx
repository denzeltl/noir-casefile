"use client";

import "lenis/dist/lenis.css";
import { ReactLenis } from "lenis/react";

/**
 * Smooth wheel scrolling for the landing page only (the game keeps native
 * scroll). Lenis drives the window's own scroll position, so sticky scenes and
 * motion's useScroll keep working; it turns itself off under reduced motion
 * and leaves touch scrolling native.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, autoRaf: true }}>
      {children}
    </ReactLenis>
  );
}
