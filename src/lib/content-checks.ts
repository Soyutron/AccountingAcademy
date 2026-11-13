// velite.config.tsのprepareから呼ぶ横断検査のうち、単体テストで固定するもの(docs/content-model.md 7章、ADR 0009)

interface UnitForCheck {
  kind: "lesson" | "history" | "forensics";
  level: number;
  sources?: { title: string; note?: string }[];
  steps: { task: { type: string } }[];
}

/** kindごとの課題の条件と、出典の必須を検査する */
export function unitKindErrors(u: UnitForCheck): string[] {
  const errors: string[] = [];
  const types = u.steps.map((st) => st.task.type);
  if (u.kind === "lesson") {
    if (!types.some((t) => t === "post" || t === "predict")) errors.push("postかpredictのステップが1つもない");
  } else if (!types.some((t) => t !== "observe")) {
    errors.push(`kind: ${u.kind}なのにobserve以外のステップが1つもない`);
  }
  if ((u.kind !== "lesson" || u.level >= 3) && !u.sources?.length) {
    errors.push(u.kind !== "lesson" ? `kind: ${u.kind}の単元にsourcesがない` : `深さ${u.level}の単元にsourcesがない`);
  }
  return errors;
}

/** パスはexamかeraのどちらかを持つ */
export function pathErrors(p: { exam?: unknown; era?: string }): string[] {
  return p.exam || p.era ? [] : ["examとeraのどちらも無い"];
}
