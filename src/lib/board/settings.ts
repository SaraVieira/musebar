export type BgVariant = "dots" | "lines" | "cross" | "none";

export interface BoardSettings {
  snap: boolean;
  gridSize: number;
  bgVariant: BgVariant;
  bgColor: string;
}

export const DEFAULT_BOARD_SETTINGS: BoardSettings = {
  snap: false,
  gridSize: 20,
  bgVariant: "dots",
  bgColor: "#3f3f46",
};

const VALID_BG: readonly BgVariant[] = ["dots", "lines", "cross", "none"];

export function normalizeSettings(raw: unknown): BoardSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_BOARD_SETTINGS;
  const s = raw as Partial<BoardSettings>;
  return {
    snap: typeof s.snap === "boolean" ? s.snap : DEFAULT_BOARD_SETTINGS.snap,
    gridSize:
      typeof s.gridSize === "number" && s.gridSize > 0
        ? s.gridSize
        : DEFAULT_BOARD_SETTINGS.gridSize,
    bgVariant: VALID_BG.includes(s.bgVariant as BgVariant)
      ? (s.bgVariant as BgVariant)
      : DEFAULT_BOARD_SETTINGS.bgVariant,
    bgColor:
      typeof s.bgColor === "string" ? s.bgColor : DEFAULT_BOARD_SETTINGS.bgColor,
  };
}
