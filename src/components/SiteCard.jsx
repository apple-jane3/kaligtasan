import { EVACUATION } from "../config.js";
import { formatDistance } from "../utils/geo.js";
import { buildDirectionsUrl } from "../services/evacuation.js";
import EvacCategoryIcon from "./EvacCategoryIcon.jsx";

export default function SiteCard({ site, index, originLat, originLon }) {
  const category = EVACUATION.categories[site.category];
  const directions = buildDirectionsUrl(originLat, originLon, site.lat, site.lon);

  return (
    <article className="site-card">
      <div className="site-card__header">
        <span className="site-card__rank">{index + 1}</span>
        <div>
          <h3 className="site-card__name">{site.name}</h3>
          <p className="site-card__type">
            <EvacCategoryIcon
              category={site.category}
              size={12}
              className="site-card__type-icon"
            />
            {category}
          </p>
        </div>
        <span className="site-card__distance">{formatDistance(site.distance)}</span>
      </div>
      {site.address && <p className="site-card__address">{site.address}</p>}
      {site.buildingDescription && (
        <p className="site-card__detail">{site.buildingDescription}</p>
      )}
      <a
        className="site-card__link"
        href={directions}
        target="_blank"
        rel="noopener noreferrer"
      >
        Walking directions
      </a>
    </article>
  );
}
