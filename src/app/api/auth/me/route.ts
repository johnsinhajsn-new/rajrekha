
import { NextResponse, connection } from "next/server";

import { getCurrentUser } from "@/lib/session";

export async function GET() {
    // Wait for an incoming request before accessing cookies.
    await connection();

    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Authentication required.",
                },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                user,
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            }
        );
    } catch (error) {
        console.error("Session verification error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to verify session.",
            },
            { status: 500 }
        );
    }
}
