import { SurgeLeg } from "./types";

// Heuristic NYC rideshare demand curve — not live surge data, just a
// day/hour bucketed estimate so the form doesn't need a manual slider.
export function surgeForTime(date: Date): SurgeLeg {
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const hour = date.getHours();
  const isWeekend = day === 5 || day === 6 || (day === 0 && hour < 5);

  if (hour >= 2 && hour < 5) {
    return isWeekend
      ? { multiplier: 1.6, label: "Weekend bar close (2–5am)" }
      : { multiplier: 1.2, label: "Late night (2–5am)" };
  }
  if (hour >= 23 || hour < 2) {
    return isWeekend
      ? { multiplier: 1.4, label: "Weekend late night" }
      : { multiplier: 1.15, label: "Weeknight late night" };
  }
  if (hour >= 19 && hour < 23) {
    return isWeekend
      ? { multiplier: 1.25, label: "Weekend evening" }
      : { multiplier: 1.05, label: "Weeknight evening" };
  }
  if (hour >= 5 && hour < 9) {
    return { multiplier: 1.1, label: "Early morning" };
  }
  return { multiplier: 1.0, label: "Off-peak" };
}

// Typical length of an EDM club night when the event has no listed end time.
export const DEFAULT_EVENT_DURATION_HOURS = 5;

export function estimateReturnTime(startISO: string, endISO: string | null): Date {
  if (endISO) return new Date(endISO);
  const start = new Date(startISO);
  return new Date(start.getTime() + DEFAULT_EVENT_DURATION_HOURS * 60 * 60 * 1000);
}
