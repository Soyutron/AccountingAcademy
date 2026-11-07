import { expect, test } from "@playwright/test";

// チュートリアル: 操作を待ちながら進み、最後まで行くと完了になる。ヘッダーの「使い方」からやり直せる

test("チュートリアルを操作しながら最後まで進められる", async ({ page }) => {
  await page.goto("/units/tutorial/first-entry");
  const tour = page.getByRole("dialog", { name: "チュートリアル" });
  await expect(tour).toBeVisible();
  await tour.getByRole("button", { name: "はじめる" }).click();
  await tour.getByRole("button", { name: "次へ" }).click(); // ガイドの説明
  // 操作待ち: 次へ → を押すまで進めない
  await expect(tour.getByRole("button", { name: "次へ" })).toBeDisabled();
  await page.getByRole("button", { name: "次へ →" }).click();
  await tour.getByRole("button", { name: "次へ" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目 1").fill("現金");
  await work.getByLabel("借方の金額 1").fill("100000");
  await tour.getByRole("button", { name: "次へ" }).click();
  await work.getByLabel("貸方の科目 1").fill("資本金");
  await work.getByLabel("貸方の金額 1").fill("100000");
  await tour.getByRole("button", { name: "次へ" }).click(); // 影響の説明
  await tour.getByRole("button", { name: "次へ" }).click(); // 記帳する待ち
  await expect(tour.getByRole("button", { name: "次へ" })).toBeDisabled();
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  for (let i = 0; i < 5; i++) await tour.getByRole("button", { name: "次へ" }).click();
  await expect(tour.getByText("できました")).toBeVisible();
  await tour.getByRole("button", { name: "閉じる" }).first().click();
  await expect(tour).toBeHidden();

  // 完了後は自動で始まらない。「使い方」からやり直せる
  await page.reload();
  await expect(tour).toBeHidden();
  await page.getByRole("button", { name: "使い方" }).click();
  await page.getByRole("button", { name: "チュートリアルを最初から" }).click();
  await expect(page.getByRole("dialog", { name: /使い方/ })).toBeHidden();
  await expect(tour).toBeVisible();
  await tour.getByRole("button", { name: "スキップ" }).click();
  await expect(tour).toBeHidden();

  // 通常の単元では、スキップ済みなら初回バナーは出ない
  await page.goto("/units/bookkeeping-basics/five-elements");
  await expect(page.getByText("初めてですか?")).toBeHidden();
});

test("初めての学習者には通常の単元でチュートリアルの案内が出る", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await expect(page.getByText("初めてですか?")).toBeVisible();
  await page.getByRole("button", { name: "今はしない" }).click();
  await expect(page.getByText("初めてですか?")).toBeHidden();
});
