import EarthquakeCard from "./EarthquakeCard.jsx";

export default function EarthquakePanel({
  earthquakes,
  loading,
  error,
  selectedCode,
  onSelect,
}) {
  return (
    <section className="panel">
      <p className="panel__intro">
        Recent earthquakes in the Philippine Area of Responsibility (USGS).
      </p>
      <ul className="quake-list">
        {loading && <li className="results__state">Loading earthquakes…</li>}
        {error && (
          <li className="results__state results__state--error">{error}</li>
        )}
        {!loading &&
          !error &&
          earthquakes.map((event) => (
            <EarthquakeCard
              key={event.properties.code}
              event={event}
              active={selectedCode === event.properties.code}
              onSelect={onSelect}
              onOpenMap={(lat, lon) =>
                window.open(
                  `https://www.google.com/maps/place/@${lat},${lon},12z`,
                  "_blank"
                )
              }
              onOpenUsgs={(url) => window.open(url, "_blank")}
            />
          ))}
      </ul>
    </section>
  );
}
