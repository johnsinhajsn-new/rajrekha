"use client";

import Link from "next/link";
import { useState } from "react";
import AuthFormCard from "@/components/auth/AuthFormCard";

export default function SuperAdminSetupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [bootstrapSecret, setBootstrapSecret] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [complete, setComplete] = useState(false);

    async function handleSetup(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/setup/super-admin", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                    "x-bootstrap-secret": bootstrapSecret,
                },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Account setup could not be completed.");
            }

            setComplete(true);
            setPassword("");
            setConfirmPassword("");
            setBootstrapSecret("");
        } catch (setupError) {
            setError(setupError instanceof Error ? setupError.message : "Unable to connect. Please try again.");
        } finally {
            setLoading(false);
            setBootstrapSecret("");
        }
    }

    return (
        <AuthFormCard title="Create Account">
            {complete ? (
                <div className="auth-form">
                    <p role="status" className="auth-success">Super Admin account created. You can now sign in.</p>
                    <Link href="/login" className="auth-submit">RETURN TO LOGIN</Link>
                </div>
            ) : (
                <>
                    <form onSubmit={handleSetup} className="auth-form">
                        <div className="auth-field">
                            <label htmlFor="setup-name" className="auth-label">Full Name</label>
                            <input
                                id="setup-name"
                                type="text"
                                required
                                minLength={2}
                                maxLength={60}
                                autoComplete="name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="auth-input"
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="setup-email" className="auth-label">Email Address</label>
                            <input
                                id="setup-email"
                                type="email"
                                required
                                maxLength={254}
                                autoComplete="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="auth-input"
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="setup-password" className="auth-label">Password</label>
                            <div className="auth-input-wrap">
                                <input
                                    id="setup-password"
                                    type={showPasswords ? "text" : "password"}
                                    required
                                    minLength={12}
                                    maxLength={128}
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="auth-input auth-password-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords((visible) => !visible)}
                                    aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                                    aria-pressed={showPasswords}
                                    className="auth-visibility-button"
                                >
                                    {showPasswords ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="setup-confirm-password" className="auth-label">Confirm Password</label>
                            <input
                                id="setup-confirm-password"
                                type={showPasswords ? "text" : "password"}
                                required
                                minLength={12}
                                maxLength={128}
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                className="auth-input"
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="setup-bootstrap-secret" className="auth-label">Bootstrap Secret</label>
                            <input
                                id="setup-bootstrap-secret"
                                type="password"
                                required
                                autoComplete="off"
                                value={bootstrapSecret}
                                onChange={(event) => setBootstrapSecret(event.target.value)}
                                className="auth-input"
                                aria-describedby="bootstrap-secret-help"
                            />
                            <p id="bootstrap-secret-help" className="auth-helper">
                                Required to authorize the existing first-time Super Admin setup.
                            </p>
                        </div>

                        {error && <p role="alert" className="auth-error">{error}</p>}

                        <button type="submit" disabled={loading} className="auth-submit">
                            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                        </button>
                    </form>

                    <footer className="auth-footer">
                        <Link href="/login" className="auth-link">Return to Login</Link>
                    </footer>
                </>
            )}
        </AuthFormCard>
    );
}
