"use client";

import { KeyboardEvent, useEffect, useState } from "react";
import DateRangePicker from "./DateRangePicker";
import { EventsResponse, fetchEvents } from "@/lib/events";
import { EventCategory, NightOutEvent } from "@/lib/types";

type Props = {
  selectedEvent: NightOutEvent | null;
  onSelect: (event: NightOutEvent) => void;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const CATEGORIES: { id: EventCategory; label: string }[] = [
  { id: "concerts", label: "Concerts" },
  { id: "sports", label: "Sports" },
];

export default function EventPicker({ selectedEvent, onSelect }: Props) {
  const [category, setCategory] = useState<EventCategory>("concerts");
  const [events, setEvents] = useState<NightOutEvent[]>([]);
  const [source, setSource] = useState<EventsResponse["source"] | null>(null);
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Kicking off the fetch's loading state is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);
    fetchEvents(category, keyword || undefined, dateFrom || undefined, dateTo || undefined)
      .then((res) => {
        if (cancelled) return;
        setEvents(res.events);
        setSource(res.source);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load events. Try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, keyword, dateFrom, dateTo]);

  function handleCardKeyDown(e: KeyboardEvent, event: NightOutEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(event);
    }
  }

  return (
    <div>
      <label className="field-label">Pick an event</label>

      <div className="flex gap-2 mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
              category === c.id
                ? "border-[var(--accent)] bg-[var(--accent-wash)] text-[var(--accent)]"
                : "border-[var(--hairline)] text-[var(--ink-soft)] hover:border-[var(--accent)]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <input
        id="event-search"
        type="text"
        placeholder={`Search NYC ${category}…`}
        className="field-input mb-3"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <div className="mb-3">
        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChange={(from, to) => {
            setDateFrom(from);
            setDateTo(to);
          }}
        />
      </div>

      {source === "mock" && (
        <p className="text-xs text-[var(--accent)] mb-2">
          {category === "sports"
            ? "Showing sample events — waiting on SeatGeek API key approval."
            : "Showing sample events — add a Ticketmaster API key for live listings."}
        </p>
      )}

      {isLoading && (
        <p className="text-sm text-[var(--muted)]">Loading events…</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!isLoading && !error && events.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No priced events found.</p>
      )}

      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
        {events.map((event) => {
          const isSelected = selectedEvent?.id === event.id;
          return (
            <div
              key={event.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(event)}
              onKeyDown={(e) => handleCardKeyDown(e, event)}
              className={`cursor-pointer rounded-md border px-3 py-2 transition-colors ${
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent-wash)]"
                  : "border-[var(--hairline)] hover:border-[var(--accent)]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm">{event.name}</p>
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-xs text-[var(--accent)] hover:underline"
                  >
                    Buy tickets ↗
                  </a>
                )}
              </div>
              <p className="text-xs text-[var(--muted)]">
                {event.venueName} · {dateFormatter.format(new Date(event.startDateTime))}
              </p>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                ${event.priceMin}
                {event.priceMax && event.priceMax !== event.priceMin
                  ? `–$${event.priceMax}`
                  : ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
