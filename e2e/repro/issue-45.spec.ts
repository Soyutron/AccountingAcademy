import { expect, test } from "@playwright/test";

// Issue #45: 保存済みのstepが単元のステップ数以上(ステップを減らした単元)だと、最後まで進めてもstarted / 範囲外のstepのまま保存されていた。
// 範囲外の保存値は無視し、最後のステップに着いたらcompletedで保存する
test("範囲外の保存stepから最後まで進むとcompletedになる", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "done", enabled: true })));
  const upserts: { step: number; status: string }[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/rest/v1/unit_progress")) upserts.push(r.postDataJSON());
  });
  const post = async () => {
    const work = page.getByRole("region", { name: "ワークスペース" });
    await work.getByLabel("借方の科目1").fill("現金");
    await work.getByLabel("借方の金額1").fill("100000");
    await work.getByLabel("貸方の科目1").fill("資本金");
    await work.getByLabel("貸方の金額1").fill("100000");
    await work.getByRole("button", { name: "記帳する" }).click();
    await expect(page.getByText("できました", { exact: true })).toBeVisible();
  };
  await page.goto("/units/tutorial/first-entry");
  await page.getByRole("button", { name: "次へ →" }).click();
  await post();

  // 単元のステップが減ったあとを模して、保存済みのstepを範囲外にして返す
  await page.route("**/rest/v1/unit_progress?select=*", async (route) => {
    const res = await route.fetch();
    const rows = await res.json();
    await route.fulfill({ response: res, json: rows.map((r: object) => ({ ...r, step: 99 })) });
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  upserts.length = 0;
  await page.getByRole("button", { name: "次へ →" }).click();
  await post();
  await page.getByRole("button", { name: "次へ →" }).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ4 / 4")).toBeVisible();
  await expect.poll(() => upserts.at(-1)).toMatchObject({ status: "completed", step: 3 });
});
