export const CATEGORY_COLORS: Record<string, string> = {
  academic: "#2f7355",
  admission: "#4e82b8",
  career: "#d28a23",
  recruit: "#8b5cf6",
  scholarship: "#e0567a",
  event: "#0ea5e9",
  general: "#6b7280",
};

export const DEFAULT_CATEGORY_COLOR = "#6b7280";

export function categoryColor(code: string): string {
  return CATEGORY_COLORS[code] ?? DEFAULT_CATEGORY_COLOR;
}
