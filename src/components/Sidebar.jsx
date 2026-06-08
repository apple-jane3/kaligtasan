import { APP_NAME, APP_TAGLINE, APP_VERSION } from "../config.js";
import EvacuationPanel from "./EvacuationPanel.jsx";
import EarthquakePanel from "./EarthquakePanel.jsx";
import NewsPanel from "./NewsPanel.jsx";
import { brand } from "../assets/index.js";

export default function Sidebar({
  activeTab,
  onTabChange,
  onClose,
  evacuationProps,
  earthquakeProps,
  newsProps,
}) {
  return (
    <aside className="sidebar" id="app-sidebar">
      <header className="sidebar__header">
        <img className="sidebar__logo" src={brand.logo} alt={`${APP_NAME} logo`} />
        <div className="sidebar__header-text">
          <h1 className="sidebar__title">{APP_NAME}</h1>
          <p className="sidebar__subtitle">{APP_TAGLINE}</p>
        </div>
        <button
          type="button"
          className="sidebar__close"
          onClick={onClose}
          aria-label="Close menu"
        >
          ×
        </button>
      </header>

      <nav className="sidebar__nav" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "evacuate"}
          className={`nav-tab${activeTab === "evacuate" ? " nav-tab--active" : ""}`}
          onClick={() => onTabChange("evacuate")}
        >
          Find shelters
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "earthquakes"}
          className={`nav-tab${activeTab === "earthquakes" ? " nav-tab--active" : ""}`}
          onClick={() => onTabChange("earthquakes")}
        >
          Earthquakes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "news"}
          className={`nav-tab${activeTab === "news" ? " nav-tab--active" : ""}`}
          onClick={() => onTabChange("news")}
        >
          News
        </button>
      </nav>

      <div className="sidebar__content">
        {activeTab === "evacuate" ? (
          <EvacuationPanel {...evacuationProps} />
        ) : activeTab === "earthquakes" ? (
          <EarthquakePanel {...earthquakeProps} />
        ) : (
          <NewsPanel {...newsProps} />
        )}
      </div>

      <footer className="sidebar__footer">
        <p>{APP_VERSION}</p>
        <p className="sidebar__credit">Data: USGS · OpenStreetMap · Google News</p>
      </footer>
    </aside>
  );
}
