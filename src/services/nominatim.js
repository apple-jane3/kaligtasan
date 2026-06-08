import { EVACUATION, NOMINATIM } from "../config.js";
import { fetchJson, fetchWithTimeout, sleep } from "../utils/http.js";

export async function geocodeAddress(query) {
  const url = `${NOMINATIM.search}?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ph`;
  const results = await fetchJson(url, { headers: NOMINATIM.headers }, NOMINATIM.timeoutMs);
  if (!results.length) {
    throw new Error("No matching location found in the Philippines.");
  }
  const [result] = results;
  return {
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    label: result.display_name,
  };
}

export async function reverseGeocode(lat, lon) {
  const url = `${NOMINATIM.reverse}?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=18`;
  const response = await fetchWithTimeout(
    url,
    { headers: NOMINATIM.headers },
    NOMINATIM.timeoutMs
  );
  if (!response.ok) return null;
  const data = await response.json();
  const address = data.address || {};
  const parts = [];
  if (address.road) parts.push(address.road);
  if (address.suburb || address.neighbourhood || address.village) {
    parts.push(address.suburb || address.neighbourhood || address.village);
  }
  if (address.city || address.municipality || address.town) {
    parts.push(address.city || address.municipality || address.town);
  }
  if (address.state) parts.push(address.state);
  if (parts.length) return parts.join(", ");
  return data.display_name?.split(",").slice(0, 4).join(",").trim() || null;
}

export async function searchEvacuationAmenities(lat, lon, radiusMeters, signal, onStatus) {
  const delta = (radiusMeters / 111320) * 1.15;
  const viewbox = [lon - delta, lat + delta, lon + delta, lat - delta].join(",");
  const elements = [];

  for (const [amenity, label] of EVACUATION.amenitySearches) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    onStatus?.(`Searching nearby ${label}…`);
    await sleep(NOMINATIM.rateLimitMs);

    const url = `${NOMINATIM.search}?amenity=${encodeURIComponent(amenity)}&format=json&viewbox=${viewbox}&bounded=1&limit=15&addressdetails=1`;
    try {
      const response = await fetchWithTimeout(
        url,
        { headers: NOMINATIM.headers },
        NOMINATIM.timeoutMs,
        signal
      );
      if (!response.ok) continue;
      const results = await response.json();
      for (const result of results) {
        const addr = result.address || {};
        elements.push({
          type: "node",
          id: result.osm_id || result.place_id,
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          tags: {
            amenity,
            name: result.name || result.display_name?.split(",")[0],
            "addr:street": addr.road,
            "addr:city": addr.city || addr.town || addr.municipality,
            "addr:suburb": addr.suburb || addr.neighbourhood,
            "addr:province": addr.state,
          },
        });
      }
    } catch (err) {
      if (err.name === "AbortError") throw err;
      console.warn(`Nominatim ${amenity} search failed:`, err.message || err);
    }
  }
  return elements;
}
