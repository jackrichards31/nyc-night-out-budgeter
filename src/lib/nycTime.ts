const NYC_TIME_ZONE = "America/New_York";

// Computes the UTC offset (in minutes, negative = behind UTC) that
// `timeZone` is at the instant `date` represents. Handles DST correctly
// since it goes through Intl's tz database rather than a hardcoded offset.
function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return (asUtc - date.getTime()) / 60000;
}

// Converts a "YYYY-MM-DD" calendar date — as picked in the UI, meaning a day
// in NYC local time — to the UTC instant of that day's start or end in
// America/New_York. Naively appending "T00:00:00Z" instead would treat the
// picked day as a UTC day, which during EDT (UTC-4) shifts the boundary by
// 4 hours and leaks the previous evening's NYC events into the filter.
export function nycDayBoundaryUtcIso(dateKey: string, endOfDay = false): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const naiveUtcMs = endOfDay
    ? Date.UTC(y, m - 1, d, 23, 59, 59)
    : Date.UTC(y, m - 1, d, 0, 0, 0);
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(naiveUtcMs), NYC_TIME_ZONE);
  const utcMs = naiveUtcMs - offsetMinutes * 60000;
  return new Date(utcMs).toISOString();
}

// "yyyy-MM-ddTHH:mm:ssZ" — Ticketmaster's expected startDateTime/endDateTime shape.
export function toTicketmasterDateTime(dateKey: string, endOfDay = false): string {
  return `${nycDayBoundaryUtcIso(dateKey, endOfDay).slice(0, 19)}Z`;
}

// "yyyy-MM-ddTHH:mm:ss" (no trailing Z) — matches the naive-but-UTC shape of
// SeatGeek's own datetime_utc field, used for their .gte/.lte filters.
export function toSeatGeekDateTime(dateKey: string, endOfDay = false): string {
  return nycDayBoundaryUtcIso(dateKey, endOfDay).slice(0, 19);
}
