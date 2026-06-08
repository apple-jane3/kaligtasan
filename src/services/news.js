import { NEWS } from "../config.js";
import { fetchEarthquakeNewsArticles } from "./news-feed.js";

const cache = new Map();
const useClientFeed = import.meta.env.BASE_URL !== "/";

export function buildNewsQuery(selectedPlace) {
  if (!selectedPlace) return NEWS.defaultQuery;

  const location = selectedPlace
    .split(",")[0]
    .replace(/^\d+\s*km\s*\w+\s*of\s*/i, "")
    .trim();

  return `${location} earthquake damage Philippines`;
}

async function fetchFromApi(query, signal, forceRefresh = false) {
  const url = `${NEWS.apiPath}?q=${encodeURIComponent(query)}${
    forceRefresh ? "&refresh=1" : ""
  }`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NEWS.timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `News feed unavailable (${response.status})`);
    }

    if (data.error) throw new Error(data.error);
    return (data.articles || []).slice(0, NEWS.maxArticles);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
}

export async function fetchEarthquakeNews(
  query = NEWS.defaultQuery,
  signal,
  { forceRefresh = false } = {}
) {
  const cacheKey = query.trim().toLowerCase();
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < NEWS.cacheTtlMs) {
      return cached.articles;
    }
  }

  const articles = useClientFeed
    ? await fetchEarthquakeNewsArticles(query, signal, { forceRefresh })
    : await fetchFromApi(query, signal, forceRefresh);

  if (!articles.length) {
    throw new Error("No news articles found. Try again later.");
  }

  cache.set(cacheKey, { timestamp: Date.now(), articles });
  return articles;
}
