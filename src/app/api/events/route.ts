import { NextRequest, NextResponse } from "next/server";
import { MOCK_EVENTS } from "@/lib/mockEvents";
import { nycDayBoundaryUtcIso, toSeatGeekDateTime, toTicketmasterDateTime } from "@/lib/nycTime";
import { EventCategory, NightOutEvent } from "@/lib/types";

type EventSource = "ticketmaster" | "seatgeek" | "mock";

function parseCategory(value: string | null): EventCategory {
  return value === "sports" ? "sports" : "concerts";
}

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword")?.trim() ?? "";
  const category = parseCategory(request.nextUrl.searchParams.get("category"));
  // "YYYY-MM-DD", straight from an <input type="date">.
  const dateFrom = request.nextUrl.searchParams.get("dateFrom") || null;
  const dateTo = request.nextUrl.searchParams.get("dateTo") || null;

  // Concerts come from Ticketmaster (good primary-market price coverage for
  // music). Sports comes from SeatGeek instead — Ticketmaster's NYC sports
  // listings almost never carry price data (verified: 0 of 151 checked had
  // any), since pro sports tickets there are resale/box-office only.
  if (category === "concerts" && process.env.TICKETMASTER_API_KEY) {
    try {
      const events = await fetchFromTicketmaster(keyword, dateFrom, dateTo);
      if (events.length > 0) {
        return NextResponse.json({ events, source: "ticketmaster" satisfies EventSource });
      }
    } catch (error) {
      console.error("Ticketmaster fetch failed, falling back to mock events", error);
    }
  } else if (category === "sports" && process.env.SEATGEEK_CLIENT_ID) {
    try {
      const events = await fetchFromSeatGeek(keyword, dateFrom, dateTo);
      if (events.length > 0) {
        return NextResponse.json({ events, source: "seatgeek" satisfies EventSource });
      }
    } catch (error) {
      console.error("SeatGeek fetch failed, falling back to mock events", error);
    }
  }

  const events = MOCK_EVENTS.filter((e) => e.category === category)
    .filter((e) =>
      keyword ? `${e.name} ${e.venueName}`.toLowerCase().includes(keyword.toLowerCase()) : true
    )
    .filter((e) =>
      dateFrom ? new Date(e.startDateTime) >= new Date(nycDayBoundaryUtcIso(dateFrom)) : true
    )
    .filter((e) =>
      dateTo ? new Date(e.startDateTime) <= new Date(nycDayBoundaryUtcIso(dateTo, true)) : true
    );
  return NextResponse.json({ events, source: "mock" satisfies EventSource });
}

// ---------- Ticketmaster (concerts) ----------

const TICKETMASTER_BASE = "https://app.ticketmaster.com/discovery/v2/events.json";

type TmEvent = {
  id: string;
  name: string;
  url?: string;
  images?: { url: string; width: number }[];
  dates?: {
    start?: { dateTime?: string };
    end?: { dateTime?: string };
  };
  priceRanges?: { min: number; max: number }[];
  _embedded?: {
    venues?: {
      name: string;
      location?: { latitude: string; longitude: string };
    }[];
  };
};

async function fetchFromTicketmaster(
  keyword: string,
  dateFrom: string | null,
  dateTo: string | null
): Promise<NightOutEvent[]> {
  const params = new URLSearchParams({
    apikey: process.env.TICKETMASTER_API_KEY!,
    city: "New York",
    countryCode: "US",
    segmentName: "Music",
    sort: "date,asc",
    // Fetched generously since events without a listed price get dropped below.
    size: "50",
  });
  if (keyword) params.set("keyword", keyword);
  // Converted from NYC-local calendar day to the matching UTC instant —
  // naively appending "Z" to the picked date would misread it as a UTC day
  // and (during EDT, UTC-4) pull in the previous evening's NYC events.
  if (dateFrom) params.set("startDateTime", toTicketmasterDateTime(dateFrom));
  if (dateTo) params.set("endDateTime", toTicketmasterDateTime(dateTo, true));

  const res = await fetch(`${TICKETMASTER_BASE}?${params.toString()}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Ticketmaster responded ${res.status}`);

  const data = (await res.json()) as { _embedded?: { events?: TmEvent[] } };
  return (data._embedded?.events ?? [])
    .map(mapTicketmasterEvent)
    .filter((e): e is NightOutEvent => e !== null);
}

