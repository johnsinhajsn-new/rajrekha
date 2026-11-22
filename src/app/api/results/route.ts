
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";
import { getIndiaDateString } from "@/lib/date";
import { TIME_SLOTS } from "@/lib/time-slots";
import Result from "@/models/Result";
import { z } from "zod";
import { validateRequestOrigin } from "@/lib/csrf";

export async function GET() {
    try {
        // Check login
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Only Admin and Super Admin can access
        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            );
        }

        await connectDB();

        // Always use current Indian date
        const today = getIndiaDateString();

        // Fetch only today's saved results
        const savedResults = await Result.find({ date: today })
            .select("-__v")
            .lean();

        const resultMap = new Map(
            savedResults.map((item) => [item.timeSlotId, item])
        );

        // Return all 42 fixed slots
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

        return NextResponse.json({
            success: true,
            date: today,
            totalSlots: data.length,
            data,
        });
    } catch (error) {
        console.error("GET /api/results error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to fetch results" },
            { status: 500 }
        );
    }
    
}


const ResultInputSchema = z.object({
    timeSlotId: z.number().int().min(1).max(42),
    results: z.object({
        A: z.string().trim().max(20),
        B: z.string().trim().max(20),
        C: z.string().trim().max(20),
        D: z.string().trim().max(20),
        E: z.string().trim().max(20),
        F: z.string().trim().max(20),
        G: z.string().trim().max(20),
        H: z.string().trim().max(20),
        I: z.string().trim().max(20),
        J: z.string().trim().max(20),
    }).strict(),
    status: z.enum(["DRAFT", "PENDING", "PUBLISHED"]).default("DRAFT"),
}).strict();

export async function POST(request: NextRequest) {
    try {
        // CSRF Origin validation
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
        { success: false, message: "Invalid JSON body" },
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

        await connectDB();

        const today = getIndiaDateString();
        const { timeSlotId, results, status } = validation.data;

        const updatedResult = await Result.findOneAndUpdate(
            {
                date: today,
                timeSlotId,
            },
            {
                $set: {
                    results,
                    status,
                    publishedAt:
                        status === "PUBLISHED" ? new Date() : null,
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
            message: "Result saved successfully",
            data: {
                recordId: updatedResult._id.toString(),
                date: updatedResult.date,
                timeSlotId: updatedResult.timeSlotId,
                results: updatedResult.results,
                status: updatedResult.status,
            },
        });
    } catch (error) {
        console.error("POST /api/results error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to save result" },
            { status: 500 }
        );
    }
}

