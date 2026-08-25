"use client";

import { useEffect, useState } from "react";
import PlanBuilder from "@/components/PlanBuilder";
import SavedPlans from "@/components/SavedPlans";
import { deletePlan, loadPlans, savePlan } from "@/lib/storage";
import { NightOutResult, SavedPlan } from "@/lib/types";

export default function Home() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);

  useEffect(() => {
    // localStorage isn't available during SSR, so plans are loaded post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlans(loadPlans());
  }, []);

  function handleSave(result: NightOutResult, name: string) {
    setPlans(savePlan(name, result));
  }

  function handleDelete(id: string) {
    setPlans(deletePlan(id));
  }

  return (
    <div className="flex-1 flex flex-col items-center px-6 py-12 sm:py-16">
      <div className="w-full max-w-xl flex flex-col gap-10">
        <header>
          <p className="text-xs uppercase tracking-wide text-[var(--accent)] mb-2">
            NYC Night Out Budgeter
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-medium leading-tight mb-2">
            Know the real cost before you buy the ticket.
          </h1>
          <p className="text-[var(--ink-soft)] text-sm">
            Pick a real NYC concert or sports event, set a food & drinks
            budget, and get transit both ways — subway, rideshare, or Citi
            Bike — with rideshare demand estimated from when you&apos;ll
            actually be leaving and coming home.
          </p>
        </header>

        <PlanBuilder onSave={handleSave} />

        <section>
          <p className="field-label mb-3">Saved plans</p>
          <SavedPlans plans={plans} onDelete={handleDelete} />
        </section>
      </div>
    </div>
  );
}
