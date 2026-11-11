import { expect, test } from "@playwright/test";

const INCOMPLETE_HINT = "入力が途中の行があります。科目と金額をそろえるか、その行を削除すると記帳できます。";

// Issue #97: 科目を途中まで入れて金額も入れた側を、「足りない側」として案内しない
test("科目名が途中までのとき、入力済みの側に「科目と金額を入れる」と言わない", async ({ page }) => {
  const work = page.getByRole("region", { name: "ワークスペース" });
  await page.goto("/units/bookkeeping-basics/five-elements");
  await page.getByRole("button", { name: "次へ →" }).click();
  await work.getByLabel("借方の科目1").fill("現金");
  await work.getByLabel("借方の金額1").fill("1000000");
  // 候補が1件の文字だと、欄を抜けた時点で確定して途中でなくなる(Issue #236)
  await work.getByLabel("貸方の科目1").fill("きん");
  await work.getByLabel("貸方の金額1").fill("1000000");
  await work.getByLabel("貸方の金額1").blur();
  const postButton = work.getByRole("button", { name: "記帳する" });
  await expect(postButton).toBeDisabled();
  await expect(work.getByText("貸方にも科目と金額を入れると記帳できます。")).toHaveCount(0);
  await expect(postButton).toHaveAccessibleDescription(INCOMPLETE_HINT);
  await expect(work.locator('[data-journal-line="credit-0"]').getByText("科目を選んでください")).toBeVisible();
});
