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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const resultDays = data.map((day) => ({
    ...day,
    slots: day.slots.filter(
      (slot) =>
        slot.published &&
        categories.some((category) => Boolean(slot.results?.[category]?.trim())),
    ),
  }));

  const fetchResults = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    setError("");

    try {
      const dates = startDate && endDate
        ? getDatesInRange(startDate, endDate)
        : [""];
      const days: ResultDay[] = [];

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
        }
      }

      setData(days);
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
    <main className="home-page min-h-screen bg-[#008080] px-2 py-2 font-serif text-black">
      <div className="w-full">
        <form
          onSubmit={handleSearch}
          className="home-date-filter grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.45fr)_minmax(0,0.9fr)_minmax(0,1.45fr)_minmax(0,1fr)] items-stretch gap-[2px]"
        >
          <label htmlFor="from-date" className="flex items-center justify-center border border-white bg-[#8a9486] px-3 py-3 text-center text-base font-bold text-white">
            From Date
          </label>
          <div className="flex items-center border border-white bg-[#8a9486] px-3 py-3">
            <input
              id="from-date"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
              required
              className="h-[35px] w-full border border-white bg-white px-2 text-sm text-black outline-none"
            />
          </div>

          <label htmlFor="to-date" className="flex items-center justify-center border border-white bg-[#8a9486] px-3 py-3 text-center text-base font-bold text-white">
            To Date
          </label>
          <div className="flex items-center border border-white bg-[#8a9486] px-3 py-3">
            <input
              id="to-date"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
              required
              className="h-[35px] w-full border border-white bg-white px-2 text-sm text-black outline-none"
            />
          </div>

          <div className="flex items-center border border-white bg-[#8a9486] px-3 py-3">
            <button
              type="submit"
              disabled={loading}
              className="h-[38px] w-full border border-white bg-[#7fff55] px-3 text-base font-bold text-[#030303] disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? "Loading..." : "Find"}
            </button>
          </div>
        </form>

        <h1 className="home-heading mt-[2px] border border-white bg-[#ac1221] px-3 py-3 text-center text-lg font-bold leading-normal text-white">
          Raj Royal Daily Update
        </h1>

        <section aria-labelledby="winners-heading" className="mt-[2px]">
          <h2
            id="winners-heading"
            className="home-heading border border-white bg-[#12616c] px-3 py-3 text-center text-lg font-bold leading-normal text-white"
          >
            Get Winners Here
          </h2>

          {error && (
            <div role="alert" className="mt-3 border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
              {error}
            </div>
          )}

          <div className="home-results-table mt-[2px] overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center font-medium text-[#31504c]" aria-live="polite">
                Loading results...
              </div>
            ) : (
              <table className="home-results-table__table w-full border-separate border-spacing-[2px] text-center text-lg">
                <thead className="bg-[#ac1221] text-base text-white">
                  <tr>
                    <th scope="col" className="whitespace-nowrap border border-white px-2 py-3 text-center align-middle font-bold">Date</th>
                    <th scope="col" className="whitespace-nowrap border border-white px-2 py-3 text-center align-middle font-bold">Time</th>
                    {categories.map((category) => (
                      <th key={category} scope="col" className="whitespace-nowrap border border-white px-2 py-3 text-center align-middle font-bold">
                        <span className="home-column-heading">
                          <span>Raj</span>{" "}
                          <span>Rekha</span>{" "}
                          <span>{category}</span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultDays.flatMap((day) =>
                    day.slots.map((slot) => (
                      <tr key={`${day.date}-${slot.timeSlotId}`} className="bg-[#e9f6f2] even:bg-[#d8eee8]">
                        <td className="whitespace-nowrap border border-white px-3 py-2 font-semibold">{day.date}</td>
                        <td className="whitespace-nowrap border border-white px-3 py-2 font-semibold">{slot.time}</td>
                        {categories.map((category) => (
                          <td key={category} className="border border-white px-2 py-2 font-semibold">
                            {slot.results?.[category]?.trim() || ""}
                          </td>
                        ))}
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <footer className="pt-5 text-center text-xs font-medium text-[#174c48]">
          © {currentYear ?? ""} RajRekha. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
