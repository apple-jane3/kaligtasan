import { useState } from "react";
import SiteCard from "./SiteCard.jsx";

export default function EvacuationPanel({
  address,
  lat,
  lon,
  radius,
  status,
  statusError,
  loading,
  loadingMessage,
  error,
  sites,
  origin,
  searching,
  pickMode,
  onAddressChange,
  onLatChange,
  onLonChange,
  onRadiusChange,
  onGeolocate,
  onMapPick,
  onSearch,
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <section className="panel">
      <p className="panel__intro">
        Set <strong>your location</strong>, then find the nearest schools,
        hospitals, and shelters to evacuate to.
      </p>

      <div className="action-row">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onGeolocate}
          disabled={searching}
        >
          Use my location
        </button>
        <button
          type="button"
          className={`btn btn--secondary${pickMode ? " btn--active" : ""}`}
          onClick={onMapPick}
          disabled={searching}
        >
          {pickMode ? "Cancel pick" : "Pick on map"}
        </button>
      </div>

      <label className="field">
        <span className="field__label">Address or place</span>
        <input
          type="text"
          className="field__input"
          placeholder="e.g. Quezon City Hall"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          autoComplete="address-line1"
        />
      </label>

      <button
        type="button"
        className="link-btn"
        aria-expanded={advancedOpen}
        onClick={() => setAdvancedOpen((open) => !open)}
      >
        Advanced: enter coordinates
      </button>

      {advancedOpen && (
        <div className="advanced-panel">
          <div className="field-row">
            <label className="field">
              <span className="field__label">Latitude</span>
              <input
                type="text"
                className="field__input"
                placeholder="14.6760"
                inputMode="decimal"
                value={lat}
                onChange={(e) => onLatChange(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Longitude</span>
              <input
                type="text"
                className="field__input"
                placeholder="121.0437"
                inputMode="decimal"
                value={lon}
                onChange={(e) => onLonChange(e.target.value)}
              />
            </label>
          </div>
        </div>
      )}

      <label className="field">
        <span className="field__label">Search radius</span>
        <select
          className="field__input"
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
        >
          <option value={2000}>2 km</option>
          <option value={5000}>5 km</option>
          <option value={8000}>8 km</option>
        </select>
      </label>

      <button
        type="button"
        className="btn btn--accent btn--block"
        onClick={onSearch}
        disabled={searching}
      >
        {searching ? "Searching…" : "Find evacuation sites"}
      </button>

      {status && (
        <p className={`status${statusError ? " status--error" : ""}`} role="status">
          {status}
        </p>
      )}

      <div className="results">
        {loading && (
          <div className="results__state">{loadingMessage || "Searching…"}</div>
        )}
        {error && !loading && (
          <div className="results__state results__state--error">{error}</div>
        )}
        {!loading && !error && sites.length > 0 && origin && (
          <>
            <div className="results__summary">{sites.length} nearest sites</div>
            <div className="results__list">
              {sites.map((site, index) => (
                <SiteCard
                  key={`${site.osmType}-${site.osmId}`}
                  site={site}
                  index={index}
                  originLat={origin.lat}
                  originLon={origin.lon}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
