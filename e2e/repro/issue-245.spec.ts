import { expect, test, type Page } from "@playwright/test";

function ide(page: Page) {
  const work = page.getByRole("region", { name: "ワークスペース" });
  const status = page.getByRole("status");
  const next = page.getByRole("button", { name: "次へ →" });
  const post = async (debit: string, credit: string, amount: string) => {
    await work.getByLabel("借方の科目1").fill(debit);
    await work.getByLabel("借方の金額1").fill(amount);
    await work.getByLabel("貸方の科目1").fill(credit);
    await work.getByLabel("貸方の金額1").fill(amount);
    await work.getByRole("button", { name: "記帳する" }).click();
  };
  const passed = () => expect(status.getByText("できました", { exact: true })).toBeVisible();
  const predict = async (values: string[]) => {
    const labels = ["資産", "負債", "純資産", "収益", "費用"];
    for (let i = 0; i < 5; i++) await work.getByLabel(`${labels[i]}の予想`, { exact: true }).selectOption({ label: values[i] });
    await work.getByRole("button", { name: "予想して記帳する" }).click();
  };
  const calc = async (value: string) => {
    await work.getByPlaceholder("金額(円)").fill(value);
    await work.getByRole("button", { name: "確認する" }).click();
    await passed();
  };
  const specific = async (debit: string, credit: string, amount: string, phrase: string) => {
    await post(debit, credit, amount);
    await expect(status.getByText("もう一歩", { exact: true })).toBeVisible();
    await expect(status).toContainText(phrase);
    await expect(status).not.toContainText("結果の表で何が動くはずかを考えて");
  };
  return { next, post, passed, predict, calc, specific };
}

test("最初の単元・三分法・現金過不足の自然な誤答に、汎用文でない説明を返す", async ({ page }) => {
  const { next, post, passed, predict, calc, specific } = ide(page);
  await page.goto("/units/bookkeeping-basics/five-elements");
  await next.click();
  await post("現金", "資本金", "1000000");
  await passed();
  await next.click();
  await predict(["増える", "増える", "変わらない", "変わらない", "変わらない"]);
  await next.click();
  await specific("普通預金", "借入金", "300000", "現金で受け取って");
  await post("現金", "借入金", "300000");
  await passed();
  await next.click();
  await post("現金", "売上", "80000");
  await passed();
  await next.click();
  await specific("資本金", "現金", "50000", "支払家賃という費用");
  await specific("支払家賃", "借入金", "50000", "減ったのは現金");

  await page.goto("/units/merchandise/three-account-method");
  await next.click();
  await specific("仕入", "普通預金", "30000", "現金で支払って");
  await post("仕入", "現金", "30000");
  await passed();
  await next.click();
  await predict(["減る", "変わらない", "減る", "変わらない", "増える"]);
  await next.click();
  await specific("現金", "資本金", "90000", "あなたが出した元手");
  await specific("現金", "借入金", "90000", "返す必要のないお金");

  await page.goto("/units/cash-and-deposits/cash-over-and-short");
  await next.click();
  await post("現金過不足", "現金", "3000");
  await passed();
  await next.click();
  await predict(["減る", "変わらない", "減る", "変わらない", "増える"]);
  await next.click();
  await calc("1000");
  await next.click();
  await specific("通信費", "現金過不足", "1000", "原因が分かった2,000円");
  await specific("雑損", "普通預金", "1000", "帳簿の中");
});
