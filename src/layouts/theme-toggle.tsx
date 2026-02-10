import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "../components/ui";

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const handleToggle = () => {
        if (theme === "light") setTheme("dark");
        else if (theme === "dark") setTheme("system");
        else setTheme("light");
    };


    return (
        <Button aria-label="icons" variant="outline" size="icon" onClick={handleToggle}>
            {theme === "dark" ? (
                <Moon className="h-5 w-5" />
            ) : theme === "light" ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Laptop className="h-5 w-5" />
            )}
        </Button>
    );
}

