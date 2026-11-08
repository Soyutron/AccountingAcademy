import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type RawConcept = { id: string; short: string; summary: string; example?: string };
const concepts: RawConcept[] = readdirSync("content/concepts").flatMap(
  (file) => parse(readFileSync(`content/concepts/${file}`, "utf8")).concepts,
);

// Issue #94: 試験固有の情報は学習パスにだけ持つ(ADR 0002)
describe("content/concepts(Issue #94)", () => {
  it.each(concepts.map((c) => [c.id, c] as const))("%s の説明に試験の級を書かない", (_id, concept) => {
    expect(`${concept.short}${concept.summary}${concept.example ?? ""}`).not.toMatch(/日商簿記|[1-3] 級/);
  });
});
