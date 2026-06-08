import NewsArticle from "./NewsArticle.jsx";

export default function NewsPanel({
  articles,
  loading,
  error,
  queryLabel,
  onRefresh,
}) {
  return (
    <section className="panel">
      <p className="panel__intro">
        Earthquake damage and impact reports from Philippine and international
        news sources.
      </p>

      {queryLabel && (
        <p className="news-panel__context">
          Showing results for: <strong>{queryLabel}</strong>
        </p>
      )}

      <button
        type="button"
        className="btn btn--secondary btn--block"
        onClick={onRefresh}
        disabled={loading}
      >
        {loading ? "Loading news…" : "Refresh news"}
      </button>

      <div className="results news-results">
        {loading && articles.length === 0 && (
          <div className="results__state">Loading news articles…</div>
        )}
        {error && !loading && (
          <div className="results__state results__state--error">
            <p>{error}</p>
            <a
              className="news-panel__fallback"
              href={`https://news.google.com/search?q=${encodeURIComponent(
                queryLabel
                  ? `${queryLabel} earthquake damage Philippines`
                  : "earthquake damage Philippines"
              )}&hl=en-PH`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Search Google News
            </a>
          </div>
        )}
        {!error && articles.length > 0 && (
          <>
            <div className="results__summary">{articles.length} articles</div>
            <div className="results__list">
              {articles.map((article) => (
                <NewsArticle key={article.url} article={article} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
