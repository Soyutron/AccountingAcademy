import { describe, expect, it } from "vitest";
import { HELP_CATEGORIES, HELP_TOPICS, currentTopics, helpTopic } from "./help-topics";

// 「いまの画面でできること」は、現在のステップで画面に出ている機能だけに絞る(docs/help-design.md 4 章)

const base = { postedCount: 0, isLast: false, hasHint: false } as const;

describe("help topics", () => {
  it("id は重複せず、分類は登録済みのものだけ", () => {
    const ids = HELP_TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const cats = new Set(HELP_CATEGORIES.map((c) => c.id));
    for (const t of HELP_TOPICS) expect(cats.has(t.category)).toBe(true);
  });

  it("post のステップでは仕訳帳と影響だけが出る", () => {
    expect(currentTopics({ ...base, taskType: "post" }).map((t) => t.id)).toEqual(["journal", "impact"]);
  });

  it("tweak のステップでは条件を変えるだけが出る", () => {
    expect(currentTopics({ ...base, taskType: "tweak" }).map((t) => t.id)).toEqual(["tweak"]);
  });

  it("記帳が 2 件以上なら会社のかたちと帳簿をさかのぼるが加わり、ヒントがあればヒントも出る", () => {
    const ids = currentTopics({ taskType: "post", postedCount: 2, isLast: false, hasHint: true }).map((t) => t.id);
    expect(ids).toEqual(["hint", "journal", "impact", "shape", "rewind"]);
  });

  it("最後の observe は自由に試す扱い", () => {
    const ids = currentTopics({ ...base, taskType: "observe", isLast: true }).map((t) => t.id);
    expect(ids).toEqual(["journal", "impact", "sandbox"]);
  });

  it("無い話題は例外", () => {
    expect(() => helpTopic("nope")).toThrow();
  });
});

describe("first-time topics", () => {
  it("predict / classify / calc / tweak と最後の observe(自由に試す)に案内を出し、post と途中の observe には出さない", async () => {
    const { firstTimeTopic, canShowTarget, helpTopic } = await import("./help-topics");
    expect(firstTimeTopic({ ...base, taskType: "predict" })?.id).toBe("predict");
    expect(firstTimeTopic({ ...base, taskType: "tweak" })?.id).toBe("tweak");
    expect(firstTimeTopic({ ...base, taskType: "observe", isLast: true })?.id).toBe("sandbox");
    expect(firstTimeTopic({ ...base, taskType: "post" })).toBeNull();
    expect(firstTimeTopic({ ...base, taskType: "observe" })).toBeNull();
    // 場所を示す: 対象があり、いまの画面に出ているものだけ
    expect(canShowTarget(helpTopic("rewind"), { ...base, taskType: "post" })).toBe(false);
    expect(canShowTarget(helpTopic("rewind"), { ...base, taskType: "post", postedCount: 2 })).toBe(true);
    expect(canShowTarget(helpTopic("resume"), { ...base, taskType: "post" })).toBe(false);
  });
});
