import { LatLng } from "./types";

export type GeolocationResult =
  | { status: "success"; point: LatLng }
  | { status: "denied" | "unavailable" | "timeout"; message: string };

export function getCurrentLocation(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve({
        status: "unavailable",
        message: "This browser doesn't support geolocation.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          status: "success",
          point: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({
            status: "denied",
            // Firing instantly with no browser prompt means the site already
            // has a saved "Block" decision for location — the browser won't
            // ask again until that's cleared in its own site settings.
            message:
              "Location is blocked for this site. Click the icon next to the address bar, set Location to Ask or Allow, then reload — or pick a neighborhood instead.",
          });
        } else if (error.code === error.TIMEOUT) {
          resolve({ status: "timeout", message: "Location request timed out." });
        } else {
          resolve({
            status: "unavailable",
            // No permission prompt + an immediate failure here usually means
            // OS-level location services are off, not a browser permission
            // issue — Chrome can't even ask before the OS blocks it.
            message:
              "Couldn't get your location — check that location services are turned on in Windows (Settings → Privacy & security → Location) and try again, or pick a neighborhood instead.",
          });
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  });
}
