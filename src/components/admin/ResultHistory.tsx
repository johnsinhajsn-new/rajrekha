
"use client";

import { useCallback, useEffect, useState } from "react";

type ResultValues = {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
    F: string;
    G: string;
    H: string;
    I: string;
    J: string;
};

type HistorySlot = {
    timeSlotId: number;
    time: string;
    results: ResultValues;
    status: "DRAFT" | "PENDING" | "PUBLISHED";
    recordId: string | null;
};

type HistoryResponse = {
    success: boolean;
    date: string;
    totalSlots: number;
    savedCount: number;
    data: HistorySlot[];
    message?: string;
};

const CATEGORIES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;

export default function ResultHistory() {
    const [selectedDate, setSelectedDate] = useState("");
    const [slots, setSlots] = useState<HistorySlot[]>([]);
    const [savedCount, setSavedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchHistory = useCallback(async (date?: string) => {
        setLoading(true);
        setError("");

        try {
            const url = date
                ? `/api/results/history?date=${encodeURIComponent(date)}`
                : "/api/results/history";

            const response = await fetch(url, {
                cache: "no-store",
            });

            const result: HistoryResponse = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "History load nahi ho payi."
                );
            }

            setSelectedDate(result.date);
            setSlots(result.data);
            setSavedCount(result.savedCount);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchHistory();
    }, [fetchHistory]);

    function handleDateChange(value: string) {
        if (!value) return;

        setSelectedDate(value);
        void fetchHistory(value);
    }

    const publishedCount = slots.filter(
        (slot) => slot.status === "PUBLISHED" && slot.recordId !== null
    ).length;

    const draftCount = slots.filter(
        (slot) => slot.status === "DRAFT" && slot.recordId !== null
    ).length;

    const pendingCount = slots.filter(
        (slot) => slot.status === "PENDING" && slot.recordId !== null
    ).length;

    return (
        <div className="space-y-6">
            {/* Page Heading */}
            <div>
                <h1 className="dashboard-page-title">
                    Result History
                </h1>
                <p className="dashboard-page-description">
                    View saved results for previous dates.
                </p>
            </div>

            {/* Date Filter */}
            <div className="dashboard-card p-5">
                <label
                    htmlFor="history-date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                >
                    Select Result Date
                </label>

                <div className="flex flex-wrap gap-3">
                    <input
                        id="history-date"
                        type="date"
                        value={selectedDate}
                        max={new Date().toLocaleDateString("en-CA", {
                            timeZone: "Asia/Kolkata",
                        })}
                        onChange={(event) =>
                            handleDateChange(event.target.value)
                        }
                        className="dashboard-input min-w-[200px] sm:w-auto"
                    />

                    <button
                        type="button"
                        onClick={() => void fetchHistory(selectedDate || undefined)}
                        disabled={loading}
                        className="dashboard-primary-button"
                    >
                        {loading ? "Loading..." : "Refresh History"}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "Total Slots", value: slots.length, color: "text-slate-900" },
                    { label: "Saved Results", value: savedCount, color: "text-blue-600" },
                    { label: "Published", value: publishedCount, color: "text-green-600" },
                    { label: "Draft / Pending", value: `${draftCount} / ${pendingCount}`, color: "text-orange-600" },
                ].map((item) => (
                    <div
                        key={item.label}
                        className="dashboard-card p-5"
                    >
                        <p className="text-sm text-slate-500">{item.label}</p>
                        <p className={`mt-3 text-3xl font-bold ${item.color}`}>
                            {item.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div
                    role="alert"
                    className="dashboard-alert-error"
                >
                    {error}
                </div>
            )}

            {/* History Table */}
            <div className="dashboard-card overflow-hidden">
                <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-bold text-slate-900">
                        Historical Result Entries
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Selected date: {selectedDate || "Loading..."}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="dashboard-table min-w-[1050px]">
                        <thead>
                            <tr>
                                <th>Time</th>

                                {CATEGORIES.map((category) => (
                                    <th
                                        key={category}
                                        className="text-center"
                                    >
                                        {category}
                                    </th>
                                ))}

                                <th className="text-center">
                                    Status
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={12}
                                        className="px-4 py-12 text-center text-slate-500"
                                    >
                                        Loading historical results...
                                    </td>
                                </tr>
                            ) : slots.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={12}
                                        className="px-4 py-12 text-center text-slate-500"
                                    >
                                        No history available.
                                    </td>
                                </tr>
                            ) : (
                                slots.map((slot) => (
                                    <tr
                                        key={slot.timeSlotId}
                                    >
                                        <td className="whitespace-nowrap font-semibold text-slate-700">
                                            {slot.time}
                                        </td>

                                        {CATEGORIES.map((category) => (
                                            <td
                                                key={category}
                                                className="text-center font-medium text-slate-700"
                                            >
                                                {slot.recordId
                                                    ? slot.results[category] || "—"
                                                    : "—"}
                                            </td>
                                        ))}

                                        <td className="text-center">
                                            <span
                                                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${!slot.recordId
                                                        ? "bg-slate-100 text-slate-500"
                                                        : slot.status === "PUBLISHED"
                                                            ? "bg-green-100 text-green-700"
                                                            : slot.status === "PENDING"
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : "bg-blue-100 text-blue-700"
                                                    }`}
                                            >
                                                {slot.recordId
                                                    ? slot.status
                                                    : "NO RECORD"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
                    Historical records are displayed in read-only mode.
                </div>
            </div>
        </div>
    );
}
