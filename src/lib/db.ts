import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Case, Difficulty } from "@/types/case";
import { toAdBrief } from "@/lib/ads/brief";
import { notifyNewCase } from "@/lib/ads/notify";

let client: SupabaseClient | null | undefined;

/** Service-role client, or null when Supabase isn't configured (the game still works). */
export function getDb(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}

/** Save a generated case. Never throws: DB trouble must not break the player's game. */
export async function saveCase(c: Case, difficulty: Difficulty): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const { error } = await db.from("cases").insert({
      id: c.id,
      difficulty,
      case_json: c,
      brief_json: toAdBrief(c),
    });
    if (error) {
      console.error("saveCase failed:", error.message);
      return;
    }
    // WF1 Telegram alert. If n8n is down, the catch-up workflow finds it later (alerted_at is null).
    await notifyNewCase({ caseId: c.id, title: c.title, setting: c.setting, difficulty });
  } catch (err) {
    console.error("saveCase failed:", err);
  }
}
