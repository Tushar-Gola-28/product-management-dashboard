import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useSettings } from "../../hooks/use-settings";
export function SettingsPage() {
    const { settings, setSettings } = useSettings();
    const { setTheme, theme } = useTheme();
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your dashboard preferences (theme, density, page size, sidebar).
                </p>
            </div>

            <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Theme Settings</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="font-medium">Theme Mode</p>
                            <p className="text-sm text-muted-foreground">
                                Choose Light, Dark or System default theme.
                            </p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={theme === "light" ? "default" : "outline"}
                                aria-label="Light"
                                onClick={() => setTheme("light")}
                            >
                                Light
                            </Button>

                            <Button
                                variant={theme === "dark" ? "default" : "outline"}
                                aria-label="Dark"
                                onClick={() => setTheme("dark")}
                            >
                                Dark
                            </Button>

                            <Button
                                variant={theme === "system" ? "default" : "outline"}
                                onClick={() => setTheme("system")}
                                aria-label="System"
                            >
                                System
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">Current: {theme}</Badge>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Display Settings</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="font-medium">Table Density</p>
                            <p className="text-sm text-muted-foreground">
                                Comfortable has more spacing, Compact fits more rows.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant={settings.density === "comfortable" ? "default" : "outline"}
                                onClick={() =>
                                    setSettings((prev) => ({ ...prev, density: "comfortable" }))
                                }
                                aria-label="Comfortable"
                            >
                                Comfortable
                            </Button>

                            <Button
                                variant={settings.density === "compact" ? "default" : "outline"}
                                aria-label="Compact"
                                onClick={() => setSettings((prev) => ({ ...prev, density: "compact" }))}
                            >
                                Compact
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="font-medium">Default Page Size</p>
                            <p className="text-sm text-muted-foreground">
                                Choose how many items show per page by default.
                            </p>
                        </div>

                        <select
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            value={settings.pageSize}
                            onChange={(e) =>
                                setSettings((prev) => ({
                                    ...prev,
                                    pageSize: Number(e.target.value) as 10 | 20 | 50,
                                }))
                            }
                        >
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                            <option value={50}>50 / page</option>
                        </select>
                    </div>

                    {/* Sidebar */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="font-medium">Sidebar Default State</p>
                            <p className="text-sm text-muted-foreground">
                                Expanded sidebar shows labels, collapsed saves space.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant={settings.sidebar === "expanded" ? "default" : "outline"}
                                onClick={() =>
                                    setSettings((prev) => ({ ...prev, sidebar: "expanded" }))
                                }
                                aria-label="Expanded"
                            >
                                Expanded
                            </Button>

                            <Button
                                variant={settings.sidebar === "collapsed" ? "default" : "outline"}
                                onClick={() =>
                                    setSettings((prev) => ({ ...prev, sidebar: "collapsed" }))
                                }
                                aria-label="Collapsed"
                            >
                                Collapsed
                            </Button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl border p-4 bg-muted/30">
                        <p className="text-sm font-semibold mb-2">Current Settings</p>

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Theme: {settings.theme}</Badge>
                            <Badge variant="secondary">Density: {settings.density}</Badge>
                            <Badge variant="secondary">Page Size: {settings.pageSize}</Badge>
                            <Badge variant="secondary">Sidebar: {settings.sidebar}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reset */}
            <div className="flex justify-end">
                <Button
                    variant="destructive"
                    aria-label="Reset All Settings"
                    onClick={() => {
                        localStorage.removeItem("app_settings_v1");
                        window.location.reload();
                    }}
                >
                    Reset All Settings
                </Button>
            </div>
        </div>
    );
}
