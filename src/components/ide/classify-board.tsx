"use client";

import { type MouseEvent, type ReactNode, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { DndContext, type DragEndEvent, DragOverlay, MouseSensor, pointerWithin, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { motion, useReducedMotion } from "motion/react";
import { type Element, ELEMENTS } from "@/lib/accounting";
import { ELEMENT_STYLE } from "@/lib/elements";
import type { ClassifyBox } from "@/lib/grading";

// 仕分けボード: 項目を箱に入れる。箱は5要素か、単元が決めたもの(Issue #262)。正本の経路はクリックとキーボードで、ドラッグはその上乗せ

interface Props {
  boxes: ClassifyBox[];
  // 科目なら科目名、任意の箱なら項目の文
  items: ClassifyBox[];
  placed: Partial<Record<string, string>>;
  onChange: (placed: Partial<Record<string, string>>) => void;
  wrong: Set<string>;
  disabled?: boolean;
}

const POOL_ID = "pool";
const CHIP_CLASS = "rounded-full border px-3 min-h-10 text-sm select-none touch-manipulation";
// 任意の箱の項目は文になるので、折り返しても読める角丸にする
const LONG_CHIP_CLASS = "rounded-md border px-3 py-1 min-h-10 text-sm text-left select-none touch-manipulation";
// 5要素でない箱は色を持たない
const PLAIN_BOX = { text: "text-foreground", bg: "bg-muted/40", border: "border-border", ring: "ring-primary" };
// 読み上げは「入れました」の1文に揃える。dnd-kitの既定は英語で、持ち上げるたびに喋る
const NO_ANNOUNCEMENTS = { announcements: { onDragStart: () => undefined, onDragOver: () => undefined, onDragEnd: () => undefined, onDragCancel: () => undefined } };

interface ChipProps {
  item: ClassifyBox;
  long: boolean;
  selected: boolean;
  wrong: boolean;
  pressed?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function Chip({ item, long, selected, wrong, pressed, disabled, onPress }: ChipProps) {
  // attributesは渡さない。キーボード操作はボタンのままで、roleやtabindexを上書きされたくない
  const { listeners, setNodeRef, isDragging } = useDraggable({ id: item.id, disabled });
  const reduced = useReducedMotion();
  return (
    <motion.button
      ref={setNodeRef}
      {...listeners}
      layout={reduced ? false : "position"}
      transition={{ layout: { duration: 0.2 } }}
      type="button"
      data-chip={item.id}
      data-wrong={wrong || undefined}
      disabled={disabled}
      onClick={onPress}
      aria-pressed={pressed}
      className={`${long ? LONG_CHIP_CLASS : CHIP_CLASS} ${disabled ? "" : "cursor-grab"} ${isDragging ? "opacity-40" : ""} ${selected ? "border-primary bg-primary text-primary-foreground" : wrong ? "border-error-fg text-error-fg bg-background" : "bg-background"}`}
    >
      {item.label}
      {wrong && <span className="sr-only">(間違い)</span>}
    </motion.button>
  );
}

function Pool({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID });
  return (
    <div ref={setNodeRef} data-drop={POOL_ID} data-over={isOver || undefined} className={`rounded-md border border-dashed p-2 min-h-10 ${isOver ? "ring-2 ring-primary" : ""}`}>
      {children}
    </div>
  );
}

function boxStyle(id: string) {
  return Object.hasOwn(ELEMENT_STYLE, id) ? ELEMENT_STYLE[id as Element] : PLAIN_BOX;
}

function Bin({ id, onPress, children }: { id: string; onPress?: () => void; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const style = boxStyle(id);
  // 余白を押す経路はポインタ専用で、キーボードと読み上げは見出しのbuttonを使う。buttonの中のクリックはそれぞれのbuttonが処理する
  const onClick = onPress && ((e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest("button")) onPress();
  });
  return (
    <div ref={setNodeRef} data-drop={id} data-over={isOver || undefined} onClick={onClick} className={`rounded-md border p-2 min-h-20 ${onPress ? "cursor-pointer" : ""} ${style.border} ${style.bg} ${isOver ? `ring-2 ring-offset-1 brightness-95 ${style.ring}` : ""}`}>
      {children}
    </div>
  );
}

export function ClassifyBoard({ boxes, items, placed, onChange, wrong, disabled }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<ClassifyBox | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const poolChips = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // タッチは長押しで持ち上げ、チップの上から始めたスワイプでもページをスクロールできるようにする
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );
  const elementBoxes = boxes.every((b) => Object.hasOwn(ELEMENT_STYLE, b.id));
  const boxLabel = (id: string) => boxes.find((b) => b.id === id)?.label;
  const pool = items.filter((a) => !placed[a.id]);
  const noun = elementBoxes ? "科目" : "項目";

  const move = (id: string, to: string | null) => {
    const next = { ...placed };
    if (to) next[id] = to;
    else delete next[id];
    onChange(next);
    const name = items.find((a) => a.id === id)?.label;
    setAnnouncement(to ? `${name}を${boxLabel(to)}に入れました` : `${name}を候補に戻しました`);
  };
  const place = (el: string, byKeyboard: boolean) => {
    if (!selected) return;
    flushSync(() => {
      move(selected, el);
      setSelected(null);
    });
    // focus()はプールまでスクロールするので、タップでは移さない(ページが跳ねる。Issue #223)
    if (byKeyboard) poolChips.current?.querySelector<HTMLElement>("[data-chip]")?.focus();
  };
  const unplace = (id: string) => {
    // 箱の中のchipは消え、プールには別のDOMノードとして描かれるので、描画後に移す(Issue #85)
    flushSync(() => {
      move(id, null);
      setSelected(id);
    });
    poolChips.current?.querySelector<HTMLElement>(`[data-chip="${id}"]`)?.focus();
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!over) return;
    const id = String(active.id);
    const to = over.id === POOL_ID ? null : String(over.id);
    if ((placed[id] ?? null) === to) return;
    move(id, to);
    if (selected === id) setSelected(null);
  };

  const chip = (a: ClassifyBox, inBin: boolean) => (
    <Chip
      key={a.id}
      item={a}
      long={!elementBoxes}
      selected={selected === a.id}
      wrong={wrong.has(a.id)}
      pressed={inBin ? undefined : selected === a.id}
      disabled={disabled}
      onPress={() => (inBin ? unplace(a.id) : setSelected(selected === a.id ? null : a.id))}
    />
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      accessibility={NO_ANNOUNCEMENTS}
      onDragStart={({ active }) => setDragging(items.find((a) => a.id === active.id) ?? null)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="space-y-3" role="group" aria-label="仕分けボード">
        <div role="status" className="sr-only">{announcement}</div>
        <Pool>
          <div className="text-xs text-muted-foreground mb-1">{noun}を箱へドラッグするか、{noun}を押してから箱を押します</div>
          <div ref={poolChips} className="flex flex-wrap gap-1">{pool.map((a) => chip(a, false))}</div>
          {pool.length === 0 && <div className="text-xs text-muted-foreground">全部の{noun}を箱に入れました。</div>}
        </Pool>
        {/* 箱が2つなら375px幅でも横に並べる。5要素は従来どおり */}
        <div className={`grid gap-2 ${boxes.length === ELEMENTS.length ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2"}`}>
          {boxes.map(({ id: el, label }) => (
            <Bin key={el} id={el} onPress={selected && !disabled ? () => place(el, false) : undefined}>
              <button
                type="button"
                aria-disabled={disabled || !selected}
                onClick={(e) => !disabled && selected && place(el, e.detail === 0)}
                className={`w-full text-left text-xs font-semibold mb-1 rounded hover:bg-background/70 px-1 min-h-10 ${boxStyle(el).text} ${selected ? "" : "opacity-70"}`}
              >
                {elementBoxes && <span aria-hidden>{ELEMENT_STYLE[el as Element].symbol} </span>}
                {label}{selected ? " ← ここに入れる" : ""}
              </button>
              <div className="flex flex-wrap gap-1">{items.filter((a) => placed[a.id] === el).map((a) => chip(a, true))}</div>
            </Bin>
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={reduced ? null : undefined}>
        {dragging && <div aria-hidden data-drag-overlay className={`${elementBoxes ? CHIP_CLASS : LONG_CHIP_CLASS} inline-flex items-center bg-background shadow-lg cursor-grabbing`}>{dragging.label}</div>}
      </DragOverlay>
    </DndContext>
  );
}
