import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPageSizeFromSettings() {
  try {
    const raw = localStorage.getItem("app_settings_v1");
    if (!raw) return 10;

    const parsed = JSON.parse(raw);
    return parsed.pageSize ? Number(parsed.pageSize) : 10;
  } catch {
    return 10;
  }
}

export function getTableDensityFromSettings(): "comfortable" | "compact" {
  try {
    const raw = localStorage.getItem("app_settings_v1");
    if (!raw) return "comfortable";

    const parsed = JSON.parse(raw);
    return parsed.density === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}
