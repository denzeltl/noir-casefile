// Builds the importable n8n workflow JSON in n8n/workflows/ from the readable
// code below. Run after editing: node n8n/build-workflows.mjs
//
// Every workflow reads its config from n8n's environment ($env), so the JSON
// holds no secrets and needs no n8n credentials: TELEGRAM_BOT_TOKEN,
// TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET, AD_STUDIO_URL, N8N_SHARED_SECRET.
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const out = new URL("./workflows/", import.meta.url);
mkdirSync(out, { recursive: true });

// Stable ids so re-building doesn't churn the diff.
const id = (seed) => {
  const h = createHash("sha1").update(seed).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};

// Shared helpers, prepended to every Code node.
const HELPERS = `
const tg = (method, body) => this.helpers.httpRequest({
  method: "POST",
  url: "https://api.telegram.org/bot" + $env.TELEGRAM_BOT_TOKEN + "/" + method,
  body, json: true,
});
const app = (method, path, body) => this.helpers.httpRequest({
  method,
  url: $env.AD_STUDIO_URL.replace(/\\/$/, "") + path,
  headers: { "x-n8n-secret": $env.N8N_SHARED_SECRET },
  body, json: true,
});
// A webhook call must carry the shared secret (the app sends it on every alert).
const fromApp = (req) => req.headers["x-n8n-secret"] === $env.N8N_SHARED_SECRET;
const caseButtons = (caseId) => ({
  inline_keyboard: [[
    { text: "Create ad", callback_data: "create:" + caseId },
    { text: "Skip", callback_data: "skip:" + caseId },
  ]],
});
`;

const code = (name, body, position) => ({
  parameters: { jsCode: `${HELPERS}\n${body.trim()}\n` },
  id: id(name),
  name,
  type: "n8n-nodes-base.code",
  typeVersion: 2,
  position,
});

const webhook = (name, path) => ({
  parameters: { httpMethod: "POST", path, responseMode: "onReceived", options: {} },
  id: id(name),
  name,
  type: "n8n-nodes-base.webhook",
  typeVersion: 2,
  position: [0, 0],
  webhookId: id(`hook:${path}`),
});

const schedule = (name, minutes) => ({
  parameters: { rule: { interval: [{ field: "minutes", minutesInterval: minutes }] } },
  id: id(name),
  name,
  type: "n8n-nodes-base.scheduleTrigger",
  typeVersion: 1.2,
  position: [0, 0],
});

const chain = (...names) =>
  Object.fromEntries(names.slice(0, -1).map((n, i) => [n, { main: [[{ node: names[i + 1], type: "main", index: 0 }]] }]));

function workflow(file, name, nodes, connections) {
  const wf = { name, nodes, connections, settings: { executionOrder: "v1" }, pinData: {}, active: false, id: id(file).replace(/-/g, "").slice(0, 16) };
  writeFileSync(new URL(file, out), JSON.stringify(wf, null, 2) + "\n");
  console.log(`wrote n8n/workflows/${file}`);
}

// ── WF1: new case → Telegram message with Create ad / Skip ────────────────────
workflow(
  "wf1-new-case-alert.json",
  "Noir Ad Studio · WF1 New case alert",
  [
    webhook("New case (from app)", "new-case"),
    code(
      "Send alert",
      `
const req = $input.first().json;
if (!fromApp(req)) return [];
const c = req.body;
// Optional filter, e.g. ALERT_DIFFICULTIES=hard,noir. Unset = every case.
const only = ($env.ALERT_DIFFICULTIES || "").split(",").map((s) => s.trim()).filter(Boolean);
if (only.length && !only.includes(c.difficulty)) return [];

await tg("sendMessage", {
  chat_id: $env.TELEGRAM_CHAT_ID,
  text: "New case opened\\n\\n" + c.title + "\\n" + c.setting + "\\nDifficulty: " + c.difficulty + "\\n\\n" + c.adminUrl,
  reply_markup: caseButtons(c.caseId),
  link_preview_options: { is_disabled: true },
});
// Mark it so the catch-up digest doesn't send it again.
await app("POST", "/api/ads/alerts/cases", { caseIds: [c.caseId] });
return [{ json: { alerted: c.caseId } }];
`,
      [260, 0]
    ),
  ],
  chain("New case (from app)", "Send alert")
);

