export type LatLng = { lat: number; lng: number };

export type Neighborhood = {
  id: string;
  name: string;
  borough: string;
  lat: number;
  lng: number;
};

export type EventCategory = "concerts" | "sports";

export type NightOutEvent = {
  id: string;
  name: string;
  venueName: string;
  location: LatLng;
  startDateTime: string; // ISO
  endDateTime: string | null; // ISO — Ticketmaster rarely provides this
  category: EventCategory;
  priceMin: number;
  priceMax: number | null;
  url?: string;
  imageUrl?: string;
  isMock: boolean;
};

export type TransitOptionId = "subway" | "rideshare" | "citibike";

export type SurgeLeg = {
  multiplier: number;
  label: string;
};

export type NightOutInputs = {
  event: NightOutEvent;
  startPoint: LatLng;
  startLabel: string;
  ticketPrice: number;
  foodAndDrinksBudget: number;
};

export type TransitOption = {
  id: TransitOptionId;
  label: string;
  costOneWay: number;
  costReturn: number;
  costRoundTrip: number;
  available: boolean;
  note?: string;
};

export type NightOutResult = {
  inputs: NightOutInputs;
  distanceMiles: number;
  ticketPrice: number;
  foodAndDrinksBudget: number;
  goingSurge: SurgeLeg;
  returnSurge: SurgeLeg;
  transitOptions: TransitOption[];
  selectedTransitId: TransitOptionId;
  total: number;
};

export type SavedPlan = NightOutResult & {
  id: string;
  name: string;
  createdAt: string;
};
