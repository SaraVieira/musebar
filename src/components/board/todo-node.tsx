import { useCallback, useRef } from "react";
import {
  NodeResizer,
  useReactFlow,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import { CARD_COLORS, ColorPicker } from "./color-picker";
import { NodeHandles } from "./node-handles";
import { cn } from "#/lib/utils";

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

interface TodoNodeData {
  title?: string;
  items?: TodoItem[];
  color?: string;
  [key: string]: unknown;
}

export type TodoNode = Node<TodoNodeData, "todo">;

function newItem(text = ""): TodoItem {
  return { id: crypto.randomUUID(), text, done: false };
}

export function TodoNodeView({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<TodoNode>) {
  const { updateNodeData } = useReactFlow();
  const itemRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const items = data.items ?? [newItem()];
  const color = data.color ?? CARD_COLORS[1].value;
  const title = data.title ?? "";

  const setItemRef = useCallback(
    (itemId: string) => (el: HTMLInputElement | null) => {
      if (el) itemRefs.current.set(itemId, el);
      else itemRefs.current.delete(itemId);
    },
    [],
  );

  const setItems = (next: TodoItem[]) => updateNodeData(id, { items: next });

  const updateItem = (itemId: string, patch: Partial<TodoItem>) => {
    setItems(items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)));
  };

  const addItemAfter = (itemId: string) => {
    const idx = items.findIndex((it) => it.id === itemId);
    const item = newItem();
    const next = [...items];
    next.splice(idx + 1, 0, item);
    setItems(next);
    requestAnimationFrame(() => itemRefs.current.get(item.id)?.focus());
  };

  const removeItem = (itemId: string) => {
    if (items.length === 1) return;
    const idx = items.findIndex((it) => it.id === itemId);
    const prev = items[idx - 1] ?? items[idx + 1];
    setItems(items.filter((it) => it.id !== itemId));
    if (prev) {
      requestAnimationFrame(() => {
        const el = itemRefs.current.get(prev.id);
        el?.focus();
        el?.setSelectionRange(el.value.length, el.value.length);
      });
    }
  };

  const appendItem = () => {
    const item = newItem();
    setItems([...items, item]);
    requestAnimationFrame(() => itemRefs.current.get(item.id)?.focus());
  };

  const remaining = items.filter((it) => !it.done).length;

  return (
    <div className="group relative size-full" style={{ width, height }}>
      <NodeResizer
        minWidth={200}
        minHeight={120}
        isVisible={selected}
        lineClassName="!border-gray-900/40"
        handleClassName="!bg-white !border !border-gray-900/40 !size-2"
      />
      {selected ? (
        <ColorPicker
          selected={color}
          onSelect={(c) => updateNodeData(id, { color: c })}
        />
      ) : null}
      <div
        onPointerDown={(e) => {
          if ((e.target as Element).closest("input, button, label")) {
            e.stopPropagation();
          }
        }}
        onKeyDown={(e) => e.stopPropagation()}
        className="flex size-full flex-col gap-4 overflow-auto rounded-xl p-4 text-sm text-gray-800 shadow-md"
        style={{ background: color }}
      >
        {selected || title ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => updateNodeData(id, { title: e.target.value })}
              placeholder="Untitled list"
              className="min-w-0 flex-1 border-none bg-transparent text-sm font-semibold outline-none placeholder:text-gray-800/40"
            />
            <span className="shrink-0 text-xs opacity-60">
              {items.length - remaining}/{items.length}
            </span>
          </div>
        ) : null}

        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) =>
                  updateItem(item.id, { done: e.target.checked })
                }
                className="size-4 shrink-0 cursor-pointer accent-gray-800"
              />
              <input
                ref={setItemRef(item.id)}
                type="text"
                value={item.text}
                onChange={(e) => updateItem(item.id, { text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItemAfter(item.id);
                  } else if (
                    e.key === "Backspace" &&
                    item.text === "" &&
                    items.length > 1
                  ) {
                    e.preventDefault();
                    removeItem(item.id);
                  }
                }}
                placeholder="Item"
                className={cn(
                  "min-w-0 flex-1 border-none bg-transparent outline-none placeholder:text-gray-800/40",
                  item.done && "text-gray-800/50 line-through",
                )}
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={appendItem}
          className="mt-1 cursor-pointer self-start rounded border-0 bg-transparent px-1 py-0.5 text-xs text-gray-800/60 hover:text-gray-800"
        >
          + Add item
        </button>
      </div>
      <NodeHandles />
    </div>
  );
}
