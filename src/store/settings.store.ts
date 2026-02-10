export type ThemeMode = "light" | "dark" | "system";
export type DensityMode = "comfortable" | "compact";
export type SidebarMode = "expanded" | "collapsed";

export type AppSettings = {
    theme: ThemeMode;
    density: DensityMode;
    pageSize: 10 | 20 | 50;
    sidebar: SidebarMode;
};

const KEY = "app_settings_v1";

export const defaultSettings: AppSettings = {
    theme: "system",
    density: "comfortable",
    pageSize: 10,
    sidebar: "expanded",
};

export function loadSettings(): AppSettings {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return defaultSettings;
        return { ...defaultSettings, ...JSON.parse(raw) };
    } catch {
        return defaultSettings;
    }
}

export function saveSettings(settings: AppSettings) {
    localStorage.setItem(KEY, JSON.stringify(settings));
}
