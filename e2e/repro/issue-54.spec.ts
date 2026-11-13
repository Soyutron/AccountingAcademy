import { expect, test } from "@playwright/test";

// predictで未選択があるあいだは、記帳できない理由(「変わらない」も選ぶ必要がある)を出す(Issue #54)
test("予想を選ぶまでは記帳できない理由が出て、選ぶと消えて記帳できる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  const next = page.getByRole("button", { name: "次へ →" });
  await next.click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();

  const predict = work.getByRole("button", { name: "予想して記帳する" });
  const hint = work.getByText("予想を選ぶと記帳できます。動かないと思うなら「変わらない」を選びます。");

  await expect(predict).toBeDisabled();
  await expect(hint).toBeVisible();
  await expect(predict).toHaveAttribute("aria-describedby", (await hint.getAttribute("id"))!);

  await work.getByLabel("資産の予想", { exact: true }).selectOption({ label: "変わらない" });
  await expect(hint).toBeHidden();
  await expect(predict).not.toHaveAttribute("aria-describedby");
  await predict.click();
  await expect(predict).toBeHidden();
  await expect(hint).toBeHidden();
});
