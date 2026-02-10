export const colors = {
    MAIN: "#33289E",
} as const;

export type colors = typeof colors[keyof typeof colors];
