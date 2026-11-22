
import "server-only";

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let redis: Redis | null = null;
let ipLimiter: Ratelimit | null = null;
let emailLimiter: Ratelimit | null = null;

function getLimiters() {
    if (ipLimiter && emailLimiter) {
        return { ipLimiter, emailLimiter };
    }

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
        throw new Error("Upstash Redis environment variables are missing.");
    }

    redis = new Redis({
        url: redisUrl,
        token: redisToken,
    });

    ipLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "15 m"),
        prefix: "rajrekha:ratelimit:login:ip",
    });

    emailLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "15 m"),
        prefix: "rajrekha:ratelimit:login:email",
    });

    return { ipLimiter, emailLimiter };
}

export async function checkLoginRateLimit(
    ip: string,
    email: string
) {
    const { ipLimiter, emailLimiter } = getLimiters();

    const normalizedEmail = email.trim().toLowerCase();

    const [ipResult, emailResult] = await Promise.all([
        ipLimiter.limit(ip),
        emailLimiter.limit(normalizedEmail),
    ]);

    return {
        success: ipResult.success && emailResult.success,
        remaining: Math.min(
            ipResult.remaining,
            emailResult.remaining
        ),
        reset: Math.max(
            ipResult.reset,
            emailResult.reset
        ),
    };
}
