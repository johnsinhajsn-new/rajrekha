
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
                <h1 className="text-2xl font-bold text-slate-900">
                    Result History
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    View saved results for previous dates.
                </p>
            </div>

            {/* Date Filter */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
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
                        className="min-w-[200px] rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />

                    <button
                        type="button"
                        onClick={() => void fetchHistory(selectedDate || undefined)}
                        disabled={loading}
                        className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
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
                        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
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
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            {/* History Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-bold text-slate-900">
                        Historical Result Entries
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Selected date: {selectedDate || "Loading..."}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                <th className="px-4 py-4">Time</th>

                                {CATEGORIES.map((category) => (
                                    <th
                                        key={category}
                                        className="px-3 py-4 text-center"
                                    >
                                        {category}
                                    </th>
                                ))}

                                <th className="px-4 py-4 text-center">
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
                                        className="hover:bg-purple-50/30"
                                    >
                                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">
                                            {slot.time}
                                        </td>

                                        {CATEGORIES.map((category) => (
                                            <td
                                                key={category}
                                                className="px-3 py-4 text-center font-medium text-slate-700"
                                            >
                                                {slot.recordId
                                                    ? slot.results[category] || "—"
                                                    : "—"}
                                            </td>
                                        ))}

                                        <td className="px-4 py-4 text-center">
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
