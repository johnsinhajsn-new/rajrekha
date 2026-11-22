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

type ResultDay = {
  date: string;
  slots: ResultSlot[];
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

function getDatesInRange(fromDate: string, toDate: string): string[] {
  const start = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T00:00:00.000Z`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start.toISOString().slice(0, 10) !== fromDate ||
    end.toISOString().slice(0, 10) !== toDate
  ) {
    throw new Error("Please select valid dates.");
  }

  if (start > end) {
    throw new Error("From Date must be on or before To Date.");
  }

  const dates: string[] = [];
  for (let time = start.getTime(); time <= end.getTime(); time += 86_400_000) {
    dates.push(new Date(time).toISOString().slice(0, 10));
  }

  return dates;
}

export default function Home() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState<ResultDay[]>([]);
  const [publishedCount, setPublishedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const fetchResults = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    setError("");

    try {
      const dates = startDate && endDate
        ? getDatesInRange(startDate, endDate)
        : [""];
      const days: ResultDay[] = [];
      let totalPublished = 0;

      // Keep requests in small batches while using the existing single-date API.
      for (let index = 0; index < dates.length; index += 8) {
        const batch = dates.slice(index, index + 8);
        const responses = await Promise.all(
          batch.map(async (date) => {
            const query = date ? `?date=${encodeURIComponent(date)}` : "";
            const response = await fetch(`/api/public/results${query}`, {
              cache: "no-store",
            });
            const result: PublicResultsResponse = await response.json();

            if (!response.ok || !result.success) {
              throw new Error(result.message || "Results load nahi ho paye.");
            }

            return result;
          }),
        );

        for (const result of responses) {
          days.push({ date: result.date, slots: result.data });
          totalPublished += result.publishedCount;
        }
      }

      setData(days);
      setPublishedCount(totalPublished);
      if (!startDate || !endDate) {
        setFromDate(days[0]?.date ?? "");
        setToDate(days[0]?.date ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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

    if (!fromDate || !toDate) {
      setError("Please select both dates.");
      return;
    }

    void fetchResults(fromDate, toDate);
  }

  return (
    <main className="min-h-screen bg-[#35b8ae] px-3 py-5 text-[#172d2b] sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1440px]">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 items-center gap-x-3 gap-y-3 border border-white/90 bg-[#a9c4b4] p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] sm:gap-x-4 sm:px-5 sm:py-4"
        >
          <label htmlFor="from-date" className="font-semibold text-[#172d2b]">
            From Date
          </label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => setFromDate(event.target.value)}
            required
            className="min-h-11 w-full border border-white bg-white px-3 text-base text-[#263b38] outline-none focus:ring-2 focus:ring-[#167c51]"
          />

          <label htmlFor="to-date" className="font-semibold text-[#172d2b]">
            To Date
          </label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => setToDate(event.target.value)}
            required
            className="min-h-11 w-full border border-white bg-white px-3 text-base text-[#263b38] outline-none focus:ring-2 focus:ring-[#167c51]"
          />

          <button
            type="submit"
            disabled={loading}
            className="min-h-11 border border-white bg-[#16834d] px-8 font-bold text-white transition-colors hover:bg-[#106c3e] disabled:cursor-wait disabled:opacity-70 sm:px-7"
          >
            {loading ? "Loading..." : "Find"}
          </button>
        </form>

        <h1 className="mt-4 border border-white bg-[#bb1e2c] px-4 py-3 text-center text-2xl font-bold text-white sm:mt-5 sm:py-4 sm:text-3xl">
          Raj Royal Daily Update
        </h1>

        <section aria-labelledby="winners-heading" className="mt-3">
          <h2
            id="winners-heading"
            className="border border-white bg-[#075e62] px-4 py-3 text-center text-xl font-bold text-white sm:py-4 sm:text-2xl"
          >
            Get Winners Here
          </h2>

          {error && (
            <div role="alert" className="mt-3 border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
              {error}
            </div>
          )}

          <div className="mt-2 overflow-x-auto border border-white bg-white">
            {loading ? (
              <div className="p-10 text-center font-medium text-[#31504c]" aria-live="polite">
                Loading results...
              </div>
            ) : (
              <table className="w-full min-w-[1120px] table-fixed border-collapse text-center text-sm">
                <thead className="bg-[#bb1e2c] text-white">
                  <tr>
                    <th scope="col" className="w-32 border border-white px-3 py-3 font-bold">Date</th>
                    <th scope="col" className="w-28 border border-white px-3 py-3 font-bold">Time</th>
                    {categories.map((category) => (
                      <th key={category} scope="col" className="border border-white px-2 py-3 font-bold">
                        Raj Rekha {category}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.flatMap((day) =>
                    day.slots.map((slot) => (
                      <tr key={`${day.date}-${slot.timeSlotId}`} className="bg-[#e9f6f2] even:bg-[#d8eee8]">
                        <td className="whitespace-nowrap border border-white px-3 py-2 font-semibold">{day.date}</td>
                        <td className="whitespace-nowrap border border-white px-3 py-2 font-semibold">{slot.time}</td>
                        {categories.map((category) => (
                          <td key={category} className="border border-white px-2 py-2 font-semibold">
                            {slot.published ? slot.results?.[category] || "—" : "—"}
                          </td>
                        ))}
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            )}
          </div>

          {!loading && !error && publishedCount === 0 && (
            <p className="mt-2 border border-white bg-[#d8eee8] p-4 text-center text-sm text-[#31504c]">
              No published results are available for the selected date range.
            </p>
          )}
        </section>

        <footer className="pt-5 text-center text-xs font-medium text-[#174c48]">
          © {currentYear ?? ""} RajRekha. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
