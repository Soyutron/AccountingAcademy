import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("当座借越の理由が名前に無い語を指さない", () => {
  const { accounts } = JSON.parse(readFileSync(".velite/accounts.json", "utf8"));
  const overdraft = accounts.find((a: { id: string }) => a.id === "bank_overdraft");
  expect(overdraft.why).not.toContain("預金という名前");
  expect(overdraft.why).toContain("名前に「当座」と付いていても負債です");
});
