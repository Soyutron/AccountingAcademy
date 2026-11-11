"use client";

import { type MouseEvent, type ReactNode, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { DndContext, type DragEndEvent, DragOverlay, MouseSensor, pointerWithin, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { motion, useReducedMotion } from "motion/react";
import { type AccountInfo, type Element, ELEMENTS } from "@/lib/accounting";
import { ELEMENT_STYLE } from "@/lib/elements";

// 仕分けボード: 科目を 5 つの箱に入れる。正本の経路はクリックとキーボードで、ドラッグはその上乗せ

interface Props {
  accounts: AccountInfo[];
  placed: Partial<Record<string, Element>>;
  onChange: (placed: Partial<Record<string, Element>>) => void;
  wrong: Set<string>;
  disabled?: boolean;
}

const POOL_ID = "pool";
const CHIP_CLASS = "rounded-full border px-3 min-h-10 text-sm select-none touch-manipulation";
// 読み上げは「入れました」の 1 文に揃える。dnd-kit の既定は英語で、持ち上げるたびに喋る
const NO_ANNOUNCEMENTS = { announcements: { onDragStart: () => undefined, onDragOver: () => undefined, onDragEnd: () => undefined, onDragCancel: () => undefined } };

interface ChipProps {
  account: AccountInfo;
  selected: boolean;
  wrong: boolean;
  pressed?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function Chip({ account, selected, wrong, pressed, disabled, onPress }: ChipProps) {
  // attributes は渡さない。キーボード操作はボタンのままで、role や tabindex を上書きされたくない
  const { listeners, setNodeRef, isDragging } = useDraggable({ id: account.id, disabled });
  const reduced = useReducedMotion();
  return (
    <motion.button
      ref={setNodeRef}
      {...listeners}
      layout={reduced ? false : "position"}
      transition={{ layout: { duration: 0.2 } }}
      type="button"
      data-chip={account.id}
      data-wrong={wrong || undefined}
      disabled={disabled}
      onClick={onPress}
      aria-pressed={pressed}
      className={`${CHIP_CLASS} ${disabled ? "" : "cursor-grab"} ${isDragging ? "opacity-40" : ""} ${selected ? "border-primary bg-primary text-primary-foreground" : wrong ? "border-error-fg text-error-fg bg-background" : "bg-background"}`}
    >
      {account.name}
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

function Bin({ element, onPress, children }: { element: Element; onPress?: () => void; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: element });
  const style = ELEMENT_STYLE[element];
  // 余白を押す経路はポインタ専用で、キーボードと読み上げは見出しの button を使う。button の中のクリックはそれぞれの button が処理する
  const onClick = onPress && ((e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest("button")) onPress();
  });
  return (
    <div ref={setNodeRef} data-drop={element} data-over={isOver || undefined} onClick={onClick} className={`rounded-md border p-2 min-h-20 ${onPress ? "cursor-pointer" : ""} ${style.border} ${style.bg} ${isOver ? `ring-2 ring-offset-1 brightness-95 ${style.ring}` : ""}`}>
      {children}
    </div>
  );
}

export function ClassifyBoard({ accounts, placed, onChange, wrong, disabled }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<AccountInfo | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const poolChips = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // タッチは長押しで持ち上げ、チップの上から始めたスワイプでもページをスクロールできるようにする
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );
  const pool = accounts.filter((a) => !placed[a.id]);

  const move = (id: string, to: Element | null) => {
    const next = { ...placed };
    if (to) next[id] = to;
    else delete next[id];
    onChange(next);
    const name = accounts.find((a) => a.id === id)?.name;
    setAnnouncement(to ? `${name}を${ELEMENT_STYLE[to].label}に入れました` : `${name}を候補に戻しました`);
  };
  const place = (el: Element, byKeyboard: boolean) => {
    if (!selected) return;
    flushSync(() => {
      move(selected, el);
      setSelected(null);
    });
    // focus() はプールまでスクロールするので、タップでは移さない(ページが跳ねる。Issue #223)
    if (byKeyboard) poolChips.current?.querySelector<HTMLElement>("[data-chip]")?.focus();
  };
  const unplace = (id: string) => {
    // 箱の中の chip は消え、プールには別の DOM ノードとして描かれるので、描画後に移す(Issue #85)
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
    const to = over.id === POOL_ID ? null : (over.id as Element);
    if ((placed[id] ?? null) === to) return;
    move(id, to);
    if (selected === id) setSelected(null);
  };

  const chip = (a: AccountInfo, inBin: boolean) => (
    <Chip
      key={a.id}
      account={a}
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
      onDragStart={({ active }) => setDragging(accounts.find((a) => a.id === active.id) ?? null)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="space-y-3" role="group" aria-label="仕分けボード">
        <div role="status" className="sr-only">{announcement}</div>
        <Pool>
          <div className="text-xs text-muted-foreground mb-1">科目を箱へドラッグするか、科目を押してから箱を押します</div>
          <div ref={poolChips} className="flex flex-wrap gap-1">{pool.map((a) => chip(a, false))}</div>
          {pool.length === 0 && <div className="text-xs text-muted-foreground">全部の科目を箱に入れました。</div>}
        </Pool>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ELEMENTS.map((el) => (
            <Bin key={el} element={el} onPress={selected && !disabled ? () => place(el, false) : undefined}>
              <button
                type="button"
                aria-disabled={disabled || !selected}
                onClick={(e) => !disabled && selected && place(el, e.detail === 0)}
                className={`w-full text-left text-xs font-semibold mb-1 rounded hover:bg-background/70 px-1 min-h-10 ${ELEMENT_STYLE[el].text} ${selected ? "" : "opacity-70"}`}
              >
                <span aria-hidden>{ELEMENT_STYLE[el].symbol} </span>
                {ELEMENT_STYLE[el].label}{selected ? " ← ここに入れる" : ""}
              </button>
              <div className="flex flex-wrap gap-1">{accounts.filter((a) => placed[a.id] === el).map((a) => chip(a, true))}</div>
            </Bin>
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={reduced ? null : undefined}>
        {dragging && <div aria-hidden data-drag-overlay className={`${CHIP_CLASS} inline-flex items-center bg-background shadow-lg cursor-grabbing`}>{dragging.name}</div>}
      </DragOverlay>
    </DndContext>
  );
}
