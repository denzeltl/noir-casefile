// Keeps Telegram and the app pointed at the current quick-tunnel URL.
// Runs in the tunnel-sync container (see docker-compose.yml). Every 30 s it asks
// cloudflared for its hostname; when that differs from what Telegram or the app
// has, it updates them. Retries until both accept, so it doesn't matter which
// comes up first after a restart (Docker, the tunnel, or the app).

const METRICS = process.env.TUNNEL_METRICS_URL ?? "http://cloudflared:2000";
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const APP = (process.env.AD_STUDIO_URL ?? "").replace(/\/$/, "");
const SHARED = process.env.N8N_SHARED_SECRET;
const EVERY_MS = 30_000;

const log = (msg) => console.log(`[tunnel-sync ${new Date().toISOString().slice(11, 19)}] ${msg}`);

for (const [k, v] of Object.entries({ TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_WEBHOOK_SECRET: TG_SECRET, AD_STUDIO_URL: APP, N8N_SHARED_SECRET: SHARED })) {
  if (!v) log(`${k} is not set in n8n/.env`);
}

let appSynced = null; // base URL the app last accepted

async function tunnelUrl() {
  const res = await fetch(`${METRICS}/quicktunnel`, { signal: AbortSignal.timeout(5000) });
  const { hostname } = await res.json();
  return hostname ? `https://${hostname}` : null;
}

async function syncTelegram(base) {
  const want = `${base}/webhook/telegram`;
  const info = await fetch(`https://api.telegram.org/bot${TOKEN}/getWebhookInfo`).then((r) => r.json());
  if (info.result?.url === want) return;
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    // Pending taps are kept, so ones made while the PC was off still arrive.
    body: JSON.stringify({ url: want, secret_token: TG_SECRET, allowed_updates: ["callback_query"] }),
  }).then((r) => r.json());
  if (!res.ok) throw new Error(`Telegram setWebhook: ${res.description}`);
  log(`Telegram webhook → ${want}`);
}

async function syncApp(base) {
  if (appSynced === base) return;
  const res = await fetch(`${APP}/api/ads/n8n-endpoint`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-n8n-secret": SHARED },
    body: JSON.stringify({ baseUrl: base }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`app answered ${res.status}`);
  appSynced = base;
  log(`app n8n URL → ${base}`);
}

async function tick() {
  let base;
  try {
    base = await tunnelUrl();
  } catch {
    return log("tunnel not up yet");
  }
  if (!base) return log("tunnel has no URL yet");
  for (const [name, fn] of [["Telegram", syncTelegram], ["app", syncApp]]) {
    try {
      await fn(base);
    } catch (err) {
      log(`${name} sync failed, will retry: ${err.message}`);
    }
  }
}

log(`watching ${METRICS}`);
await tick();
setInterval(tick, EVERY_MS);
