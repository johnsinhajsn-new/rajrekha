
import { Suspense } from "react";
import { connection } from "next/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ResultEntry from "@/components/admin/ResultEntry";
import { requireRole } from "@/lib/guards";

async function AdminDashboardContent() {
    await connection();

    const user = await requireRole("ADMIN");

    return (
        <DashboardShell role="ADMIN" name={user.name}>
            <ResultEntry />
        </DashboardShell>
    );
}

export default function AdminDashboard() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-sm text-slate-500">
                    Loading Admin Dashboard...
                </div>
            }
        >
            <AdminDashboardContent />
        </Suspense>
    );
}
