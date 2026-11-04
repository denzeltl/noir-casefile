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
  // Every suspect (up to 5) and every clue (up to 6): the lineup and the evidence board show them all.
  // Unused slots are sent empty so the template's sample names never show.
  for (let i = 0; i < 5; i++) vars[`suspect${i + 1}`] = brief.suspects[i] ? clip(brief.suspects[i].name, 28) : "";
  for (let i = 0; i < 6; i++) vars[`clue${i + 1}`] = brief.clues[i] ? clip(brief.clues[i], 32) : "";
  return vars;
}

/** Long cut (19 s) when the case has 4-5 suspects and the storyboard has a fourth shot. */
export function isLongCut(vars: TrailerVariables): boolean {
  return Boolean(vars.shot4);
}

/**
 * video/index.html is the long cut. The short cut (15 s) drops shot 4 and moves
 * the call to action to 12-15 s. The template's script reads clip times from
 * data-start, so moving the attributes is all it takes.
 */
export function shortCut(html: string): string {
  const out = html
    .replace(/\s*<!-- shot4:start[\s\S]*?<!-- shot4:end -->/, "")
    .replace(/(<section id="cta-scene"[^>]*?)data-start="[\d.]+" data-duration="[\d.]+"/, '$1data-start="12" data-duration="3"')
    .replace(/(<div id="root"[^>]*?)data-duration="[\d.]+"/, '$1data-duration="15"');
  if (out.includes('id="shot4"') || !out.includes('data-start="12" data-duration="3"') || !/id="root"[^>]*data-duration="15"/.test(out)) {
    throw new Error("shortCut: video/index.html no longer matches the expected markers.");
  }
  return out;
}
