import { expect, test, type Page } from "@playwright/test";

// Issue #215: 記入の段で先に記帳して本体を進めると、仕訳欄が消えてもツアーが記入を指示し続けて進めなくなっていた

const tourOf = (page: Page) => page.getByRole("dialog", { name: "チュートリアル" });
const nextOf = (page: Page) => tourOf(page).getByRole("button", { name: "次へ", exact: true });
const workOf = (page: Page) => page.getByRole("region", { name: "ワークスペース" });

// ツアーの案内どおりに4/12「借方(左)に書く」まで進める
async function advanceToDebit(page: Page) {
  await page.goto("/units/tutorial/first-entry?tour=1");
  const tour = tourOf(page);
  await tour.getByRole("button", { name: "はじめる" }).click({ timeout: 15000 });
  await nextOf(page).click();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(tour).toContainText("借方(左)に書く");
}

async function postAndLeaveJournalStep(page: Page) {
  const work = workOf(page);
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("100000");
  await work.getByLabel("貸方の金額1").press("Enter");
  await expect(page.getByRole("status")).toContainText("できました");
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 4")).toBeVisible();
  await expect(work.getByLabel("借方の科目1")).toHaveCount(0);
}

async function expectTourFinishes(page: Page) {
  const tour = tourOf(page);
  await expect(tour).toContainText("8 / 12");
  await expect(tour).toContainText("ここは結果");
  for (const stage of ["9 / 12", "10 / 12", "11 / 12", "12 / 12"]) {
    await nextOf(page).click();
    await expect(tour).toContainText(stage);
  }
}

test("4/12で記帳して本体を進めると、記入の指示を残さず8/12へ進み、最後の段まで進める", async ({ page }) => {
  await advanceToDebit(page);

  await postAndLeaveJournalStep(page);

  await expect(tourOf(page)).not.toContainText("借方に 現金100,000を入れてください");
  await expectTourFinishes(page);
});

test("5/12で記帳して本体を進めると、記入の指示を残さず8/12へ進み、最後の段まで進める", async ({ page }) => {
  await advanceToDebit(page);
  const work = workOf(page);
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("100000");
  await nextOf(page).click();
  await expect(tourOf(page)).toContainText("5 / 12");

  await postAndLeaveJournalStep(page);

  await expect(tourOf(page)).not.toContainText("貸方に 資本金100,000を入れてください");
  await expectTourFinishes(page);
});
