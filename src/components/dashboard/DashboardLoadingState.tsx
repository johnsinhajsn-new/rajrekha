export default function DashboardLoadingState({ label }: { label: string }) {
    return (
        <main className="dashboard-theme min-h-screen bg-[#f0f2f5] p-4 sm:p-8" aria-live="polite">
            <div className="dashboard-card mx-auto w-full max-w-[1440px] p-5 text-sm text-[#707983]">
                {label}
            </div>
        </main>
    );
}
