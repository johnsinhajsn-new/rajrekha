
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/session";
import { hashPassword } from "@/lib/auth";

const createAdminSchema = z.object({
    name: z.string().trim().min(2).max(60),
    email: z.string().trim().email().max(254),
    password: z.string().min(12).max(128),
});

async function authorizeSuperAdmin() {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
        return null;
    }

    return currentUser;
}

export async function GET() {
    try {
        const currentUser = await authorizeSuperAdmin();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 403 }
            );
        }

        await connectDB();

        const admins = await User.find({ role: "ADMIN" })
            .select("_id name email isActive lastLogin createdAt")
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            admins: admins.map((admin) => ({
                id: admin._id.toString(),
                name: admin.name,
                email: admin.email,
                isActive: admin.isActive,
                lastLogin: admin.lastLogin,
                createdAt: admin.createdAt,
            })),
        });
    } catch {
        return NextResponse.json(
            { success: false, message: "Unable to fetch admins" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await authorizeSuperAdmin();

        if (!currentUser) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const parsed = createAdminSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, message: "Please enter valid details. Password must be at least 12 characters." },
                { status: 400 }
            );
        }

        await connectDB();

        const email = parsed.data.email.toLowerCase();

        const existingUser = await User.findOne({ email }).select("_id");

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "This email is already registered." },
                { status: 409 }
            );
        }

        const passwordHash = await hashPassword(parsed.data.password);

        const admin = await User.create({
            name: parsed.data.name,
            email,
            passwordHash,
            role: "ADMIN",
            isActive: true,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Admin account created successfully.",
                admin: {
                    id: admin._id.toString(),
                    name: admin.name,
                    email: admin.email,
                    isActive: admin.isActive,
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            return NextResponse.json(
                { success: false, message: "This email is already registered." },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, message: "Unable to create admin." },
            { status: 500 }
        );
    }
}
