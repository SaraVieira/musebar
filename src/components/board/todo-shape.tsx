import { useCallback, useRef } from "react";
import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  T,
  resizeBox,
  type RecordProps,
  type TLBaseShape,
  type TLResizeInfo,
} from "tldraw";
import { CARD_COLORS, ColorPicker } from "./color-picker";
import { cn } from "#/lib/utils";

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TodoCardShapeProps {
  w: number;
  h: number;
  title: string;
  items: TodoItem[];
  color: string;
}

declare module "@tldraw/tlschema" {
  interface TLGlobalShapePropsMap {
    "todo-card": TodoCardShapeProps;
  }
}

export type TodoCardShape = TLBaseShape<"todo-card", TodoCardShapeProps>;

const todoItemValidator = T.object({
  id: T.string,
  text: T.string,
  done: T.boolean,
});

function newItem(text = ""): TodoItem {
  return { id: crypto.randomUUID(), text, done: false };
}

export class TodoCardShapeUtil extends ShapeUtil<TodoCardShape> {
  static override type = "todo-card" as const;
  static override props: RecordProps<TodoCardShape> = {
    w: T.number,
    h: T.number,
    title: T.string,
    items: T.arrayOf(todoItemValidator),
    color: T.string,
  };

  override getDefaultProps(): TodoCardShapeProps {
    return {
      w: 260,
      h: 200,
      title: "",
      items: [newItem()],
      color: CARD_COLORS[1].value,
    };
  }

  override canEdit = () => true;
  override canResize = () => true;
  override hideRotateHandle = () => true;

  override getGeometry(shape: TodoCardShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(shape: TodoCardShape, info: TLResizeInfo<TodoCardShape>) {
    return resizeBox(shape, info);
  }

  override getIndicatorPath(shape: TodoCardShape) {
    const path = new Path2D();
    path.roundRect(0, 0, shape.props.w, shape.props.h, 12);
    return path;
  }

  override component(shape: TodoCardShape) {
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id);
    return (
      <TodoCardBody
        shape={shape}
        isSelected={isSelected}
        onChange={(props) =>
          this.editor.updateShape({
            id: shape.id,
            type: "todo-card",
            props,
          })
        }
      />
    );
  }
}

interface TodoCardBodyProps {
  shape: TodoCardShape;
  isSelected: boolean;
  onChange: (props: Partial<TodoCardShapeProps>) => void;
}

function TodoCardBody({ shape, isSelected, onChange }: TodoCardBodyProps) {
  const itemRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const setItemRef = useCallback(
    (id: string) => (el: HTMLInputElement | null) => {
      if (el) itemRefs.current.set(id, el);
      else itemRefs.current.delete(id);
    },
    [],
  );

  const updateItem = (id: string, patch: Partial<TodoItem>) => {
    onChange({
      items: shape.props.items.map((it) =>
        it.id === id ? { ...it, ...patch } : it,
      ),
    });
  };

  const addItemAfter = (id: string) => {
    const idx = shape.props.items.findIndex((it) => it.id === id);
    const item = newItem();
    const next = [...shape.props.items];
    next.splice(idx + 1, 0, item);
    onChange({ items: next });
    requestAnimationFrame(() => {
      itemRefs.current.get(item.id)?.focus();
    });
  };

  const removeItem = (id: string) => {
    if (shape.props.items.length === 1) return;
    const idx = shape.props.items.findIndex((it) => it.id === id);
    const prev = shape.props.items[idx - 1] ?? shape.props.items[idx + 1];
    onChange({
      items: shape.props.items.filter((it) => it.id !== id),
    });
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
    onChange({ items: [...shape.props.items, item] });
    requestAnimationFrame(() => {
      itemRefs.current.get(item.id)?.focus();
    });
  };

  const remaining = shape.props.items.filter((it) => !it.done).length;

  return (
    <HTMLContainer
      className="relative overflow-visible"
      style={{
        width: shape.props.w,
        height: shape.props.h,
        pointerEvents: "all",
      }}
    >
      {isSelected ? (
        <ColorPicker
          selected={shape.props.color}
          onSelect={(color) => onChange({ color })}
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
        style={{ background: shape.props.color }}
      >
        {isSelected || shape.props.title ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shape.props.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Untitled list"
              className="min-w-0 flex-1 border-none bg-transparent text-sm font-semibold outline-none placeholder:text-gray-800/40"
            />
            <span className="shrink-0 text-xs opacity-60">
              {shape.props.items.length - remaining}/{shape.props.items.length}
            </span>
          </div>
        ) : null}

        <ul className="flex flex-col gap-1">
          {shape.props.items.map((item) => (
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
                    shape.props.items.length > 1
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
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            appendItem();
          }}
          className="mt-1 cursor-pointer self-start rounded border-0 bg-transparent px-1 py-0.5 text-xs text-gray-800/60 hover:text-gray-800"
        >
          + Add item
        </button>
      </div>
    </HTMLContainer>
  );
}
