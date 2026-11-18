
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/session";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(
    request: NextRequest,
    { params }: RouteContext
) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 403 }
            );
        }

        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid admin ID." },
                { status: 400 }
            );
        }

        const body: unknown = await request.json();

        if (
            typeof body !== "object" ||
            body === null ||
            !("isActive" in body) ||
            typeof body.isActive !== "boolean"
        ) {
            return NextResponse.json(
                { success: false, message: "Invalid status." },
                { status: 400 }
            );
        }

        await connectDB();

        const admin = await User.findOneAndUpdate(
            { _id: id, role: "ADMIN" },
            { $set: { isActive: body.isActive } },
            { new: true, runValidators: true }
        ).select("_id name email isActive");

        if (!admin) {
            return NextResponse.json(
                { success: false, message: "Admin not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: body.isActive
                ? "Admin activated successfully."
                : "Admin deactivated successfully.",
            admin: {
                id: admin._id.toString(),
                name: admin.name,
                email: admin.email,
                isActive: admin.isActive,
            },
        });
    } catch {
        return NextResponse.json(
            { success: false, message: "Unable to update admin status." },
            { status: 500 }
        );
    }
}
