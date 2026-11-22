
import { Suspense } from "react";
import { connection } from "next/server";
import { requireRole } from "@/lib/guards";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardLoadingState from "@/components/dashboard/DashboardLoadingState";
import AdminManagementClient from "./AdminManagementClient";

async function AdminManagementContent() {
    await connection();

    const user = await requireRole("SUPER_ADMIN");

    return (
        <DashboardShell role="SUPER_ADMIN" name={user.name}>
            <AdminManagementClient />
        </DashboardShell>
    );
}

export default function AdminManagementPage() {
    return (
        <Suspense
            fallback={<DashboardLoadingState label="Loading Admin Management..." />}
        >
            <AdminManagementContent />
        </Suspense>
    );
}
