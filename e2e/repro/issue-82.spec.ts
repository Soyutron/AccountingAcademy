import { expect, test } from "@playwright/test";

// Issue #82: 売掛金・買掛金が用語集に2項目ずつ並び、結果ペインからは例も関連も無い勘定科目版が開いていた

for (const name of ["売掛金", "買掛金"]) {
  test(`用語集で「${name}」を検索すると1項目だけ出る`, async ({ page }) => {
    await page.goto("/glossary");
    await page.getByPlaceholder("用語を検索").fill(name);
    await expect(page.locator("main div[id]").first()).toContainText(name);
    await expect(page.locator("main div[id]")).toHaveCount(1);
  });
}

test("結果ペインの「買掛金」から本文の「買掛金」と同じ説明が開く", async ({ page }) => {
  await page.goto("/units/merchandise/credit-transactions");
  await page.getByRole("button", { name: "次へ →" }).click();

  const guide = page.getByRole("region", { name: "ガイド" });
  await guide.getByRole("button", { name: "買掛金", exact: true }).click();
  await page.getByRole("button", { name: "もっと見る" }).click();
  const popover = page.getByRole("dialog", { name: "買掛金" });
  const guideText = await popover.innerText();
  const guideHref = await popover.getByRole("link", { name: "用語集で見る" }).getAttribute("href");
  await page.keyboard.press("Escape");

  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("仕入");
  await work.getByLabel("借方の金額1").fill("40000");
  await work.getByLabel("貸方の科目1").fill("買掛金");
  await work.getByLabel("貸方の金額1").fill("40000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();

  await page.getByRole("region", { name: "結果" }).getByRole("button", { name: "買掛金", exact: true }).first().click();
  await page.getByRole("button", { name: "もっと見る" }).click();
  await expect(popover.getByText(/^例: /)).toBeVisible();
  await expect(popover.getByRole("link", { name: "用語集で見る" })).toHaveAttribute("href", guideHref!);
  expect(await popover.innerText()).toBe(guideText);
});
