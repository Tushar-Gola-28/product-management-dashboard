import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../hooks/use-online-status";

export function OfflineBanner() {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-2xl bg-red-600 text-white shadow-lg flex items-center gap-2 text-sm">
            <WifiOff size={16} />
            You are offline. Some features may not work.
        </div>
    );
}
