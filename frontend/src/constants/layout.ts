/** Shared max-width classes — keep header and main in sync via useLayoutWidth(). */
export const LAYOUT_WIDTH_CALENDAR = "max-w-full";
export const LAYOUT_WIDTH_DEFAULT = "max-w-full";

/** Approximate fixed header block (border + py-4 + title row). */
export const LAYOUT_HEADER_OFFSET = "4.5rem";

export function layoutWidthForPath(pathname: string): string {
    if (pathname === "/") return LAYOUT_WIDTH_CALENDAR;
    return LAYOUT_WIDTH_DEFAULT;
}

export function isCalendarPath(pathname: string): boolean {
    return pathname === "/"
}