// ── WF2: Telegram button tap → start the ad run (idempotent in the app) ──────
workflow(
  "wf2-telegram-buttons.json",
  "Noir Ad Studio · WF2 Telegram button handler",
  [
    webhook("Telegram update", "telegram"),
    code(
      "Handle button",
      `
const req = $input.first().json;
// Telegram echoes the secret set with setWebhook; anything else is forged.
if (req.headers["x-telegram-bot-api-secret-token"] !== $env.TELEGRAM_WEBHOOK_SECRET) return [];
const q = req.body.callback_query;
if (!q) return [];
// Only my own chat may start runs.
if (String(q.message?.chat?.id) !== String($env.TELEGRAM_CHAT_ID)) {
  await tg("answerCallbackQuery", { callback_query_id: q.id, text: "Not allowed." });
  return [];
}

const [action, caseId] = String(q.data || "").split(":");
let note;
if (action === "create") {
  // The app returns the existing run on a double tap instead of starting another.
  const res = await app("POST", "/api/ads/runs", { caseIds: [caseId] });
  const run = res.runs?.[0];
  note = !run ? "Couldn't start: " + (res.errors?.[0]?.error || "unknown error")
    : run.created ? "Ad run started." : "Already running (" + run.status.replace(/_/g, " ") + ").";
} else if (action === "skip") {
  note = "Skipped.";
} else {
  return [];
}

await tg("answerCallbackQuery", { callback_query_id: q.id, text: note });
// Replace the buttons with the outcome so the message can't be tapped again.
await tg("editMessageText", {
  chat_id: q.message.chat.id,
  message_id: q.message.message_id,
  text: q.message.text + "\\n\\n→ " + note,
  link_preview_options: { is_disabled: true },
});
return [{ json: { action, caseId, note } }];
`,
      [260, 0]
    ),
  ],
  chain("Telegram update", "Handle button")
);

// ── WF3: run status → Telegram, with the MP4 attached when it needs review ───
workflow(
  "wf3-run-status-alerts.json",
  "Noir Ad Studio · WF3 Run status alerts",
  [
    webhook("Run status (from app)", "ad-status"),
    code(
      "Build message",
      `
const req = $input.first().json;
if (!fromApp(req)) return [];
const r = req.body;
const lines = {
  waiting_hook: "Hooks are ready. Pick one:",
  waiting_video: "The trailer is rendered. Approve, re-render or discard:",
  ready_to_post: "Approved and ready to post. Download it from:",
  render_failed: "The render failed: " + (r.error || "no error recorded") + "\\nRetry from:",
  failed: "The run failed: " + (r.error || "no error recorded") + "\\nOpen:",
};
const text = r.caseTitle + "\\n" + (lines[r.status] || r.status) + "\\n" + r.adminUrl;
// Attach the preview when a video needs a decision (Telegram fetches it by URL, up to 20 MB).
const withVideo = r.status === "waiting_video" && r.videoUrl;
return [{
  json: {
    method: withVideo ? "sendVideo" : "sendMessage",
    payload: withVideo
      ? { chat_id: $env.TELEGRAM_CHAT_ID, video: r.videoUrl, caption: text, supports_streaming: true }
      : { chat_id: $env.TELEGRAM_CHAT_ID, text, link_preview_options: { is_disabled: true } },
  },
}];
`,
      [260, 0]
    ),
    {
      parameters: {
        method: "POST",
        url: "={{ 'https://api.telegram.org/bot' + $env.TELEGRAM_BOT_TOKEN + '/' + $json.method }}",
        sendBody: true,
        specifyBody: "json",
        jsonBody: "={{ JSON.stringify($json.payload) }}",
        options: {},
      },
      id: id("Send to Telegram"),
      name: "Send to Telegram",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [520, 0],
    },
  ],
  chain("Run status (from app)", "Build message", "Send to Telegram")
);

