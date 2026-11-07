import { expect, test } from "@playwright/test";

// Issue #6: tweak で目標を満たした後に値を外すと、未達の目標表示と「できました」が同時に出ていた
test("tweak で目標を外すと「できました」と未達表示が同居しない", async ({ page }) => {
  const inserts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/rest/v1/attempts")) inserts.push(r.postDataJSON()?.exercise_id);
  });
  await page.goto("/units/depreciation/straight-line");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const next = page.getByRole("button", { name: "次へ →" });
  const done = page.getByRole("status").filter({ hasText: "できました" });
  const reached = page.getByRole("status").filter({ hasText: "達成" });
  await next.click();
  await work.getByLabel("借方の科目 1").fill("車両運搬具");
  await work.getByLabel("借方の金額 1").fill("1200000");
  await work.getByLabel("貸方の科目 1").fill("現金");
  await work.getByLabel("貸方の金額 1").fill("1200000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(done).toBeVisible();
  await next.click();
  const slider = work.getByRole("slider", { name: "耐用年数" });
  await slider.fill("6");
  await expect(reached).toBeVisible();
  await expect(done).toBeVisible();

  await slider.fill("4");
  await expect(work.getByText("300,000 円").first()).toBeVisible();
  await expect(reached).toHaveCount(0);
  await expect(done).toHaveCount(0);
  // 達成済みの進行は保つ
  await expect(next).toHaveAttribute("aria-disabled", "false");

  await slider.fill("6");
  await expect(reached).toBeVisible();
  await expect(done).toBeVisible();
  await expect(next).toHaveAttribute("aria-disabled", "false");
  // 記録は記帳 1 件と tweak 1 件だけ
  await expect.poll(() => inserts.length).toBe(2);
});
