"use client";

import { FormEvent, useState } from "react";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import { NightOutInputs } from "@/lib/types";

const DEFAULT_INPUTS: NightOutInputs = {
  eventName: "",
  ticketPrice: 0,
  coverCharge: 0,
  drinkCount: 3,
  avgDrinkPrice: 12,
  startLocationId: "east-village",
  endLocationId: "williamsburg",
  rideshareSurge: 1.3,
};

type Props = {
  onCalculate: (inputs: NightOutInputs) => void;
  isCalculating: boolean;
};

export default function BudgetForm({ onCalculate, isCalculating }: Props) {
  const [inputs, setInputs] = useState<NightOutInputs>(DEFAULT_INPUTS);

  function update<K extends keyof NightOutInputs>(key: K, value: NightOutInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onCalculate(inputs);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--card)] border border-[var(--hairline)] rounded-xl p-6 flex flex-col gap-5"
    >
      <div>
        <label className="field-label" htmlFor="eventName">
          What&apos;s the plan?
        </label>
        <input
          id="eventName"
          type="text"
          placeholder="e.g. Rooftop bar in Williamsburg"
          className="field-input"
          value={inputs.eventName}
          onChange={(e) => update("eventName", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberField
          label="Ticket price"
          value={inputs.ticketPrice}
          onChange={(v) => update("ticketPrice", v)}
        />
        <NumberField
          label="Cover charge"
          value={inputs.coverCharge}
          onChange={(v) => update("coverCharge", v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberField
          label="Drinks"
          value={inputs.drinkCount}
          step={1}
          onChange={(v) => update("drinkCount", v)}
        />
        <NumberField
          label="Avg. drink price"
          value={inputs.avgDrinkPrice}
          onChange={(v) => update("avgDrinkPrice", v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="start">
            Starting from
          </label>
          <select
            id="start"
            className="field-input"
            value={inputs.startLocationId}
            onChange={(e) => update("startLocationId", e.target.value)}
          >
            {NEIGHBORHOODS.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.borough})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="end">
            Going to
          </label>
          <select
            id="end"
            className="field-input"
            value={inputs.endLocationId}
            onChange={(e) => update("endLocationId", e.target.value)}
          >
            {NEIGHBORHOODS.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.borough})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="surge">
          Expected rideshare surge ({inputs.rideshareSurge.toFixed(1)}x)
        </label>
        <input
          id="surge"
          type="range"
          min={1}
          max={3}
          step={0.1}
          className="w-full accent-[var(--accent-deep)]"
          value={inputs.rideshareSurge}
          onChange={(e) => update("rideshareSurge", Number(e.target.value))}
        />
      </div>

      <button
        type="submit"
        disabled={isCalculating}
        className="mt-2 rounded-md bg-[var(--ink)] text-[var(--bg)] font-medium text-sm py-3 hover:bg-[var(--accent-deep)] transition-colors disabled:opacity-60"
      >
        {isCalculating ? "Checking Citi Bike stations…" : "Calculate real cost"}
      </button>
    </form>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 0.5,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div className="relative">
        {step < 1 && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">
            $
          </span>
        )}
        <input
          type="number"
          min={0}
          step={step}
          className={`field-input ${step < 1 ? "pl-6" : ""}`}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        />
      </div>
    </div>
  );
}
