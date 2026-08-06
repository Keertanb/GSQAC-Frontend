import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Campaign as CampaignIcon,
  School as SchoolIcon,
  Star as StarIcon,
  Groups as GroupsIcon,
  AutoAwesome as AutoAwesomeIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { usePublicNewsQuery } from "../../../services/landingContentService";
import "./LatestNewsSection.css";

const INTERVAL_MS = 6000;

const CARD_ICONS = [
  { Icon: SchoolIcon, tone: "mint" },
  { Icon: StarIcon, tone: "amber" },
  { Icon: GroupsIcon, tone: "lavender" },
  { Icon: AutoAwesomeIcon, tone: "sky" },
];

function formatNewsDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function useVisibleCount() {
  const [count, setCount] = useState(4);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      if (width < 640) setCount(1);
      else if (width < 900) setCount(2);
      else if (width < 1200) setCount(3);
      else setCount(4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

export function LatestNewsSection() {
  const { data, isLoading } = usePublicNewsQuery();
  const items = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : [];
  const visibleCount = useVisibleCount();
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(items.length / visibleCount));

  useEffect(() => {
    setPage(0);
  }, [items.length, visibleCount]);

  useEffect(() => {
    if (pageCount <= 1) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setPage((p) => (p + 1) % pageCount);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [pageCount]);

  const visibleItems = useMemo(() => {
    const start = page * visibleCount;
    return items.slice(start, start + visibleCount);
  }, [items, page, visibleCount]);

  if (isLoading || !items.length) {
    return null;
  }

  const goPrev = () => setPage((p) => (p === 0 ? pageCount - 1 : p - 1));
  const goNext = () => setPage((p) => (p + 1) % pageCount);

  return (
    <div id="news" className="ln-ref" aria-label="Latest News & Updates">
      <div className="ln-ref__panel">
        <header className="ln-ref__head">
          <h2 className="ln-ref__title">
            <CampaignIcon className="ln-ref__title-icon" aria-hidden />
            Latest News &amp; Updates
          </h2>
          <div className="ln-ref__tools">
            {items.length > visibleCount ? (
              <button
                type="button"
                className="ln-ref__view-all"
                onClick={goNext}
              >
                View All
              </button>
            ) : null}
            {pageCount > 1 ? (
              <div className="ln-ref__nav">
                <button
                  type="button"
                  aria-label="Previous news"
                  onClick={goPrev}
                >
                  <ChevronLeftIcon fontSize="small" />
                </button>
                <button
                  type="button"
                  aria-label="Next news"
                  onClick={goNext}
                >
                  <ChevronRightIcon fontSize="small" />
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div
          className="ln-ref__track"
          role="region"
          aria-roledescription="carousel"
        >
          {visibleItems.map((item, i) => {
            const absoluteIndex = page * visibleCount + i;
            const { Icon, tone } = CARD_ICONS[absoluteIndex % CARD_ICONS.length];
            const dateLabel = formatNewsDate(item.createdAt || item.updatedAt);

            return (
              <article key={item.newsId} className="ln-ref__card">
                <div className={`ln-ref__icon ln-ref__icon--${tone}`} aria-hidden>
                  {item.imageUrl ? (
                    <span
                      className="ln-ref__thumb"
                      style={{ backgroundImage: `url(${item.imageUrl})` }}
                    />
                  ) : (
                    <Icon fontSize="inherit" />
                  )}
                </div>
                <div className="ln-ref__body">
                  <h3>{item.title}</h3>
                  {item.description ? <p>{item.description}</p> : null}
                  <div className="ln-ref__footer">
                    {item.linkUrl ? (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ln-ref__more"
                      >
                        Read More <ArrowForwardIcon fontSize="inherit" />
                      </a>
                    ) : (
                      <span className="ln-ref__more ln-ref__more--muted">
                        Update
                      </span>
                    )}
                    {dateLabel ? (
                      <time className="ln-ref__date" dateTime={item.createdAt}>
                        {dateLabel}
                      </time>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
