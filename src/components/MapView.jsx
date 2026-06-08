import { Fragment, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  PHILIPPINE_CENTER,
  PAR_POLYLINE,
  EVACUATION,
  INTENSITY_COLORS,
} from "../config.js";
import { formatDistance } from "../utils/geo.js";
import { formatDateTime } from "../utils/html.js";
import {
  buildDirectionsUrl,
  buildOsmUrl,
} from "../services/evacuation.js";
import {
  createEvacMarkerIcon,
  getEvacMarkerConfig,
  EVAC_MARKER_TYPES,
  renderEvacMarkerSvg,
} from "../utils/evac-markers.js";
import {
  createQuakeMarkerIcon,
  renderEpicenterSvg,
} from "../utils/quake-markers.js";

const userIcon = L.divIcon({
  className: "user-location-marker",
  html: '<div class="user-location-marker__pin"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function getQuakeColor(magnitude) {
  return `#${INTENSITY_COLORS[Math.floor(magnitude)] || "EA1C29"}`;
}

function estimateImpactRadiusM(magnitude) {
  return Math.min(120000, Math.max(12000, 10 ** ((magnitude - 3.2) * 0.62) * 6000));
}

function createPulseIcon(color) {
  return L.divIcon({
    className: "quake-pulse-marker",
    html: `<div class="quake-pulse" style="--pulse-color:${color}">
      <span class="quake-pulse__ring"></span>
      <span class="quake-pulse__ring"></span>
      <span class="quake-pulse__ring"></span>
    </div>`,
    iconSize: [240, 240],
    iconAnchor: [120, 120],
  });
}

function PanTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lon], target.zoom ?? 13, {
      animate: true,
      duration: 1.4,
      easeLinearity: 0.25,
    });
  }, [target, map]);
  return null;
}

