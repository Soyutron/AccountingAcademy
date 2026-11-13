import { expect, test } from "@playwright/test";

// Issue #3: 正解した直後にreloadして「続きから」で戻ると、そのステップが未達になり仕訳も消えていた
test("正解直後にreloadしても「続きから」で達成状態と仕訳が戻る", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const resume = async () => {
    await page.reload();
    // 進捗の取得は非同期なので、案内が出るまで待つ
    await page.getByRole("button", { name: "続きから" }).click();
  };
  const attempt = (id: string) => page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/attempts") && r.request().postDataJSON()?.exercise_id === id);

  await page.goto("/units/bookkeeping-basics/five-elements");
  await next.click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  const posted = attempt("bookkeeping-basics/five-elements#1");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await posted;

  await resume();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await expect(work.getByText("元手として現金1,000,000円をお店に出資した").filter({ visible: true })).toHaveCount(1);
  await expect(next).not.toHaveAttribute("aria-disabled", "true");

  // predictステップでも、予想をやり直さずに済む
  await next.click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  for (const el of ["資産"]) await work.getByLabel(`${el}の予想`, { exact: true }).selectOption("none");
  const predicted = attempt("bookkeeping-basics/five-elements#2");
  await work.getByRole("button", { name: "予想して記帳する" }).click();
  await expect(page.getByRole("button", { name: "予想して記帳する" })).toHaveCount(0);
  await predicted;

  await resume();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  await expect(page.getByRole("button", { name: "予想して記帳する" })).toHaveCount(0);
  await expect(work.getByText("元手として現金1,000,000円をお店に出資した").filter({ visible: true })).toHaveCount(1);
  await expect(work.getByText("コーヒーマシン(備品)600,000円を現金で買った").filter({ visible: true })).toHaveCount(1);
  await expect(next).not.toHaveAttribute("aria-disabled", "true");
});
