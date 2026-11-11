import { expect, test, type BrowserContext, type Page } from "@playwright/test";

// Issue #13: 同じ単元を2タブで開き、古いタブで「次へ →」を押すと、別タブで進んだunit_progress.stepと完了が巻き戻っていた。
// 保存はDB側のトリガーで後退させない(stepを下げない、completedをstartedに戻さない)

const unit = "/units/cash-and-deposits/petty-cash";

/** unit_progressへのupsertを記録する(URLと認証ヘッダーは、テストから直接RESTを叩くのにも使う) */
function recordSaved(page: Page) {
  const saved: { body: { user_id: string; step: number; status: string }; url: string; headers: Record<string, string> }[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().includes("/rest/v1/unit_progress")) saved.push({ body: r.postDataJSON(), url: r.url(), headers: r.headers() });
  });
  return saved;
}

async function resumeBanner(context: BrowserContext) {
  const c = await context.newPage();
  await c.goto(unit);
  const banner = c.getByText(/前回はステップ\d+まで進みました。/);
  await expect(banner).toBeVisible();
  const text = await banner.textContent();
  await c.close();
  return text;
}

test("古いタブで次へを押しても、別タブで進んだstepと完了は戻らない", async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await a.goto(unit);
  await b.goto(unit);
  await expect(b.getByText("ステップ1 / 9")).toBeVisible();
  const savedA = recordSaved(a);
  const savedB = recordSaved(b);

  // Aでステップ2を記帳してステップ3へ(DBはstep=2)
  const work = a.getByRole("region", { name: "ワークスペース" });
  await a.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目1").fill("小口現金");
  await work.getByLabel("借方の金額1").fill("30000");
  await work.getByLabel("貸方の科目1").fill("当座預金");
  await work.getByLabel("貸方の金額1").fill("30000");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(a.getByText("できました", { exact: true })).toBeVisible();
  await a.getByRole("button", { name: "次へ →" }).click();
  await expect(a.getByText("ステップ3 / 9")).toBeVisible();
  await expect.poll(() => savedA.at(-1)?.body.step).toBe(2);

  // 開きっぱなしのBで1つ進む(古い値step=1を送る)が、保存済みの2は戻らない
  const upsertB = b.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/unit_progress"));
  await b.getByRole("button", { name: "次へ →" }).click();
  await expect(b.getByText("ステップ2 / 9")).toBeVisible();
  expect((await upsertB).ok()).toBe(true);
  expect(savedB.at(-1)?.body.step).toBe(1);
  expect(await resumeBanner(context)).toBe("前回はステップ3まで進みました。");

  // 完了済み(completed / step=8)にしてから古いタブで進めても、完了のまま
  const { url, headers } = savedA.at(-1)!;
  const done = await context.request.post(url, {
    headers: { apikey: headers["apikey"], authorization: headers["authorization"], "content-type": "application/json", prefer: "resolution=merge-duplicates" },
    data: { user_id: savedA.at(-1)!.body.user_id, unit_id: "cash-and-deposits/petty-cash", status: "completed", step: 8 },
  });
  expect(done.ok()).toBe(true);
  // Bのステップ2は未回答で「次へ →」が無効なので、「← 前へ」で古い値(step=1 / started)を保存させる
  const upsertB2 = b.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/rest/v1/unit_progress"));
  await b.getByRole("button", { name: "← 前へ" }).click();
  await expect(b.getByText("ステップ1 / 9")).toBeVisible();
  expect((await upsertB2).ok()).toBe(true);
  expect(savedB.at(-1)?.body.status).toBe("started");
  expect(await resumeBanner(context)).toBe("前回はステップ9まで進みました。");
  const topic = await context.newPage();
  await topic.goto("/topics/cash-and-deposits");
  await expect(topic.getByRole("listitem").filter({ hasText: "小口現金" })).toContainText("完了");
});
