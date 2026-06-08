import { USGS_API } from "../config.js";
import { fetchJson, timeoutPromise } from "../utils/http.js";

export async function fetchRecentEarthquakes() {
  const data = await Promise.race([
    fetchJson(USGS_API, {}, 15000),
    timeoutPromise(15),
  ]);
  return data.features || [];
}

