import React from "react";
import {
  Download as DownloadIcon,
  OpenInNew as OpenInNewIcon,
  FolderOpen as FolderOpenIcon,
} from "@mui/icons-material";
import { usePublicDocumentsQuery } from "../../../services/landingContentService";
import "./ImportantDocumentsSection.css";

function getFileMeta(doc) {
  const name = `${doc.originalFileName || doc.fileName || ""}`.toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() : "";

  if (ext === "pdf") return { label: "PDF", tone: "pdf" };
  if (["doc", "docx"].includes(ext)) return { label: "DOC", tone: "doc" };
  if (["xls", "xlsx", "csv"].includes(ext)) return { label: "XLS", tone: "xls" };
  if (["ppt", "pptx"].includes(ext)) return { label: "PPT", tone: "ppt" };
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return { label: "IMG", tone: "img" };
  return { label: "FILE", tone: "file" };
}

function getDisplayFileName(doc) {
  return doc.originalFileName || doc.fileName || "";
}

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
          <span className="id-section__kicker">
            <FolderOpenIcon fontSize="inherit" /> Resources
          </span>
          <h2>Important Documents</h2>
          <p>
            Official guidelines, circulars and reference files for schools and
            stakeholders.
          </p>
        </header>

        <div className="id-section__panel">
          <div className="id-section__panel-bar">
            <span>{items.length} {items.length === 1 ? "file" : "files"}</span>
            <span>View online or download</span>
          </div>

          <ul className="id-section__list">
            {items.map((doc) => {
              const meta = getFileMeta(doc);
              const fileName = getDisplayFileName(doc);

              return (
                <li key={doc.documentId} className="id-row">
                  <div className={`id-row__type id-row__type--${meta.tone}`} aria-hidden>
                    {meta.label}
                  </div>

                  <div className="id-row__body">
                    <h3>{doc.title}</h3>
                    {doc.description ? <p>{doc.description}</p> : null}
                    {fileName ? <small>{fileName}</small> : null}
                  </div>

                  {doc.fileUrl ? (
                    <div className="id-row__actions">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="id-row__btn"
                      >
                        <OpenInNewIcon fontSize="inherit" />
                        View
                      </a>
                      <a
                        href={doc.fileUrl}
                        download={doc.originalFileName || true}
                        className="id-row__btn id-row__btn--primary"
                      >
                        <DownloadIcon fontSize="inherit" />
                        Download
                      </a>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
