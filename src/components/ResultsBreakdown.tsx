"use client";

import { useState } from "react";
import { NightOutResult } from "@/lib/types";

type Props = {
  result: NightOutResult;
  onSave: (name: string) => void;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function ResultsBreakdown({ result, onSave }: Props) {
  const [name, setName] = useState(result.inputs.eventName || "Night out");
  const cheapest = result.transitOptions.find(
    (o) => o.id === result.cheapestTransitId
  )!;

  return (
    <div className="bg-[var(--card)] border border-[var(--hairline)] rounded-xl p-6 flex flex-col gap-6">
      <div>
        <p className="field-label mb-1">Real cost, cheapest transit</p>
        <p className="font-display text-4xl font-medium">
          {currency.format(result.totalWithCheapestTransit)}
        </p>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          {result.distanceMiles.toFixed(1)} mi each way · via {cheapest.label}
        </p>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <Row label="Ticket + cover" value={result.ticketAndCover} />
        <Row label="Drinks" value={result.drinksTotal} />
        <Row
          label={`Transit, round trip (${cheapest.label})`}
          value={cheapest.costRoundTrip}
        />
      </div>

      <div>
        <p className="field-label mb-2">Transit options, round trip</p>
        <div className="flex flex-col gap-2">
          {result.transitOptions.map((option) => (
            <div
              key={option.id}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                option.id === cheapest.id
                  ? "border-[var(--accent)] bg-[#FFF9FB]"
                  : "border-[var(--hairline)]"
              } ${!option.available ? "opacity-50" : ""}`}
            >
              <div>
                <p className="font-medium">{option.label}</p>
                {option.note && (
                  <p className="text-xs text-[var(--muted)]">{option.note}</p>
                )}
              </div>
              <p className="font-medium">{currency.format(option.costRoundTrip)}</p>
            </div>
          ))}
        </div>
      </div>

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
          onClick={() => onSave(name || "Night out")}
          className="rounded-md border border-[var(--ink)] px-4 text-sm font-medium hover:border-[var(--accent-deep)] hover:text-[var(--accent-deep)] transition-colors"
        >
          Save plan
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--ink-soft)]">{label}</span>
      <span className="font-medium">{currency.format(value)}</span>
    </div>
  );
}
