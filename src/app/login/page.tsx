
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthFormCard from "@/components/auth/AuthFormCard";

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
        <AuthFormCard title="Sign in">
            <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-field">
                    <label htmlFor="login-email" className="auth-label">
                            Email Address
                    </label>
                    <input
                        type="email"
                        id="login-email"
                        required
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="auth-input"
                    />
                </div>

                <div className="auth-field">
                    <label htmlFor="login-password" className="auth-label">Password</label>
                    <div className="auth-input-wrap">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="login-password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="auth-input auth-password-input"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((visible) => !visible)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            aria-pressed={showPassword}
                            className="auth-visibility-button"
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                {error && <p role="alert" className="auth-error">{error}</p>}

                <button type="submit" disabled={loading} className="auth-submit">
                    {loading ? "SIGNING IN..." : "SIGN IN"}
                </button>
            </form>

            <footer className="auth-footer">
                <p>Authorized personnel only</p>
                <p><Link href="/setup/super-admin" className="auth-link">First-time Super Admin setup</Link></p>
            </footer>
        </AuthFormCard>
    );
}
