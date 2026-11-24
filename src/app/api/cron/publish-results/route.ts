
import { randomInt, timingSafeEqual } from "crypto";
import { NextResponse, connection } from "next/server";

import connectDB from "@/lib/mongodb";
import { getIndiaDateString } from "@/lib/date";
import { TIME_SLOTS } from "@/lib/time-slots";
import Result from "@/models/Result";

const CATEGORIES = [
    "A", "B", "C", "D", "E",
    "F", "G", "H", "I", "J",
] as const;

type Category = (typeof CATEGORIES)[number];
type ResultValues = Record<Category, string>;

function isAuthorized(request: Request): boolean {
    const secret = process.env.CRON_SECRET;

    if (!secret) return false;

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) return false;

    const suppliedSecret = authorization.slice(7);
    const expectedBuffer = Buffer.from(secret);
    const suppliedBuffer = Buffer.from(suppliedSecret);

    if (expectedBuffer.length !== suppliedBuffer.length) return false;

    return timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function generateColumnValue(category: Category): string {
    const digits = String(randomInt(0, 100)).padStart(2, "0");
    return `Z${category}${digits}`;
}

function generateResults(
    existing?: Partial<ResultValues> | null
): ResultValues {
    const results = {} as ResultValues;

    for (const category of CATEGORIES) {
        const expectedPattern = new RegExp(`^Z${category}\\d{2}$`);
        const oldValue = existing?.[category];

        if (typeof oldValue === "string" && expectedPattern.test(oldValue)) {
            results[category] = oldValue;
        } else {
            results[category] = generateColumnValue(category);
        }
    }

    return results;
}

function getScheduledAt(date: string, timeLabel: string): Date {
    const match = timeLabel.match(
        /^(\d{1,2}):(\d{2})\s*(A\.?M\.?|P\.?M\.?)$/i
    );

    if (!match) {
        throw new Error(`Invalid time slot format: ${timeLabel}`);
    }

    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    const day = Number(date.slice(8, 10));

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const period = match[3].replace(/\./g, "").toUpperCase();

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
        throw new Error(`Invalid time slot: ${timeLabel}`);
    }

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    // Convert India Standard Time (UTC+05:30) into UTC.
    return new Date(
        Date.UTC(year, month - 1, day, hour, minute) -
        330 * 60 * 1000
    );
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

        const today = getIndiaDateString();
        const now = new Date();

        let publishedCount = 0;
        let skippedCount = 0;

        for (const slot of TIME_SLOTS) {
            const scheduledAt = getScheduledAt(today, slot.label);

            // Do not generate results before their scheduled time.
            if (scheduledAt.getTime() > now.getTime()) {
                continue;
            }

            const existing = await Result.findOne({
                date: today,
                timeSlotId: slot.id,
            }).lean();

            // Never modify an already published result.
            if (existing?.status === "PUBLISHED") {
                skippedCount++;
                continue;
            }

            // Preserve valid existing values and generate missing values.
            const results = generateResults(
                existing?.results as Partial<ResultValues> | undefined
            );

            try {
                const updated = await Result.findOneAndUpdate(
                    {
                        date: today,
                        timeSlotId: slot.id,
                        status: { $ne: "PUBLISHED" },
                    },
                    {
                        $set: {
                            results,
                            status: "PUBLISHED",
                            scheduledAt,
                            publishedAt: now,
                        },
                        $setOnInsert: {
                            date: today,
                            timeSlotId: slot.id,
                        },
                    },
                    {
                        new: true,
                        upsert: true,
                        runValidators: true,
                        setDefaultsOnInsert: true,
                    }
                );

                if (updated?.status === "PUBLISHED") {
                    publishedCount++;
                }
            } catch (error) {
                // Another request may have created this slot simultaneously.
                // The unique date/timeSlot index prevents duplicate records.
                if (
                    typeof error === "object" &&
                    error !== null &&
                    "code" in error &&
                    error.code === 11000
                ) {
                    const latest = await Result.findOne({
                        date: today,
                        timeSlotId: slot.id,
                    });

                    if (latest?.status === "PUBLISHED") {
                        skippedCount++;
                        continue;
                    }

                    if (latest) {
                        const latestResults = generateResults(
                            latest.results as Partial<ResultValues>
                        );

                        latest.results = latestResults;
                        latest.status = "PUBLISHED";
                        latest.scheduledAt = scheduledAt;
                        latest.publishedAt = now;

                        await latest.save();
                        publishedCount++;
                    }

                    continue;
                }

                throw error;
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: "Scheduled result generation and publishing completed.",
                date: today,
                publishedCount,
                skippedCount,
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
