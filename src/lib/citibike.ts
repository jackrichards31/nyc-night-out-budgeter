import { haversineMiles } from "./geo";
import { CITIBIKE } from "./pricing";

const STATION_INFO_URL =
  "https://gbfs.lyft.com/gbfs/1.1/bkn/en/station_information.json";
const STATION_STATUS_URL =
  "https://gbfs.lyft.com/gbfs/1.1/bkn/en/station_status.json";

type StationInfo = { station_id: string; name: string; lat: number; lon: number };
type StationStatus = {
  station_id: string;
  num_bikes_available: number;
  num_docks_available: number;
  is_renting: number;
  is_returning: number;
};

type Station = StationInfo & StationStatus;

let cache: { stations: Station[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 2 * 60 * 1000;

async function getStations(): Promise<Station[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.stations;
  }

  const [infoRes, statusRes] = await Promise.all([
    fetch(STATION_INFO_URL),
    fetch(STATION_STATUS_URL),
  ]);
  if (!infoRes.ok || !statusRes.ok) {
    throw new Error("Failed to fetch Citi Bike GBFS feeds");
  }

  const info = (await infoRes.json()) as { data: { stations: StationInfo[] } };
  const status = (await statusRes.json()) as { data: { stations: StationStatus[] } };

  const statusById = new Map(status.data.stations.map((s) => [s.station_id, s]));
  const stations: Station[] = info.data.stations
    .map((s) => {
      const st = statusById.get(s.station_id);
      return st ? { ...s, ...st } : null;
    })
    .filter((s): s is Station => s !== null);

  cache = { stations, fetchedAt: Date.now() };
  return stations;
}

export type StationAvailability = {
  found: boolean;
  stationName?: string;
  distanceMiles?: number;
  hasBikes?: boolean;
  hasDocks?: boolean;
};

// Looks at every station within walking radius, not just the single closest
// one — a real rider walks to the next-closest station if the first is full
// or empty, so checking only the nearest station understates availability.
async function nearestStation(
  point: { lat: number; lng: number },
  requires: "bikes" | "docks"
): Promise<StationAvailability> {
  const stations = await getStations();

  let closestInRadius: { station: Station; distance: number } | null = null;
  let closestQualifying: { station: Station; distance: number } | null = null;

  for (const station of stations) {
    if (!station.is_renting && !station.is_returning) continue;
    const distance = haversineMiles(point, { lat: station.lat, lng: station.lon });
    if (distance > CITIBIKE.nearbyRadiusMiles) continue;

    if (!closestInRadius || distance < closestInRadius.distance) {
      closestInRadius = { station, distance };
    }

    const qualifies =
      requires === "bikes"
        ? station.num_bikes_available > 0
        : station.num_docks_available > 0;
    if (qualifies && (!closestQualifying || distance < closestQualifying.distance)) {
      closestQualifying = { station, distance };
    }
  }

  if (!closestInRadius) {
    return { found: false };
  }

  const chosen = closestQualifying ?? closestInRadius;
  return {
    found: true,
    stationName: chosen.station.name,
    distanceMiles: chosen.distance,
    hasBikes: chosen.station.num_bikes_available > 0,
    hasDocks: chosen.station.num_docks_available > 0,
  };
}

export type CitibikeLegAvailability = {
  pickup: StationAvailability;
  dropoff: StationAvailability;
  available: boolean;
};

export async function checkCitibikeLeg(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<CitibikeLegAvailability> {
  const [pickup, dropoff] = await Promise.all([
    nearestStation(from, "bikes"),
    nearestStation(to, "docks"),
  ]);

  const available = Boolean(
    pickup.found && pickup.hasBikes && dropoff.found && dropoff.hasDocks
  );

  return { pickup, dropoff, available };
}
