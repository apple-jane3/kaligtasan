import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import MapView from "./components/MapView.jsx";
import { EVACUATION, NEWS } from "./config.js";
import { isValidCoordinate } from "./utils/geo.js";
import { geocodeAddress, reverseGeocode } from "./services/nominatim.js";
import {
  fetchNearbyEvacuationSites,
  enrichSiteAddresses,
} from "./services/evacuation.js";
import { fetchRecentEarthquakes } from "./services/earthquakes.js";
import { buildNewsQuery, fetchEarthquakeNews } from "./services/news.js";

export default function App() {
  const [activeTab, setActiveTab] = useState("evacuate");
  const [address, setAddress] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lonInput, setLonInput] = useState("");
  const [radius, setRadius] = useState(EVACUATION.defaultRadiusM);
  const [status, setStatus] = useState("");
  const [statusError, setStatusError] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  const [sites, setSites] = useState([]);
  const [origin, setOrigin] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [pickMode, setPickMode] = useState(false);
  const [panTarget, setPanTarget] = useState(null);

  const [earthquakes, setEarthquakes] = useState([]);
  const [quakesLoading, setQuakesLoading] = useState(true);
  const [quakesError, setQuakesError] = useState("");
  const [selectedCode, setSelectedCode] = useState(null);

  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const abortRef = useRef(null);
  const requestIdRef = useRef(0);
  const newsAbortRef = useRef(null);

  const selectedEvent = useMemo(
    () => earthquakes.find((event) => event.properties.code === selectedCode) ?? null,
    [earthquakes, selectedCode]
  );

  const newsQuery = useMemo(
    () =>
      selectedEvent
        ? buildNewsQuery(selectedEvent.properties.place)
        : NEWS.defaultQuery,
    [selectedEvent]
  );

  const newsQueryLabel = useMemo(() => {
    if (!selectedEvent) return null;
    return selectedEvent.properties.place.split(",")[0];
  }, [selectedEvent]);

  useEffect(() => {
    fetchRecentEarthquakes()
      .then(setEarthquakes)
      .catch(() => setQuakesError("Could not load earthquake data."))
      .finally(() => setQuakesLoading(false));
  }, []);

  const setLocation = useCallback((lat, lon, label) => {
    setLatInput(lat.toFixed(5));
    setLonInput(lon.toFixed(5));
    if (label) setAddress(label);
    const loc = { lat, lon, label };
    setUserLocation(loc);
    setOrigin(loc);
    setStatus(label ? `Location: ${label}` : "Location set");
    setStatusError(false);
  }, []);

  const runEvacuationSearch = useCallback(
    async (lat, lon, radiusMeters, label) => {
      const requestId = ++requestIdRef.current;
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      setSearching(true);
      setLoading(true);
      setError("");
      setSites([]);
      setLoadingMessage(`Searching within ${radiusMeters / 1000} km…`);
      setPanTarget({ lat, lon, zoom: 14 });
      setLocation(lat, lon, label);

      try {
        const results = await fetchNearbyEvacuationSites(
          lat,
          lon,
          radiusMeters,
          signal,
          (msg) => setLoadingMessage(msg)
        );
        if (requestId !== requestIdRef.current || signal.aborted) return;

        setSites(results);
        setLoading(false);
        setStatus(label ? `Found sites near ${label}` : "Evacuation sites loaded");
        setSidebarOpen(false);

        enrichSiteAddresses(results, signal).then(() => {
          if (requestId !== requestIdRef.current || signal.aborted) return;
          setSites([...results]);
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        const message =
          String(err.message).includes("timed out")
            ? "Search timed out. Please try again."
            : err.message || "Search failed.";
        setError(message);
        setStatus(message);
        setStatusError(true);
        setLoading(false);
      } finally {
        if (requestId === requestIdRef.current) setSearching(false);
      }
    },
    [setLocation]
  );

  const resolveLocation = useCallback(async () => {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (isValidCoordinate(lat, lon)) {
      return { lat, lon, label: address.trim() };
    }
    const query = address.trim();
    if (!query) throw new Error("Enter your address or use My Location.");
    return geocodeAddress(query);
  }, [address, latInput, lonInput]);

  const handleSearch = useCallback(async () => {
    try {
      setStatus("Finding your location…");
      setStatusError(false);
      const location = await resolveLocation();
      await runEvacuationSearch(location.lat, location.lon, radius, location.label);
    } catch (err) {
      setStatus(err.message);
      setStatusError(true);
      setError(err.message);
    }
  }, [resolveLocation, runEvacuationSearch, radius]);

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("Geolocation not supported.");
      setStatusError(true);
      return;
    }
    setStatus("Getting GPS location…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const label = (await reverseGeocode(lat, lon)) || "My location";
        await runEvacuationSearch(lat, lon, radius, label);
      },
      () => {
        setStatus("Could not access location.");
        setStatusError(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [runEvacuationSearch, radius]);

  const handleMapPick = useCallback(() => {
    setPickMode((active) => {
      if (active) {
        setStatus("");
        return false;
      }
      setStatus("Click anywhere on the map.");
      setStatusError(false);
      setSidebarOpen(false);
      return true;
    });
  }, []);

  const handleMapPickClick = useCallback(
    async (lat, lon) => {
      setPickMode(false);
      const label = (await reverseGeocode(lat, lon)) || "Selected location";
      await runEvacuationSearch(lat, lon, radius, label);
    },
    [runEvacuationSearch, radius]
  );

  const handleEarthquakeSelect = useCallback(
    (code) => {
      const event = earthquakes.find((e) => e.properties.code === code);
      if (!event) return;
      const [lon, lat] = event.geometry.coordinates;
      setSelectedCode(code);
      setPanTarget({ lat, lon, zoom: 10, key: Date.now() });
      setActiveTab("earthquakes");
      setSidebarOpen(false);
    },
    [earthquakes]
  );

  const handleClearEarthquakeSelection = useCallback(() => {
    setSelectedCode(null);
  }, []);

  const loadNews = useCallback(async (forceRefresh = false) => {
    newsAbortRef.current?.abort();
    newsAbortRef.current = new AbortController();
    const { signal } = newsAbortRef.current;

    setNewsLoading(true);
    setNewsError("");

    try {
      const articles = await fetchEarthquakeNews(newsQuery, signal, { forceRefresh });
      setNewsArticles(articles);
    } catch (err) {
      if (err.name === "AbortError") return;
      setNewsError(err.message || "Could not load news.");
      setNewsArticles([]);
    } finally {
      setNewsLoading(false);
    }
  }, [newsQuery]);

  useEffect(() => {
    if (activeTab === "news") {
      loadNews();
    }
  }, [activeTab, loadNews]);

  useEffect(() => {
    if (!sidebarOpen || !window.matchMedia("(max-width: 768px)").matches) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 769px)");
    const onChange = () => {
      if (media.matches) setSidebarOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <div className={`app${sidebarOpen ? " app--sidebar-open" : ""}`}>
      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close menu"
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={() => setSidebarOpen(false)}
        evacuationProps={{
          address,
          lat: latInput,
          lon: lonInput,
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
          onAddressChange: setAddress,
          onLatChange: setLatInput,
          onLonChange: setLonInput,
          onRadiusChange: setRadius,
          onGeolocate: handleGeolocate,
          onMapPick: handleMapPick,
          onSearch: handleSearch,
        }}
        earthquakeProps={{
          earthquakes,
          loading: quakesLoading,
          error: quakesError,
          selectedCode,
          onSelect: handleEarthquakeSelect,
        }}
        newsProps={{
          articles: newsArticles,
          loading: newsLoading,
          error: newsError,
          queryLabel: newsQueryLabel,
          onRefresh: () => loadNews(true),
        }}
      />
      <MapView
        userLocation={userLocation}
        evacuationSites={sites}
        searchRadius={origin ? radius : 0}
        earthquakes={earthquakes}
        selectedCode={selectedCode}
        panTarget={panTarget}
        pickMode={pickMode}
        onMapPick={handleMapPickClick}
        onEarthquakeSelect={handleEarthquakeSelect}
        onClearSelection={handleClearEarthquakeSelection}
        originLat={origin?.lat}
        originLon={origin?.lon}
        onOpenSidebar={() => setSidebarOpen(true)}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
}
