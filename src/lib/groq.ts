import Groq from "groq-sdk";

/**
 * Server-side only Groq client singleton.
 * This file must NEVER be imported from client components.
 */
if (!process.env.GROQ_API_KEY) {
  throw new Error(
    "Missing GROQ_API_KEY environment variable. " +
      "Get a free key at https://console.groq.com/keys and add it to .env.local"
  );
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default groq;
