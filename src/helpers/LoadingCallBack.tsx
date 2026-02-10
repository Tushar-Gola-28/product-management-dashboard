import { Loader2 } from "lucide-react";
export const LoadingCallBack = () => {

    return (
        <div className="flex w-full flex-col items-center justify-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
                Checking authentication...
            </p>
        </div>
    );

}