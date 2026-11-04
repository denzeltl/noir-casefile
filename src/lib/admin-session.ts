// Admin session cookie: "<expiry>.<hmac>", signed with ADMIN_PASSWORD.
// Web Crypto only, so it runs in proxy.ts as well as route handlers.

export const ADMIN_COOKIE = "nc_admin";
export const SESSION_SECONDS = 60 * 60 * 24 * 7;

const enc = new TextEncoder();

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return Buffer.from(sig).toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(secret: string): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${exp}.${await sign(exp, secret)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await sign(exp, secret));
}

/** x-n8n-secret check; false when N8N_SHARED_SECRET isn't set. */
export async function n8nSecretMatches(input: string | null): Promise<boolean> {
  const secret = process.env.N8N_SHARED_SECRET;
  if (!secret || !input) return false;
  return safeEqual(await sign(input, "n8n"), await sign(secret, "n8n"));
}

/** Constant-time password check (hashing first evens out lengths). */
export async function passwordMatches(input: string): Promise<boolean> {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  return safeEqual(await sign(input, "pw"), await sign(secret, "pw"));
}
