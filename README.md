# NYC Night Out Budgeter

A pre-going-out budget calculator for NYC nightlife. Pick a real concert or sports event, set a food & drinks budget, and see the full round-trip cost — subway, rideshare, or Citi Bike — before you buy the ticket.

I built this because "how much is tonight actually going to cost" is always a rideshare surge and a rideshare-surge-shaped surprise away from the number you had in your head.

## How It Works

1. **Pick a category** — Concerts or sports
2. **Pick an event** — Real, upcoming NYC listings pulled live from Ticketmaster (concerts) or SeatGeek (sports)
3. **Set your starting point** — Use your current location or pick an NYC neighborhood
4. **Enter your budget** — Ticket price plus a food & drinks number
5. **Compare transit both ways** — Subway (flat OMNY fare), rideshare (priced with real time-of-day demand for the ride there *and* the ride home), or Citi Bike (checked against live dock/bike availability)
6. **See the real total** — Ticket + food & drinks + your chosen transit, round trip
7. **Save the plan** — Compare it against other nights later

## Tech Stack

- **Next.js (App Router) / React / TypeScript** — App shell, routing, and the `/api/events` server route
- **Tailwind CSS** — Styling
- **Ticketmaster Discovery API** — Live concert listings
- **SeatGeek API** — Live sports listings (Ticketmaster's NYC sports data almost never carries real pricing, so sports comes from SeatGeek instead)
- **Citi Bike GBFS feed** — Real-time station bike/dock availability
- **Formula-based fare & surge modeling** — Subway, rideshare, and Citi Bike costs are estimated from published NYC rates and a day/hour demand curve, not a live pricing API
- **`localStorage`** — Saved plans persist client-side, no backend database

Both event APIs are optional — without keys, the app falls back to a small set of mock NYC events so the whole flow still works end to end.

## Getting Started

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Add API keys for live event data — copy `.env.local.example` to `.env.local`:
   ```bash
   # Concerts: free key at https://developer.ticketmaster.com (Discovery API)
   TICKETMASTER_API_KEY=

   # Sports: free client_id at https://seatgeek.com/account/develop
   SEATGEEK_CLIENT_ID=
   ```
   Leave either blank and that category falls back to mock NYC events.

4. Run the dev server:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`

**Requirements:** Node.js 20+, a modern browser. Citi Bike availability checks and geolocation both need an internet connection.

## Project Structure

```
nyc-night-out-budgeter/
├── src/
│   ├── app/
│   │   ├── api/events/route.ts   # Server route — Ticketmaster/SeatGeek fetch + mock fallback
│   │   ├── page.tsx              # Home page — plan builder + saved plans
│   │   └── layout.tsx
│   ├── components/
│   │   ├── PlanBuilder.tsx       # Main flow: event → location → budget → transit compare
│   │   ├── EventPicker.tsx       # Concert/sports event search & selection
│   │   ├── LocationPicker.tsx    # Current location or neighborhood picker
│   │   ├── DateRangePicker.tsx   # Event date filtering
│   │   └── SavedPlans.tsx        # List of saved plans, loaded from localStorage
│   └── lib/
│       ├── events.ts             # Client-side fetch wrapper for /api/events
│       ├── transit.ts            # Orchestrates distance, surge, and all three transit options
│       ├── pricing.ts            # Published NYC fare constants + fare formulas
│       ├── surge.ts              # Day/hour rideshare demand heuristic
│       ├── citibike.ts           # Live GBFS station lookup (nearest bike / nearest dock)
│       ├── geo.ts                # Haversine distance
│       ├── geolocation.ts        # Browser geolocation wrapper
│       ├── neighborhoods.ts      # NYC neighborhood list + coordinates
│       ├── nycTime.ts            # NYC-local ↔ UTC date boundary conversion
│       ├── storage.ts            # Save/load/delete plans via localStorage
│       └── types.ts              # Shared types (NightOutEvent, NightOutResult, etc.)
└── .env.local.example
```

## Fare & Surge Model

Subway, rideshare, and Citi Bike costs aren't pulled from a live pricing API — they're computed from published NYC rates plus a demand heuristic, defined in `src/lib/pricing.ts` and `src/lib/surge.ts`:

```ts
export const OMNY_FARE = 2.9;

export const RIDESHARE = {
  baseFare: 2.55,
  bookingAndCongestionFee: 3.3,
  perMile: 1.75,
  perMinute: 0.45,
  minimumFare: 10.0,
  avgSpeedMph: 11,
};

export const CITIBIKE = {
  unlockFee: 4.79,
  perMinute: 0.26,
  avgSpeedMph: 8,
  nearbyRadiusMiles: 0.3,
  maxPracticalMiles: 6,
};
```

Rideshare cost is estimated separately for the ride there and the ride home, since demand (and price) swings a lot over the course of one night out — a Friday 2–5am ride home is priced at a 1.6x multiplier, while the ride there at 7pm is close to 1.0x. The full day/hour curve lives in `surgeForTime()`.

Citi Bike isn't just distance-gated — a leg only counts as "available" if there's an actual bike at a nearby station for pickup *and* an open dock at a nearby station for drop-off, checked live against Citi Bike's public GBFS feed.
