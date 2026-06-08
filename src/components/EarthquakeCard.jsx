import { useEffect, useRef, useState } from "react";
import { INTENSITY_COLORS } from "../config.js";
import { formatDateTime } from "../utils/html.js";

export default function EarthquakeCard({
  event,
  active,
  onSelect,
  onOpenMap,
  onOpenUsgs,
}) {
  const cardRef = useRef(null);
  const [pulsing, setPulsing] = useState(false);
  const { mag, magType, place, tsunami, time, code, url } = event.properties;
  const color = INTENSITY_COLORS[Math.floor(mag)] || "EA1C29";
  const [lon, lat, depth] = event.geometry.coordinates;

  useEffect(() => {
    if (active && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [active]);

  useEffect(() => {
    if (!pulsing) return;
    const id = window.setTimeout(() => setPulsing(false), 450);
    return () => window.clearTimeout(id);
  }, [pulsing]);

  const handleSelect = () => {
    setPulsing(true);
    onSelect(code);
  };

  return (
    <li
      ref={cardRef}
      className={`quake-card${active ? " quake-card--active" : ""}${pulsing ? " quake-card--pulse" : ""}`}
      style={{ "--mag-color": `#${color}` }}
      onClick={handleSelect}
      onKeyDown={(e) => e.key === "Enter" && handleSelect()}
      role="button"
      tabIndex={0}
    >
      <div className="quake-card__mag" style={{ background: `#${color}` }}>
        {mag}
        <span>{magType}</span>
      </div>
      <div className="quake-card__body">
        <h3 className="quake-card__place">{place}</h3>
        <p className="quake-card__meta">
          {formatDateTime(time)} · {depth} km deep
        </p>
        <p
          className={`quake-card__tsunami${tsunami ? " quake-card__tsunami--warn" : ""}`}
        >
          {tsunami ? "Tsunami warning" : "No tsunami warning"}
        </p>
        <div className="quake-card__actions">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMap(lat, lon);
            }}
          >
            Map
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenUsgs(url);
            }}
          >
            Details
          </button>
        </div>
      </div>
    </li>
  );
}
