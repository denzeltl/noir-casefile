import type { Case } from "../../types/case.ts";

/**
 * Spoiler-free view of a case. This is the ONLY case data the ad pipeline
 * (LLM nodes, chat alerts, admin client) may ever see.
 */
export interface AdBrief {
  id: string;
  title: string;
  setting: string;
  narrative: string;
  victim: { name: string; occupation: string; causeOfDeath: string };
  weapon?: string;
  clues: string[];
  suspects: { name: string; occupation: string; personality: string }[];
}

export function toAdBrief(c: Case, opts: { includeWeapon?: boolean } = {}): AdBrief {
  // Explicit allow-list: never spread `c` or a suspect, so new spoiler fields can't leak.
  return {
    id: c.id,
    title: c.title,
    setting: c.setting,
    narrative: c.narrative,
    victim: {
      name: c.victim.name,
      occupation: c.victim.occupation,
      causeOfDeath: c.victim.causeOfDeath,
    },
    ...(opts.includeWeapon ? { weapon: c.weapon } : {}),
    clues: c.clues.map((clue) => clue.name),
    suspects: c.suspects.map((s) => ({
      name: s.name,
      occupation: s.occupation,
      personality: s.personality,
    })),
  };
}
