"use client";

import { type FormulaId, evaluateFormula } from "@/lib/formulas";
import { formatAmount } from "@/lib/accounting";

// 条件を変えるパネル: スライダーで条件を動かし、式の出力をその場で見る(what-if)

export interface TweakParam {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}

interface Props {
  formula: FormulaId;
  params: TweakParam[];
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  goal: { output: string; equals: number; label: string };
}

export function TweakPanel({ formula, params, values, onChange, goal }: Props) {
  const result = evaluateFormula(formula, values);
  const reached = result.outputs[goal.output] === goal.equals;
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {params.map((p) => (
          <label key={p.id} className="block text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{p.label}</span>
              <span className="tabular-nums">
                {formatAmount(values[p.id] ?? p.value)} {p.unit}
              </span>
            </div>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={values[p.id] ?? p.value}
              onChange={(e) => onChange({ ...values, [p.id]: Number(e.target.value) })}
              className="w-full"
              aria-valuetext={`${formatAmount(values[p.id] ?? p.value)} ${p.unit}`}
            />
          </label>
        ))}
      </div>
      <dl className="rounded-md bg-muted/50 p-2 text-sm grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
        {Object.entries(result.outputs).map(([k, v]) => (
          <div key={k} className={`contents ${k === goal.output ? "font-semibold" : ""}`}>
            <dt>{result.labels[k]}</dt>
            <dd className="text-right tabular-nums">{formatAmount(v)} 円</dd>
          </div>
        ))}
      </dl>
      <p role="status" className={`text-sm ${reached ? "text-emerald-700" : "text-muted-foreground"}`}>
        目標: {goal.label}を {formatAmount(goal.equals)} 円にする{reached ? " — 達成" : ""}
      </p>
    </div>
  );
}
