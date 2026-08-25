"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  dateFrom: string; // "" | "YYYY-MM-DD"
  dateTo: string; // "" | "YYYY-MM-DD"
  onChange: (dateFrom: string, dateTo: string) => void;
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const shortDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildMonthGrid(viewMonth: Date): (Date | null)[] {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  return cells;
}

export default function DateRangePicker({ dateFrom, dateTo, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = startOfToday();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  // Tracks an in-progress range click (first day picked, awaiting a second
  // click to extend it or the same day again to clear it).
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function handleDayClick(date: Date) {
    const key = toDateKey(date);

    if (!selectionStart) {
      // First click of a new selection — treat as a single day for now;
      // a second click either extends it into a range or (if it's the
      // same day) clears it.
      onChange(key, key);
      setSelectionStart(key);
      return;
    }

    if (key === selectionStart) {
      onChange("", "");
      setSelectionStart(null);
      return;
    }

    const [rangeStart, rangeEnd] =
      key < selectionStart ? [key, selectionStart] : [selectionStart, key];
    onChange(rangeStart, rangeEnd);
    setSelectionStart(null);
  }

  function handleClear() {
    onChange("", "");
    setSelectionStart(null);
    setIsOpen(false);
  }

  const today = startOfToday();
  const todayKey = toDateKey(today);
  const cells = buildMonthGrid(viewMonth);

  const label = !dateFrom
    ? "Any date"
    : dateFrom === dateTo
    ? shortDateFormatter.format(parseDateKey(dateFrom))
    : `${shortDateFormatter.format(parseDateKey(dateFrom))} – ${shortDateFormatter.format(
        parseDateKey(dateTo)
      )}`;

  return (
    <div className="relative" ref={containerRef}>
      <label className="field-label">When</label>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="field-input text-left flex items-center justify-between"
      >
        <span>{label}</span>
        <span className="text-[var(--muted)] text-xs">▾</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-72 rounded-lg border border-[var(--hairline)] bg-[var(--card)] p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="text-[var(--ink-soft)] hover:text-[var(--accent)] px-2"
              aria-label="Previous month"
            >
              ‹
            </button>
            <p className="text-sm font-medium">{monthFormatter.format(viewMonth)}</p>
            <button
              type="button"
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="text-[var(--ink-soft)] hover:text-[var(--accent)] px-2"
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_LABELS.map((w, i) => (
              <div key={i} className="text-center text-xs text-[var(--muted)] py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={i} />;
              const key = toDateKey(date);
              const isPast = key < todayKey;
              const isInRange = Boolean(dateFrom && dateTo && key >= dateFrom && key <= dateTo);
              const isEndpoint = key === dateFrom || key === dateTo;
              const isToday = key === todayKey;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleDayClick(date)}
                  className={`aspect-square rounded-md text-xs flex items-center justify-center transition-colors ${
                    isEndpoint
                      ? "bg-[var(--accent)] text-[var(--bg)] font-semibold"
                      : isInRange
                      ? "bg-[var(--accent-wash)] text-[var(--ink)]"
                      : "text-[var(--ink)] hover:bg-[var(--accent-wash)]"
                  } ${
                    isPast
                      ? "opacity-30 cursor-not-allowed hover:bg-transparent"
                      : "cursor-pointer"
                  } ${isToday && !isEndpoint ? "ring-1 ring-[var(--hairline)]" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--hairline)]">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
