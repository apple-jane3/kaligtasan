const DEFAULT_QUERY = "earthquake philippines damage";
const MAX_ARTICLES = 30;
const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

const RSS_FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml", source: "BBC Asia", region: "asia" },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World", region: "world" },
  { url: "https://www.theguardian.com/world/rss", source: "The Guardian", region: "world" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera", region: "world" },
  { url: "http://rss.cnn.com/rss/edition_asia.rss", source: "CNN Asia", region: "asia" },
  { url: "https://www.rappler.com/feed/", source: "Rappler", region: "ph" },
  { url: "https://data.gmanetwork.com/gno/rss/news/nation/feed.xml", source: "GMA News", region: "ph" },
];

const GOOGLE_NEWS_QUERIES = (query) => [
  query,
  simplifyQuery(query),
  "earthquake Philippines damage",
  "earthquake Philippines casualties",
  "lindol pinsala Philippines",
  "PHIVOLCS earthquake",
  "Mindanao earthquake",
];

const cache = new Map();

export function parseRssItems(xml, defaultSource = null) {
  const articles = [];

  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate") || extractTag(block, "updated");
    const source = extractTag(block, "source");
    const description = extractTag(block, "description") || extractTag(block, "summary");

    if (title && link) {
      articles.push({
        title: decodeEntities(title),
        url: link.trim(),
        publishedAt: pubDate,
        source: source ? decodeEntities(source) : defaultSource,
        description: description ? stripHtml(decodeEntities(description)) : null,
      });
    }
  }

  return articles;
}

function extractTag(block, tag) {
  const match = block.match(
    new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tag}>`)
  );
  return match?.[1] || match?.[2] || null;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseGdeltDate(value) {
  if (!value || value.length < 8) return value;
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(9, 11) || "00";
  const minute = value.slice(11, 13) || "00";
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`).toISOString();
}

function parseArticleDate(value) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function simplifyQuery(query) {
  return query
    .replace(/\bOR\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildGdeltQuery(query) {
  const simplified = simplifyQuery(query);
  if (/philippines|pilipinas|lindol/i.test(simplified)) {
    return simplified;
  }
  return `${simplified} philippines`;
}

function extractSearchTerms(query) {
  return simplifyQuery(query)
    .toLowerCase()
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 3 &&
        ![
          "earthquake",
          "damage",
          "philippines",
          "pilipinas",
          "lindol",
          "pinsala",
          "casualties",
        ].includes(word)
    );
}

function isPhilippineEarthquakeNews(article, query, region = "world") {
  const text = `${article.title} ${article.description || ""}`.toLowerCase();
  const hasQuake =
    /earthquake|tremor|lindol|seismic|aftershock|magnitude|phivolcs|epicenter|richter/.test(
      text
    );
  const hasTsunamiPh =
    /tsunami/.test(text) &&
    /philippines|filipino|mindanao|surigao|davao|visayas|luzon/.test(text);

  if (!hasQuake && !hasTsunamiPh) return false;
  if (region === "ph") return hasQuake || hasTsunamiPh;

  const hasPh =
    /philippines|filipino|manila|cebu|davao|luzon|mindanao|visayas|quezon|baguio|surigao|bohol|leyte|mindoro|palawan|phivolcs|cotabato|davao/.test(
      text
    );
  if (hasPh && (hasQuake || hasTsunamiPh)) return true;

  const hasDamage =
    /damage|destroyed|collapsed|casualt|death|dead|injur|evacuat|rescue|rubble|devastat|destroyed/.test(
      text
    );
  if (hasQuake && hasDamage && /asia|pacific|southeast|asean/.test(text)) return true;

  const terms = extractSearchTerms(query);
  return hasQuake && terms.some((term) => text.includes(term));
}

function dedupeArticles(articles) {
  const seen = new Set();

  return articles.filter((article) => {
    const urlKey = article.url.replace(/#.*$/, "").toLowerCase();
    const titleKey = article.title.toLowerCase().replace(/\s+/g, " ").slice(0, 100);
    if (seen.has(urlKey) || seen.has(titleKey)) return false;
    seen.add(urlKey);
    seen.add(titleKey);
    return true;
  });
}

function isBrowserClient() {
  return typeof window !== "undefined";
}

function resolveFetchUrl(url) {
  if (!isBrowserClient()) return url;
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
}

function getGoogleNewsQueries(query) {
  const queries = GOOGLE_NEWS_QUERIES(query);
  return isBrowserClient() ? queries.slice(0, 3) : queries;
}

async function fetchText(url, timeoutMs = 12000, signal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(resolveFetchUrl(url), {
      headers: typeof window === "undefined" ? FETCH_HEADERS : { Accept: FETCH_HEADERS.Accept },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    return response.text();
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
}

async function fetchRssFeed({ url, source, region }, query, signal) {
  const xml = await fetchText(url, 12000, signal);
  return parseRssItems(xml, source).filter((article) =>
    isPhilippineEarthquakeNews(article, query, region)
  );
}

async function fetchGoogleNewsArticles(query, signal, timeoutMs = 8000) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-PH&gl=PH&ceid=PH:en`;
  const xml = await fetchText(rssUrl, timeoutMs, signal);
  return parseRssItems(xml, "Google News");
}

async function fetchGdeltArticles(query, signal) {
  const gdeltQuery = buildGdeltQuery(query);
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(gdeltQuery)}&mode=artlist&maxrecords=${MAX_ARTICLES}&format=json&sort=datedesc`;
  const response = await fetch(resolveFetchUrl(url), {
    headers: typeof window === "undefined" ? FETCH_HEADERS : { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`GDELT unavailable (${response.status})`);
  }

  const text = await response.text();
  if (text.startsWith("Please") || text.startsWith("<")) {
    throw new Error("GDELT rate limit reached");
  }

  const data = JSON.parse(text);
  return (data.articles || []).map((article) => ({
    title: article.title,
    url: article.url,
    publishedAt: parseGdeltDate(article.seendate),
    source: article.domain || "GDELT",
    description: null,
  }));
}

async function fetchAllSources(query, signal) {
  const tasks = [
    ...RSS_FEEDS.map((feed) => fetchRssFeed(feed, query, signal).catch(() => [])),
    ...getGoogleNewsQueries(query).map((searchQuery) =>
      fetchGoogleNewsArticles(searchQuery, signal).catch(() => [])
    ),
  ];

  if (!isBrowserClient()) {
    tasks.push(fetchGdeltArticles(query, signal).catch(() => []));
  }

  const results = await Promise.all(tasks);
  return dedupeArticles(results.flat());
}

export async function fetchEarthquakeNewsArticles(query = DEFAULT_QUERY, signal) {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

  const cacheKey = query.trim().toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.articles;
  }

  let articles = await fetchAllSources(query, signal);

  articles.sort(
    (a, b) => parseArticleDate(b.publishedAt) - parseArticleDate(a.publishedAt)
  );
  articles = articles.slice(0, MAX_ARTICLES);

  if (!articles.length) {
    throw new Error("No news articles found. Try again later.");
  }

  cache.set(cacheKey, { timestamp: Date.now(), articles });
  return articles;
}

export function createNewsApiMiddleware() {
  return async (req, res, next) => {
    if (!req.url?.startsWith("/api/news")) return next();

    try {
      const url = new URL(req.url, "http://localhost");
      const query = url.searchParams.get("q") || DEFAULT_QUERY;
      const articles = await fetchEarthquakeNewsArticles(query);
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ articles }));
    } catch (err) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err.message || "News feed failed" }));
    }
  };
}
