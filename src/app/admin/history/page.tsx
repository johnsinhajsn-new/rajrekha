
import { Suspense } from "react";
import { connection } from "next/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardLoadingState from "@/components/dashboard/DashboardLoadingState";
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
            fallback={<DashboardLoadingState label="Loading Result History..." />}
        >
            <ResultHistoryContent />
        </Suspense>
    );
}
