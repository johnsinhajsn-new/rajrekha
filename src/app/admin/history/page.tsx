
import { Suspense } from "react";
import { connection } from "next/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ResultHistory from "@/components/admin/ResultHistory";
import { requireRole } from "@/lib/guards";

async function ResultHistoryContent() {
    await connection();

    const user = await requireRole("ADMIN");

    return (
        <DashboardShell role="ADMIN" name={user.name}>
            <ResultHistory />
        </DashboardShell>
    );
}

export default function AdminHistoryPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-sm text-slate-500">
                    Loading Result History...
                </div>
            }
        >
            <ResultHistoryContent />
        </Suspense>
    );
}
