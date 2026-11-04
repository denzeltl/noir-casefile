# Handoff: Noir Casefile Ad Studio

Build an admin-only "Ad Studio" inside Noir Casefile. When a player starts a game, the case gets saved. From an admin page I can choose to create a short promo ad for any case. A LangGraph pipeline writes hooks, critiques them, pauses for my approval, writes a storyboard, renders a 15-second vertical trailer, pauses again for approval, then puts it in a "ready to post" queue.

Goals: a real portfolio piece showing LangGraph (state, loops, `interrupt()` human-in-the-loop, checkpointing), LangChain (structured output, multiple providers), and a polished admin UI. Free to run: **Groq + Gemini free tiers only.**

## Current project (as of 2026-11-04)

- Next.js 16.4 (App Router), React 19, TypeScript, Tailwind 4, Motion, Zod 4, `groq-sdk`.
- **Read `AGENTS.md` first:** this Next.js version has breaking changes. Check `node_modules/next/dist/docs/` before writing routes or pages.
- `src/lib/groq.ts`: server-only Groq client with multi-key failover and 429 cooldown. Reuse this pattern; don't break it.
- `src/app/api/generate-case/route.ts`: generates a Zod-validated `Case` (`src/types/case.ts`) with Groq.
- `src/app/api/interrogate/route.ts`: suspect chat.
- **No database.** Cases live only in the browser (`localStorage` in `src/context/GameContext.tsx`). The backend can't see a case today. Step 1 fixes that.

## Spoiler rule (important)

A `Case` contains `solution`, `isKiller` and `alibiFlawed`. **The ad pipeline must never receive these fields.** Build a `toAdBrief(case)` function that keeps only title, setting, narrative, victim, weapon (optional), clue names and suspect names/occupations/personalities. Pass only the brief to any LLM node. Add a test that the brief has no `solution`/`isKiller`/`alibiFlawed`.

## Architecture

```
Player starts game → /api/generate-case → case saved to DB (cases table)

/admin (password-protected)
  Cases list → [Create ad] → POST /api/ads/runs  → start graph (thread_id = run id)

LangGraph (server, checkpointed to Postgres)
  brief      : toAdBrief(case)                       (code, no LLM)
  hookWriter : 5 hooks + 15-sec scripts              (Groq, structured output)
  critic     : score each 1-10 + feedback            (Gemini, structured output)
     └─ best < 7 and loops < 3 → back to hookWriter with feedback
  ⏸ interrupt #1 "pick_hook": choose / edit / "rewrite: <note>" (→ hookWriter)
  storyboard : 4-6 shots, overlay text, timings      (Groq, structured output)
  render     : status = waiting_render; HyperFrames worker renders 1080x1920 MP4, ~15s, then resumes the graph
  ⏸ interrupt #2 "approve_video": approve / re-render / discard
  queue      : status = ready_to_post                 (code)

/admin/runs/[id]  shows state, waits for decisions, POST /api/ads/runs/[id]/resume
```

Using two providers on purpose: the writer and the critic on different models gives a less self-agreeing critique, and it shows LangChain's provider swap in practice.

## n8n + Telegram layer

Split of jobs: **LangGraph = the AI pipeline** (loops, state, pauses). **n8n = triggers, alerts and glue** (new-case alerts, chat buttons, notifications, scheduled cleanup). The Next.js API stays the single source of truth; n8n only calls it.

### Two ways to start an ad (same endpoint)

1. **Admin UI:** `/admin` cases list with filters (difficulty, date, "has ad / no ad") and checkboxes. Select one or more games → "Create ad" → `POST /api/ads/runs` with `{ caseIds: [...] }`. Show each case's ad status badge (none / running / waiting / ready).
2. **Chat button:** n8n sends a Telegram message for a new case with inline buttons **Create ad** / **Skip**. Tapping Create ad makes n8n call the same `POST /api/ads/runs`.

### n8n workflows