// ── WF4: every 10 min, warn once when the PC render worker is offline ────────
workflow(
  "wf4-worker-offline-alert.json",
  "Noir Ad Studio · WF4 Worker offline alert",
  [
    schedule("Every 10 minutes", 10),
    code(
      "Check worker",
      `
const w = await app("GET", "/api/ads/worker");
// Remember whether we already warned, so an outage sends one message, not one every 10 min.
const memo = $getWorkflowStaticData("global");
const down = !w.online && w.waiting > 0;
if (!down) {
  if (memo.warned) {
    memo.warned = false;
    await tg("sendMessage", { chat_id: $env.TELEGRAM_CHAT_ID, text: "Render worker is back online." });
  }
  return [];
}
if (memo.warned) return [];
memo.warned = true;
const seen = w.lastSeen ? "Last seen " + new Date(w.lastSeen).toLocaleString() + "." : "It has never checked in.";
await tg("sendMessage", {
  chat_id: $env.TELEGRAM_CHAT_ID,
  text: "Render worker is offline, " + w.waiting + (w.waiting === 1 ? " run" : " runs") + " waiting. " + seen + "\\nStart it with: npm run render-worker",
});
return [{ json: w }];
`,
      [260, 0]
    ),
  ],
  chain("Every 10 minutes", "Check worker")
);

// ── Catch-up: on n8n start and every 15 min, one digest for unalerted cases ──
workflow(
  "wf5-catch-up-digest.json",
  "Noir Ad Studio · Catch-up digest",
  [
    {
      parameters: { events: ["init"] },
      id: id("When n8n starts"),
      name: "When n8n starts",
      type: "n8n-nodes-base.n8nTrigger",
      typeVersion: 1,
      position: [0, -120],
    },
    schedule("Every 15 minutes", 15),
    code(
      "Send digest",
      `
const { cases, adminUrl } = await app("GET", "/api/ads/alerts/cases");
const fresh = cases.filter((c) => !c.hasAd);
const ids = cases.map((c) => c.caseId);
if (!fresh.length) {
  if (ids.length) await app("POST", "/api/ads/alerts/cases", { caseIds: ids });
  return [];
}
if (fresh.length === 1) {
  const c = fresh[0];
  await tg("sendMessage", {
    chat_id: $env.TELEGRAM_CHAT_ID,
    text: "New case opened\\n\\n" + c.title + "\\n" + c.setting + "\\nDifficulty: " + c.difficulty + "\\n\\n" + adminUrl,
    reply_markup: caseButtons(c.caseId),
    link_preview_options: { is_disabled: true },
  });
} else {
  // One message for the lot, with a Create ad button per case (Telegram allows plenty of rows).
  const shown = fresh.slice(0, 10);
  await tg("sendMessage", {
    chat_id: $env.TELEGRAM_CHAT_ID,
    text: fresh.length + " new games while you were away:\\n\\n" +
      shown.map((c, i) => (i + 1) + ". " + c.title + " (" + c.difficulty + ")").join("\\n") +
      (fresh.length > shown.length ? "\\n…and " + (fresh.length - shown.length) + " more" : "") +
      "\\n\\n" + adminUrl,
    reply_markup: { inline_keyboard: shown.map((c, i) => [{ text: "Create ad #" + (i + 1), callback_data: "create:" + c.caseId }]) },
    link_preview_options: { is_disabled: true },
  });
}
await app("POST", "/api/ads/alerts/cases", { caseIds: ids });
return [{ json: { sent: fresh.length } }];
`,
      [260, 0]
    ),
  ],
  {
    "When n8n starts": { main: [[{ node: "Send digest", type: "main", index: 0 }]] },
    "Every 15 minutes": { main: [[{ node: "Send digest", type: "main", index: 0 }]] },
  }
);
