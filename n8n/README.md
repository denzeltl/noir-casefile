# n8n + Telegram for the Ad Studio

LangGraph runs the AI pipeline; n8n handles the glue: Telegram alerts and the
"Create ad" button. The Next.js API stays the source of truth, and n8n only
calls it.

| Workflow | Trigger | What it does |
|---|---|---|
| WF1 New case alert | app → `POST /webhook/new-case` | Telegram message per new case with **Create ad** / **Skip**, then marks the case alerted |
| WF2 Button handler | Telegram → `POST /webhook/telegram` | Checks the secret token and your chat id, starts the run (`POST /api/ads/runs`, idempotent), edits the message |
| WF3 Run status alerts | app → `POST /webhook/ad-status` | Message on `waiting_hook`, `waiting_video` (with the MP4), `ready_to_post`, `render_failed`, `failed` |
| WF4 Worker offline | every 10 min | One warning when runs wait and the PC render worker is offline, one when it's back |
| Catch-up digest | n8n start + every 15 min | One message for cases that never got an alert (n8n was down) |

The new-case alert comes from the app with the spoiler-free brief only. There's
deliberately no Supabase database webhook on `cases`: it would send the whole
row to n8n, solution included.

The workflow JSON in `workflows/` is generated from `build-workflows.mjs`
(readable code; run `node n8n/build-workflows.mjs` after editing). It holds no
secrets and needs no n8n credentials: every workflow reads its config from
n8n's environment.

## One-time setup

1. **Docker Desktop.** Install it, then Settings → General → turn on
   **Start Docker Desktop when you sign in**. (n8n 2.x doesn't install natively on Windows.)
2. **Telegram bot.** Message [@BotFather](https://t.me/BotFather) → `/newbot` →
   copy the token. Message your bot once, then get your chat id from
   [@userinfobot](https://t.me/userinfobot).
3. **Config.** Copy `n8n/.env.example` to `n8n/.env` and fill it in.
   `N8N_SHARED_SECRET` matches the app's. `AD_STUDIO_URL` is the app n8n talks
   to: `http://host.docker.internal:3000` for the local dev server, your live
   domain once the Ad Studio is deployed.
4. **Database.** Run `supabase/schema.sql` in the Supabase SQL editor (it adds
   the `n8n_endpoint` table).
5. **Start.** In Git Bash, prefix `docker compose exec` commands with
   `MSYS_NO_PATHCONV=1`, or `/workflows` gets rewritten to a Windows path.
   ```bash
   docker compose -f n8n/docker-compose.yml --env-file n8n/.env up -d
   MSYS_NO_PATHCONV=1 docker compose -f n8n/docker-compose.yml exec n8n n8n import:workflow --separate --input=/workflows
   ```
   Publish each workflow (`n8n list:workflow` shows the ids), then
   `docker compose -f n8n/docker-compose.yml restart n8n`:
   ```bash
   MSYS_NO_PATHCONV=1 docker compose -f n8n/docker-compose.yml exec n8n n8n publish:workflow --id=<id>
   ```
   Open http://localhost:5678 once to create the owner account.

That's all. There's no webhook to register and no URL to copy anywhere.

## How the quick tunnel stays hands-off

`cloudflared` runs a free quick tunnel (`https://<random>.trycloudflare.com`).
Its URL changes every time the container restarts. The `tunnel-sync` container
checks every 30 s and, when the URL changed:

- re-registers the Telegram webhook (button taps made meanwhile are kept and arrive), and
- saves the URL in the app via `POST /api/ads/n8n-endpoint`. The app and the
  render worker read it from the `n8n_endpoint` table (cached 60 s), so Vercel
  needs no env change or redeploy. `N8N_BASE_URL` overrides it if set.

If the app isn't reachable yet (dev server off, or not deployed), it keeps retrying.
`docker compose -f n8n/docker-compose.yml logs -f tunnel-sync` shows what it did.

Docker Desktop starts at login and the containers restart on their own, so after
a PC restart everything comes back without you. While the PC or Docker is off,
nothing reaches Telegram: run alerts are skipped (each is still visible in the
admin), new cases arrive in the catch-up digest when n8n is back, and button taps
wait at Telegram for up to 24 hours. WF4 can't warn you about this, since it runs
inside n8n.

For a permanent URL later (a domain on Cloudflare), stop `cloudflared` and
`tunnel-sync`, set `CLOUDFLARE_TUNNEL_TOKEN`, start with `--profile named`, and
register the Telegram webhook and `n8n_endpoint` once by hand.

## After editing a workflow in the n8n UI

Export it back so the repo stays the source:
```bash
MSYS_NO_PATHCONV=1 docker compose -f n8n/docker-compose.yml exec n8n n8n export:workflow --all --separate --output=/home/node/.n8n/export
```
then copy the changes into `build-workflows.mjs`, or edit there first and re-import.
