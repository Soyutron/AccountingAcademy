import { expect, test } from "@playwright/test";

// 新規ゲストが 2 タブでほぼ同時に最初の書き込みをしても、匿名ユーザーは 1 人だけ作る

const unit = "/units/bookkeeping-basics/five-elements";

test("2 タブ同時の最初の書き込みで匿名ユーザーが 2 人できない", async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  let signups = 0;
  for (const p of [a, b]) {
    p.on("response", (r) => {
      if (r.url().includes("/auth/v1/signup") && r.status() === 200) signups++;
    });
    await p.goto(unit);
    await p.waitForLoadState("networkidle");
  }
  const saved = [a, b].map((p) =>
    p.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.request().method() === "POST"),
  );
  await Promise.all([a, b].map((p) => p.getByRole("button", { name: "次へ →" }).click()));
  for (const response of await Promise.all(saved)) expect(response.ok()).toBe(true);
  expect(signups).toBe(1);
  await expect(a.getByText(/保存エラー/)).toHaveCount(0);
  await expect(b.getByText(/保存エラー/)).toHaveCount(0);
});
