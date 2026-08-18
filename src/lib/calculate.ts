import { checkCitibikeLeg } from "./citibike";
import { haversineMiles } from "./geo";
import { getNeighborhood } from "./neighborhoods";
import { CITIBIKE, OMNY_FARE, estimateCitibikeFare, estimateRideshareFare } from "./pricing";
import { NightOutInputs, NightOutResult, TransitOption } from "./types";

export async function calculateNightOut(
  inputs: NightOutInputs
): Promise<NightOutResult> {
  const start = getNeighborhood(inputs.startLocationId);
  const end = getNeighborhood(inputs.endLocationId);
  const distanceMiles = haversineMiles(start, end);

  const ticketAndCover = inputs.ticketPrice + inputs.coverCharge;
  const drinksTotal = inputs.drinkCount * inputs.avgDrinkPrice;

  const subwayCostOneWay = OMNY_FARE;
  const rideshareCostOneWay = estimateRideshareFare(distanceMiles, inputs.rideshareSurge);
  const citibikeCostOneWay = estimateCitibikeFare(distanceMiles);

  let citibikeAvailable = distanceMiles <= CITIBIKE.maxPracticalMiles;
  let citibikeNote: string | undefined;

  if (!citibikeAvailable) {
    citibikeNote = `Too far for a comfortable ride (${distanceMiles.toFixed(1)} mi)`;
  } else {
    try {
      const [there, back] = await Promise.all([
        checkCitibikeLeg(start, end),
        checkCitibikeLeg(end, start),
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
      costOneWay: subwayCostOneWay,
      costRoundTrip: subwayCostOneWay * 2,
      available: true,
    },
    {
      id: "rideshare",
      label: "Rideshare (Uber/Lyft est.)",
      costOneWay: rideshareCostOneWay,
      costRoundTrip: rideshareCostOneWay * 2,
      available: true,
    },
    {
      id: "citibike",
      label: "Citi Bike",
      costOneWay: citibikeCostOneWay,
      costRoundTrip: citibikeCostOneWay * 2,
      available: citibikeAvailable,
      note: citibikeNote,
    },
  ];

  const cheapest = transitOptions
    .filter((option) => option.available)
    .reduce((min, option) => (option.costRoundTrip < min.costRoundTrip ? option : min));

  const totalWithCheapestTransit =
    ticketAndCover + drinksTotal + cheapest.costRoundTrip;

  return {
    inputs,
    distanceMiles,
    ticketAndCover,
    drinksTotal,
    transitOptions,
    cheapestTransitId: cheapest.id,
    totalWithCheapestTransit,
  };
}
