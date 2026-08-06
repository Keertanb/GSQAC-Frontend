import React from "react";
import {
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { usePublicDocumentsQuery } from "../../../services/landingContentService";
import "./ImportantDocumentsSection.css";

/** Only renders when published documents exist — no empty placeholder. */
export function ImportantDocumentsSection() {
  const { data, isLoading } = usePublicDocumentsQuery();
  const items = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : [];

  if (isLoading || !items.length) {
    return null;
  }

  return (
    <section
      id="documents"
      className="id-section"
      aria-label="Important Documents"
    >
      <div className="id-section__inner">
        <header className="id-section__head">
          <p className="id-section__eyebrow">Resources</p>
          <h2>Important Documents</h2>
          <p>
            Official guidelines, circulars and reference files for schools and
            stakeholders.
          </p>
        </header>

        <div className="id-section__grid">
          {items.map((doc) => (
            <article key={doc.documentId} className="id-card">
              <div className="id-card__icon" aria-hidden>
                <DescriptionIcon />
              </div>
              <div className="id-card__body">
                <h3>{doc.title}</h3>
                {doc.description ? <p>{doc.description}</p> : null}
                <div className="id-card__actions">
                  {doc.fileUrl ? (
                    <>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="id-card__btn"
                      >
                        <VisibilityIcon fontSize="inherit" /> View
                      </a>
                      <a
                        href={doc.fileUrl}
                        download={doc.originalFileName || true}
                        className="id-card__btn id-card__btn--solid"
                      >
                        <DownloadIcon fontSize="inherit" /> Download
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
