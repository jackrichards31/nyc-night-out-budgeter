import { EventCategory, NightOutEvent } from "./types";

export type EventsResponse = {
  events: NightOutEvent[];
  source: "ticketmaster" | "seatgeek" | "mock";
};

export async function fetchEvents(
  category: EventCategory,
  keyword?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<EventsResponse> {
  const params = new URLSearchParams({ category });
  if (keyword) params.set("keyword", keyword);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  const res = await fetch(`/api/events?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load events");
  return res.json();
}
