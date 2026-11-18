
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type DashboardShellProps = {
    children: React.ReactNode;
    role: "ADMIN" | "SUPER_ADMIN";
    name: string;
};

const adminMenu = [
    { label: "Dashboard", href: "/admin", icon: "▦" },
    { label: "Results", href: "/admin/results", icon: "▤" },
    { label: "Add Result", href: "/admin/results/new", icon: "+" },
    { label: "Result History", href: "/admin/history", icon: "◷" },
    { label: "Profile Settings", href: "/admin/settings", icon: "⚙" },
];

const superAdminMenu = [
    { label: "Dashboard", href: "/super-admin", icon: "▦" },
    { label: "Admin Management", href: "/super-admin/admins", icon: "♙" },
    { label: "Result Monitoring", href: "/super-admin/results", icon: "▤" },
    { label: "Notifications", href: "/super-admin/notifications", icon: "♧" },
    { label: "Website Settings", href: "/super-admin/settings", icon: "⚙" },
    { label: "Activity Logs", href: "/super-admin/logs", icon: "◷" },
];

export default function DashboardShell({
    children,
    role,
    name,
}: DashboardShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    const isSuperAdmin = role === "SUPER_ADMIN";
    const menu = isSuperAdmin ? superAdminMenu : adminMenu;

    async function handleLogout() {
        if (loggingOut) return;

        setLoggingOut(true);

        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Logout failed");
            }

            router.replace("/login");
            router.refresh();
        } catch {
            setLoggingOut(false);
            alert("Logout nahi ho paya. Please dobara try karein.");
        }
    }

    return (
        <div className="min-h-screen bg-[#f5f5fa] text-slate-800">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col bg-[#21143d] text-white md:flex">
                <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold">
                        RR
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">RajRekha</h1>
                        <p className="text-xs text-purple-200">Control Panel</p>
                    </div>
                </div>

                <div className="px-5 py-6">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[2px] text-purple-300">
                        Main Menu
                    </p>

                    <nav className="space-y-2">
                        {menu.map((item) => {
                            const active = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${active
                                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-pink-950/20"
                                            : "text-purple-100 hover:bg-white/10"
                                        }`}
                                >
                                    <span className="w-5 text-center text-lg">
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto border-t border-white/10 p-5">
                    <div className="mb-4 rounded-xl bg-white/10 p-3">
                        <p className="text-xs text-purple-200">Logged in as</p>
                        <p className="mt-1 truncate text-sm font-semibold">{name}</p>
                        <p className="mt-1 text-[10px] tracking-wider text-pink-300">
                            {role.replace("_", " ")}
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full rounded-xl border border-white/20 px-4 py-3 text-left text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                        {loggingOut ? "Signing out..." : "↪  Logout"}
                    </button>
                </div>
            </aside>

            <div className="md:pl-[260px]">
                <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm md:px-8">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            RajRekha Control Center
                        </h2>
                        <p className="text-xs text-slate-500">
                            Welcome back, {name}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden rounded-lg bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700 sm:block">
                            {role.replace("_", " ")}
                        </span>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 font-bold text-white">
                            {name.charAt(0).toUpperCase()}
                        </div>

                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="text-sm font-medium text-slate-600 hover:text-pink-600 md:hidden"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <main className="min-h-[calc(100vh-76px)] p-5 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
