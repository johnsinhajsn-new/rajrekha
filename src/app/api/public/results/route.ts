
import { NextResponse, connection } from "next/server";

import connectDB from "@/lib/mongodb";
import { getIndiaDateString } from "@/lib/date";
import { TIME_SLOTS } from "@/lib/time-slots";
import Result from "@/models/Result";

function isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
    );
}

export async function GET(request: Request) {
    // Wait for an incoming request before reading its URL.
    await connection();

    try {
        const { searchParams } = new URL(request.url);

        // Default date is today's Indian date.
        const requestedDate = searchParams.get("date");
        const selectedDate = requestedDate || getIndiaDateString();

        if (!isValidDate(selectedDate)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid date. Use YYYY-MM-DD format.",
                },
                {
                    status: 400,
                    headers: { "Cache-Control": "no-store" },
                }
            );
        }

        await connectDB();

        // Only published records are accessible publicly.
        const savedResults = await Result.find({
            date: selectedDate,
            status: "PUBLISHED",
        })
            .select("timeSlotId results status -_id")
            .lean();

        const slotMap = new Map(
            savedResults.map((item) => [item.timeSlotId, item])
        );

        // Return all 42 slots, but never expose drafts.
        const data = TIME_SLOTS.map((slot) => {
            const saved = slotMap.get(slot.id);

            return {
                timeSlotId: slot.id,
                time: slot.label,
                published: Boolean(saved),
                results: saved?.results ?? null,
            };
        });

        return NextResponse.json(
            {
                success: true,
                date: selectedDate,
                totalSlots: TIME_SLOTS.length,
                publishedCount: savedResults.length,
                data,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (error) {
        console.error("GET /api/public/results error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to fetch public results.",
            },
            {
                status: 500,
                headers: { "Cache-Control": "no-store" },
            }
        );
    }
}
