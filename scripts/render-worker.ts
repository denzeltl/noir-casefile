// Ad Studio render worker. Runs on the PC that has Chrome, FFmpeg and HyperFrames.
//   npm run render-worker            poll forever
//   npm run render-worker -- --once  render at most one run, then exit
//
// Loop: find a run in waiting_render → claim it (status = rendering) → render
// video/ with the run's trailer variables → check the MP4 with ffprobe → upload
// to Supabase Storage → POST the app's resume endpoint, which moves the graph on.
// Everything goes over HTTPS (Supabase REST + the app), never direct Postgres.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const POLL_MS = 10_000;
const HEARTBEAT_MS = 30_000;
const STALE_CLAIM_MS = 10 * 60_000;
const RENDER_TIMEOUT_MS = 10 * 60_000;
const BUCKET = "ad-videos";
const TARGET_SECONDS = 15;

const env = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (put it in .env.worker or .env.local).`);
  return v;
};
const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
const APP_URL = env("AD_STUDIO_URL").replace(/\/$/, "");
const SECRET = env("N8N_SHARED_SECRET");
const once = process.argv.includes("--once");
const tmp = join(process.cwd(), "tmp");
mkdirSync(tmp, { recursive: true });

const log = (msg: string) => console.log(`[render-worker ${new Date().toISOString().slice(11, 19)}] ${msg}`);

async function heartbeat() {
  const { error } = await db
    .from("worker_heartbeat")
    .upsert({ id: "render-worker", worker_last_seen: new Date().toISOString() });
  if (error) log(`heartbeat failed: ${error.message}`);
}

/** Claim the oldest renderable run. The status filter in the update makes the claim atomic. */
async function claim(): Promise<{ id: string; trailer: Record<string, string> } | null> {
  const stale = new Date(Date.now() - STALE_CLAIM_MS).toISOString();
  const ready = `status.eq.waiting_render,and(status.eq.rendering,claimed_at.lt.${stale})`;
  const { data: next, error } = await db
    .from("ad_runs")
    .select("id")
    .or(ready)
    .order("updated_at", { ascending: true })
    .limit(1);
  if (error) throw new Error(error.message);
  if (!next?.length) return null;

  const now = new Date().toISOString();
  const { data: won, error: claimError } = await db
    .from("ad_runs")
    .update({ status: "rendering", claimed_at: now, updated_at: now })
    .eq("id", next[0].id)
    .or(ready)
    .select("id, storyboard_json");
  if (claimError) throw new Error(claimError.message);
  if (!won?.length) return null; // someone else got it
  const trailer = (won[0].storyboard_json as { trailer?: Record<string, string> } | null)?.trailer;
  if (!trailer) throw Object.assign(new Error("Run has no trailer variables."), { runId: won[0].id });
  return { id: won[0].id, trailer };
}

function run(cmd: string, args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    // shell: true so `npx` resolves on Windows; every argument here is ours, not user input.
    const child = spawn(cmd, args, { shell: true, windowsHide: true });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${cmd} timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`${cmd} exited ${code}: ${(err || out).trim().split("\n").slice(-5).join(" | ")}`));
    });
  });
}

async function render(id: string, trailer: Record<string, string>): Promise<string> {
  const vars = join(tmp, `${id}.json`);
  const mp4 = join(tmp, `${id}.mp4`);
  writeFileSync(vars, JSON.stringify(trailer));
  try {
    await run(
      "npx",
      ["hyperframes", "render", "video", "--variables-file", `"${vars}"`, "--quality", "looks", "--output", `"${mp4}"`, "--quiet"],
      RENDER_TIMEOUT_MS
    );
    if (!statSync(mp4, { throwIfNoEntry: false })?.size) throw new Error("Render produced no file.");
    const seconds = Number(
      await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `"${mp4}"`], 30_000)
    );
    if (!(Math.abs(seconds - TARGET_SECONDS) < 1)) throw new Error(`Render is ${seconds}s, expected ~${TARGET_SECONDS}s.`);

    // A new name per render, so a re-render never serves a cached copy of the old one.
    const path = `${id}/${Date.now()}.mp4`;
    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, readFileSync(mp4), { contentType: "video/mp4", upsert: true });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } finally {
    rmSync(vars, { force: true });
    rmSync(mp4, { force: true });
  }
}

async function resume(id: string, videoUrl: string) {
  const res = await fetch(`${APP_URL}/api/ads/runs/${id}/resume`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-n8n-secret": SECRET },
    body: JSON.stringify({ action: "rendered", videoUrl }),
  });
  if (!res.ok) throw new Error(`Resume answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function fail(id: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  log(`run ${id} failed: ${message}`);
  await db
    .from("ad_runs")
    .update({ status: "render_failed", error: message.slice(0, 1000), claimed_at: null, updated_at: new Date().toISOString() })
    .eq("id", id);
}

/** One pass: claim, render, upload, resume. Returns whether a run was handled. */
async function tick(): Promise<boolean> {
  let job: Awaited<ReturnType<typeof claim>>;
  try {
    job = await claim();
  } catch (err) {
    const runId = (err as { runId?: string }).runId;
    if (runId) await fail(runId, err);
    else log(`claim failed: ${err instanceof Error ? err.message : err}`);
    return Boolean(runId);
  }
  if (!job) return false;

  const started = Date.now();
  log(`rendering ${job.id}`);
  try {
    const url = await render(job.id, job.trailer);
    await resume(job.id, url);
    log(`done ${job.id} in ${((Date.now() - started) / 1000).toFixed(0)}s → ${url}`);
  } catch (err) {
    await fail(job.id, err);
  }
  return true;
}

async function ensureBucket() {
  const { error } = await db.storage.createBucket(BUCKET, { public: true, fileSizeLimit: "50MB" });
  if (error && !/exist/i.test(error.message)) throw new Error(`Bucket ${BUCKET}: ${error.message}`);
}

await ensureBucket();
await heartbeat();
const beat = setInterval(heartbeat, HEARTBEAT_MS);

if (once) {
  if (!(await tick())) log("nothing waiting to render");
  clearInterval(beat);
} else {
  log(`watching for runs every ${POLL_MS / 1000}s (Ctrl+C to stop)`);
  let stopping = false;
  process.on("SIGINT", () => {
    stopping = true;
    log("stopping after the current run");
  });
  while (!stopping) {
    // Straight to the next run when one was handled; otherwise wait a poll.
    if (!(await tick())) await new Promise((r) => setTimeout(r, POLL_MS));
  }
  clearInterval(beat);
}
