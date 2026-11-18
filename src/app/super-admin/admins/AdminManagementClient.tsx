
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
                    className="text-sm font-medium text-purple-600 hover:text-pink-600"
                >
                    ← Back to Dashboard
                </Link>

                <h1 className="mt-4 text-2xl font-bold">Admin Management</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Create and manage RajRekha admin accounts.
                </p>
            </div>

            {message && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {message}
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold">Create New Admin</h2>
                <p className="mt-1 text-sm text-slate-500">
                    New Admin ko login credentials securely provide karein.
                </p>

                <form
                    onSubmit={handleCreateAdmin}
                    className="mt-6 grid gap-5 md:grid-cols-2"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Full Name
                        </label>
                        <input
                            required
                            minLength={2}
                            maxLength={60}
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            placeholder="Enter admin name"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Email Address
                        </label>
                        <input
                            required
                            type="email"
                            maxLength={254}
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                            placeholder="admin@example.com"
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                        />
                    </div>


                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Temporary Password
                        </label>

                        <div className="relative">
                            <input
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
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-20 outline-none focus:border-purple-500"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((previous) => !previous)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-purple-600 hover:text-pink-600"
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
                            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50 md:w-auto"
                        >
                            {creating ? "Creating..." : "Create Admin"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <div>
                        <h2 className="text-lg font-bold">All Admins</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {admins.length} admin account(s)
                        </p>
                    </div>

                    <button
                        onClick={loadAdmins}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                    >
                        Refresh
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
                        <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Admin</th>
                                    <th className="px-6 py-4 font-medium">Email</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Last Login</th>
                                    <th className="px-6 py-4 font-medium">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {admins.map((admin) => (
                                    <tr key={admin.id}>
                                        <td className="px-6 py-4 font-semibold">
                                            {admin.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {admin.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${admin.isActive
                                                        ? "bg-green-50 text-green-700"
                                                        : "bg-red-50 text-red-700"
                                                    }`}
                                            >
                                                {admin.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {admin.lastLogin
                                                ? new Date(admin.lastLogin).toLocaleString()
                                                : "Never"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleAdmin(admin)}
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
        </div>
    );
}
