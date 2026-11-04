import { test } from "node:test";
import assert from "node:assert/strict";
import { toAdBrief } from "./brief.ts";
import type { Case } from "../../types/case.ts";

const sample: Case = {
  id: "case-1",
  title: "The Last Martini",
  setting: "A jazz club in 1947 Chicago.",
  narrative: "Rain on the glass. A body behind the bar.",
  victim: { name: "Lou Marsh", age: 52, occupation: "Club owner", causeOfDeath: "Poisoning" },
  weapon: "Cyanide",
  clues: [
    { id: "clue-1", name: "Lipstick glass", description: "SECRET-DESC", location: "Bar" },
    { id: "clue-2", name: "Torn ticket", description: "SECRET-DESC", location: "Stage" },
    { id: "clue-3", name: "Wet coat", description: "SECRET-DESC", location: "Cloakroom" },
  ],
  suspects: [0, 1, 2].map((i) => ({
    id: `suspect-${i}`,
    name: `Suspect ${i}`,
    age: 40,
    occupation: "Singer",
    appearance: "Tall",
    relationshipToVictim: "Employee",
    alibi: "SECRET-ALIBI",
    alibiFlawed: i === 0,
    motive: "SECRET-MOTIVE",
    isKiller: i === 0,
    personality: "Cool",
  })),
  solution: "SECRET-SOLUTION",
};

test("brief contains no spoiler fields", () => {
  for (const includeWeapon of [false, true]) {
    const json = JSON.stringify(toAdBrief(sample, { includeWeapon }));
    for (const banned of ["solution", "isKiller", "alibiFlawed", "alibi", "motive", "SECRET"]) {
      assert.ok(!json.includes(banned), `brief leaked "${banned}"`);
    }
  }
});

test("brief keeps the promo-safe fields", () => {
  const brief = toAdBrief(sample);
  assert.equal(brief.title, sample.title);
  assert.deepEqual(brief.clues, ["Lipstick glass", "Torn ticket", "Wet coat"]);
  assert.equal(brief.suspects.length, 3);
  assert.equal(brief.weapon, undefined);
  assert.equal(toAdBrief(sample, { includeWeapon: true }).weapon, "Cyanide");
});
