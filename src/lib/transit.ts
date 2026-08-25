import { checkCitibikeLeg } from "./citibike";
import { haversineMiles } from "./geo";
import { CITIBIKE, OMNY_FARE, estimateCitibikeFare, estimateRideshareFare } from "./pricing";
import { estimateReturnTime, surgeForTime } from "./surge";
import { LatLng, NightOutEvent, SurgeLeg, TransitOption } from "./types";

export type TransitCalc = {
  distanceMiles: number;
  goingSurge: SurgeLeg;
  returnSurge: SurgeLeg;
  transitOptions: TransitOption[];
};

// The distance/surge/live-availability part of the estimate — split out from
// ticket price and food & drinks budget since those are simple additions
// that don't need recomputing (or a Citi Bike network call) on every keystroke.
export async function computeTransit(
  event: NightOutEvent,
  startPoint: LatLng
): Promise<TransitCalc> {
  const end = event.location;
  const distanceMiles = haversineMiles(startPoint, end);

  const departureTime = new Date(event.startDateTime);
  const returnTime = estimateReturnTime(event.startDateTime, event.endDateTime);
  const goingSurge = surgeForTime(departureTime);
  const returnSurge = surgeForTime(returnTime);

  const subwayOneWay = OMNY_FARE;
  const rideshareGoing = estimateRideshareFare(distanceMiles, goingSurge.multiplier);
  const rideshareReturn = estimateRideshareFare(distanceMiles, returnSurge.multiplier);
  const citibikeOneWay = estimateCitibikeFare(distanceMiles);

  let citibikeAvailable = distanceMiles <= CITIBIKE.maxPracticalMiles;
  let citibikeNote: string | undefined;

  if (!citibikeAvailable) {
    citibikeNote = `Too far for a comfortable ride (${distanceMiles.toFixed(1)} mi)`;
  } else {
    try {
      const [there, back] = await Promise.all([
        checkCitibikeLeg(startPoint, end),
        checkCitibikeLeg(end, startPoint),
      ]);
      citibikeAvailable = there.available && back.available;
      if (!citibikeAvailable) {
        citibikeNote = "No bikes/docks at nearby stations right now";
      }
    } catch {
      citibikeAvailable = false;
      citibikeNote = "Couldn't reach Citi Bike's live station data";
    }
  }

  const transitOptions: TransitOption[] = [
    {
      id: "subway",
      label: "Subway / Bus (OMNY)",
      costOneWay: subwayOneWay,
      costReturn: subwayOneWay,
      costRoundTrip: subwayOneWay * 2,
      available: true,
    },
    {
      id: "rideshare",
      label: "Rideshare (Uber/Lyft est.)",
      costOneWay: rideshareGoing,
      costReturn: rideshareReturn,
      costRoundTrip: rideshareGoing + rideshareReturn,
      available: true,
      note: `${goingSurge.label} there · ${returnSurge.label} back`,
    },
    {
      id: "citibike",
      label: "Citi Bike",
      costOneWay: citibikeOneWay,
      costReturn: citibikeOneWay,
      costRoundTrip: citibikeOneWay * 2,
      available: citibikeAvailable,
      note: citibikeNote,
    },
  ];

  return { distanceMiles, goingSurge, returnSurge, transitOptions };
}

export function cheapestAvailable(options: TransitOption[]): TransitOption {
  return options
    .filter((option) => option.available)
    .reduce((min, option) => (option.costRoundTrip < min.costRoundTrip ? option : min));
}
