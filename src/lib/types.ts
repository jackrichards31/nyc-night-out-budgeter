export type Neighborhood = {
  id: string;
  name: string;
  borough: string;
  lat: number;
  lng: number;
};

export type TransitOptionId = "subway" | "rideshare" | "citibike";

export type NightOutInputs = {
  eventName: string;
  ticketPrice: number;
  coverCharge: number;
  drinkCount: number;
  avgDrinkPrice: number;
  startLocationId: string;
  endLocationId: string;
  rideshareSurge: number;
};

export type TransitOption = {
  id: TransitOptionId;
  label: string;
  costOneWay: number;
  costRoundTrip: number;
  available: boolean;
  note?: string;
};

export type NightOutResult = {
  inputs: NightOutInputs;
  distanceMiles: number;
  ticketAndCover: number;
  drinksTotal: number;
  transitOptions: TransitOption[];
  cheapestTransitId: TransitOptionId;
  totalWithCheapestTransit: number;
};

export type SavedPlan = NightOutResult & {
  id: string;
  name: string;
  createdAt: string;
};
