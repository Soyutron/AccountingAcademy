import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

type RawConcept = { id: string; short: string };
const concepts: RawConcept[] = parse(readFileSync("content/concepts/basics.yaml", "utf8")).concepts;

// Issue #171: 単元 five-elements は「この 1 か月の当期純利益」と問うので、定義を 1 年に固定しない
describe("content/concepts/basics.yaml(Issue #171)", () => {
  it("当期純利益の short が期間を 1 年に限定しない", () => {
    const netIncome = concepts.find((c) => c.id === "net_income");
    expect(netIncome?.short).toContain("一定期間(通常 1 年)");
    expect(netIncome?.short).not.toContain("1 年間");
  });
});
