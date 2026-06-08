/**
 * Optional Cloudflare Worker for live RSS fetching on GitHub Pages.
 * Deploy with: npx wrangler deploy
 * Then set VITE_NEWS_PROXY_URL in GitHub Actions to your worker URL.
 */
export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const requestUrl = new URL(request.url);
    const target = requestUrl.searchParams.get("url");
    if (!target) {
      return new Response("Missing url parameter", { status: 400 });
    }

    const response = await fetch(target, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, application/json, */*",
        "User-Agent":
          "Mozilla/5.0 (compatible; Kaligtasan/2.0; +https://apple-jane3.github.io/kaligtasan/)",
      },
    });

    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  },
};
