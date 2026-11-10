import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("雑損を「使ってしまった」お金と説明しない", () => {
  const units = JSON.parse(readFileSync(".velite/units.json", "utf8"));
  const unit = units.find((u: { id: string }) => u.id === "cash-and-deposits/cash-over-and-short");
  expect(unit.steps[6].title).toBe("箱に分ける");
  expect(unit.steps[6].narrative).not.toContain("使ってしまって");
});
