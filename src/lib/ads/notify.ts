// Fire-and-forget pings to n8n, which turns them into Telegram messages.
// Plain fetch and no "server-only", so the PC render worker can use it too.
// Payloads carry spoiler-free fields only: titles, settings, links, status.

import { createClient } from "@supabase/supabase-js";

/** Statuses worth a Telegram message (WF3). */
export const ALERT_STATUSES = ["waiting_hook", "waiting_video", "ready_to_post", "render_failed", "failed"];

export interface RunAlert {
  runId: string;
  status: string;
  caseTitle: string;
  videoUrl?: string | null;
  error?: string | null;
}

export interface CaseAlert {
  caseId: string;
  title: string;
  setting: string;
  difficulty: string;
}

/** Base URL for deep links in messages. */
function siteUrl(): string {
  return (process.env.AD_STUDIO_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

const CACHE_MS = 60_000;
let cached: { base: string | null; at: number } | null = null;

/**
 * n8n's public base URL. N8N_BASE_URL wins if set (e.g. http://localhost:5678
 * in dev); otherwise the URL tunnel-sync last saved in n8n_endpoint, cached 60 s.
 */
async function n8nBase(): Promise<string | null> {
  if (process.env.N8N_BASE_URL) return process.env.N8N_BASE_URL.replace(/\/$/, "");
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.base;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let base: string | null = null;
  if (url && key) {
    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.from("n8n_endpoint").select("base_url").eq("id", "n8n").maybeSingle();
    if (error) console.error("[notify] n8n_endpoint lookup failed:", error.message);
    base = data?.base_url ?? null;
  }
  cached = { base, at: Date.now() };
  return base;
}

async function post(path: string, body: object): Promise<void> {
  const secret = process.env.N8N_SHARED_SECRET;
  if (!secret) return;
  const base = await n8nBase().catch(() => null);
  if (!base) return;
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-n8n-secret": secret },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`[notify] n8n answered ${res.status}`);
  } catch (err) {
    // n8n down (PC off): the catch-up workflow covers new cases; run alerts are best effort.
    console.error("[notify] n8n unreachable:", err instanceof Error ? err.message : err);
  }
}

/** WF3: a run reached a status that needs the admin, finished, or failed. */
export function notifyRunStatus(alert: RunAlert): Promise<void> {
  if (!ALERT_STATUSES.includes(alert.status)) return Promise.resolve();
  return post("/webhook/ad-status", {
    ...alert,
    error: alert.error?.slice(0, 300) ?? null,
    adminUrl: `${siteUrl()}/admin/runs/${alert.runId}`,
  });
}

/** WF1: a player opened a new case. */
export function notifyNewCase(alert: CaseAlert): Promise<void> {
  return post("/webhook/new-case", { ...alert, adminUrl: `${siteUrl()}/admin` });
}
