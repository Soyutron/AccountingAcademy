import { describe, expect, it } from "vitest";
import { splitAmounts } from "./task-text";

describe("splitAmounts", () => {
  it("3 桁区切りの金額を区切りなしの数字にする", () => {
    expect(splitAmounts("元手として現金 100,000 円をお店に出資した")).toEqual([
      "元手として現金 ",
      { text: "100,000 円", digits: "100000" },
      "をお店に出資した",
    ]);
  });
  it("複数の金額と、空白なし・区切りなしの金額も拾う", () => {
    expect(splitAmounts("切手代 4,000 円と文房具代 6500円を現金で払った")).toEqual([
      "切手代 ",
      { text: "4,000 円", digits: "4000" },
      "と文房具代 ",
      { text: "6500円", digits: "6500" },
      "を現金で払った",
    ]);
  });
  it("「円」が付かない数字や年数は金額にしない", () => {
    expect(splitAmounts("耐用年数 6 年で 2024 年に買った")).toEqual(["耐用年数 6 年で 2024 年に買った"]);
    expect(splitAmounts("")).toEqual([]);
  });
});
