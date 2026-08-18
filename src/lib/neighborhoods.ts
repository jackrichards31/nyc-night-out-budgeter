import { Neighborhood } from "./types";

export const NEIGHBORHOODS: Neighborhood[] = [
  { id: "east-village", name: "East Village", borough: "Manhattan", lat: 40.7265, lng: -73.9815 },
  { id: "les", name: "Lower East Side", borough: "Manhattan", lat: 40.715, lng: -73.9843 },
  { id: "greenwich-village", name: "Greenwich Village", borough: "Manhattan", lat: 40.7336, lng: -74.0027 },
  { id: "soho", name: "SoHo", borough: "Manhattan", lat: 40.7233, lng: -74.003 },
  { id: "chelsea", name: "Chelsea", borough: "Manhattan", lat: 40.7465, lng: -74.0014 },
  { id: "hells-kitchen", name: "Hell's Kitchen", borough: "Manhattan", lat: 40.7638, lng: -73.9918 },
  { id: "midtown", name: "Midtown", borough: "Manhattan", lat: 40.7549, lng: -73.984 },
  { id: "fidi", name: "Financial District", borough: "Manhattan", lat: 40.7075, lng: -74.0113 },
  { id: "upper-east-side", name: "Upper East Side", borough: "Manhattan", lat: 40.7736, lng: -73.9566 },
  { id: "upper-west-side", name: "Upper West Side", borough: "Manhattan", lat: 40.787, lng: -73.9754 },
  { id: "harlem", name: "Harlem", borough: "Manhattan", lat: 40.8116, lng: -73.9465 },
  { id: "williamsburg", name: "Williamsburg", borough: "Brooklyn", lat: 40.7081, lng: -73.9571 },
  { id: "greenpoint", name: "Greenpoint", borough: "Brooklyn", lat: 40.7304, lng: -73.9515 },
  { id: "bushwick", name: "Bushwick", borough: "Brooklyn", lat: 40.6958, lng: -73.9171 },
  { id: "dumbo", name: "DUMBO", borough: "Brooklyn", lat: 40.7033, lng: -73.9903 },
  { id: "park-slope", name: "Park Slope", borough: "Brooklyn", lat: 40.671, lng: -73.9814 },
  { id: "bed-stuy", name: "Bedford-Stuyvesant", borough: "Brooklyn", lat: 40.6872, lng: -73.9418 },
  { id: "astoria", name: "Astoria", borough: "Queens", lat: 40.7644, lng: -73.9235 },
  { id: "lic", name: "Long Island City", borough: "Queens", lat: 40.7447, lng: -73.9485 },
];

export function getNeighborhood(id: string): Neighborhood {
  const found = NEIGHBORHOODS.find((n) => n.id === id);
  if (!found) {
    throw new Error(`Unknown neighborhood id: ${id}`);
  }
  return found;
}
