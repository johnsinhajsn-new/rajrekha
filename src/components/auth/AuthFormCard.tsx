import type { ReactNode } from "react";
import "./AuthFormCard.css";

export default function AuthFormCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <main className="auth-page">
            <section className="auth-card" aria-label={`${title} form`}>
                <header className="auth-header">
                    <h1>{title}</h1>
                </header>
                <div className="auth-content">{children}</div>
            </section>
        </main>
    );
}
