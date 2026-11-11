import { expect, test } from "@playwright/test";
import { db } from "../../scripts/monkey/session.mjs";

const UNIT = "bookkeeping-basics/five-elements";

// ステップを減らした単元を模してunit_progress.stepを範囲外にする。その後に進めた位置から「続きから」で再開できること
test("範囲外の保存stepでも、進めたあとのreloadで「続きから」が出る", async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true })));
  await page.goto(`/units/${UNIT}`);
  const saved = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.request().method() === "POST");
  await page.getByRole("button", { name: "次へ →" }).click();
  await saved;

  const token = (await context.cookies()).filter((c) => c.name.includes("auth-token")).sort((a, b) => (a.name < b.name ? -1 : 1)).map((c) => c.value).join("");
  const userId = JSON.parse(Buffer.from(decodeURIComponent(token).replace(/^base64-/, ""), "base64url").toString()).user.id;
  db(`update unit_progress set step=10 where user_id='${userId}' and unit_id='${UNIT}'`);

  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する", exact: true }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  const advanced = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.request().method() === "POST");
  await page.getByRole("button", { name: "次へ →" }).click();
  await advanced;
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "続きから" })).toBeVisible();
});
