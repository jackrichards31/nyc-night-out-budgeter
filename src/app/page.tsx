"use client";

import { useEffect, useState } from "react";
import BudgetForm from "@/components/BudgetForm";
import ResultsBreakdown from "@/components/ResultsBreakdown";
import SavedPlans from "@/components/SavedPlans";
import { calculateNightOut } from "@/lib/calculate";
import { deletePlan, loadPlans, savePlan } from "@/lib/storage";
import { NightOutInputs, NightOutResult, SavedPlan } from "@/lib/types";

export default function Home() {
  const [result, setResult] = useState<NightOutResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SavedPlan[]>([]);

  useEffect(() => {
    // localStorage isn't available during SSR, so plans are loaded post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlans(loadPlans());
  }, []);

  async function handleCalculate(inputs: NightOutInputs) {
    setIsCalculating(true);
    setError(null);
    try {
      const next = await calculateNightOut(inputs);
      setResult(next);
    } catch {
      setError("Something went wrong calculating that plan. Try again.");
    } finally {
      setIsCalculating(false);
    }
  }

  function handleSave(name: string) {
    if (!result) return;
    setPlans(savePlan(name, result));
  }

  function handleDelete(id: string) {
    setPlans(deletePlan(id));
  }

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-12 sm:py-16">
      <div className="w-full max-w-xl flex flex-col gap-10">
        <header>
          <p className="text-xs uppercase tracking-wide text-[var(--accent-deep)] mb-2">
            NYC Night Out Budgeter
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-medium leading-tight mb-2">
            Know the real cost before you buy the ticket.
          </h1>
          <p className="text-[var(--ink-soft)] text-sm">
            Ticket, cover, drinks, and transit both ways — subway, rideshare,
            or Citi Bike using live station availability.
          </p>
        </header>

        <BudgetForm onCalculate={handleCalculate} isCalculating={isCalculating} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result && <ResultsBreakdown result={result} onSave={handleSave} />}

        <section>
          <p className="field-label mb-3">Saved plans</p>
          <SavedPlans plans={plans} onDelete={handleDelete} />
        </section>
      </div>
    </div>
  );
}
