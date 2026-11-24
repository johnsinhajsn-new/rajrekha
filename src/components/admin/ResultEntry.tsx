
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
        A: "",
        B: "",
        C: "",
        D: "",
        E: "",
        F: "",
        G: "",
        H: "",
        I: "",
        J: "",
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
                throw new Error(
                    data.message || "Results load nahi ho sake."
                );
            }

            setDate(data.date);
            setRows(data.data);
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
        loadResults();
    }, [loadResults]);

    function updateColumnA(timeSlotId: number, value: string) {
        setRows((previous) =>
            previous.map((row) =>
                row.timeSlotId === timeSlotId
                    ? {
                        ...row,
                        results: {
                            ...row.results,
                            A: value.toUpperCase(),
                        },
                    }
                    : row
            )
        );
    }

    async function saveResult(row: ResultRow) {
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
                    results: {
                        A: row.results.A,
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Result save nahi hua."
                );
            }

            setRows((previous) =>
                previous.map((item) =>
                    item.timeSlotId === row.timeSlotId
                        ? {
                            ...item,
                            results: data.data.results,
                            recordId: data.data.recordId,
                            status: data.data.status,
                        }
                        : item
                )
            );

            setMessage(
                `${row.time} ka result save ho gaya. B–J values generate hokar schedule ho gayi hain.`
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
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

    const pendingCount = rows.filter(
        (row) => row.status === "PENDING"
    ).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="dashboard-page-title">
                        Result Management
                    </h1>
                    <p className="dashboard-page-description">
                        Manage daily results for all 42 time slots.
                    </p>
                </div>

                <div className="dashboard-card px-4 py-3">
                    <p className="text-xs text-slate-500">
                        Current India Date
                    </p>
                    <p className="mt-1 font-semibold text-[#c2185b]">
                        {date || "Loading..."}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
                <div className="dashboard-card p-5">
                    <p className="text-sm text-slate-500">Total Slots</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {rows.length}
                    </p>
                </div>

                <div className="dashboard-card p-5">
                    <p className="text-sm text-slate-500">Saved Results</p>
                    <p className="mt-2 text-2xl font-bold text-blue-600">
                        {savedCount}
                    </p>
                </div>

                <div className="dashboard-card p-5">
                    <p className="text-sm text-slate-500">Pending Results</p>
                    <p className="mt-2 text-2xl font-bold text-amber-600">
                        {pendingCount}
                    </p>
                </div>

                <div className="dashboard-card p-5">
                    <p className="text-sm text-slate-500">Published Results</p>
                    <p className="mt-2 text-2xl font-bold text-green-600">
                        {publishedCount}
                    </p>
                </div>
            </div>

            {error && (
                <div role="alert" className="dashboard-alert-error">
                    {error}
                </div>
            )}

            {message && (
                <div role="status" className="dashboard-alert-success">
                    {message}
                </div>
            )}

            <div className="dashboard-card overflow-hidden">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="font-bold text-slate-900">
                            Daily Result Entries
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Enter Column A. Columns B–J are generated automatically.
                        </p>
                    </div>

                    <button
                        onClick={loadResults}
                        disabled={loading || savingId !== null}
                        className="dashboard-secondary-button"
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
                        <table className="dashboard-table min-w-[1250px]">
                            <thead>
                                <tr>
                                    <th className="sticky left-0 z-10">
                                        Time
                                    </th>

                                    {CATEGORIES.map((category) => (
                                        <th
                                            key={category}
                                            className="px-2 text-center"
                                        >
                                            {category}
                                        </th>
                                    ))}

                                    <th className="text-center">
                                        Status
                                    </th>

                                    <th className="text-center">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {rows.map((row) => {
                                    const isPublished =
                                        row.status === "PUBLISHED";

                                    return (
                                        <tr key={row.timeSlotId}>
                                            <td className="sticky left-0 z-10 whitespace-nowrap bg-white font-semibold text-slate-800">
                                                {row.time}
                                            </td>

                                            {CATEGORIES.map((category) => (
                                                <td
                                                    key={category}
                                                    className="px-2"
                                                >
                                                    <input
                                                        type="text"
                                                        id={`result-${row.timeSlotId}-${category.toLowerCase()}`}
                                                        name={`results[${row.timeSlotId}][${category}]`}
                                                        maxLength={20}
                                                        value={
                                                            row.results?.[category] ?? ""
                                                        }
                                                        readOnly={
                                                            category !== "A" ||
                                                            isPublished
                                                        }
                                                        onChange={(event) => {
                                                            if (category === "A") {
                                                                updateColumnA(
                                                                    row.timeSlotId,
                                                                    event.target.value
                                                                );
                                                            }
                                                        }}
                                                        aria-label={`${row.time} category ${category}`}
                                                        autoComplete="off"
                                                        className={`dashboard-input w-[76px] px-2 py-2 text-center ${category !== "A"
                                                                ? "bg-slate-50 text-slate-600"
                                                                : ""
                                                            }`}
                                                    />
                                                </td>
                                            ))}

                                            <td className="text-center">
                                                <span
                                                    className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold ${row.status === "PUBLISHED"
                                                            ? "bg-green-100 text-green-700"
                                                            : row.status === "PENDING"
                                                                ? "bg-amber-100 text-amber-700"
                                                                : "bg-slate-100 text-slate-600"
                                                        }`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => saveResult(row)}
                                                        disabled={
                                                            savingId !== null ||
                                                            isPublished ||
                                                            !row.results.A.trim()
                                                        }
                                                        className="dashboard-primary-button min-h-0 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {savingId === row.timeSlotId
                                                            ? "Saving..."
                                                            : isPublished
                                                                ? "Published"
                                                                : "Save"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="border-t border-[#edf0f2] px-5 py-3 text-xs text-slate-500">
                    Showing {rows.length} fixed time slots. Column A is editable; B–J are generated automatically.
                </div>
            </div>
        </div>
    );
}
