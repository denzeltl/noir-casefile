import { z } from "zod";

// ─── Difficulty ─────────────────────────────────────────────────────────────
export const DIFFICULTIES = ["easy", "medium", "hard", "noir"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DifficultySchema = z.enum(DIFFICULTIES);

export interface DifficultyConfig {
  label: string;
  description: string;
  suspectCount: number;
  clueCount: number;
  maxQuestions: number;
  /** How the killer behaves under questioning */
  killerBehavior: string;
  /** Extra prompt rules injected for harder modes */
  extraRules: string;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Rookie",
    description: "3 suspects · 12 questions · Killer cracks under pressure",
    suspectCount: 3,
    clueCount: 3,
    maxQuestions: 12,
    killerBehavior:
      "Visibly nervous. Contradicts alibi details when pressed even lightly. Stumbles over words.",
    extraRules:
      "The killer's alibi flaw should be fairly obvious. Clues should point clearly toward the killer.",
  },
  medium: {
    label: "Detective",
    description: "3 suspects · 10 questions · Balanced difficulty",
    suspectCount: 3,
    clueCount: 3,
    maxQuestions: 10,
    killerBehavior:
      "Tries to stay calm but gets evasive on specifics. Subtle contradictions if pressed hard.",
    extraRules:
      "The killer's alibi flaw should be subtle but detectable. Clues require some deduction.",
  },
  hard: {
    label: "Hardboiled",
    description: "4 suspects · 10 questions · Killer deflects well · Red herrings",
    suspectCount: 4,
    clueCount: 4,
    maxQuestions: 10,
    killerBehavior:
      "Composed and articulate. Only contradicts under very specific, pointed questioning. Deflects skillfully.",
    extraRules: `The killer's alibi flaw should be very subtle — only noticeable if the detective cross-references with specific clues.
One innocent suspect should also have a suspicious motive or shaky-sounding alibi (a red herring), but their alibi is actually solid.
Clues should require combining at least two together to point at the killer.`,
  },
  noir: {
    label: "Noir",
    description: "5 suspects · 8 questions · Ice-cold killer · Multiple red herrings",
    suspectCount: 5,
    clueCount: 4,
    maxQuestions: 8,
    killerBehavior:
      "Ice-cold. Almost never slips. Responds with confidence. Only the most precise line of questioning reveals a tiny crack.",
    extraRules: `The killer's alibi flaw should be nearly invisible — requires combining multiple clues AND catching a very specific inconsistency in their story.
Two innocent suspects should have suspicious motives or questionable alibis (red herrings), but their alibis hold up under scrutiny.
One clue should be misleading, pointing toward an innocent suspect.
The real evidence chain should require connecting at least three clues together.`,
  },
};

// ─── Clue ───────────────────────────────────────────────────────────────────
export const ClueSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  location: z.string(),
});

export type Clue = z.infer<typeof ClueSchema>;

// ─── Suspect ────────────────────────────────────────────────────────────────
export const SuspectSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().int().min(18).max(90),
  occupation: z.string(),
  appearance: z.string(),
  relationshipToVictim: z.string(),
  alibi: z.string(),
  alibiFlawed: z.boolean(),
  motive: z.string(),
  isKiller: z.boolean(),
  personality: z.string(),
});

export type Suspect = z.infer<typeof SuspectSchema>;

// ─── Victim ─────────────────────────────────────────────────────────────────
export const VictimSchema = z.object({
  name: z.string(),
  age: z.number().int().min(18).max(90),
  occupation: z.string(),
  causeOfDeath: z.string(),
});

export type Victim = z.infer<typeof VictimSchema>;

// ─── Full Case (dynamic suspect/clue count) ─────────────────────────────────
export const CaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  setting: z.string(),
  narrative: z.string(),
  victim: VictimSchema,
  weapon: z.string(),
  clues: z.array(ClueSchema).min(3).max(5),
  suspects: z.array(SuspectSchema).min(3).max(5),
  solution: z.string(),
});

export type Case = z.infer<typeof CaseSchema>;

// ─── Chat message ───────────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Interrogation request ──────────────────────────────────────────────────
export const InterrogateRequestSchema = z.object({
  suspect: SuspectSchema,
  question: z.string().min(1).max(500),
  difficulty: DifficultySchema,
  chatHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  caseContext: z.object({
    title: z.string(),
    setting: z.string(),
    victimName: z.string(),
    weapon: z.string(),
    clues: z.array(ClueSchema),
  }),
});

export type InterrogateRequest = z.infer<typeof InterrogateRequestSchema>;

// ─── Accusation request ─────────────────────────────────────────────────────
export const AccusationRequestSchema = z.object({
  accusedSuspectId: z.string(),
  accusedWeapon: z.string(),
  evidence: z.string().min(10).max(1000),
  caseData: CaseSchema,
});

export type AccusationRequest = z.infer<typeof AccusationRequestSchema>;
