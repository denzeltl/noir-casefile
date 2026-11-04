import type { AdBrief } from "./brief.ts";
import type { Storyboard } from "./schemas.ts";

/**
 * Flat composition variables for video/index.html. Built from the storyboard
 * and the spoiler-free brief only; this is everything the render worker sees.
 */
export type TrailerVariables = Record<string, string>;

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

export function toTrailerVariables(storyboard: Storyboard, brief: AdBrief): TrailerVariables {
  const vars: TrailerVariables = {
    title: clip(brief.title, 48),
    hook: clip(storyboard.hook, 80),
    cta: clip(storyboard.cta, 48),
  };
  storyboard.shots.forEach((s, i) => {
    vars[`shot${i + 1}`] = clip(s.overlay, 72);
    vars[`shot${i + 1}Motif`] = s.motif;
    vars[`shot${i + 1}Detail`] = clip(s.detail, 32);
  });
  brief.suspects.slice(0, 3).forEach((s, i) => {
    vars[`suspect${i + 1}`] = clip(s.name, 28);
  });
  return vars;
}
