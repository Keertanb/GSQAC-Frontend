import React, { useMemo, useEffect } from "react";
import { GRADING_LEGEND } from "../../../../utils/assessmentGrading";
import emblemIndia from "../../../../assets/emblem_india.png";
import gsqacLogo from "../../../../assets/gsqac_new_logo.png";
import {
  formatYearLabel,
  formatRoundLabel,
  formatMarks,
  formatPercent,
  getPerformanceTier,
  computeReportStats,
  getDomainAccent,
  getScoreBarColor,
} from "../../../school-dashboard/report-generation/utils/reportHelpers";
import { buildAdminMonitorReportPages } from "../utils/adminMonitorReportPages";
import "../AdminMonitorReport.css";

function ReportPageFrame({ pageRef, children, className = "" }) {
  return (
    <div className={`amr-frame ${className}`} ref={pageRef}>
      <div className="amr-page">{children}</div>
    </div>
  );
}

function PageFooter({ pageNumber, totalPages }) {
  return (
    <footer className="amr-footer">
      <span>Gujarat School Quality Accreditation Council · GSQAC</span>
      <span>
        Page {pageNumber} of {totalPages}
      </span>
    </footer>
  );
}

function ReportHeader({ title, subtitle }) {
  return (
    <header className="amr-header">
      <div className="amr-header__brand">
        <img src={emblemIndia} alt="" className="amr-header__logo" />
        <div className="amr-header__titles">
          <p className="amr-header__org">
            Gujarat Council of Educational Research and Training
          </p>
          <h1 className="amr-header__title">{title}</h1>
          {subtitle && <p className="amr-header__subtitle">{subtitle}</p>}
        </div>
        <img src={gsqacLogo} alt="GSQAC" className="amr-header__logo amr-header__logo--gsqac" />
      </div>
    </header>
  );
}

