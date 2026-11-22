
"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";

type Admin = {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    lastLogin: string | null;
    createdAt: string;
};

export default function AdminManagementPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [pendingAdmin, setPendingAdmin] = useState<Admin | null>(null);

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);

    async function loadAdmins() {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/super-admin/admins");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load admins.");
            }

            setAdmins(data.admins);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAdmins();
    }, []);

    async function handleCreateAdmin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setCreating(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch("/api/super-admin/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Admin creation failed.");
            }

            setMessage(data.message);
            setForm({ name: "", email: "", password: "" });
            await loadAdmins();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setCreating(false);
        }
    }

    async function toggleAdmin(admin: Admin) {
        setMessage("");
        setError("");

        try {
            const response = await fetch(`/api/super-admin/admins/${admin.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !admin.isActive }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Status update failed.");
            }

            setMessage(data.message);
            await loadAdmins();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        }
    }

    return (
        <div className="space-y-7">
            <div>
                <Link
                    href="/super-admin"
                    className="text-sm font-semibold text-[#c2185b] hover:text-[#e91e63]"
                >
                    ← Back to Dashboard
                </Link>

                <h1 className="dashboard-page-title mt-4">Admin Management</h1>
                <p className="dashboard-page-description">
                    Create and manage RajRekha admin accounts.
                </p>
            </div>

            {message && (
                <div role="status" className="dashboard-alert-success">
                    {message}
                </div>
            )}

            {error && (
                <div role="alert" className="dashboard-alert-error">
                    {error}
                </div>
            )}

            <section className="dashboard-card p-5 sm:p-6">
                <h2 className="text-lg font-bold">Create New Admin</h2>
                <p className="mt-1 text-sm text-slate-500">
                    New Admin ko login credentials securely provide karein.
                </p>

                <form
                    onSubmit={handleCreateAdmin}
                    className="mt-6 grid gap-5 md:grid-cols-2"
                >
                    <div>
                        <label htmlFor="new-admin-name" className="mb-2 block text-sm font-semibold text-[#505a65]">
                            Full Name
                        </label>
                        <input
                            id="new-admin-name"
                            required
                            minLength={2}
                            maxLength={60}
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            placeholder="Enter admin name"
                            className="dashboard-input"
                        />
                    </div>

                    <div>
                        <label htmlFor="new-admin-email" className="mb-2 block text-sm font-semibold text-[#505a65]">
                            Email Address
                        </label>
                        <input
                            id="new-admin-email"
                            required
                            type="email"
                            maxLength={254}
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                            placeholder="admin@example.com"
                            className="dashboard-input"
                        />
                    </div>


                    <div>
                        <label htmlFor="new-admin-password" className="mb-2 block text-sm font-semibold text-[#505a65]">
                            Temporary Password
                        </label>

                        <div className="relative">
                            <input
                                id="new-admin-password"
                                required
                                type={showPassword ? "text" : "password"}
                                minLength={12}
                                maxLength={128}
                                autoComplete="new-password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({ ...form, password: e.target.value })
                                }
                                placeholder="Minimum 12 characters"
                                className="dashboard-input pr-20"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((previous) => !previous)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#c2185b] hover:text-[#e91e63]"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                            Minimum 12 characters. Password securely share karein.
                        </p>
                    </div>


                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={creating}
                            className="dashboard-primary-button w-full md:w-auto"
                        >
                            {creating ? "Creating..." : "Create Admin"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="dashboard-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <div>
                        <h2 className="text-lg font-bold">All Admins</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {admins.length} admin account(s)
                        </p>
                    </div>

                    <button
                        onClick={loadAdmins}
                        disabled={loading}
                        className="dashboard-secondary-button"
                    >
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>

                {loading ? (
                    <p className="p-8 text-center text-sm text-slate-500">
                        Loading admins...
                    </p>
                ) : admins.length === 0 ? (
                    <p className="p-8 text-center text-sm text-slate-500">
                        No Admin accounts found. Create your first Admin above.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="dashboard-table min-w-[650px]">
                            <thead>
                                <tr>
                                    <th>Admin</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Last Login</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {admins.map((admin) => (
                                    <tr key={admin.id}>
                                        <td className="font-semibold text-[#343a40]">
                                            {admin.name}
                                        </td>
                                        <td>
                                            {admin.email}
                                        </td>
                                        <td>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${admin.isActive
                                                        ? "bg-green-50 text-green-700"
                                                        : "bg-red-50 text-red-700"
                                                    }`}
                                            >
                                                {admin.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            {admin.lastLogin
                                                ? new Date(admin.lastLogin).toLocaleString()
                                                : "Never"}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => setPendingAdmin(admin)}
                                                className={`rounded-lg px-3 py-2 text-xs font-semibold ${admin.isActive
                                                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                                                        : "bg-green-50 text-green-700 hover:bg-green-100"
                                                    }`}
                                            >
                                                {admin.isActive ? "Deactivate" : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
            {pendingAdmin && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setPendingAdmin(null);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") setPendingAdmin(null);
                    }}
                >
                    <section role="alertdialog" aria-modal="true" aria-labelledby="admin-status-title" aria-describedby="admin-status-description" className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                        <h2 id="admin-status-title" className="text-lg font-bold text-[#343a40]">
                            {pendingAdmin.isActive ? "Deactivate admin?" : "Activate admin?"}
                        </h2>
                        <p id="admin-status-description" className="mt-2 text-sm leading-6 text-[#707983]">
                            {pendingAdmin.isActive
                                ? `${pendingAdmin.name} will no longer be able to sign in.`
                                : `${pendingAdmin.name} will be able to sign in again.`}
                        </p>
                        <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
                            <button autoFocus type="button" onClick={() => setPendingAdmin(null)} className="dashboard-secondary-button">Cancel</button>
                            <button type="button" onClick={() => {
                                const admin = pendingAdmin;
                                setPendingAdmin(null);
                                void toggleAdmin(admin);
                            }} className={pendingAdmin.isActive ? "dashboard-primary-button bg-red-600 hover:bg-red-700" : "dashboard-primary-button"}>
                                {pendingAdmin.isActive ? "Deactivate admin" : "Activate admin"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
