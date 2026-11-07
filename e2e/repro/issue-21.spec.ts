import { expect, test } from "@playwright/test";

// Issue #21: 2 回誤答して「答えを見る」が出た後に reload して「続きから」で戻ると、誤答回数が 0 に戻り「答えを見る」が消えていた
test("2 回誤答後に再訪しても答えを見るが使える", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const attempt = () => page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/attempts"));
  const wrong = async (amount: string) => {
    await work.getByLabel("借方の科目 1").fill("資本金");
    await work.getByLabel("借方の金額 1").fill(amount);
    await work.getByLabel("貸方の科目 1").fill("現金");
    await work.getByLabel("貸方の金額 1").fill(amount);
    const posted = attempt();
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(page.getByRole("status")).toContainText("もう一歩");
    await posted;
  };

  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ 2 / 10")).toBeVisible();
  // 同じ答えの押し直しは 1 回と数える(Issue #15)ので、2 回目は答えを変える
  await wrong("1000000");
  await wrong("100000");
  await expect(page.getByRole("button", { name: "答えを見る" })).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "続きから" }).click();
  await expect(page.getByText("ステップ 2 / 10")).toBeVisible();
  await expect(page.getByRole("button", { name: "答えを見る" })).toBeVisible();
});
