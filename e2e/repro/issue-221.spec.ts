import { expect, test } from "@playwright/test";

// 通信が戻って回答の保存が成功すると保存エラーは消えるが、失敗した「次へ →」の進捗は再送されないまま残る
test("「次へ →」の進捗の保存に失敗したあと回答が保存されたら、再開位置もそのステップになる", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true, seen: ["post", "predict", "classify", "calc", "tweak"] })));
  await page.goto("/units/bookkeeping-basics/five-elements");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" }).first();
  await next.click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  // 最初の回答でサインインした後の進捗の保存を待つ。これが失敗の窓に入ると、未保存の印が残って次の回答で偶然送り直される
  const progressSaved = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.request().method() === "POST" && r.ok());
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await progressSaved;

  // 「次へ →」の進捗の保存だけ失敗させる
  await page.route("**/rest/v1/unit_progress**", (route) => (route.request().method() === "POST" ? route.abort() : route.continue()));
  await next.click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "保存エラー" })).toBeVisible();
  await page.unroute("**/rest/v1/unit_progress**");

  for (const el of ["資産", "負債", "純資産", "収益", "費用"]) await work.getByLabel(`${el}の予想`, { exact: true }).selectOption("none");
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "保存エラー" })).toHaveCount(0);

  await page.reload();
  await expect(page.getByText("前回はステップ3まで進みました")).toBeVisible();
});
