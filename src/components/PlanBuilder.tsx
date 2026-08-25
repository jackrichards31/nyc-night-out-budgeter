"use client";

import { useEffect, useState } from "react";
import EventPicker from "./EventPicker";
import LocationPicker from "./LocationPicker";
import { cheapestAvailable, computeTransit, TransitCalc } from "@/lib/transit";
import { LatLng, NightOutEvent, NightOutResult, TransitOptionId } from "@/lib/types";

type Props = {
  onSave: (result: NightOutResult, name: string) => void;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const eventDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export default function PlanBuilder({ onSave }: Props) {
  const [event, setEvent] = useState<NightOutEvent | null>(null);
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [startLabel, setStartLabel] = useState("");
  const [ticketPrice, setTicketPrice] = useState(0);
  const [foodAndDrinksBudget, setFoodAndDrinksBudget] = useState(40);
  const [selectedTransitId, setSelectedTransitId] = useState<TransitOptionId | null>(null);
  const [transitCalc, setTransitCalc] = useState<TransitCalc | null>(null);
  const [isCalculatingTransit, setIsCalculatingTransit] = useState(false);
  const [transitError, setTransitError] = useState<string | null>(null);
  const [name, setName] = useState("");

  function handleSelectEvent(selected: NightOutEvent) {
    setEvent(selected);
    setTicketPrice(selected.priceMin ?? 0);
    setSelectedTransitId(null);
  }

  function handleLocationChange(point: LatLng, label: string) {
    setStartPoint(point);
    setStartLabel(label);
    setSelectedTransitId(null);
  }

  // Distance/surge/live Citi Bike availability only depend on event + start
  // point, so this only reruns (and only hits the network) when either of
  // those actually change — not on every ticket price / budget keystroke.
  useEffect(() => {
    if (!event || !startPoint) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTransitCalc(null);
      return;
    }
    let cancelled = false;
    setIsCalculatingTransit(true);
    setTransitError(null);
    computeTransit(event, startPoint)
      .then((calc) => {
        if (!cancelled) setTransitCalc(calc);
      })
      .catch(() => {
        if (!cancelled) setTransitError("Couldn't calculate transit options. Try again.");
      })
      .finally(() => {
        if (!cancelled) setIsCalculatingTransit(false);
      });
    return () => {
      cancelled = true;
    };
  }, [event, startPoint]);

  // Default the plan name from the selected event; still freely editable.
  useEffect(() => {
    if (event) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(`${event.name} — ${eventDateFormatter.format(new Date(event.startDateTime))}`);
    }
  }, [event]);

  const cheapestOption = transitCalc ? cheapestAvailable(transitCalc.transitOptions) : null;
  const activeOption =
    (selectedTransitId &&
      transitCalc?.transitOptions.find((o) => o.id === selectedTransitId && o.available)) ||
    cheapestOption;

  const total = ticketPrice + foodAndDrinksBudget + (activeOption?.costRoundTrip ?? 0);
  const canSave = event !== null && startPoint !== null && transitCalc !== null && activeOption !== null;

  function handleSave() {
    if (!event || !startPoint || !transitCalc || !activeOption) return;
    const result: NightOutResult = {
      inputs: { event, startPoint, startLabel, ticketPrice, foodAndDrinksBudget },
      distanceMiles: transitCalc.distanceMiles,
      ticketPrice,
      foodAndDrinksBudget,
      goingSurge: transitCalc.goingSurge,
      returnSurge: transitCalc.returnSurge,
      transitOptions: transitCalc.transitOptions,
      selectedTransitId: activeOption.id,
      total,
    };
    onSave(result, name || event.name);
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--hairline)] rounded-xl p-6 flex flex-col gap-5">
      <EventPicker selectedEvent={event} onSelect={handleSelectEvent} />

      <LocationPicker startLabel={startLabel} onChange={handleLocationChange} />

      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Ticket price" value={ticketPrice} onChange={setTicketPrice} />
        <NumberField
          label="Food & drinks budget"
          value={foodAndDrinksBudget}
          onChange={setFoodAndDrinksBudget}
        />
      </div>

      {!event || !startPoint ? (
        <p className="text-sm text-[var(--muted)] border-t border-[var(--hairline)] pt-4">
          Pick an event and a starting point to see the real cost.
        </p>
      ) : (
        <>
          <div className="border-t border-[var(--hairline)] pt-4">
            <p className="field-label mb-1">
              Real cost{activeOption ? `, via ${activeOption.label}` : ""}
            </p>
            {isCalculatingTransit && !transitCalc ? (
              <p className="text-sm text-[var(--muted)]">Checking Citi Bike stations…</p>
            ) : transitError ? (
              <p className="text-sm text-red-400">{transitError}</p>
            ) : (
              <>
                <p className="font-display text-4xl font-medium">{currency.format(total)}</p>
                {transitCalc && (
                  <p className="text-sm text-[var(--ink-soft)] mt-1">
                    {transitCalc.distanceMiles.toFixed(1)} mi each way
                  </p>
                )}
              </>
            )}
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-[var(--accent)] hover:underline"
              >
                Buy tickets for {event.name} ↗
              </a>
            )}
          </div>

          {transitCalc && (
            <>
              <div className="rounded-md border border-[var(--hairline)] px-3 py-2 text-xs text-[var(--ink-soft)]">
                Rideshare demand estimate:{" "}
                <span className="text-[var(--ink)]">{transitCalc.goingSurge.label}</span>{" "}
                heading out,{" "}
                <span className="text-[var(--ink)]">{transitCalc.returnSurge.label}</span>{" "}
                heading home.
              </div>

              <div>
                <p className="field-label mb-2">
                  Transit options, round trip — tap to choose
                </p>
                <div className="flex flex-col gap-2">
                  {transitCalc.transitOptions.map((option) => {
                    const isActive = activeOption?.id === option.id;
                    const isCheapest = cheapestOption?.id === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={!option.available}
                        onClick={() => setSelectedTransitId(option.id)}
                        className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                          isActive
                            ? "border-[var(--accent)] bg-[var(--accent-wash)]"
                            : "border-[var(--hairline)] hover:border-[var(--accent)]"
                        } ${
                          option.available
                            ? "cursor-pointer"
                            : "opacity-50 cursor-not-allowed hover:border-[var(--hairline)]"
                        }`}
                      >
                        <div>
                          <p className="font-medium">
                            {option.label}
                            {isCheapest && (
                              <span className="ml-2 text-xs text-[var(--accent)]">
                                Cheapest
                              </span>
                            )}
                          </p>
                          {option.note && (
                            <p className="text-xs text-[var(--muted)]">{option.note}</p>
                          )}
                        </div>
                        <p className="font-medium">{currency.format(option.costRoundTrip)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2 border-t border-[var(--hairline)]">
            <input
              type="text"
              className="field-input flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name this plan"
            />
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className="rounded-md border border-[var(--ink)] px-4 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save plan
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">
          $
        </span>
        <input
          type="number"
          min={0}
          step="any"
          className="field-input field-input-currency"
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        />
      </div>
    </div>
  );
}
