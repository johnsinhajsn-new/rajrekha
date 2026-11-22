"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DashboardShellProps = {
    children: React.ReactNode;
    role: "ADMIN" | "SUPER_ADMIN";
    name: string;
};

type MenuItem = {
    label: string;
    href: string;
    icon: "dashboard" | "history" | "admins";
};

const adminMenu: MenuItem[] = [
    { label: "Dashboard", href: "/admin", icon: "dashboard" },
    { label: "Result History", href: "/admin/history", icon: "history" },
];

const superAdminMenu: MenuItem[] = [
    { label: "Dashboard", href: "/super-admin", icon: "dashboard" },
    { label: "Admin Management", href: "/super-admin/admins", icon: "admins" },
];

function MenuIcon({ name }: { name: MenuItem["icon"] }) {
    const paths = {
        dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
        history: <><path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>,
        admins: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    };

    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            {paths[name]}
        </svg>
    );
}

export default function DashboardShell({ children, role, name }: DashboardShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isSuperAdmin = role === "SUPER_ADMIN";
    const menu = isSuperAdmin ? superAdminMenu : adminMenu;
    const activeItem = menu.find((item) => pathname === item.href)
        ?? menu
            .filter((item) => item.href !== "/admin" && item.href !== "/super-admin" && pathname.startsWith(`${item.href}/`))
            .sort((left, right) => right.href.length - left.href.length)[0]
        ?? menu[0];

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    async function handleLogout() {
        if (loggingOut) return;

        setLoggingOut(true);

        try {
            const response = await fetch("/api/auth/logout", { method: "POST" });

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
        <div className="dashboard-theme min-h-screen bg-[#f0f2f5] text-[#343a40]">
            {mobileMenuOpen && (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 z-40 bg-black/45 md:hidden"
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-[#2c2c32] text-white shadow-xl transition-transform duration-200 md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-white/10 px-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e91e63] text-sm font-bold tracking-wide text-white">RR</div>
                    <div>
                        <h1 className="text-lg font-bold tracking-wide">RajRekha</h1>
                        <p className="text-xs text-white/55">{isSuperAdmin ? "Super Admin Panel" : "Admin Panel"}</p>
                    </div>
                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        onClick={() => setMobileMenuOpen(false)}
                        className="ml-auto rounded-md p-2 text-white/70 hover:bg-white/10 md:hidden"
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </div>

                <div className="px-4 py-6">
                    <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[1.8px] text-white/45">Main Menu</p>
                    <nav aria-label="Main navigation" className="space-y-1.5">
                        {menu.map((item) => {
                            const active = pathname === item.href || (
                                item.href !== "/admin" &&
                                item.href !== "/super-admin" &&
                                pathname.startsWith(`${item.href}/`)
                            );

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${active ? "bg-[#e91e63] text-white shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
                                >
                                    <MenuIcon name={item.icon} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto border-t border-white/10 p-4">
                    <div className="mb-3 rounded-lg bg-white/[0.06] p-3">
                        <p className="text-xs text-white/50">Logged in as</p>
                        <p className="mt-1 truncate text-sm font-semibold text-white">{name}</p>
                        <p className="mt-1 text-[10px] font-semibold tracking-wider text-[#ff80ab]">{role.replace("_", " ")}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full rounded-lg border border-white/15 px-3 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                        {loggingOut ? "Signing out..." : "Log out"}
                    </button>
                </div>
            </aside>

            <div className="min-h-screen md:pl-[264px]">
                <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-4 border-b border-[#e5e7eb] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(25,35,45,0.05)] sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            aria-label="Open navigation menu"
                            aria-expanded={mobileMenuOpen}
                            onClick={() => setMobileMenuOpen(true)}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
                        >
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[#87909a]">RajRekha <span aria-hidden="true">/</span> {activeItem.label}</p>
                            <h2 className="mt-0.5 truncate text-base font-bold text-[#343a40] sm:text-lg">{activeItem.label}</h2>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="max-w-40 truncate text-sm font-semibold text-[#343a40]">{name}</p>
                            <p className="text-[11px] text-[#87909a]">{role.replace("_", " ")}</p>
                        </div>
                        <div aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fde7ef] text-sm font-bold text-[#c2185b]">
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="rounded-lg px-2 py-2 text-xs font-semibold text-[#68717b] hover:bg-slate-50 hover:text-[#c2185b] disabled:opacity-50 sm:hidden"
                        >
                            {loggingOut ? "..." : "Log out"}
                        </button>
                    </div>
                </header>

                <main className="min-h-[calc(100vh-76px)] p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto w-full max-w-[1440px]">{children}</div>
                </main>
            </div>
        </div>
    );
}
