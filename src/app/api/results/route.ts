
import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import { getIndiaDateString } from "@/lib/date";
import { TIME_SLOTS } from "@/lib/time-slots";
import Result from "@/models/Result";
import { validateRequestOrigin } from "@/lib/csrf";

const EMPTY_RESULTS = {
    A: "",
    B: "",
    C: "",
    D: "",
    E: "",
    F: "",
    G: "",
    H: "",
    I: "",
    J: "",
};

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

    // Convert India time (UTC+05:30) into UTC.
    return new Date(
        Date.UTC(year, month - 1, day, hour, minute) - 330 * 60 * 1000
    );
}

function generateValueFromPattern(pattern: string): string {
    return Array.from(pattern, (character) => {
        if (/[0-9]/.test(character)) {
            return String(randomInt(0, 10));
        }

        if (/[A-Za-z]/.test(character)) {
            return String.fromCharCode(65 + randomInt(0, 26));
        }

        throw new Error("Only letters and numbers are supported.");
    }).join("");
}

function generateResults(columnA: string) {
    const results = {
        ...EMPTY_RESULTS,
        A: columnA,
    };

    for (const category of [
        "B", "C", "D", "E", "F", "G", "H", "I", "J",
    ] as const) {
        results[category] = generateValueFromPattern(columnA);
    }

    return results;
}

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        await connectDB();

        const today = getIndiaDateString();

        const savedResults = await Result.find({ date: today })
            .select("-__v")
            .lean();

        const resultMap = new Map(
            savedResults.map((item) => [item.timeSlotId, item])
        );

        const data = TIME_SLOTS.map((slot) => {
            const saved = resultMap.get(slot.id);

            return {
                timeSlotId: slot.id,
                time: slot.label,
                results: saved?.results ?? EMPTY_RESULTS,
                status: saved?.status ?? "DRAFT",
                recordId: saved?._id?.toString() ?? null,
            };
        });

        return NextResponse.json(
            {
                success: true,
                date: today,
                totalSlots: data.length,
                data,
            },
            {
                headers: { "Cache-Control": "no-store" },
            }
        );
    } catch (error) {
        console.error("GET /api/results error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to fetch results",
            },
            { status: 500 }
        );
    }
}

const ResultInputSchema = z.object({
    timeSlotId: z.number().int().min(1).max(42),

    results: z.object({
        A: z.string().trim().min(1).max(20),
    }).passthrough(),

    // Accepted temporarily for compatibility with the old frontend.
    // This value is deliberately ignored by the server.
    status: z.enum(["DRAFT", "PENDING", "PUBLISHED"]).optional(),
}).strict();

export async function POST(request: NextRequest) {
    try {
        if (!validateRequestOrigin(request)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid request origin.",
                },
                { status: 403 }
            );
        }

        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        let body: unknown;

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid JSON body",
                },
                { status: 400 }
            );
        }

        const validation = ResultInputSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid result data",
                    errors: validation.error.flatten(),
                },
                { status: 400 }
            );
        }

        const { timeSlotId, results } = validation.data;

        // Normalize Column A to uppercase.
        const columnA = results.A.toUpperCase();

        if (!/^[A-Z0-9]+$/.test(columnA)) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Column A mein sirf English letters aur numbers allowed hain.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        const today = getIndiaDateString();

        const slot = TIME_SLOTS.find(
            (item) => item.id === timeSlotId
        );

        if (!slot) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid time slot.",
                },
                { status: 400 }
            );
        }

        const scheduledAt = getScheduledAt(today, slot.label);

        // Do not allow an already published result to be overwritten.
        const existingResult = await Result.findOne({
            date: today,
            timeSlotId,
        }).select("status");

        if (existingResult?.status === "PUBLISHED") {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "This result is already published and cannot be changed.",
                },
                { status: 409 }
            );
        }

        // Generate B-J once. Only these generated values are saved.
        const generatedResults = generateResults(columnA);

        const updatedResult = await Result.findOneAndUpdate(
            {
                date: today,
                timeSlotId,
                status: { $ne: "PUBLISHED" },
            },
            {
                $set: {
                    results: generatedResults,
                    status: "PENDING",
                    scheduledAt,
                    publishedAt: null,
                },
                $setOnInsert: {
                    date: today,
                    timeSlotId,
                    createdBy: user.id,
                },
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        return NextResponse.json({
            success: true,
            message: "Result saved and scheduled successfully.",
            data: {
                recordId: updatedResult._id.toString(),
                date: updatedResult.date,
                timeSlotId: updatedResult.timeSlotId,
                results: updatedResult.results,
                status: updatedResult.status,
                scheduledAt: updatedResult.scheduledAt,
            },
        });
    } catch (error) {
        console.error("POST /api/results error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to save result",
            },
            { status: 500 }
        );
    }
}
