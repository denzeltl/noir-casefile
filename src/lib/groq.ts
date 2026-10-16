import Groq from "groq-sdk";

/**
 * Server-side Groq client with multi-key failover and rate-limit cooldown handling.
 * This file must NEVER be imported from client components.
 */

// Gather all configured keys from environment variables
const rawKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_BACKUP,
  process.env.GROQ_API_KEY_2,
  ...(process.env.GROQ_API_KEYS ? process.env.GROQ_API_KEYS.split(",") : []),
]
  .map((k) => k?.trim())
  .filter((k): k is string => Boolean(k && k.length > 0));

// Deduplicate keys while maintaining order
const apiKeys = Array.from(new Set(rawKeys));

if (apiKeys.length === 0) {
  throw new Error(
    "Missing GROQ_API_KEY environment variable. " +
      "Get a free key at https://console.groq.com/keys and add it to .env.local"
  );
}

// Pre-initialize Groq clients for each key
const clients = apiKeys.map((apiKey) => new Groq({ apiKey }));

// Cooldown tracker per key index (e.g. after hitting a 429 rate limit)
const keyCooldowns = new Map<number, number>();
const COOLDOWN_DURATION_MS = 60_000; // 60 seconds cooldown

function isCoolingDown(index: number): boolean {
  const until = keyCooldowns.get(index);
  if (!until) return false;
  if (Date.now() >= until) {
    keyCooldowns.delete(index);
    return false;
  }
  return true;
}

function markCooldown(index: number) {
  keyCooldowns.set(index, Date.now() + COOLDOWN_DURATION_MS);
}

/**
 * Prioritize keys that are not currently cooling down.
 * If all keys are cooling down, still try them in order as a fallback.
 */
function getKeyOrder(): number[] {
  const ready: number[] = [];
  const cooling: number[] = [];

  for (let i = 0; i < clients.length; i++) {
    if (isCoolingDown(i)) {
      cooling.push(i);
    } else {
      ready.push(i);
    }
  }

  return ready.length > 0 ? [...ready, ...cooling] : cooling;
}

/**
 * Wraps chat.completions.create with automatic retry and failover across configured keys.
 */
async function createChatCompletion(
  body: Parameters<Groq["chat"]["completions"]["create"]>[0],
  options?: Parameters<Groq["chat"]["completions"]["create"]>[1]
): Promise<any> {
  const keyOrder = getKeyOrder();
  let lastError: unknown;

  for (let attempt = 0; attempt < keyOrder.length; attempt++) {
    const keyIndex = keyOrder[attempt];
    const client = clients[keyIndex];

    try {
      return await client.chat.completions.create(body as any, options);
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.statusCode;
      const isRateLimit = status === 429 || /rate[-_ ]?limit/i.test(err?.message || "");
      const isAuthOrQuota = status === 401 || status === 403 || /quota/i.test(err?.message || "");

      console.warn(
        `[Groq] Key #${keyIndex + 1} failed (status: ${status || "unknown"}${
          isRateLimit ? " - Rate Limit" : isAuthOrQuota ? " - Auth/Quota Issue" : ""
        }).`
      );

      // Place key on cooldown so subsequent calls don't waste time retrying it immediately
      if (isRateLimit || isAuthOrQuota || (status && status >= 500)) {
        markCooldown(keyIndex);
      }

      const hasNextKey = attempt < keyOrder.length - 1;
      if (hasNextKey) {
        const nextIndex = keyOrder[attempt + 1];
        console.warn(`[Groq] Seamlessly falling back to Key #${nextIndex + 1}...`);
      }
    }
  }

  throw lastError;
}

// Proxy the primary client to provide transparent fallback on completions
const groq = new Proxy(clients[0], {
  get(target, prop, receiver) {
    if (prop === "chat") {
      return {
        ...target.chat,
        completions: {
          ...target.chat.completions,
          create: createChatCompletion as Groq["chat"]["completions"]["create"],
        },
      };
    }
    return Reflect.get(target, prop, receiver);
  },
}) as unknown as Groq;

export default groq;

