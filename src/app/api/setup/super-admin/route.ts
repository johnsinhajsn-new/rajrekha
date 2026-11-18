
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";

import connectDB from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import User from "@/models/User";

const SetupSchema = z.object({
    name: z.string().trim().min(2).max(60),
    email: z.string().trim().email().max(254),
    password: z.string().min(12).max(128),
});

function isValidSetupSecret(received: string | null) {
    const expected = process.env.BOOTSTRAP_SECRET;

    if (!received || !expected) {
        return false;
    }

    const receivedBuffer = Buffer.from(received);
    const expectedBuffer = Buffer.from(expected);

    if (receivedBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
    try {
        // Verify bootstrap secret
        const setupSecret = request.headers.get("x-bootstrap-secret");

        if (!isValidSetupSecret(setupSecret)) {
            return NextResponse.json(
                { success: false, message: "Unauthorized setup request" },
                { status: 401 }
            );
        }

        // Validate request body
        const body = await request.json();
        const validation = SetupSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid input",
                    errors: validation.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        await connectDB();

        // Ensure MongoDB has created the unique index
        await User.init();

        // Only one Super Admin is allowed
        const existingSuperAdmin = await User.exists({
            role: "SUPER_ADMIN",
        });

        if (existingSuperAdmin) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Super Admin setup has already been completed",
                },
                { status: 409 }
            );
        }

        const { name, email, password } = validation.data;

        // Check email availability
        const existingUser = await User.findOne({
            email: email.toLowerCase(),
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This email is already registered",
                },
                { status: 409 }
            );
        }

        // Hash password before saving
        const passwordHash = await hashPassword(password);

        const superAdmin = await User.create({
            name,
            email: email.toLowerCase(),
            passwordHash,
            role: "SUPER_ADMIN",
            isActive: true,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Super Admin created successfully!",
                user: {
                    id: superAdmin._id.toString(),
                    name: superAdmin.name,
                    email: superAdmin.email,
                    role: superAdmin.role,
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        // Duplicate index protection
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Super Admin already exists",
                },
                { status: 409 }
            );
        }

        console.error("Super Admin setup error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
            },
            { status: 500 }
        );
    }
}
