import { EVACUATION } from "../config.js";
import { haversineDistance, getCacheKey } from "../utils/geo.js";
import { searchEvacuationAmenities, reverseGeocode } from "./nominatim.js";
import { sleep } from "../utils/http.js";
import { NOMINATIM } from "../config.js";

const cache = new Map();

function getSiteCenter(element) {
  if (element.type === "node") return { lat: element.lat, lon: element.lon };
  if (element.center) return { lat: element.center.lat, lon: element.center.lon };
  return null;
}

function formatAddress(tags) {
  if (tags["addr:full"]) return tags["addr:full"];
  const parts = [];
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:suburb"]) parts.push(tags["addr:suburb"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:province"]) parts.push(tags["addr:province"]);
  return parts.length ? parts.join(", ") : null;
}

function getCategory(tags) {
  if (tags.emergency === "assembly_point") return "assembly_point";
  if (tags.amenity === "shelter") return "shelter";
  if (tags.amenity === "school") return "school";
  if (tags.amenity === "hospital") return "hospital";
  if (tags.amenity === "place_of_worship") return "place_of_worship";
  if (tags.leisure === "park") return "park";
  return "shelter";
}

function parseSite(element, originLat, originLon) {
  const center = getSiteCenter(element);
  if (!center) return null;
  const tags = element.tags || {};
  const category = getCategory(tags);
  const buildingParts = [];
  if (tags.building && tags.building !== "yes") {
    buildingParts.push(
      EVACUATION.buildingLabels[tags.building] || tags.building.replace(/_/g, " ")
    );
  }
  if (tags["building:levels"]) buildingParts.push(`${tags["building:levels"]} floors`);

  return {
    osmId: element.id,
    osmType: element.type,
    name:
      tags.name ||
      tags["name:en"] ||
      EVACUATION.categories[category] ||
      "Evacuation Site",
    category,
    subtype: tags["school:type"]?.replace(/_/g, " ") || null,
    buildingDescription: buildingParts.join(" · ") || null,
    address: formatAddress(tags),
    lat: center.lat,
    lon: center.lon,
    distance: haversineDistance(originLat, originLon, center.lat, center.lon),
  };
}

function dedupeSites(sites) {
  const kept = [];
  for (const site of sites) {
    const duplicate = kept.find(
      (existing) =>
        existing.name.toLowerCase() === site.name.toLowerCase() ||
        (Math.abs(existing.lat - site.lat) < 0.0004 &&
          Math.abs(existing.lon - site.lon) < 0.0004)
    );
    if (!duplicate) kept.push(site);
  }
  return kept;
}

export async function fetchNearbyEvacuationSites(
  lat,
  lon,
  radiusMeters,
  signal,
  onStatus
) {
  const cacheKey = getCacheKey(lat, lon, radiusMeters);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < EVACUATION.cacheTtlMs) {
    return cached.sites.map((site) => ({
      ...site,
      distance: haversineDistance(lat, lon, site.lat, site.lon),
    }));
  }

  const elements = await searchEvacuationAmenities(
    lat,
    lon,
    radiusMeters,
    signal,
    onStatus
  );

  const sites = [];
  for (const element of elements) {
    const site = parseSite(element, lat, lon);
    if (!site || site.distance > radiusMeters) continue;
    sites.push(site);
  }

  const results = dedupeSites(sites)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, EVACUATION.maxSites);

  if (!results.length) {
    throw new Error("No evacuation sites found. Try increasing the search radius.");
  }

  cache.set(cacheKey, { timestamp: Date.now(), sites: results });
  return results;
}

export async function enrichSiteAddresses(sites, signal) {
  const pending = sites.filter((site) => !site.address).slice(0, 3);
  for (const site of pending) {
    if (signal?.aborted) return;
    await sleep(NOMINATIM.rateLimitMs);
    try {
      site.address = await reverseGeocode(site.lat, site.lon);
    } catch (err) {
      console.warn(err);
    }
  }
}

export function buildDirectionsUrl(originLat, originLon, destLat, destLon) {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${destLat},${destLon}&travelmode=walking`;
}

export function buildOsmUrl(site) {
  return `https://www.openstreetmap.org/${site.osmType}/${site.osmId}`;
}
