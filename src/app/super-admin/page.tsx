
import { Suspense } from "react";
import { connection } from "next/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireRole } from "@/lib/guards";

async function SuperAdminDashboardContent() {
    await connection();

    const user = await requireRole("SUPER_ADMIN");

    const stats = [
        { label: "Total Admins", value: "0", icon: "♙" },
        { label: "Total Results", value: "0", icon: "▤" },
        { label: "Active Admins", value: "0", icon: "✓" },
        { label: "System Status", value: "Online", icon: "●" },
    ];

    return (
        <DashboardShell role="SUPER_ADMIN" name={user.name}>
            <div>
                <h1 className="text-2xl font-bold">Platform Overview</h1>

                <p className="mt-1 text-sm text-slate-500">
                    Monitor and manage your RajRekha platform.
                </p>

                <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500">{stat.label}</p>
                                <span className="text-xl text-purple-600">{stat.icon}</span>
                            </div>

                            <h2 className="mt-4 text-3xl font-bold">{stat.value}</h2>
                        </div>
                    ))}
                </div>

                <div className="mt-7 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-bold">Admin Management</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Create, manage and control admin accounts.
                        </p>
                        <span className="mt-5 inline-block text-xs font-medium text-purple-600">
                            Management module available
                        </span>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-bold">System Notifications</h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Send maintenance and update announcements.
                        </p>
                        <span className="mt-5 inline-block text-xs font-medium text-purple-600">
                            Notification module coming next
                        </span>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}

export default function SuperAdminDashboard() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-sm text-slate-500">
                    Loading Super Admin Dashboard...
                </div>
            }
        >
            <SuperAdminDashboardContent />
        </Suspense>
    );
}
