import { expect, test, type BrowserContext, type Page } from "@playwright/test";

// Issue #136: Cookieのセッションが無効でもgetSession()はそのまま返すので、読み込みと保存が401や例外になり続け、
// 再読み込みしても「保存エラー」が直らなかった。refreshできるなら同じユーザーで、できないなら新しいゲストとして続けられること

const unit = "/units/bookkeeping-basics/five-elements";
const next = (page: Page) => page.getByRole("button", { name: "次へ →" });

type Session = Record<string, unknown> & { access_token: string; user: { id: string } };

function decode(value: string): Session {
  return JSON.parse(Buffer.from(value.replace(/^base64-/, ""), "base64url").toString());
}

async function authCookie(context: BrowserContext) {
  return (await context.cookies()).find((c) => c.name.includes("auth-token"));
}

async function replaceSession(context: BrowserContext, build: (session: Session) => unknown) {
  const cookie = (await authCookie(context))!;
  const value = `base64-${Buffer.from(JSON.stringify(build(decode(cookie.value)))).toString("base64url")}`;
  await context.addCookies([{ name: cookie.name, value, domain: cookie.domain, path: "/", sameSite: "Lax", expires: -1 }]);
}

const breakSignature = (session: Session) => ({ ...session, access_token: `${session.access_token.slice(0, -6)}AAAAAA` });

// ステップ1から進んでステップ2の仕訳に答える。匿名サインインは最初の回答で行う(Issue #214)
async function answerStep2AndExpectSaved(page: Page) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await next(page).click();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  const saved = page.waitForResponse((r) => r.url().includes("/rest/v1/attempts") && r.request().method() === "POST" && r.status() !== 401);
  await work.getByRole("button", { name: "記帳する" }).click();
  expect((await saved).ok()).toBe(true);
  await expect(page.getByText(/保存エラー/)).toHaveCount(0);
}

// 新しいゲストで回答と進捗を保存し、そのユーザーIDを返す
async function startGuest(page: Page, context: BrowserContext) {
  await page.goto(unit);
  await page.waitForLoadState("networkidle");
  await answerStep2AndExpectSaved(page);
  const saved = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.request().method() === "POST");
  await next(page).click();
  expect((await saved).ok()).toBe(true);
  return decode((await authCookie(context))!.value).user.id;
}

function watchDenied(page: Page) {
  const denied: string[] = [];
  page.on("response", (r) => {
    if (/\/rest\/v1\/(unit_progress|attempts)/.test(r.url()) && [401, 403].includes(r.status())) denied.push(`${r.status()} ${r.url()}`);
  });
  return denied;
}

async function clickNextAndExpectSaved(page: Page) {
  const saved = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.request().method() === "POST" && r.status() !== 401);
  await next(page).click();
  expect((await saved).ok()).toBe(true);
  await expect(page.getByText(/保存エラー/)).toHaveCount(0);
}

test("access_tokenの署名が無効でも、refresh_tokenが有効なら同じユーザーで進捗を読み直して続けられる", async ({ page, context }) => {
  const userId = await startGuest(page, context);
  await replaceSession(context, breakSignature);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "続きから" })).toBeVisible();

  const denied = watchDenied(page);
  await clickNextAndExpectSaved(page);
  expect(denied).toEqual([]);
  expect(decode((await authCookie(context))!.value).user.id).toBe(userId);
});

test("refresh_tokenも無効なら、閲覧ではユーザーを作らず、次の回答で新しいゲストになる", async ({ page, context }) => {
  const userId = await startGuest(page, context);
  await replaceSession(context, (s) => ({ ...breakSignature(s), refresh_token: "invalid-refresh-token" }));
  let signups = 0;
  page.on("response", (r) => {
    if (r.url().includes("/auth/v1/signup") && r.ok()) signups++;
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  expect(signups).toBe(0);

  const denied = watchDenied(page);
  await answerStep2AndExpectSaved(page);
  expect(denied).toEqual([]);
  expect(signups).toBe(1);
  expect(decode((await authCookie(context))!.value).user.id).not.toBe(userId);
});

test("開いたままセッションが無効になっても、保存を1回やり直して成功する", async ({ page, context }) => {
  // five-elementsの次のステップは答えるまで進めないので、仕訳を済ませれば進める単元を使う
  await page.goto("/units/cash-and-deposits/petty-cash");
  await page.waitForLoadState("networkidle");
  const work = page.getByRole("region", { name: "ワークスペース" });
  await next(page).click();
  await work.getByLabel("借方の科目1").fill("小口現金");
  await work.getByLabel("借方の金額1").fill("30000");
  await work.getByLabel("貸方の科目1").fill("当座預金");
  await work.getByLabel("貸方の金額1").fill("30000");
  const posted = page.waitForResponse((r) => r.url().includes("/rest/v1/attempts") && r.request().method() === "POST");
  // 最初の回答の後に続けて送る進捗(Issue #214)も済ませてから、セッションを壊す
  const progress = page.waitForResponse((r) => r.url().includes("/rest/v1/unit_progress") && r.request().method() === "POST");
  await work.getByRole("button", { name: "記帳する" }).click();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  expect((await posted).ok()).toBe(true);
  expect((await progress).ok()).toBe(true);
  const userId = decode((await authCookie(context))!.value).user.id;

  await replaceSession(context, breakSignature);
  const denied = watchDenied(page);
  await clickNextAndExpectSaved(page);
  // 回復の前に出る1回だけ
  expect(denied).toHaveLength(1);
  expect(decode((await authCookie(context))!.value).user.id).toBe(userId);
});

const malformed: [string, unknown][] = [
  ["userが無い", { access_token: "a.b.c", refresh_token: "x", expires_at: 9999999999 }],
  ["refresh_tokenが空で期限切れ", { access_token: "a.b.c", refresh_token: "", expires_at: 1, user: { id: "x" } }],
];

for (const [label, session] of malformed) {
  test(`Cookieが壊れた形(${label})でも、新しいゲストとして保存できる`, async ({ page, context }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.stack ?? e.message));
    await startGuest(page, context);
    await replaceSession(context, () => session);
    await page.reload();
    await page.waitForLoadState("networkidle");

    await answerStep2AndExpectSaved(page);
    expect(decode((await authCookie(context))!.value).user.id).toMatch(/^[0-9a-f-]{36}$/);
    // refresh_tokenが空だとauth-jsの起動時処理(_emitInitialSession)がcatchなしで投げるが、アプリからは捕まえられず保存にも影響しない
    expect(errors.filter((e) => !e.includes("_emitInitialSession"))).toEqual([]);
  });
}
