import { type Page, expect, test } from "@playwright/test";

// Issue #175: 「続きから」で再開して「← 前へ」で戻ると、再開地点より前の正解済みステップが未回答に見え、誤答も記録できた
const UNIT = "/units/bookkeeping-basics/five-elements";

function ide(page: Page) {
  return {
    work: page.getByRole("region", { name: "ワークスペース" }),
    next: page.getByRole("button", { name: "次へ →" }),
    prev: page.getByRole("button", { name: "← 前へ" }),
    done: page.getByRole("status").filter({ hasText: "できました" }),
  };
}

async function post(page: Page, debit: [string, string], credit: [string, string]) {
  const { work } = ide(page);
  await work.getByLabel("借方の科目1").fill(debit[0]);
  await work.getByLabel("借方の金額1").fill(debit[1]);
  await work.getByLabel("貸方の科目1").fill(credit[0]);
  await work.getByLabel("貸方の金額1").fill(credit[1]);
  await work.getByRole("button", { name: "記帳する" }).click();
}

// 再読み込みで案内が読めるよう、進捗の保存を待ってから進む
async function nextAndSave(page: Page) {
  await Promise.all([page.waitForResponse((r) => r.url().includes("/unit_progress") && r.request().method() === "POST"), ide(page).next.click()]);
}

async function resumeAfterReload(page: Page, label: string) {
  await page.reload();
  await page.getByRole("button", { name: "続きから" }).click();
  await expect(page.getByText(label)).toBeVisible();
}

test("続きから → ← 前へ: 正解済みのpostステップが入力と「できました」つきで戻り、採点も記録もされない", async ({ page }) => {
  const { work, next, prev, done } = ide(page);
  await page.goto(UNIT);
  await next.click();
  await post(page, ["現金", "1000000"], ["資本金", "1000000"]);
  await expect(done).toBeVisible();
  await nextAndSave(page);
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();

  await resumeAfterReload(page, "ステップ3 / 10");
  const attempts: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/attempts") && r.method() === "POST") attempts.push(r.url());
  });
  await prev.click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();

  await expect(work.getByLabel("借方の科目1")).toHaveValue("現金");
  await expect(done).toBeVisible();
  await expect(next).toHaveAttribute("aria-disabled", "false");
  await expect(work.getByRole("button", { name: "記帳する" })).toHaveCount(0);
  expect(attempts).toEqual([]);
});

test("続きから → 前へを重ねても、ステップごとの答えが戻る(誤答で進んだpredictはその予想のまま)", async ({ page }) => {
  const { work, next, prev, done } = ide(page);
  await page.goto(UNIT);
  await next.click();
  await post(page, ["現金", "1000000"], ["資本金", "1000000"]);
  await expect(done).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  for (const [el, v] of [["資産", "decrease"], ["負債", "none"], ["純資産", "none"], ["収益", "none"], ["費用", "none"]])
    await work.getByLabel(`${el}の予想`, { exact: true }).selectOption(v);
  await work.getByRole("button", { name: /予想/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ4 / 10")).toBeVisible();
  await post(page, ["現金", "300000"], ["借入金", "300000"]);
  await expect(done).toBeVisible();
  await nextAndSave(page);
  await expect(page.getByText("ステップ5 / 10")).toBeVisible();

  await resumeAfterReload(page, "ステップ5 / 10");
  await prev.click();
  await expect(page.getByText("ステップ4 / 10")).toBeVisible();
  await expect(work.getByLabel("借方の金額1")).toHaveValue("300,000");
  await expect(done).toBeVisible();

  await prev.click();
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();
  await expect(work.getByLabel("資産の予想", { exact: true })).toHaveValue("decrease");
  await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).toBeVisible();

  await prev.click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await expect(work.getByLabel("借方の金額1")).toHaveValue("1,000,000");
  await expect(done).toBeVisible();
});

test("正解したあとに誤答を重ねたステップは、最後の誤答ではなく正解の状態で戻る", async ({ page }) => {
  const { work, next, prev, done } = ide(page);
  await page.goto(UNIT);
  await next.click();
  await post(page, ["現金", "1000000"], ["資本金", "1000000"]);
  await expect(done).toBeVisible();
  await nextAndSave(page);
  await expect(page.getByText("ステップ3 / 10")).toBeVisible();

  // 「続きから」を押さず手で進めると、正解済みのステップにも答えられる
  await page.reload();
  await expect(page.getByRole("button", { name: "続きから" })).toBeVisible();
  await next.click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/attempts") && r.request().method() === "POST"),
    post(page, ["現金", "1000000"], ["売上", "1000000"]),
  ]);
  await expect(page.getByRole("status").filter({ hasText: "もう一歩" })).toBeVisible();

  await resumeAfterReload(page, "ステップ3 / 10");
  await prev.click();
  await expect(page.getByText("ステップ2 / 10")).toBeVisible();
  await expect(work.getByLabel("貸方の科目1")).toHaveValue("資本金");
  await expect(done).toBeVisible();
});
