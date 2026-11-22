
import "server-only";
import { isIP } from "node:net";
import type { NextRequest } from "next/server";

const VALID_IP_HEADERS = [
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip",
] as const;

type ClientIpHeader = (typeof VALID_IP_HEADERS)[number];

function isValidIp(value: string): boolean {
    return isIP(value) !== 0;
}

export function getClientIp(request: NextRequest): string {
    const configuredHeader = process.env.CLIENT_IP_HEADER?.toLowerCase();

    if (
        !configuredHeader ||
        !VALID_IP_HEADERS.includes(configuredHeader as ClientIpHeader)
    ) {
        throw new Error("CLIENT_IP_HEADER is missing or invalid.");
    }

    const rawIp = request.headers.get(configuredHeader);

    if (!rawIp) {
        throw new Error("Trusted client IP header is missing.");
    }

    // x-forwarded-for can contain multiple IPs.
    // The first value is used only when the trusted proxy overwrites
    // this header with a verified client IP chain.
    const ip = rawIp.split(",")[0]?.trim();

    if (!ip || !isValidIp(ip)) {
        throw new Error("Invalid client IP address.");
    }

    return ip;
}
