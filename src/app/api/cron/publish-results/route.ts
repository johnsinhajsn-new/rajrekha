
import { timingSafeEqual } from "crypto";
import { NextResponse, connection } from "next/server";

import connectDB from "@/lib/mongodb";
import Result from "@/models/Result";

function isAuthorized(request: Request): boolean {
    const secret = process.env.CRON_SECRET;

    if (!secret) {
        return false;
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
        return false;
    }

    const suppliedSecret = authorization.slice(7);

    const expectedBuffer = Buffer.from(secret);
    const suppliedBuffer = Buffer.from(suppliedSecret);

    if (expectedBuffer.length !== suppliedBuffer.length) {
        return false;
    }

    return timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function GET(request: Request) {
    await connection();
    
    try {
        if (!isAuthorized(request)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                {
                    status: 401,
                    headers: { "Cache-Control": "no-store" },
                }
            );
        }

        await connectDB();

        const now = new Date();

        const result = await Result.updateMany(
            {
                status: "PENDING",
                scheduledAt: {
                    $ne: null,
                    $lte: now,
                },
            },
            {
                $set: {
                    status: "PUBLISHED",
                    publishedAt: now,
                },
            }
        );

        return NextResponse.json(
            {
                success: true,
                message: "Scheduled publishing check completed.",
                publishedCount: result.modifiedCount,
                checkedAt: now.toISOString(),
            },
            {
                headers: { "Cache-Control": "no-store" },
            }
        );
    } catch (error) {
        console.error("Scheduled result publishing error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to publish scheduled results.",
            },
            {
                status: 500,
                headers: { "Cache-Control": "no-store" },
            }
        );
    }
}
