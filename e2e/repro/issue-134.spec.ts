import { expect, test } from "@playwright/test";

// 新規ゲストが2タブでほぼ同時に最初の書き込みをしても、匿名ユーザーは1人だけ作る

const unit = "/units/bookkeeping-basics/five-elements";

test("2タブ同時の最初の書き込みで匿名ユーザーが2人できない", async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  let signups = 0;
  for (const p of [a, b]) {
    p.on("response", (r) => {
      if (r.url().includes("/auth/v1/signup") && r.status() === 200) signups++;
    });
    await p.goto(unit);
    await p.waitForLoadState("networkidle");
    // 匿名サインインは最初の回答で行う(Issue #214)ので、記帳の直前まで進めておく
    const work = p.getByRole("region", { name: "ワークスペース" });
    await p.getByRole("button", { name: "次へ →" }).click();
    await work.getByLabel("借方の科目1").fill("現金");
    await work.getByLabel("借方の金額1").fill("1000000");
    await work.getByLabel("貸方の科目1").fill("資本金");
    await work.getByLabel("貸方の金額1").fill("1000000");
  }
  const saved = [a, b].map((p) =>
    p.waitForResponse((r) => r.url().includes("/rest/v1/attempts") && r.request().method() === "POST"),
  );
  await Promise.all([a, b].map((p) => p.getByRole("region", { name: "ワークスペース" }).getByRole("button", { name: "記帳する" }).click()));
  for (const response of await Promise.all(saved)) expect(response.ok()).toBe(true);
  expect(signups).toBe(1);
  await expect(a.getByText(/保存エラー/)).toHaveCount(0);
  await expect(b.getByText(/保存エラー/)).toHaveCount(0);
});
