import { expect, test } from "@playwright/test";

// Issue #17: 仕訳帳の科目候補が <datalist> で、科目名と要素の分類が同じ見た目で並んでいた。
// 自前のコンボボックスで5要素ごとにまとめ、キーボードとクリックの両方で選べるようにする

test("科目の候補が要素ごとにまとまり、キーボードで選べる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  const input = work.getByLabel("借方の科目1");
  await input.pressSequentially("金");

  const list = page.getByRole("listbox", { name: "科目の候補" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("group", { name: "資産", exact: true })).toBeVisible();
  await expect(list.getByRole("group", { name: "純資産", exact: true })).toBeVisible();
  await expect(list.getByRole("group", { name: "純資産", exact: true }).getByRole("option", { name: /資本金/ })).toBeVisible();

  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(input).toHaveValue("小口現金");
  await expect(list).toBeHidden();
  // Enterで候補を選んでもフォームは送信されない
  await expect(page.getByText("できました", { exact: true })).toBeHidden();

  // Escで閉じる
  await input.fill("現金");
  await expect(list).toBeVisible();
  await input.press("Escape");
  await expect(list).toBeHidden();
  await expect(input).toHaveValue("現金");
});

test("クリックで候補を選ぶと行が要素の色になる", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  const input = work.getByLabel("貸方の科目1");
  await input.click();
  const list = page.getByRole("listbox", { name: "科目の候補" });
  await list.getByRole("option", { name: /^買掛金/ }).click();
  await expect(input).toHaveValue("買掛金");
  await expect(list).toBeHidden();
  await expect(work.locator('[data-journal-line="credit-0"]')).toHaveClass(/border-liability-border/);
  await expect(work.locator('[data-journal-line="credit-0"]')).toContainText("負債");
});
