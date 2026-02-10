import { useEffect, useState } from "react";
import { loadSettings, saveSettings, type AppSettings } from "../store/settings.store";

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
    useEffect(() => {
        saveSettings(settings);
    }, [settings]);


    return { settings, setSettings };
}

