import { NightOutResult, SavedPlan } from "./types";

const STORAGE_KEY = "nyc-night-out-plans";

export function loadPlans(): SavedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPlan[];
  } catch {
    return [];
  }
}

export function savePlan(name: string, result: NightOutResult): SavedPlan[] {
  const plans = loadPlans();
  const plan: SavedPlan = {
    ...result,
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
  };
  const updated = [plan, ...plans];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deletePlan(id: string): SavedPlan[] {
  const updated = loadPlans().filter((p) => p.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
