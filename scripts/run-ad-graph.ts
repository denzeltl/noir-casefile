// Run the ad graph once against a saved case, outside Next.js.
//   node --env-file=.env.local scripts/run-ad-graph.ts [caseId]
// With no caseId it uses the newest case.
import { createClient } from "@supabase/supabase-js";
import type { AdBrief } from "../src/lib/ads/brief.ts";
import { buildAdGraph, RECURSION_LIMIT } from "../src/lib/ads/graph.ts";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const caseId = process.argv[2];
// brief_json only: the script never loads the solution.
const query = db.from("cases").select("id, brief_json").order("created_at", { ascending: false }).limit(1);
const { data, error } = caseId ? await query.eq("id", caseId) : await query;
if (error || !data?.length) throw new Error(error?.message ?? "No case found");

const brief = data[0].brief_json as AdBrief;
console.log(`Case: ${brief.title} (${data[0].id})\n`);

const started = Date.now();
const result = await buildAdGraph().invoke({ brief }, { recursionLimit: RECURSION_LIMIT });

console.log(`Trail: ${result.trail.join(" → ")}`);
console.log(`Loops: ${result.loops}   (${((Date.now() - started) / 1000).toFixed(1)}s)\n`);
for (const h of result.hooks) {
  console.log(`[${h.score}/10] ${h.hook}   (${h.angle})`);
  console.log(`   ${h.script}`);
  console.log(`   critic: ${h.feedback}\n`);
}
