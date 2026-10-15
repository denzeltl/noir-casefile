import { NextRequest, NextResponse } from "next/server";
import groq from "@/lib/groq";
import {
  InterrogateRequestSchema,
  AccusationRequestSchema,
  DIFFICULTY_CONFIGS,
  type Difficulty,
} from "@/types/case";

const SLIDING_WINDOW = 6;

/**
 * POST /api/interrogate
 * Two modes: interrogation (ask suspects) and accusation (judge verdict).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if ("accusedSuspectId" in body) return handleAccusation(body);
    return handleInterrogation(body);
  } catch (error) {
    console.error("Interrogation error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

// ── Interrogation ───────────────────────────────────────────────────────────

async function handleInterrogation(body: unknown) {
  const parsed = InterrogateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { suspect, question, chatHistory, caseContext, difficulty } = parsed.data;
  const persona = buildPersona(suspect, caseContext, difficulty);
  const recent = chatHistory.slice(-SLIDING_WINDOW);

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: persona },
    ...recent.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: question + " /no_think" },
  ];

  const completion = await groq.chat.completions.create({
    model: "qwen/qwen3.8-27b",
    messages,
    temperature: 0.8,
    max_tokens: 250,
  });

  let reply = completion.choices[0]?.message?.content?.trim() ?? "";
  reply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  if (!reply) {
    return NextResponse.json({ error: "No response from suspect" }, { status: 502 });
  }

  return NextResponse.json({ reply });
}

/**
 * Builds a concise persona prompt. Difficulty controls how the killer behaves:
 * - Easy: nervous, slips often
 * - Medium: evasive on specifics
 * - Hard: composed, deflects skillfully
 * - Noir: ice-cold, nearly uncrackable
 */
function buildPersona(
  suspect: {
    name: string;
    occupation: string;
    personality: string;
    alibi: string;
    isKiller: boolean;
    motive: string;
    relationshipToVictim: string;
  },
  ctx: { title: string; setting: string; victimName: string; weapon: string },
  difficulty: Difficulty
): string {
  const config = DIFFICULTY_CONFIGS[difficulty];

  const base = `You are ${suspect.name}, a ${suspect.occupation}, being interrogated about the murder of ${ctx.victimName}.
Setting: ${ctx.setting}. Personality: ${suspect.personality}.
Relationship: ${suspect.relationshipToVictim}. Your alibi: "${suspect.alibi}"

RULES: Stay in character. 1–2 sentences max. Never say you're an AI. Never outright confess or deny being the killer.`;

  if (suspect.isKiller) {
    return `${base}

SECRET: You are the killer. Motive: ${suspect.motive}
Behavior: ${config.killerBehavior}
- Deflect toward other suspects when possible.
- Never confess, but your answers may contain small cracks a sharp detective can catch.`;
  }

  return `${base}

SECRET: You are innocent. Your alibi is solid.
- Answer consistently. You may show emotion (grief, fear, annoyance).
- If asked, you can voice suspicions about other suspects.`;
}

// ── Accusation / Judge ──────────────────────────────────────────────────────

async function handleAccusation(body: unknown) {
  const parsed = AccusationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid accusation", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { accusedSuspectId, accusedWeapon, evidence, caseData } = parsed.data;
  const killer = caseData.suspects.find((s) => s.isKiller);
  const accused = caseData.suspects.find((s) => s.id === accusedSuspectId);

  const gotSuspect = accusedSuspectId === killer?.id;
  const gotWeapon =
    accusedWeapon.toLowerCase().trim() === caseData.weapon.toLowerCase().trim();

  const prompt = `Noir judge delivering a murder mystery verdict. Be dramatic, 2–3 sentences.

TRUTH: Killer=${killer?.name}. Weapon=${caseData.weapon}. ${caseData.solution}
ACCUSED: ${accused?.name ?? "Unknown"}. Weapon="${accusedWeapon}". Reasoning: ${evidence}
CORRECT SUSPECT: ${gotSuspect ? "YES" : "NO"}. CORRECT WEAPON: ${gotWeapon ? "YES" : "NO"}.

${gotSuspect && gotWeapon ? "Congratulate them like a grizzled DA." : "Tell them the real killer walks free. Reveal who and why."}`;

  const completion = await groq.chat.completions.create({
    model: "qwen/qwen3.8-27b",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: "Verdict. /no_think" },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  let verdict = completion.choices[0]?.message?.content?.trim() ?? "";
  verdict = verdict.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  return NextResponse.json({
    correct: gotSuspect && gotWeapon,
    correctSuspect: gotSuspect,
    correctWeapon: gotWeapon,
    actualKillerName: killer?.name,
    actualWeapon: caseData.weapon,
    solution: caseData.solution,
    verdict: verdict || "The court is unable to render a verdict at this time.",
  });
}
