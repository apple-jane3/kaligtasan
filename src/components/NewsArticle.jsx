import { formatNewsDate } from "../utils/html.js";

export default function NewsArticle({ article }) {
  return (
    <article className="news-card">
      <a
        className="news-card__link"
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <h3 className="news-card__title">{article.title}</h3>
        {article.description && (
          <p className="news-card__summary">{article.description}</p>
        )}
        <p className="news-card__meta">
          {article.source && <span>{article.source}</span>}
          {article.source && article.publishedAt && <span> · </span>}
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>{formatNewsDate(article.publishedAt)}</time>
          )}
        </p>
      </a>
    </article>
  );
}