function CoverPage({ report, pageNumber, totalPages }) {
  const { school, summary, domains, strengths, improvements, academicYear, round } =
    report;
  const yearLabel = formatYearLabel(academicYear);
  const roundLabel = formatRoundLabel(round);
  const stats = useMemo(() => computeReportStats(report), [report]);
  const pct = Math.min(100, Math.max(0, Number(summary?.overallPercentage) || 0));
  const scoreColor = getScoreBarColor(pct);

  return (
    <>
      <ReportHeader
        title="School Self-Assessment Report"
        subtitle={`Academic Year ${yearLabel}${roundLabel ? ` · ${roundLabel}` : ""}`}
      />
      <div className="amr-body amr-body--cover">
        <div className="amr-school-strip">
          <div className="amr-school-strip__primary">
            <span className="amr-label">School Name</span>
            <strong>{school?.schoolName || "—"}</strong>
          </div>
          <div className="amr-school-strip__meta">
            <div>
              <span className="amr-label">UDISE</span>
              <strong>{school?.schoolId || "—"}</strong>
            </div>
            <div>
              <span className="amr-label">District</span>
              <strong>{school?.district || "—"}</strong>
            </div>
            <div>
              <span className="amr-label">Taluka</span>
              <strong>{school?.taluka || "—"}</strong>
            </div>
            <div>
              <span className="amr-label">Cluster</span>
              <strong>{school?.cluster || "—"}</strong>
            </div>
          </div>
        </div>

        <div className="amr-score-panel">
          <div className="amr-score-panel__main" style={{ borderColor: scoreColor }}>
            <span className="amr-label">Overall Score</span>
            <strong className="amr-score-panel__pct" style={{ color: scoreColor }}>
              {pct.toFixed(1)}%
            </strong>
            <span className="amr-score-panel__grade">
              Grade {summary?.grade || "—"}
              {summary?.stars > 0 ? ` · ${"★".repeat(summary.stars)}` : ""}
            </span>
          </div>
          <div className="amr-score-panel__stats">
            <div>
              <span className="amr-label">Marks Obtained</span>
              <strong>{formatMarks(summary?.totalObtained)}</strong>
            </div>
            <div>
              <span className="amr-label">Maximum Marks</span>
              <strong>{formatMarks(summary?.totalMaxMarks)}</strong>
            </div>
            <div>
              <span className="amr-label">Domains</span>
              <strong>{stats.domainCount}</strong>
            </div>
            <div>
              <span className="amr-label">Sub-domains</span>
              <strong>{stats.subdomainCount}</strong>
            </div>
            <div>
              <span className="amr-label">Report Date</span>
              <strong>{stats.generatedOn}</strong>
            </div>
          </div>
        </div>

        <section className="amr-section">
          <h2 className="amr-section__title">Domain Performance Overview</h2>
          <div className="amr-domain-bars">
            {(domains || []).map((domain, index) => {
              const accent = getDomainAccent(domain.domainOrder || index + 1);
              const domainPct = Math.min(
                100,
                Math.max(0, Number(domain.percentage) || 0),
              );
              return (
                <div key={domain.domainId} className="amr-domain-bar">
                  <div className="amr-domain-bar__head">
                    <span className="amr-domain-bar__name">{domain.domainName}</span>
                    <span className="amr-domain-bar__pct" style={{ color: accent }}>
                      {formatPercent(domainPct)}
                    </span>
                  </div>
                  <div className="amr-domain-bar__track">
                    <div
                      className="amr-domain-bar__fill"
                      style={{ width: `${domainPct}%`, backgroundColor: accent }}
                    />
                  </div>
                  <div className="amr-domain-bar__meta">
                    <span>Weight {domain.weightage}%</span>
                    <span>
                      {formatMarks(domain.obtainedMarks)}/{formatMarks(domain.maxMarks)} marks
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="amr-insight-row">
          <div className="amr-insight amr-insight--strength">
            <h3>Strengths</h3>
            <p className="amr-insight__domain">{strengths?.mainDomain || "—"}</p>
            {strengths?.mainDomainPercentage != null && (
              <p className="amr-insight__pct">
                {formatPercent(strengths.mainDomainPercentage)}
              </p>
            )}
            {strengths?.subDomains?.length > 0 && (
              <p className="amr-insight__subs">{strengths.subDomains.join(", ")}</p>
            )}
          </div>
          <div className="amr-insight amr-insight--improve">
            <h3>Areas for Improvement</h3>
            <p className="amr-insight__domain">{improvements?.mainDomain || "—"}</p>
            {improvements?.mainDomainPercentage != null && (
              <p className="amr-insight__pct">
                {formatPercent(improvements.mainDomainPercentage)}
              </p>
            )}
            {improvements?.subDomains?.length > 0 && (
              <p className="amr-insight__subs">{improvements.subDomains.join(", ")}</p>
            )}
          </div>
        </div>
      </div>
      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </>
  );
}

function PerformancePage({
  report,
  rows,
  showOverview,
  showInsights,
  pageNumber,
  totalPages,
}) {
  const { summary, academicYear, round } = report;
  const yearLabel = formatYearLabel(academicYear);
  const roundLabel = formatRoundLabel(round);

  return (
    <>
      <ReportHeader
        title="Domain & Sub-domain Performance"
        subtitle={`Detailed score breakdown · ${yearLabel}${roundLabel ? ` · ${roundLabel}` : ""}`}
      />
      <div className="amr-body">
        {showOverview && (
          <div className="amr-kpi-row">
            <div>
              <span className="amr-label">Overall</span>
              <strong>{formatPercent(summary?.overallPercentage)}</strong>
            </div>
            <div>
              <span className="amr-label">Grade</span>
              <strong>{summary?.grade || "—"}</strong>
            </div>
            <div>
              <span className="amr-label">Total Marks</span>
              <strong>
                {formatMarks(summary?.totalObtained)}/{formatMarks(summary?.totalMaxMarks)}
              </strong>
            </div>
          </div>
        )}

        <table className="amr-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Sub-domain</th>
              <th className="amr-num">Marks</th>
              <th className="amr-num">Score %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && pageNumber === 3 && (
              <tr>
                <td colSpan={5} className="amr-table__empty">
                  All performance details are shown on the previous page.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              if (row.rowType === "domain") {
                const tier = getPerformanceTier(row.percentage);
                return (
                  <tr key={`d-${row.domainId}`} className="amr-table__domain-row">
                    <td colSpan={2}>
                      <strong>{row.domainName}</strong>
                      <span className="amr-table__weight">Weight {row.weightage}%</span>
                    </td>
                    <td className="amr-num">
                      {formatMarks(row.obtainedMarks)}/{formatMarks(row.maxMarks)}
                    </td>
                    <td className="amr-num amr-num--emphasis">
                      {formatPercent(row.percentage)}
                    </td>
                    <td>
                      <span className={`amr-status amr-status--${tier.tone}`}>
                        {tier.label}
                      </span>
                    </td>
                  </tr>
                );
              }

              const tier = getPerformanceTier(row.percentage);
              return (
                <tr key={`s-${row.subDomainId}`} className="amr-table__sub-row">
                  <td className="amr-table__domain-ref">{row.domainName}</td>
                  <td>{row.subDomainName}</td>
                  <td className="amr-num">
                    {formatMarks(row.obtainedMarks)}/{formatMarks(row.maxMarks)}
                  </td>
                  <td className="amr-num">{formatPercent(row.percentage)}</td>
                  <td>
                    <span className={`amr-status amr-status--${tier.tone}`}>
                      {tier.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {showInsights && (
          <div className="amr-grading-block">
            <h3 className="amr-section__title amr-section__title--sm">
              Grading Reference
            </h3>
            <div className="amr-grading-grid">
              {GRADING_LEGEND.map((item) => (
                <div key={item.label} className="amr-grading-item">
                  <span
                    className="amr-grading-item__swatch"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="amr-grading-item__grade">{item.grade}</span>
                  <span className="amr-grading-item__label">{item.label}</span>
                </div>
              ))}
            </div>
            <p className="amr-disclaimer">
              This report is generated from the school&apos;s submitted self-assessment
              under the GSQAC framework. Scores reflect domain and sub-domain level
              performance only.
            </p>
          </div>
        )}
      </div>
      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </>
  );
}

function renderPageContent(page) {
  switch (page.type) {
    case "cover":
      return (
        <CoverPage
          report={page.report}
          pageNumber={page.pageNumber}
          totalPages={page.totalPages}
        />
      );
    case "performance":
      return (
        <PerformancePage
          report={page.report}
          rows={page.rows}
          showOverview={page.showOverview}
          showInsights={page.showInsights}
          pageNumber={page.pageNumber}
          totalPages={page.totalPages}
        />
      );
    default:
      return null;
  }
}

export function AdminMonitorReportDocument({
  report,
  pageRefs,
  pdfCapture = false,
  screenPreview = false,
}) {
  const pages = useMemo(() => buildAdminMonitorReportPages(report), [report]);

  useEffect(() => {
    if (pageRefs?.current) {
      pageRefs.current.length = pages.length;
    }
  }, [pages.length, pageRefs]);

  if (!report) return null;

  const docClass = [
    "amr-document",
    pdfCapture ? "amr-document--pdf-capture" : "",
    screenPreview ? "amr-document--screen-preview" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={docClass}>
      {pages.map((page, index) => (
        <ReportPageFrame
          key={`${page.type}-${index}`}
          pageRef={
            pageRefs
              ? (el) => {
                  pageRefs.current[index] = el;
                }
              : undefined
          }
        >
          {renderPageContent(page)}
        </ReportPageFrame>
      ))}
    </div>
  );
}
