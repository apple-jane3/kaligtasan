import L from "leaflet";

const iconCache = new Map();

export function computeQuakeMarkerSize(magnitude) {
  if (magnitude < 4) return 32;
  return Math.min(48, Math.round(32 + (magnitude - 4) * 3));
}

/**
 * Earthquake epicenter glyph: surface rupture point (filled dot) with an
 * eight-ray shock star and outer seismic wave ring.
 */
function buildEpicenterSvg(size = 18) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.25" stroke-width="1.3" opacity="0.45"/>
    <path stroke-width="2.1" d="M12 2.5V6.5M12 17.5V21.5M2.5 12H6.5M17.5 12H21.5"/>
    <path stroke-width="1.85" opacity="0.9" d="M5.1 5.1L7.8 7.8M16.2 16.2L18.9 18.9M18.9 5.1L16.2 7.8M7.8 16.2L5.1 18.9"/>
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
  </svg>`;
}

export function renderEpicenterSvg(size = 16) {
  return buildEpicenterSvg(size);
}

export function createQuakeMarkerIcon(magnitude, { selected, dimmed, color } = {}) {
  const size = computeQuakeMarkerSize(magnitude);
  const iconSize = Math.round(size * 0.54);
  const cacheKey = `${size}-${color}-${selected}-${dimmed}`;

  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey);

  const className = [
    "quake-marker",
    selected && "quake-marker--selected",
    dimmed && "quake-marker--dimmed",
  ]
    .filter(Boolean)
    .join(" ");

  const pulseStyle = selected ? ` style="--pulse-color:${color}"` : "";

  const icon = L.divIcon({
    className,
    html: `<div class="quake-marker__pin" style="--quake-color:${color};--quake-size:${size}px"${pulseStyle}>
      <span class="quake-marker__icon">${buildEpicenterSvg(iconSize)}</span>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });

  iconCache.set(cacheKey, icon);
  return icon;
}
