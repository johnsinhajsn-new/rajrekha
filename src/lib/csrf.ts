
import "server-only";

import { NextRequest } from "next/server";

const ALLOWED_ORIGINS = new Set(
    [process.env.NEXT_PUBLIC_SITE_URL]
        .filter((origin): origin is string => Boolean(origin))
        .map((origin) => new URL(origin).origin)
);

export function validateRequestOrigin(request: NextRequest): boolean {
    const origin = request.headers.get("origin");

    if (!origin) {
        return false;
    }

    try {
        const requestOrigin = new URL(origin).origin;

        return ALLOWED_ORIGINS.has(requestOrigin);
    } catch {
        return false;
    }
}
