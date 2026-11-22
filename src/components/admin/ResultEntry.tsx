
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

type SlotStatus = "DRAFT" | "PENDING" | "PUBLISHED";

type ResultRow = {
    timeSlotId: number;
    time: string;
    results: ResultValues;
    status: SlotStatus;
    recordId: string | null;
};

const CATEGORIES: (keyof ResultValues)[] = [
    "A", "B", "C", "D", "E",
    "F", "G", "H", "I", "J",
];

function emptyResults(): ResultValues {
    return {
        A: "", B: "", C: "", D: "", E: "",
        F: "", G: "", H: "", I: "", J: "",
    };
}

export default function ResultEntry() {
    const [rows, setRows] = useState<ResultRow[]>([]);
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadResults = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch("/api/results", {
                cache: "no-store",
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Results load nahi ho sake.");
            }

            setDate(data.date);
            setRows(data.data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadResults();
    }, [loadResults]);

    function updateResult(
        timeSlotId: number,
        category: keyof ResultValues,
        value: string
    ) {
        setRows((previous) =>
            previous.map((row) =>
                row.timeSlotId === timeSlotId
                    ? {
                        ...row,
                        results: {
                            ...row.results,
                            [category]: value,
                        },
                    }
                    : row
            )
        );
    }

    async function saveResult(
        row: ResultRow,
        status: "DRAFT" | "PUBLISHED"
    ) {
        try {
            setSavingId(row.timeSlotId);
            setError("");
            setMessage("");

            const response = await fetch("/api/results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    timeSlotId: row.timeSlotId,
                    results: row.results,
                    status,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Result save nahi hua.");
            }

            setRows((previous) =>
                previous.map((item) =>
                    item.timeSlotId === row.timeSlotId
                        ? {
                            ...item,
                            recordId: data.data.recordId,
                            status: data.data.status,
                        }
                        : item
                )
            );

            setMessage(
                `${row.time} ka result ${status === "PUBLISHED" ? "publish" : "draft save"
                } ho gaya.`
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setSavingId(null);
        }
    }

    const publishedCount = rows.filter(
        (row) => row.status === "PUBLISHED"
    ).length;

    const savedCount = rows.filter(
        (row) => row.recordId !== null
    ).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Result Management
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage daily results for all 42 time slots.
                    </p>
                </div>

                <div className="rounded-xl border border-purple-100 bg-white px-4 py-3">
                    <p className="text-xs text-slate-500">Current India Date</p>
                    <p className="mt-1 font-semibold text-purple-700">
                        {date || "Loading..."}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Total Slots</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {rows.length}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Saved Results</p>
                    <p className="mt-2 text-2xl font-bold text-blue-600">
                        {savedCount}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Published Results</p>
                    <p className="mt-2 text-2xl font-bold text-green-600">
                        {publishedCount}
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {message && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {message}
                </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="font-bold text-slate-900">
                            Daily Result Entries
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Enter values for categories A to J.
                        </p>
                    </div>

                    <button
                        onClick={loadResults}
                        disabled={loading}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        {loading ? "Loading..." : "Refresh Results"}
                    </button>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                        Loading today's results...
                    </div>
                ) : rows.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                        No time slots found. Please check time-slots configuration.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1250px] border-collapse text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="sticky left-0 z-10 bg-slate-50 px-4 py-4 text-xs font-semibold text-slate-600">
                                        Time
                                    </th>

                                    {CATEGORIES.map((category) => (
                                        <th
                                            key={category}
                                            className="px-2 py-4 text-center text-xs font-semibold text-slate-600"
                                        >
                                            {category}
                                        </th>
                                    ))}

                                    <th className="px-4 py-4 text-center text-xs font-semibold text-slate-600">
                                        Status
                                    </th>

                                    <th className="px-4 py-4 text-center text-xs font-semibold text-slate-600">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row) => (
                                    <tr key={row.timeSlotId} className="hover:bg-slate-50">
                                        <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                                            {row.time}
                                        </td>

                                        {CATEGORIES.map((category) => (
                                            <td key={category} className="px-2 py-3">

                                                <input
                                                    type="text"
                                                    id={`result-${row.timeSlotId}-${category.toLowerCase()}`}
                                                    name={`results[${row.timeSlotId}][${category}]`}
                                                    maxLength={20}
                                                    value={row.results?.[category] ?? ""}
                                                    onChange={(event) =>
                                                        updateResult(
                                                            row.timeSlotId,
                                                            category,
                                                            event.target.value
                                                        )
                                                    }
                                                    aria-label={`${row.time} category ${category}`}
                                                    autoComplete="off"
                                                    className="w-[76px] rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                                />
                                            </td>
                                        ))}

                                        <td className="px-3 py-3 text-center">
                                            <span
                                                className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold ${row.status === "PUBLISHED"
                                                        ? "bg-green-100 text-green-700"
                                                        : row.recordId
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                {row.status}
                                            </span>
                                        </td>

                                        <td className="px-3 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => saveResult(row, "DRAFT")}
                                                    disabled={savingId !== null}
                                                    className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                                                >
                                                    {savingId === row.timeSlotId
                                                        ? "Saving..."
                                                        : "Save"}
                                                </button>

                                                <button
                                                    onClick={() => saveResult(row, "PUBLISHED")}
                                                    disabled={savingId !== null}
                                                    className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                                                >
                                                    Publish
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                    Showing {rows.length} fixed time slots.
                    Scroll horizontally to view all categories.
                </div>
            </div>
        </div>
    );
}