function MapClickHandler({ active, onPick }) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().style.cursor = active ? "crosshair" : "";
  }, [active, map]);

  useMapEvents({
    click(e) {
      if (active) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function SitePopup({ site, originLat, originLon }) {
  const category = EVACUATION.categories[site.category];
  const mapsUrl = buildDirectionsUrl(originLat, originLon, site.lat, site.lon);
  const osmUrl = buildOsmUrl(site);

  return (
    <Popup>
      <strong>{site.name}</strong>
      <br />
      {category} · {formatDistance(site.distance)} away
      {site.buildingDescription && (
        <>
          <br />
          {site.buildingDescription}
        </>
      )}
      {site.address && (
        <>
          <br />
          {site.address}
        </>
      )}
      <br />
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
        Directions
      </a>
      {" · "}
      <a href={osmUrl} target="_blank" rel="noopener noreferrer">
        Map data
      </a>
    </Popup>
  );
}

function MapQuakeInfo({ event, onDismiss }) {
  if (!event) return null;

  const { mag, magType, place, time, tsunami } = event.properties;
  const [, , depth] = event.geometry.coordinates;
  const color = getQuakeColor(mag);

  return (
    <div
      className="map-quake-info"
      style={{ "--mag-color": color }}
      key={event.properties.code}
    >
      <div className="map-quake-info__mag" style={{ background: color }}>
        {mag}
        <span>{magType}</span>
      </div>
      <div className="map-quake-info__body">
        <p className="map-quake-info__place">{place}</p>
        <p className="map-quake-info__meta">
          {formatDateTime(time)} · {depth} km deep
          {tsunami ? " · Tsunami warning" : ""}
        </p>
      </div>
      <button
        type="button"
        className="map-quake-info__close"
        onClick={onDismiss}
        aria-label="Clear selection"
      >
        ×
      </button>
    </div>
  );
}

export default function MapView({
  userLocation,
  evacuationSites,
  searchRadius,
  earthquakes,
  selectedCode,
  panTarget,
  pickMode,
  onMapPick,
  onEarthquakeSelect,
  onClearSelection,
  originLat,
  originLon,
}) {
  const [lat, lon, zoom] = PHILIPPINE_CENTER;
  const hasSelection = Boolean(selectedCode);

  const selectedEvent = useMemo(
    () => earthquakes.find((event) => event.properties.code === selectedCode),
    [earthquakes, selectedCode]
  );

  return (
    <div className="map-wrap">
      <MapContainer center={[lat, lon]} zoom={zoom} className="map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://www.usgs.gov/">USGS</a>'
        />
        <Polyline
          positions={PAR_POLYLINE}
          pathOptions={{
            color: "#e53e3e",
            weight: 1,
            opacity: 0.45,
            dashArray: "6 4",
          }}
        />

        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lon]}
              icon={userIcon}
              zIndexOffset={1000}
            >
              <Popup>{userLocation.label || "Your location"}</Popup>
            </Marker>
            {searchRadius > 0 && (
              <Circle
                center={[userLocation.lat, userLocation.lon]}
                radius={searchRadius}
                pathOptions={{
                  color: "#3182ce",
                  fillColor: "#4299e1",
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: "6 4",
                }}
              />
            )}
          </>
        )}

        {evacuationSites.map((site) => (
          <Marker
            key={`${site.osmType}-${site.osmId}`}
            position={[site.lat, site.lon]}
            icon={createEvacMarkerIcon(site.category)}
          >
            {originLat != null && originLon != null && (
              <SitePopup site={site} originLat={originLat} originLon={originLon} />
            )}
          </Marker>
        ))}

        {earthquakes.map((event) => {
          const [eqLon, eqLat] = event.geometry.coordinates;
          const { mag, magType, title, place, code } = event.properties;
          const isSelected = selectedCode === code;
          const isDimmed = hasSelection && !isSelected;
          const color = getQuakeColor(mag);
          const impactRadius = estimateImpactRadiusM(mag);

          return (
            <Fragment key={code}>
              {isSelected && (
                <>
                  <Marker
                    position={[eqLat, eqLon]}
                    icon={createPulseIcon(color)}
                    interactive={false}
                    zIndexOffset={200}
                  />
                  <Circle
                    center={[eqLat, eqLon]}
                    radius={impactRadius}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.07,
                      weight: 2,
                      opacity: 0.55,
                      dashArray: "10 8",
                      className: "quake-impact-zone",
                    }}
                  />
                </>
              )}
              <Marker
                position={[eqLat, eqLon]}
                icon={createQuakeMarkerIcon(mag, {
                  selected: isSelected,
                  dimmed: isDimmed,
                  color,
                })}
                title={`${mag}${magType} - ${place}`}
                zIndexOffset={isSelected ? 600 : 0}
                eventHandlers={{ click: () => onEarthquakeSelect(code) }}
              >
                <Popup>{title}</Popup>
              </Marker>
            </Fragment>
          );
        })}

        <PanTo target={panTarget} />
        <MapClickHandler active={pickMode} onPick={onMapPick} />
      </MapContainer>

      <MapQuakeInfo event={selectedEvent} onDismiss={onClearSelection} />

      <div className={`map-legend${evacuationSites.length ? " map-legend--with-evac" : ""}`}>
        <span>
          <i className="legend-dot legend-dot--you" /> Your location
        </span>
        <span>
          <i
            className="legend-quake-icon"
            dangerouslySetInnerHTML={{ __html: renderEpicenterSvg(12) }}
          />{" "}
          Epicenter
        </span>
        {selectedEvent && (
          <span className="map-legend__selected">
            <i className="legend-dot legend-dot--selected" /> Selected quake
          </span>
        )}
        {evacuationSites.length > 0 &&
          EVAC_MARKER_TYPES.map((type) => {
            const { color, label } = getEvacMarkerConfig(type);
            return (
              <span key={type} className="map-legend__evac">
                <i
                  className={`legend-evac-icon legend-evac-icon--${type}`}
                  style={{ "--evac-color": color }}
                  dangerouslySetInnerHTML={{ __html: renderEvacMarkerSvg(type, 10) }}
                />
                {label}
              </span>
            );
          })}
      </div>
    </div>
  );
}
