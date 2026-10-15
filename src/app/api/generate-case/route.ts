import { NextRequest, NextResponse } from "next/server";
import groq from "@/lib/groq";
import {
  CaseSchema,
  DifficultySchema,
  DIFFICULTY_CONFIGS,
  type Difficulty,
} from "@/types/case";

/**
 * POST /api/generate-case
 * Accepts: { difficulty: "easy" | "medium" | "hard" | "noir" }
 * Returns: a Zod-validated Case object.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const difficulty: Difficulty = DifficultySchema.catch("medium").parse(
      body.difficulty
    );
    const config = DIFFICULTY_CONFIGS[difficulty];
    const caseId = `case-${Date.now()}`;

    // Build suspect entries for schema example
    const suspectEntries = Array.from(
      { length: config.suspectCount },
      (_, i) =>
        `    {"id":"suspect-${i + 1}","name":"string","age":number,"occupation":"string","appearance":"string (1 sentence)","relationshipToVictim":"string","alibi":"string","alibiFlawed":boolean,"motive":"string","isKiller":boolean,"personality":"string (1 sentence)"}`
    ).join(",\n");

    const clueEntries = Array.from(
      { length: config.clueCount },
      (_, i) =>
        `    {"id":"clue-${i + 1}","name":"string","description":"1 sentence","location":"string"}`
    ).join(",\n");

    const systemPrompt = `Noir murder-mystery generator. Output ONLY valid JSON, no commentary.

Schema:
{
  "id":"${caseId}",
  "title":"noir-style title",
  "setting":"1-sentence crime scene",
  "narrative":"2 sentence hardboiled opening",
  "victim":{"name":"string","age":number(18-90),"occupation":"string","causeOfDeath":"string"},
  "weapon":"the murder weapon",
  "clues":[
${clueEntries}
  ],
  "suspects":[
${suspectEntries}
  ],
  "solution":"2 sentences: how the killer did it and what evidence links them"
}

RULES:
- Exactly ${config.clueCount} clues, exactly ${config.suspectCount} suspects.
- Exactly ONE suspect: isKiller=true, alibiFlawed=true. All others: isKiller=false, alibiFlawed=false.
- Weapon must match causeOfDeath.
- Each suspect gets a distinct personality.
- Vary settings, time periods, ethnicities.
${config.extraRules}`;

    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate a unique murder mystery. JSON only. /no_think" },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
      max_tokens: 5000,
    });

    let raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "No response from AI" }, { status: 502 });
    }

    // Strip Qwen thinking tags
    raw = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("JSON parse failed:", raw.slice(0, 300));
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 });
    }

    const result = CaseSchema.safeParse(parsed);
    if (!result.success) {
      console.error("Validation failed:", result.error.format());
      return NextResponse.json(
        { error: "Generated case failed validation", details: result.error.flatten() },
        { status: 502 }
      );
    }

    // Sanity: exactly one killer
    const killerCount = result.data.suspects.filter((s) => s.isKiller).length;
    if (killerCount !== 1) {
      return NextResponse.json(
        { error: `Invalid case: ${killerCount} killers (expected 1)` },
        { status: 502 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Case generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate case. Please try again." },
      { status: 500 }
    );
  }
}
