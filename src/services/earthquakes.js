import { USGS_API } from "../config.js";
import { fetchJson, timeoutPromise } from "../utils/http.js";

export async function fetchRecentEarthquakes() {
  const data = await Promise.race([
    fetchJson(USGS_API, {}, 15000),
    timeoutPromise(15),
  ]);
  return data.features || [];
}

export function computeMagnitudeIconSize(magnitude) {
  if (magnitude < 4) return [50, 50];
  const MAX = 500;
  const BASE = 50;
  const factor = (MAX - BASE) * (Math.log10(magnitude) / 10);
  return [50 + factor, 50 + factor];
}
