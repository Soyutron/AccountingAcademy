import { expect, test, type Page } from "@playwright/test";

// Issue #14: 記帳した後にCookieが消えると、古いuser_idで書き続けてreloadするまで保存がすべて401になり、
// RLSの英文の「保存エラー」が出続けていた。新しいゲストとして続けられること

const unit = "/units/cash-and-deposits/petty-cash";

function watchDenied(page: Page) {
  const denied: string[] = [];
  page.on("response", (r) => {
    if (/\/rest\/v1\/(unit_progress|attempts)/.test(r.url()) && [401, 403].includes(r.status())) denied.push(`${r.status()} ${r.url()}`);
  });
  return denied;
}

async function postFirstEntry(page: Page) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目1").fill("小口現金");
  await work.getByLabel("借方の金額1").fill("30000");
  await work.getByLabel("貸方の科目1").fill("当座預金");
  await work.getByLabel("貸方の金額1").fill("30000");
  const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/attempts"));
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await saved;
}

test("Cookieが消えた後の保存は、新しいゲストとして続けられる", async ({ context, page }) => {
  const denied = watchDenied(page);
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.goto(unit);
  await postFirstEntry(page);
  await context.clearCookies();

  const progress = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/unit_progress"));
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 9")).toBeVisible();
  expect((await progress).status()).toBe(201);
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ4 / 9")).toBeVisible();
  // 新しいゲストとして回答が保存される
  await work.getByLabel("借方の科目1").fill("通信費");
  await work.getByLabel("借方の金額1").fill("4000");
  await work.getByRole("button", { name: "行を追加" }).first().click();
  await work.getByLabel("借方の科目2").fill("消耗品費");
  await work.getByLabel("借方の金額2").fill("6500");
  await work.getByRole("button", { name: "行を追加" }).first().click();
  await work.getByLabel("借方の科目3").fill("旅費交通費");
  await work.getByLabel("借方の金額3").fill("2000");
  await work.getByLabel("貸方の科目1").fill("小口現金");
  await work.getByLabel("貸方の金額1").fill("12500");
  const attempt = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/attempts"));
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  expect((await attempt).status()).toBe(201);
  expect(denied).toEqual([]);
  await expect(page.getByText(/保存エラー/)).toHaveCount(0);
});

test("別タブで新しいゲストに入れ替わっても、古いタブの保存は失敗しない", async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await a.goto(unit);
  await postFirstEntry(a);
  await b.goto(unit);
  await expect(b.getByText("ステップ1 / 9")).toBeVisible();
  const deniedB = watchDenied(b);
  await context.clearCookies();
  // Aが新しいゲストになる
  await a.getByRole("button", { name: "次へ →" }).click();
  await expect(a.getByText("ステップ3 / 9")).toBeVisible();
  // Bは古いuser_idではなく、いまのセッション(新しいゲスト)で書く
  const progress = b.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/unit_progress"));
  await b.getByRole("button", { name: "次へ →" }).click();
  // 新しいゲストの行はAが作っているのでupsertは更新(200)になる
  expect((await progress).status()).toBe(200);
  expect(deniedB).toEqual([]);
  await expect(b.getByText(/保存エラー/)).toHaveCount(0);
});
