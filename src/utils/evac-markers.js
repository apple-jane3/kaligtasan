import L from "leaflet";
import { EVACUATION } from "../config.js";

const MARKER_PATHS = {
  school:
    '<path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z"/>',
  hospital:
    '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>',
  place_of_worship:
    '<path d="M18 12h-2V8h2V6h-2V4h-2v2h-2V4h-2v2H8V4H6v2H4v2h2v4H4v2h2v4h12v-4h2v-2zm-4 4h-4v-4h4v4z"/>',
  shelter:
    '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"/>',
  assembly_point:
    '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>',
  park:
    '<path d="M12 2C9.24 2 7 4.24 7 7c0 2.09 1.24 3.88 3 4.72V22h4v-10.28c1.76-.84 3-2.63 3-4.72 0-2.76-2.24-5-5-5z"/>',
};

const MARKER_COLORS = {
  school: "#2563eb",
  hospital: "#dc2626",
  place_of_worship: "#7c3aed",
  shelter: "#16a34a",
  assembly_point: "#ea580c",
  park: "#059669",
};

export const EVAC_MARKER_TYPES = Object.keys(MARKER_PATHS);

const iconCache = new Map();

function buildSvg(path, size = 16) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">${path}</svg>`;
}

export function getEvacMarkerConfig(category) {
  const key = MARKER_PATHS[category] ? category : "shelter";
  return {
    category: key,
    color: MARKER_COLORS[key],
    label: EVACUATION.categories[key],
    path: MARKER_PATHS[key],
  };
}

export function createEvacMarkerIcon(category) {
  const { category: key, color, path } = getEvacMarkerConfig(category);
  if (iconCache.has(key)) return iconCache.get(key);

  const icon = L.divIcon({
    className: "evac-marker-wrap",
    html: `<div class="evac-marker evac-marker--${key}" style="--evac-color:${color}" title="">
      <span class="evac-marker__icon">${buildSvg(path)}</span>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -28],
  });

  iconCache.set(key, icon);
  return icon;
}

export function renderEvacMarkerSvg(category, size = 16) {
  const { path } = getEvacMarkerConfig(category);
  return buildSvg(path, size);
}
