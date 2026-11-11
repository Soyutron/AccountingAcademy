import { expect, test } from "@playwright/test";

// Issue #59: 別タブで変えたチュートリアルの状態を、開いたままの古いタブが古いcacheで上書きしていた。
// storageイベントで古いタブのバナーが消えるので「今はしない」はもう押せない。
// イベントが届く前に押した場合はsrc/lib/tutorial-store.issue-59.test.tsで固定する

const unit = "/units/merchandise/three-account-method";

test("別タブでツアーを完了すると、古いタブのバナーが消え、完了済みのツアーは自動で始まらない", async ({ context }) => {
  const a = await context.newPage();
  await a.goto(unit);
  const banner = a.getByRole("note").filter({ hasText: "初めてですか" });
  await expect(banner).toBeVisible();

  const b = await context.newPage();
  await b.goto("/units/tutorial/first-entry");
  const tour = b.getByRole("dialog", { name: "チュートリアル" });
  await tour.getByRole("button", { name: "はじめる" }).click();
  await tour.getByRole("button", { name: "次へ" }).click();
  await b.getByRole("button", { name: "次へ →" }).click();
  const work = b.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await tour.getByRole("button", { name: "次へ" }).click();
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await tour.getByRole("button", { name: "次へ" }).click();
  await tour.getByRole("button", { name: "次へ" }).click();
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(b.getByText("できました", { exact: true })).toBeVisible();
  for (let i = 0; i < 4; i++) await tour.getByRole("button", { name: "次へ" }).click();
  await tour.getByRole("button", { name: "閉じる" }).first().click();
  await expect(tour).toBeHidden();

  await expect(banner).toBeHidden();

  await b.reload();
  await expect(b.getByRole("heading", { name: "ようこそ" })).toBeVisible();
  await expect(tour).toBeHidden();
  expect(await b.evaluate(() => JSON.parse(localStorage.getItem("tutorial-state") ?? "{}").status)).toBe("done");
});

test("別タブで初回の案内を切ると、古いタブのバナーが消える", async ({ context }) => {
  const a = await context.newPage();
  await a.goto(unit);
  const banner = a.getByRole("note").filter({ hasText: "初めてですか" });
  await expect(banner).toBeVisible();

  const b = await context.newPage();
  await b.goto(unit);
  await b.evaluate(() => localStorage.setItem("tutorial-state", JSON.stringify({ status: "pending", enabled: false })));

  await expect(banner).toBeHidden();
});
