import { Settings } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";
import { Switch } from "#/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { cn } from "#/lib/utils";
import type { BgVariant, BoardSettings } from "#/lib/board/settings";
import { Checkbox } from "../ui/checkbox";

const BG_PATTERNS: { value: BgVariant; label: string }[] = [
  { value: "dots", label: "Dots" },
  { value: "lines", label: "Lines" },
  { value: "cross", label: "Cross" },
  { value: "none", label: "None" },
];

const GRID_SIZES = [
  { value: 10, label: "S" },
  { value: 20, label: "M" },
  { value: 40, label: "L" },
];

const BG_COLORS = [
  "#27272a",
  "#3f3f46",
  "#52525b",
  "#f59e0b",
  "#3b82f6",
  "#10b981",
  "#a855f7",
];

export function BoardSettingsButton({
  settings,
  onChange,
}: {
  settings: BoardSettings;
  onChange: (patch: Partial<BoardSettings>) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            variant="ghost"
            size="icon"
            aria-label="Board settings"
            title="Board settings"
          >
            <Settings aria-hidden />
          </Button>
        )}
      />
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="snap-toggle" className="text-sm">
                Snap to grid
              </Label>
              <p className="text-muted-foreground text-xs">
                Nodes stick to the grid while dragging.
              </p>
            </div>
            <Switch
              id="snap-toggle"
              checked={settings.snap}
              onCheckedChange={(v) => onChange({ snap: v })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm">Grid size</Label>
            <ToggleGroup
              value={[String(settings.gridSize)]}
              onValueChange={(v) => {
                const next = v[0];
                if (next) onChange({ gridSize: Number(next) });
              }}
              className="w-full"
            >
              {GRID_SIZES.map((g) => (
                <ToggleGroupItem
                  key={g.value}
                  value={String(g.value)}
                  className="flex-1"
                >
                  {g.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm">Background pattern</Label>
            <ToggleGroup
              value={[settings.bgVariant]}
              onValueChange={(v) => {
                const next = v[0] as BgVariant | undefined;
                if (next) onChange({ bgVariant: next });
              }}
              className="grid grid-cols-4"
            >
              {BG_PATTERNS.map((p) => (
                <ToggleGroupItem key={p.value} value={p.value}>
                  {p.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm">Pattern color</Label>
            <div className="flex flex-wrap gap-2">
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => onChange({ bgColor: c })}
                  style={{ background: c }}
                  className={cn(
                    "size-6 cursor-pointer rounded-full border border-white/10",
                    settings.bgColor === c &&
                      "ring-foreground ring-offset-popover ring-2 ring-offset-2",
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="snap-minimap" className="text-sm">
                Minimap
              </Label>
              <p className="text-muted-foreground text-xs">Show minimap</p>
            </div>
            <Switch
              id="show-minimap"
              checked={settings.minimap}
              onCheckedChange={(v) => onChange({ minimap: v })}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
