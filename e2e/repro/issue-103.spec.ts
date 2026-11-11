import { expect, test } from "@playwright/test";

// ヘッドレスChromiumは既定でスクロールバーを隠す。隠れていると右端は候補行に当たり、修正前でも通ってしまう
test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

test("科目の候補一覧のスクロールバーを押しても一覧が閉じない", async ({ page }) => {
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  const input = work.getByLabel("借方の科目1");
  await input.click();
  const list = page.getByRole("listbox", { name: "科目の候補" });
  await expect(list).toBeVisible();

  const container = list.locator("xpath=..");
  const box = await container.boundingBox();
  if (!box) throw new Error("候補一覧が見つからない");
  // スクロールバーが実際に描かれていることを前提として固定する
  expect(await container.evaluate((el) => el.clientWidth < (el as HTMLElement).offsetWidth - 2)).toBe(true);

  await page.mouse.move(box.x + box.width - 6, box.y + box.height / 2);
  await page.mouse.down();
  await expect(list).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("aria-expanded", "true");
  // preventDefaultしてもネイティブのスクロールバー操作は効く
  await expect.poll(() => container.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.mouse.up();
  await expect(list).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("aria-expanded", "true");
});
