
"use client";

import { useCallback, useEffect, useState } from "react";

type ResultValues = Record<
  "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J",
  string
>;

type ResultSlot = {
  timeSlotId: number;
  time: string;
  published: boolean;
  results: ResultValues | null;
};

type PublicResultsResponse = {
  success: boolean;
  date: string;
  totalSlots: number;
  publishedCount: number;
  data: ResultSlot[];
  message?: string;
};

const categories = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;

export default function Home() {
  const [selectedDate, setSelectedDate] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [data, setData] = useState<ResultSlot[]>([]);
  const [publishedCount, setPublishedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const fetchResults = useCallback(async (date?: string) => {
    setLoading(true);
    setError("");

    try {
      const url = date
        ? `/api/public/results?date=${encodeURIComponent(date)}`
        : "/api/public/results";

      const response = await fetch(url, { cache: "no-store" });
      const result: PublicResultsResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Results load nahi ho paye.");
      }

      setSelectedDate(result.date);
      setDateInput(result.date);
      setData(result.data);
      setPublishedCount(result.publishedCount);
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
    setCurrentYear(new Date().getFullYear());
    void fetchResults();
  }, [fetchResults]);

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!dateInput) {
      setError("Please select a date.");
      return;
    }

    void fetchResults(dateInput);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              <span className="text-purple-700">Raj</span>
              <span className="text-pink-600">Rekha</span>
            </h1>
            <p className="text-xs text-slate-500">
              Daily Results & History
            </p>
          </div>

          <span className="rounded-full bg-purple-50 px-4 py-2 text-xs font-semibold text-purple-700">
            Public Results
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="rounded-3xl bg-gradient-to-r from-[#21143d] to-purple-800 px-6 py-10 text-white md:px-10">
          <p className="text-sm font-semibold text-purple-200">
            WELCOME TO RAJREKHA
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Daily Result Board
          </h2>
          <p className="mt-3 max-w-xl text-sm text-purple-100">
            Check today's published results and search previous
            dates using the date selector.
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Selected Result Date
            </p>
            <p className="mt-2 text-2xl font-bold text-purple-700">
              {selectedDate || "Loading..."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Published Results
            </p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {publishedCount}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          className="mt-7 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="result-date"
              className="mb-2 block text-sm font-semibold"
            >
              Search Results by Date
            </label>

            <input
              id="result-date"
              type="date"
              value={dateInput}
              onChange={(event) =>
                setDateInput(event.target.value)
              }
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-purple-700 px-7 py-3 font-semibold text-white transition hover:bg-purple-800 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Search Results"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h3 className="text-lg font-bold">
                Published Result Entries
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Date: {selectedDate || "—"}
              </p>
            </div>

            <span className="rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
              {publishedCount} Published
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Loading results...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left">
                      Time
                    </th>

                    {categories.map((category) => (
                      <th
                        key={category}
                        className="px-4 py-4 text-center"
                      >
                        {category}
                      </th>
                    ))}

                    <th className="px-5 py-4 text-center">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.map((slot) => (
                    <tr
                      key={slot.timeSlotId}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-semibold">
                        {slot.time}
                      </td>

                      {categories.map((category) => (
                        <td
                          key={category}
                          className="px-4 py-4 text-center font-semibold"
                        >
                          {slot.published
                            ? slot.results?.[category] || "—"
                            : "—"}
                        </td>
                      ))}

                      <td className="px-5 py-4 text-center">
                        {slot.published ? (
                          <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                            PUBLISHED
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-500">
                            NO RESULT
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && publishedCount === 0 && (
            <div className="border-t border-slate-100 p-6 text-center text-sm text-slate-500">
              Is date ke liye abhi koi published result available nahi hai.
            </div>
          )}
        </section>

        <footer className="py-8 text-center text-xs text-slate-500">
          © {currentYear ?? ""} RajRekha. All rights reserved.
        </footer>
      </section>
    </main>
  );
}
