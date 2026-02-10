export const config = {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
};

export const STATUS_COLORS = {
    pending: "#FFA500",          // Orange
    confirmed: "#1976d2",        // Blue
    preparing: "#9c27b0",        // Purple
    ready_for_pickup: "#0288d1", // Cyan
    out_for_delivery: "#f57c00", // Deep Orange
    delivered: "#2e7d32",        // Green
    cancelled: "#d32f2f",        // Red
};