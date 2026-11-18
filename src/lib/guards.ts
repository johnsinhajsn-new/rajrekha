
import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export async function requireRole(
    allowedRole: "ADMIN" | "SUPER_ADMIN"
) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    if (user.role !== allowedRole) {
        if (user.role === "SUPER_ADMIN") {
            redirect("/super-admin");
        }

        redirect("/admin");
    }

    return user;
}
