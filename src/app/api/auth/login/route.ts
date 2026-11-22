
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { checkLoginRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { validateRequestOrigin } from "@/lib/csrf";
import {
    createSession,
    verifyPassword,
} from "@/lib/auth";

const LoginSchema = z.object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128),
});

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

        const body = await request.json().catch(() => null);
        const validation = LoginSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Please enter valid login details.",
                },
                { status: 400 }
            );
        }

        await connectDB();

        const { email, password } = validation.data;

        // Get client IP address
        const ip = getClientIp(request);

        // Check login rate limit
        let rateLimit;

        try {
            rateLimit = await checkLoginRateLimit(ip, email);
        } catch (error) {
            console.error("Login rate-limit service error:", error);

            return NextResponse.json(
                {
                    success: false,
                    message: "Login service is temporarily unavailable. Please try again later.",
                },
                {
                    status: 503,
                    headers: {
                        "Retry-After": "60",
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        if (!rateLimit.success) {
            const retryAfter = Math.max(
                1,
                Math.ceil((rateLimit.reset - Date.now()) / 1000)
            );

            return NextResponse.json(
                {
                    success: false,
                    message: "Too many login attempts. Please try again later.",
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(retryAfter),
                        "Cache-Control": "no-store",
                    },
                }
            );
        }

        const user = await User.findOne({
            email: email.toLowerCase(),
        }).select("+passwordHash");

        if (!user || !user.isActive || !user.passwordHash) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email or password.",
                },
                { status: 401 }
            );
        }

        const passwordMatches = await verifyPassword(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email or password.",
                },
                { status: 401 }
            );
        }

        const token = await createSession({
            userId: user._id.toString(),
            role: user.role,
        });

        user.lastLogin = new Date();
        await user.save();

        const response = NextResponse.json({
            success: true,
            message: "Login successful!",
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

        response.cookies.set("rr_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 8,
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Unable to process login.",
            },
            { status: 500 }
        );
    }
}
