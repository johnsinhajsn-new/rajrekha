
import { NextResponse, connection } from "next/server";
import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
    await connection();

    try {
        const user = await getCurrentUser();

        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Forbidden",
                },
                {
                    status: user ? 403 : 401,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        await connectDB();

        return NextResponse.json(
            {
                success: true,
                message: "Database connection healthy.",
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (error) {
        console.error("Database health check failed:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Database health check failed.",
            },
            {
                status: 500,
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    }
}
