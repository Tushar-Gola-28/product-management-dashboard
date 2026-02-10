import { toast } from "sonner";

type ToastAction = {
    label: string;
    onClick: () => void;
};

const baseOptions = {
    position: "top-center" as const,
};

const closeAction = {
    label: "✖",
    onClick: () => toast.dismiss(),
};

export const showToast = (
    title: string,
    description?: string,
    action?: ToastAction
) => {
    return toast(title, {
        ...baseOptions,
        description,
        action,
        cancel: closeAction,
    });
};

export const showSuccessToast = (
    title: string,
    description?: string,
    action?: ToastAction
) => {
    return toast.success(title, {
        ...baseOptions,
        description,
        action,
        cancel: closeAction,
    });
};

export const showErrorToast = (
    title: string,
    description?: string,
    action?: ToastAction
) => {
    return toast.error(title, {
        ...baseOptions,
        description,
        action,
        cancel: closeAction,
    });
};

export const showWarningToast = (
    title: string,
    description?: string,
    action?: ToastAction
) => {
    return toast.warning(title, {
        ...baseOptions,
        description,
        action,
        cancel: closeAction,
    });
};
