
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "same-origin",
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(data.message || "Login failed.");
                return;
            }

            if (data.user.role === "SUPER_ADMIN") {
                router.replace("/super-admin");
            } else if (data.user.role === "ADMIN") {
                router.replace("/admin");
            } else {
                setError("Unauthorized account.");
            }
        } catch {
            setError("Unable to connect. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#f5f5fa] flex items-center justify-center p-5">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#7928ca] to-[#ff0080] text-2xl font-bold text-white">
                        RR
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900">
                        RajRekha
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Sign in to your dashboard
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Email Address
                        </label>

                        <input
                            type="email"
                            required
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Password
                        </label>

                        <div className="flex rounded-lg border border-gray-200 focus-within:border-purple-500">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="min-w-0 flex-1 rounded-lg px-4 py-3 text-gray-900 outline-none"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="px-4 text-sm text-purple-700"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-gradient-to-r from-purple-700 to-pink-600 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="mt-8 text-center text-xs text-gray-400">
                    Authorized personnel only
                </p>
            </div>
        </main>
    );
}
