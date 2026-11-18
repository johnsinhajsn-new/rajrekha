
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import { getIndiaDateString } from "@/lib/date";
import { TIME_SLOTS } from "@/lib/time-slots";
import Result from "@/models/Result";

function isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

export async function GET(request: Request) {
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

        const { searchParams } = new URL(request.url);
        const requestedDate = searchParams.get("date");
        const selectedDate = requestedDate || getIndiaDateString();

        if (!isValidDate(selectedDate)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid date. Use YYYY-MM-DD format.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        const savedResults = await Result.find({
            date: selectedDate,
        })
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
                results: saved?.results ?? {
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
                },
                status: saved?.status ?? "DRAFT",
                recordId: saved?._id?.toString() ?? null,
            };
        });

        return NextResponse.json(
            {
                success: true,
                date: selectedDate,
                totalSlots: data.length,
                savedCount: savedResults.length,
                data,
            },
            {
                headers: { "Cache-Control": "no-store" },
            }
        );
    } catch (error) {
        console.error("GET /api/results/history error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to fetch result history.",
            },
            { status: 500 }
        );
    }
}
