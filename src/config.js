export const APP_NAME = "Kaligtasan";
export const APP_TAGLINE = "Philippine earthquake & evacuation tracker";
export const APP_VERSION = "v2.0";

export const USGS_API =
  "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=30&minlatitude=5&maxlatitude=25&minlongitude=115&maxlongitude=135";

export const PHILIPPINE_CENTER = [12.8797, 121.774, 6];

export const PH_LOCALE = "en-PH";
export const PH_TIMEZONE = "Asia/Manila";

export const PAR_POLYLINE = [
  [5, 115],
  [15, 115],
  [21, 120],
  [25, 120],
  [25, 135],
  [5, 135],
  [5, 115],
];

export const INTENSITY_COLORS = [
  undefined,
  "86AE59",
  "C0D731",
  "FFC20F",
  "F7941F",
  "F46F2C",
  "F0452B",
  "EA1C29",
  "D6186E",
  "A01252",
];

export const NOMINATIM = {
  reverse: "https://nominatim.openstreetmap.org/reverse",
  search: "https://nominatim.openstreetmap.org/search",
  headers: {
    Accept: "application/json",
    "Accept-Language": "en",
    "User-Agent": "kaligtasan-ph-earthquake/2.0",
  },
  timeoutMs: 10000,
  rateLimitMs: 1100,
};

export const EVACUATION = {
  defaultRadiusM: 5000,
  maxSites: 20,
  cacheTtlMs: 5 * 60 * 1000,
  categories: {
    assembly_point: "Assembly Point",
    shelter: "Evacuation Shelter",
    school: "School",
    hospital: "Hospital",
    place_of_worship: "Place of Worship",
    park: "Open Park",
  },
  buildingLabels: {
    school: "School building",
    hospital: "Hospital building",
    church: "Church",
    chapel: "Chapel",
    public: "Public building",
    civic: "Civic building",
  },
  amenitySearches: [
    ["school", "schools"],
    ["hospital", "hospitals"],
    ["place_of_worship", "places of worship"],
    ["shelter", "shelters"],
  ],
};

export const NEWS = {
  defaultQuery: "earthquake philippines damage",
  maxArticles: 30,
  cacheTtlMs: 10 * 60 * 1000,
  apiPath: "/api/news",
  timeoutMs: 35000,
};
