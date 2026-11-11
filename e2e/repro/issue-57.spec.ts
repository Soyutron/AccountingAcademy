import { expect, test } from "@playwright/test";

const GENERIC = "結果の表で何が動くはずか";

// Issue #57: 小口現金を「現金」と書く、切手代を消耗品費にする誤りに誤答パターンが無く、汎用文だけが出ていた
test("小口現金の単元で、小口現金を現金と書く・切手代を消耗品費にすると専用の説明が出る", async ({ page }) => {
  await page.goto("/units/cash-and-deposits/petty-cash");
  const work = page.getByRole("region", { name: "ワークスペース" });
  const setLine = async (side: "借方" | "貸方", n: number, account: string, amount: number) => {
    await work.getByLabel(`${side}の科目${n}`).fill(account);
    await work.getByLabel(`${side}の科目${n}`).press("Escape");
    await work.getByLabel(`${side}の金額${n}`).fill(String(amount));
  };
  const submit = () => work.getByRole("button", { name: "記帳する" }).click();
  const status = page.getByRole("status").filter({ hasText: "もう一歩" });
  const misconception = page.getByText("よくある思い込み: 小口現金も金庫の現金と同じ");

  await page.getByRole("button", { name: "次へ →" }).first().click();
  await expect(page.getByText("ステップ2 / 9")).toBeVisible();

  await setLine("借方", 1, "現金", 30000);
  await setLine("貸方", 1, "当座預金", 30000);
  await submit();
  await expect(status).toContainText("金庫の現金とは分けて");
  await expect(status).not.toContainText(GENERIC);
  await expect(misconception).toBeVisible();

  await setLine("借方", 1, "小口現金", 30000);
  await submit();
  await expect(page.getByText("できました", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ3 / 9")).toBeVisible();
  await page.getByRole("button", { name: "次へ →" }).click();
  await expect(page.getByText("ステップ4 / 9")).toBeVisible();

  const addDebitLine = work.getByRole("button", { name: "行を追加" }).first();
  await setLine("借方", 1, "通信費", 4000);
  await addDebitLine.click();
  await setLine("借方", 2, "消耗品費", 6500);
  await addDebitLine.click();
  await setLine("借方", 3, "旅費交通費", 2000);
  await setLine("貸方", 1, "現金", 12500);
  await submit();
  await expect(status).toContainText("金庫の現金とは分けて");
  await expect(status).not.toContainText(GENERIC);
  await expect(misconception).toBeVisible();

  await setLine("借方", 1, "消耗品費", 4000);
  await setLine("貸方", 1, "小口現金", 12500);
  await submit();
  await expect(status).toContainText("通信費");
  await expect(status).not.toContainText(GENERIC);
});
