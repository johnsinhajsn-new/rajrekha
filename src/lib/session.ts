
    import "server-only";

    import { cookies } from "next/headers";
    import connectDB from "@/lib/mongodb";
    import User from "@/models/User";
    import { verifySession } from "@/lib/auth";

    export async function getCurrentUser() {
        const cookieStore = await cookies();
        const token = cookieStore.get("rr_session")?.value;

        if (!token) {
            return null;
        }

        const session = await verifySession(token);

        if (!session) {
            return null;
        }

        await connectDB();

        const user = await User.findById(session.userId)
            .select("_id name email role isActive")
            .lean();

        if (
            !user ||
            !user.isActive ||
            user.role !== session.role
        ) {
            return null;
        }

        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }
