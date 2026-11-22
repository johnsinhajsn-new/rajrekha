
import { NextRequest, NextResponse } from "next/server";
import { validateRequestOrigin } from "@/lib/csrf";

export async function POST(request: NextRequest) {
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

    const response = NextResponse.json({
        success: true,
        message: "Logged out successfully!",
    });

    response.cookies.set("rr_session", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });

    return response;
}
