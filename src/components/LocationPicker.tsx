"use client";

import { useState } from "react";
import { getCurrentLocation } from "@/lib/geolocation";
import { NEIGHBORHOODS, getNeighborhood } from "@/lib/neighborhoods";
import { LatLng } from "@/lib/types";

type Props = {
  startLabel: string;
  onChange: (point: LatLng, label: string) => void;
};

type Mode = "idle" | "loading" | "granted" | "fallback";

export default function LocationPicker({ startLabel, onChange }: Props) {
  const [mode, setMode] = useState<Mode>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleUseLocation() {
    setMode("loading");
    setMessage(null);
    const result = await getCurrentLocation();
    if (result.status === "success") {
      onChange(result.point, "Current location");
      setMode("granted");
    } else {
      setMessage(result.message);
      setMode("fallback");
    }
  }

  return (
    <div>
      <label className="field-label">Starting from</label>

      {mode !== "fallback" && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={mode === "loading"}
            className="rounded-md border border-[var(--hairline)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)] transition-colors disabled:opacity-60"
          >
            {mode === "loading"
              ? "Locating…"
              : mode === "granted"
              ? `Using: ${startLabel}`
              : "Use my location"}
          </button>
          <button
            type="button"
            onClick={() => setMode("fallback")}
            className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
          >
            or pick a neighborhood
          </button>
        </div>
      )}

      {mode === "fallback" && (
        <div>
          {message && (
            <p className="text-xs text-[var(--muted)] mb-2">{message}</p>
          )}
          <select
            className="field-input"
            defaultValue=""
            onChange={(e) => {
              const n = getNeighborhood(e.target.value);
              onChange({ lat: n.lat, lng: n.lng }, n.name);
            }}
          >
            <option value="" disabled>
              Choose a neighborhood…
            </option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.borough})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
