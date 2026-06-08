import { getEvacMarkerConfig, renderEvacMarkerSvg } from "../utils/evac-markers.js";

export default function EvacCategoryIcon({ category, size = 16, className = "" }) {
  const { color, label, category: key } = getEvacMarkerConfig(category);
  const containerSize = size + 8;

  return (
    <span
      className={`evac-category-icon evac-category-icon--${key}${className ? ` ${className}` : ""}`}
      style={{ "--evac-color": color, width: containerSize, height: containerSize }}
      title={label}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: renderEvacMarkerSvg(key, size) }}
    />
  );
}
