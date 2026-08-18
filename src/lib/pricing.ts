// All rates below are approximate published NYC rates (2026) used for
// formula-based estimation — not live pricing APIs. Easy to tune here.

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
  // Stations within this radius of a start/end point count as "nearby".
  nearbyRadiusMiles: 0.3,
  // Beyond this a bike ride is impractical for a night out (dressy shoes, etc).
  maxPracticalMiles: 6,
};

export function estimateRideshareFare(distanceMiles: number, surge: number): number {
  const minutes = (distanceMiles / RIDESHARE.avgSpeedMph) * 60;
  const fare =
    RIDESHARE.baseFare +
    RIDESHARE.bookingAndCongestionFee +
    RIDESHARE.perMile * distanceMiles +
    RIDESHARE.perMinute * minutes;
  return Math.max(fare, RIDESHARE.minimumFare) * surge;
}

export function estimateCitibikeFare(distanceMiles: number): number {
  const minutes = (distanceMiles / CITIBIKE.avgSpeedMph) * 60;
  return CITIBIKE.unlockFee + CITIBIKE.perMinute * minutes;
}