- **WF1 New case alert:** Supabase database webhook on `cases` INSERT → n8n Webhook → filter (e.g. skip if an ad already exists, optional only `hard`/`noir`, optional digest instead of one message per case) → Telegram message: case title, setting, difficulty, link to `/admin/cases/{id}`, buttons Create ad / Skip.
- **WF2 Button handler:** Telegram Trigger (callback_query) → check the chat ID is mine → `POST /api/ads/runs` with header `x-n8n-secret` → edit the Telegram message to "Ad run started".
- **WF3 Run status alerts:** the app calls an n8n webhook whenever `ad_runs.status` changes to `waiting_hook`, `waiting_video`, `ready_to_post`, `render_failed` or `failed` → Telegram message with a deep link to `/admin/runs/{id}`. For `waiting_video`, attach the MP4 preview (Telegram sendVideo, up to 50 MB).
- **WF4 Worker offline alert (schedule, every 10 min):** if a run is in `waiting_render` and `worker_last_seen` is older than 2 minutes → "Render worker is offline, N runs waiting."
- **WF5 Weekly cleanup (optional):** delete Storage files for `discarded` runs older than 7 days.

Approvals (pick hook, approve video) stay in the admin UI, reached through the deep link. Optional later: Approve / Re-render / Discard buttons in Telegram that call the resume endpoint.

### Chat channel: Telegram only

- **Telegram:** a bot from @BotFather, inline buttons, video previews, and n8n's built-in Telegram nodes. Easiest way to get tappable buttons.

### Security

- API routes called by n8n require `x-n8n-secret` (`N8N_SHARED_SECRET`); reject without it.
- The Telegram handler accepts callbacks only from `TELEGRAM_CHAT_ID`.
- Messages contain only the spoiler-free brief, never the solution.
- Make `POST /api/ads/runs` idempotent per case: if a run is already active for that case, return it instead of starting another (double taps).

### Hosting n8n (free)

Self-host n8n in Docker on the same PC as the render worker. Telegram and Supabase webhooks need a public HTTPS URL, so expose n8n through a **Cloudflare Tunnel** (free) and set `WEBHOOK_URL` to it. Same trade-off as the worker: the PC must be on. Alternative: n8n Cloud trial.

**Don't lose alerts while the PC is off.** Webhooks sent while n8n is down are lost, so add `cases.alerted_at`. WF1 sets it after sending. A catch-up workflow (on n8n startup + every 15 min) sends one digest for cases with `alerted_at IS NULL` ("4 new games while you were away") with a link to the admin. Telegram button taps are held by Telegram for up to 24 hours, so taps made while n8n is down still arrive when it comes back. Export every workflow as JSON into `n8n/` in this repo so it's versioned and shows up in the portfolio.

## Stack to add

- `@langchain/langgraph`, `@langchain/core`, `@langchain/groq`, `@langchain/google-genai`
- `@langchain/langgraph-checkpoint-postgres` (pause/resume that survives restarts)
- Supabase (free tier): Postgres for `cases`, `ad_runs`, the checkpointer, and Storage for MP4s
- HyperFrames (`npx hyperframes`, needs Node 22+, Chrome and FFmpeg) on the machine that runs the render worker. Load the `hyperframes` / `hyperframes-cli` skills before writing the composition
- Optional: LangSmith free tier for tracing (`LANGSMITH_TRACING=true`, `LANGSMITH_API_KEY`)

