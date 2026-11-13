import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

// 匿名ユーザーの定期削除は「最終活動から90日」(docs/architecture.md 3.2)。今日も回答している学習者は対象にならない(Issue #133)。
// cron の delete 文を select count(*) に置き換えて当該ユーザーだけ評価し、実際の削除は走らせない

const unit = "/units/bookkeeping-basics/five-elements";
const sql = (q: string) =>
  execFileSync("docker", ["exec", "-i", "supabase_db_openboki", "psql", "-U", "postgres", "-d", "postgres", "-Atc", q], { encoding: "utf8" }).trim();

test("初回サインインから100日後でも、今日活動した匿名ユーザーは削除の対象にならない", async ({ page }) => {
  // 匿名サインインと進捗の保存は最初の回答のときに行われるので、ステップ2を記帳して user_id を拾う
  await page.goto(unit);
  await page.getByRole("button", { name: "今はしない" }).click({ timeout: 8000 }).catch(() => {});
  await page.getByRole("button", { name: "次へ →" }).click();
  const work = page.getByRole("region", { name: "ワークスペース" });
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  await work.getByLabel("貸方の科目1").fill("資本金");
  await work.getByLabel("貸方の金額1").fill("1000000");
  const saved = page.waitForRequest((r) => r.method() === "POST" && r.url().includes("/rest/v1/unit_progress"));
  await work.getByRole("button", { name: "記帳する" }).click();
  const userId: string = (await saved).postDataJSON().user_id;
  expect(userId).not.toBe("");
  await expect.poll(() => sql(`select count(*) from public.unit_progress where user_id='${userId}'`)).toBe("1");

  const original = sql(`select last_sign_in_at || ',' || created_at from auth.users where id='${userId}'`).split(",");
  sql(`update auth.users set last_sign_in_at = now() - interval '100 days', created_at = now() - interval '100 days' where id='${userId}'`);
  try {
    const command = sql("select command from cron.job where jobname='delete-stale-anonymous-users'");
    const countMatching = (extra = "") =>
      sql(`${command.replace(/delete\s+from auth\.users(\s+u)?/i, "select count(*) from auth.users u")} and u.id='${userId}'${extra}`);

    // 今日 unit_progress を書いているので対象外
    expect(countMatching()).toBe("0");

    // 進捗と記帳の回答も古くすると対象になり、attempts だけが90日以内なら対象外(条件の片側漏れを防ぐ)
    sql(`update public.unit_progress set updated_at = now() - interval '100 days' where user_id='${userId}'`);
    sql(`update public.attempts set created_at = now() - interval '100 days' where user_id='${userId}'`);
    expect(countMatching()).toBe("1");
    sql(
      `insert into public.attempts (user_id, unit_id, exercise_id, correct, answer, content_version) values ('${userId}', 'bookkeeping-basics/five-elements', 'bookkeeping-basics/five-elements#1', false, '{}'::jsonb, 'issue-133')`,
    );
    expect(countMatching()).toBe("0");
  } finally {
    sql(`delete from public.attempts where user_id='${userId}'`);
    sql(`update auth.users set last_sign_in_at='${original[0]}', created_at='${original[1]}' where id='${userId}'`);
  }
});
