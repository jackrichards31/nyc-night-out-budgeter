"use client";

import { SavedPlan } from "@/lib/types";
import { getNeighborhood } from "@/lib/neighborhoods";

type Props = {
  plans: SavedPlan[];
  onDelete: (id: string) => void;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function SavedPlans({ plans, onDelete }: Props) {
  if (plans.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Saved plans will show up here so you can compare a few nights out.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {plans.map((plan) => {
        const start = getNeighborhood(plan.inputs.startLocationId);
        const end = getNeighborhood(plan.inputs.endLocationId);
        return (
          <div
            key={plan.id}
            className="flex items-center justify-between bg-[var(--card)] border border-[var(--hairline)] rounded-lg px-4 py-3"
          >
            <div>
              <p className="font-medium text-sm">{plan.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {start.name} → {end.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-display text-lg">
                {currency.format(plan.totalWithCheapestTransit)}
              </p>
              <button
                type="button"
                onClick={() => onDelete(plan.id)}
                className="text-xs text-[var(--muted)] hover:text-[var(--accent-deep)]"
                aria-label={`Delete ${plan.name}`}
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
