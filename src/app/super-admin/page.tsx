import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardLoadingState from "@/components/dashboard/DashboardLoadingState";
import { requireRole } from "@/lib/guards";

async function SuperAdminDashboardContent() {
    await connection();

    const user = await requireRole("SUPER_ADMIN");

    return (
        <DashboardShell role="SUPER_ADMIN" name={user.name}>
            <div className="space-y-6">
                <div>
                    <h1 className="dashboard-page-title">Platform Overview</h1>
                    <p className="dashboard-page-description">
                        Manage administrator access for your RajRekha platform.
                    </p>
                </div>

                <section className="dashboard-card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="flex items-start gap-4">
                        <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#fde7ef] text-[#c2185b]">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#343a40]">Admin Management</h2>
                            <p className="mt-1 max-w-xl text-sm leading-6 text-[#7b8490]">
                                Create administrator accounts, review their status, and manage access.
                            </p>
                        </div>
                    </div>
                    <Link href="/super-admin/admins" className="dashboard-primary-button w-full sm:w-auto">
                        Manage admins
                    </Link>
                </section>
            </div>
        </DashboardShell>
    );
}

export default function SuperAdminDashboard() {
    return (
        <Suspense
            fallback={<DashboardLoadingState label="Loading Super Admin Dashboard..." />}
        >
            <SuperAdminDashboardContent />
        </Suspense>
    );
}