Env vars (add to `.env.example`, values in `.env.local`):
`GOOGLE_API_KEY`, `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `N8N_SHARED_SECRET`, plus the existing Groq keys. In n8n: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

Check the current Groq and Gemini free-tier models and rate limits on their sites before choosing model names. Keep model names in one config file, not scattered through nodes.

## Data model (Supabase)

- `cases`: `id` (the existing `case-…` id), `created_at`, `difficulty`, `case_json` (full Case, server-only), `brief_json` (spoiler-free).
- `ad_runs`: `id` (= LangGraph thread_id), `case_id`, `status` (`running | waiting_hook | waiting_video | ready_to_post | discarded | failed`), `hooks_json`, `chosen_hook`, `storyboard_json`, `video_url`, `loops`, `error`, timestamps.
- Never expose `case_json` to the client. Admin pages read `brief_json` and run data only.

## Build order

1. **Persist cases.** After `/api/generate-case` validates the case, insert it into `cases` along with `brief_json`. Don't slow the player down: log and swallow DB errors, the game must still work without the DB.
2. **Admin shell.** `/admin` behind `ADMIN_PASSWORD` (middleware/proxy + cookie is enough). Cases list with a "Create ad" button. Match the existing noir look.
3. **Graph v1, no interrupts.** `brief → hookWriter → critic` with the loop and a max of 3. Zod schemas + `.withStructuredOutput()`. Run it from a script first, then from `POST /api/ads/runs`.
4. **Checkpointer + interrupt #1.** Postgres checkpointer, `interrupt()` after the critic, `/admin/runs/[id]` showing hooks with scores, and a resume route (`Command({ resume: … })`). Support choose, edit-text, and "rewrite with note".
5. **Storyboard + render (HyperFrames worker).**
   - Put one noir trailer composition in `video/` (HTML/CSS animation, 1080x1920, ~15s) with composition variables matching the storyboard schema (title, hook, shot texts, suspect names, timings). Pass only the spoiler-free storyboard in as variables.
   - The graph's render node only sets `ad_runs.status = waiting_render` and stores the storyboard. No rendering happens on Vercel.
   - `scripts/render-worker.ts` (`npm run render-worker`) runs on my PC: it subscribes to Supabase Realtime (or polls every ~10s) for `waiting_render` runs, claims one atomically (`status = rendering`), runs `npx hyperframes render --variables-file … --quality looks --output tmp/{runId}.mp4`, checks the file is non-empty with `ffprobe` duration ≈ 15s, uploads it to Supabase Storage, deletes the local file, then resumes the graph (resume endpoint or direct `graph.invoke(Command…)`), which reaches interrupt #2.
   - On failure: `status = render_failed` with the error, and a Retry button in the admin. If a claim is older than 10 minutes, treat it as stale and allow a re-claim.
   - Render one run at a time. The worker uses the service-role key from its own `.env`, never in the browser.
   - Admin shows "Waiting for render worker" plus a worker heartbeat (`worker_last_seen` updated every 30s) so I know whether my PC's worker is online.
   - Auto-start option: Windows Task Scheduler at login, or `pm2`.
   - **Render alternatives (swap the render step only):** Canvas + WebCodecs in the browser (fastest, free, works from the live site); ffmpeg.wasm in the browser (free, ~30s–3min); HyperFrames cloud render (HeyGen, paid per credit, `--callback-url` webhook resumes the graph). Same `waiting_render` → upload → resume contract for all of them.
6. **Interrupt #2 + queue.** Video preview with Approve / Re-render / Discard. A "Ready to post" tab with a download button. **No TikTok API**: posting it through the API needs app review. Download and post by hand.
7. **n8n + Telegram.** Docker n8n + Cloudflare Tunnel, Telegram bot, then WF3 (status alerts) first since it's the simplest, then WF1 + WF2 (new-case alert with Create ad button), then WF4. Add the multi-select cases UI in the admin. Export workflows to `n8n/`.
8. **Polish.** Error states, a retry button on a failed run, a timeline of nodes visited per run, the README section, a Loom walkthrough.

## Guardrails

- Never send spoiler fields to any model (see the spoiler rule).
- Cap loops (max 3) and set `recursionLimit` on the graph.
- Handle free-tier 429s: reuse the cooldown/failover idea from `src/lib/groq.ts`, and fall back Groq ↔ Gemini on a node when one provider is rate-limited.
- Validate every LLM output with Zod. On parse failure, retry once with the error message, then mark the run `failed`.
- All LLM and DB code stays server-only. No keys in client components.

## Done when

- Starting a game saves the case. `/admin` lists it.
- "Create ad" runs the graph, loops on low scores, and pauses for me to pick a hook.
- I can edit or ask for a rewrite, then approve a storyboard. An MP4 renders, and I can approve or re-render it.
- Approved videos appear in "Ready to post" and download.
- Restarting the dev server mid-pause, the run resumes from the same point.
- Approving a storyboard on the live Vercel site gets rendered by the worker on my PC within about a minute, and the MP4 appears for approval. With the worker off, the run waits and renders when I start it.
- I can select one or more games in the admin and start ad runs.
- A new game sends a Telegram alert; tapping Create ad starts a run, and a double tap doesn't start two.
- I get a Telegram message when a run needs my decision, is ready, fails, or the worker is offline.
- No spoiler fields reach any LLM call or chat message (test passes).
- README explains the graph, why LangGraph (loops, durable pauses, two providers), and how to run it.

## For my CV afterwards

Once it works, go back to the job-hunt repo and run `/career-ops add` so LangGraph, LangChain, Gemini API, FFmpeg and human-in-the-loop become real CV claims. Add n8n and Telegram bot integration too.
