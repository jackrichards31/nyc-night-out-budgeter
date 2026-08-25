import { NightOutEvent } from "./types";

// Next occurrence of a given weekday/hour, always in the future — keeps mock
// events "upcoming" no matter when this app is viewed.
function nextOccurrence(
  targetDay: number,
  hour: number,
  minute = 0,
  weeksAhead = 0
): string {
  const now = new Date();
  let daysUntil = (targetDay - now.getDay() + 7) % 7;
  const isToday = daysUntil === 0;
  const alreadyPassed =
    isToday &&
    (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute));
  if (isToday && alreadyPassed) daysUntil = 7;

  const result = new Date(now);
  result.setDate(now.getDate() + daysUntil + weeksAhead * 7);
  result.setHours(hour, minute, 0, 0);
  return result.toISOString();
}

function hoursAfter(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString();
}

const FRI = 5;
const SAT = 6;
const SUN = 0;

const knockdownStart = nextOccurrence(SAT, 23, 0);
const nowadaysStart = nextOccurrence(SAT, 21, 0, 1);

// Realistic NYC venues/events used when no TICKETMASTER_API_KEY is
// configured, so the event picker works out of the box. Swap in real
// Ticketmaster data by setting the env var — see src/app/api/events/route.ts.
export const MOCK_EVENTS: NightOutEvent[] = [
  {
    id: "mock-1",
    name: "Brooklyn Mirage: Outdoor Season Closing",
    venueName: "The Brooklyn Mirage",
    location: { lat: 40.7048, lng: -73.9236 },
    startDateTime: nextOccurrence(FRI, 22, 0),
    endDateTime: null,
    category: "concerts",
    priceMin: 55,
    priceMax: 120,
    isMock: true,
  },
  {
    id: "mock-2",
    name: "Knockdown Center Presents: Techno Warehouse",
    venueName: "Knockdown Center",
    location: { lat: 40.7188, lng: -73.913 },
    startDateTime: knockdownStart,
    endDateTime: hoursAfter(knockdownStart, 7),
    category: "concerts",
    priceMin: 40,
    priceMax: 75,
    isMock: true,
  },
  {
    id: "mock-3",
    name: "House of Yes: Bassline Saturdays",
    venueName: "House of Yes",
    location: { lat: 40.7057, lng: -73.9238 },
    startDateTime: nextOccurrence(SAT, 22, 0),
    endDateTime: null,
    category: "concerts",
    priceMin: 30,
    priceMax: 60,
    isMock: true,
  },
  {
    id: "mock-4",
    name: "Elsewhere Hall: Late Night Set",
    venueName: "Elsewhere",
    location: { lat: 40.7096, lng: -73.933 },
    startDateTime: nextOccurrence(FRI, 23, 30),
    endDateTime: null,
    category: "concerts",
    priceMin: 25,
    priceMax: 45,
    isMock: true,
  },
  {
    id: "mock-5",
    name: "Nowadays All Night",
    venueName: "Nowadays",
    location: { lat: 40.704, lng: -73.9021 },
    startDateTime: nowadaysStart,
    endDateTime: hoursAfter(nowadaysStart, 7),
    category: "concerts",
    priceMin: 20,
    priceMax: 30,
    isMock: true,
  },
  {
    id: "mock-6",
    name: "Good Room: Deep House Sundays",
    venueName: "Good Room",
    location: { lat: 40.7282, lng: -73.9509 },
    startDateTime: nextOccurrence(SUN, 21, 0),
    endDateTime: null,
    category: "concerts",
    priceMin: 20,
    priceMax: 35,
    isMock: true,
  },
  {
    id: "mock-sports-1",
    name: "Knicks vs. Celtics",
    venueName: "Madison Square Garden",
    location: { lat: 40.7505, lng: -73.9934 },
    startDateTime: nextOccurrence(FRI, 19, 30, 1),
    endDateTime: null,
    category: "sports",
    priceMin: 85,
    priceMax: 450,
    isMock: true,
  },
  {
    id: "mock-sports-2",
    name: "Yankees vs. Red Sox",
    venueName: "Yankee Stadium",
    location: { lat: 40.8296, lng: -73.9262 },
    startDateTime: nextOccurrence(SAT, 19, 5),
    endDateTime: null,
    category: "sports",
    priceMin: 28,
    priceMax: 165,
    isMock: true,
  },
  {
    id: "mock-sports-3",
    name: "Nets vs. 76ers",
    venueName: "Barclays Center",
    location: { lat: 40.6826, lng: -73.9754 },
    startDateTime: nextOccurrence(SUN, 18, 0, 1),
    endDateTime: null,
    category: "sports",
    priceMin: 45,
    priceMax: 220,
    isMock: true,
  },
];