function mapTicketmasterEvent(raw: TmEvent): NightOutEvent | null {
  const venue = raw._embedded?.venues?.[0];
  const lat = venue?.location?.latitude ? Number(venue.location.latitude) : null;
  const lng = venue?.location?.longitude ? Number(venue.location.longitude) : null;
  const startISO = raw.dates?.start?.dateTime;
  // Only pull events where a ticket price is actually known — Ticketmaster
  // uses 0 as a default when no real price data is attached, so treat that
  // the same as missing rather than as a genuinely free event.
  const priceMin = raw.priceRanges?.[0]?.min;
  if (!venue || lat === null || lng === null || !startISO || !priceMin) {
    return null;
  }

  return {
    id: raw.id,
    name: raw.name,
    venueName: venue.name,
    location: { lat, lng },
    startDateTime: startISO,
    endDateTime: raw.dates?.end?.dateTime ?? null,
    category: "concerts",
    priceMin,
    priceMax: raw.priceRanges?.[0]?.max ?? null,
    url: raw.url,
    imageUrl: raw.images?.[0]?.url,
    isMock: false,
  };
}

// ---------- SeatGeek (sports) ----------

const SEATGEEK_BASE = "https://api.seatgeek.com/2/events";

type SgEvent = {
  id: number;
  title: string;
  url?: string;
  datetime_utc?: string;
  time_tbd?: boolean;
  venue?: {
    name: string;
    location?: { lat: number; lon: number };
  };
  stats?: { lowest_price?: number; highest_price?: number };
};

async function fetchFromSeatGeek(
  keyword: string,
  dateFrom: string | null,
  dateTo: string | null
): Promise<NightOutEvent[]> {
  // SeatGeek's datetime filters expect the same naive "YYYY-MM-DDTHH:MM:SS"
  // shape their own datetime_utc field uses (see mapSeatGeekEvent below).
  const nowUtc = new Date().toISOString().slice(0, 19);
  // Converted from NYC-local calendar day to the matching UTC instant — see
  // toSeatGeekDateTime for why naive "date + T00:00:00" would be wrong.
  const fromBound = dateFrom ? toSeatGeekDateTime(dateFrom) : null;
  // Never let an explicit dateFrom pull in past events — use whichever of
  // "now" or the requested start is later.
  const lowerBound = fromBound && fromBound > nowUtc ? fromBound : nowUtc;

  const params = new URLSearchParams({
    client_id: process.env.SEATGEEK_CLIENT_ID!,
    "venue.city": "New York",
    // Documented filter for sports vs. concerts/theater/etc — see
    // https://seatgeek.github.io (Events > taxonomies Argument).
    "taxonomies.name": "sports",
    // Ask the API to only return events with real pricing where possible;
    // mapSeatGeekEvent still double-checks this since it's not guaranteed.
    "lowest_price.gt": "0",
    "datetime_utc.gte": lowerBound,
    sort: "datetime_utc.asc",
    per_page: "50",
  });
  if (keyword) params.set("q", keyword);
  if (dateTo) params.set("datetime_utc.lte", toSeatGeekDateTime(dateTo, true));

  const res = await fetch(`${SEATGEEK_BASE}?${params.toString()}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`SeatGeek responded ${res.status}`);

  const data = (await res.json()) as { events?: SgEvent[] };
  return (data.events ?? [])
    .map(mapSeatGeekEvent)
    .filter((e): e is NightOutEvent => e !== null);
}

function mapSeatGeekEvent(raw: SgEvent): NightOutEvent | null {
  const lat = raw.venue?.location?.lat;
  const lng = raw.venue?.location?.lon;
  const priceMin = raw.stats?.lowest_price;
  // time_tbd events use a 3:30am sentinel time per SeatGeek's docs — skip
  // them since the rideshare-surge estimate needs a real departure time.
  if (
    !raw.venue ||
    lat === undefined ||
    lng === undefined ||
    !raw.datetime_utc ||
    !priceMin ||
    raw.time_tbd
  ) {
    return null;
  }

  return {
    id: `sg-${raw.id}`,
    name: raw.title,
    venueName: raw.venue.name,
    location: { lat, lng },
    // SeatGeek's datetime_utc has no trailing "Z" (e.g. "2012-03-10T00:00:00"),
    // so passing it straight to `new Date()` would be misread as local time
    // instead of UTC — append "Z" to force correct UTC parsing.
    startDateTime: `${raw.datetime_utc}Z`,
    endDateTime: null,
    category: "sports",
    priceMin,
    priceMax: raw.stats?.highest_price ?? null,
    url: raw.url,
    isMock: false,
  };
}
