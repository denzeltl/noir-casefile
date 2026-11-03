import { NextResponse } from "next/server";

/**
 * POST /api/ads/runs  { caseIds: string[] }
 * Placeholder until the LangGraph pipeline lands (handoff step 3).
 */
export async function POST() {
  return NextResponse.json(
    { error: "The ad pipeline isn't built yet. It arrives with the LangGraph step." },
    { status: 501 }
  );
}
