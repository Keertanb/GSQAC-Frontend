import React, { useMemo, useEffect } from "react";
import { GRADING_LEGEND, getScoreBarColor } from "../../../../utils/assessmentGrading";
import emblemIndia from "../../../../assets/emblem_india.png";
import logoImage from "../../../../assets/logo_image.png";
import studentsBanner from "../../../../assets/students_image.jpeg";
import { buildReportPageList } from "../utils/reportPageUtils";

function ReportPageFrame({ pageRef, children, className = "" }) {
  return (
    <div className={`report-page-frame ${className}`} ref={pageRef}>
      <div className="report-page">{children}</div>
    </div>
  );
}

function StarRating({ count }) {
  if (!count) return null;
  return (
    <span className="report-stars" aria-label={`${count} stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="report-star">
          ★
        </span>
      ))}
    </span>
  );
}

function ProgressBar({ percentage, compact = false }) {
  const pct = Math.min(100, Math.max(0, Number(percentage) || 0));
  const display = pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(1)}%`;
  return (
    <div className={`report-progress ${compact ? "report-progress--compact" : ""}`}>
      <div
        className="report-progress__fill"
        style={{ width: `${pct}%`, backgroundColor: getScoreBarColor(pct) }}
      />
      <span className="report-progress__label">{display}</span>
    </div>
  );
}

function GradingLegend() {
  return (
    <div className="report-legend">
      {GRADING_LEGEND.map((item) => (
        <div key={item.label} className="report-legend__item" style={{ backgroundColor: item.color }}>
          <span>
            {item.label} : {item.grade}
            {item.stars ? ` ${item.stars}★` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReportHeader({ title }) {
  return (
    <div className="report-header">
      <img src={emblemIndia} alt="Emblem" className="report-header__logo report-header__logo--left" />
      <h1 className="report-header__title">{title}</h1>
      <img src={logoImage} alt="GSQAC" className="report-header__logo report-header__logo--right" />
    </div>
  );
}

function CoverPage({ report }) {
  const { school, summary, domains, strengths, improvements, academicYear } = report;
  const yearLabel = academicYear?.replace("-", " - ") || "2024 - 2025";

  return (
    <>
      <div className="report-cover-top">
        <img src={emblemIndia} alt="Emblem" className="report-cover-top__emblem" />
        <div className="report-cover-top__text">
          <p>ગુજરાત શૈક્ષણિક સંશોધન અને તાલીમ પરિષદ, ગાંધીનગર</p>
          <p>Gujarat School Quality Accreditation Council (GSQAC)</p>
        </div>
        <img src={logoImage} alt="GSQAC" className="report-cover-top__logo" />
      </div>

      <div
        className="report-cover-banner"
        style={{ backgroundImage: `url(${studentsBanner})` }}
      >
        <div className="report-cover-banner__title-band">
          <p>સ્કૂલ એક્રેડિટેશન (ગુણોત્સવ ૨.૦)</p>
          <p>સ્કૂલ રિપોર્ટ કાર્ડ: {yearLabel}</p>
        </div>
      </div>

      <h2 className="report-school-name">{school?.schoolName || "—"}</h2>

      <div className="report-summary-cards">
        <div className="report-summary-card">
          <p className="report-summary-card__label">શાળાનું પરિણામ</p>
          <div className="report-gauge">
            <span>{summary.overallPercentage?.toFixed(1)}%</span>
          </div>
        </div>
        <div className="report-summary-card">
          <p className="report-summary-card__label">ગ્રેડ</p>
          <div className="report-grade">{summary.grade}</div>
          <StarRating count={summary.stars} />
        </div>
        <div className="report-summary-card report-summary-card--details">
          <p>
            <strong>શાળાનો કોડ:</strong> {school?.schoolId || "—"}
          </p>
          <p>
            <strong>જિલ્લો:</strong> {school?.district || "—"}
          </p>
          <p>
            <strong>તાલુકો:</strong> {school?.taluka || "—"}
          </p>
          <p>
            <strong>ક્લસ્ટર:</strong> {school?.cluster || "—"}
          </p>
        </div>
      </div>

      <div className="report-page__body">
        <div className="report-chart-section">
          <h3>શાળાનું પરિણામ</h3>
          <div className="report-bar-chart">
            {(domains || []).map((domain) => (
              <div key={domain.domainId} className="report-bar-group">
                <div className="report-bar-group__bars">
                  <div
                    className="report-bar report-bar--school"
                    style={{ height: `${Math.max(8, domain.percentage || 0)}%` }}
                    title={`${domain.percentage}%`}
                  />
                </div>
                <p className="report-bar-group__label">{domain.domainName}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="report-insights">
          <div className="report-insight-box">
            <h4>શાળાની સારી બાબતો</h4>
            <p>
              <strong>મુખ્ય ક્ષેત્રો:</strong> {strengths?.mainDomain || "—"}
            </p>
            <p>
              <strong>પેટા ક્ષેત્રો:</strong>{" "}
              {strengths?.subDomains?.length ? strengths.subDomains.join(", ") : "—"}
            </p>
          </div>
          <div className="report-insight-box">
            <h4>શાળાની સુધારાત્મક બાબતો</h4>
            <p>
              <strong>મુખ્ય ક્ષેત્રો:</strong> {improvements?.mainDomain || "—"}
            </p>
            <p>
              <strong>પેટા ક્ષેત્રો:</strong>{" "}
              {improvements?.subDomains?.length ? improvements.subDomains.join(", ") : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="report-page__footer">
        <GradingLegend />
      </div>
    </>
  );
}

function SummaryTablePage({ report, rows, showTotal }) {
  const { summary, academicYear } = report;
  const yearLabel = academicYear?.replace("-", " - ") || "2024 - 2025";

  return (
    <>
      <ReportHeader title={`સ્કૂલ એક્રેડિટેશન રિપોર્ટ કાર્ડ ${yearLabel}`} />
      <div className="report-page__body">
        <table className="report-table report-table--summary">
          <thead>
            <tr>
              <th>ક્ષેત્ર</th>
              <th>કુલ ગુણ</th>
              <th>મેળવેલ ગુણ</th>
              <th>મેળવેલ ગુણ %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              if (row.rowType === "domain") {
                const { domain } = row;
                return (
                  <tr key={`domain-${domain.domainId}`} className="report-table__domain-row">
                    <td>
                      <strong>
                        મુખ્યક્ષેત્ર {domain.domainOrder}: {domain.domainName}
                      </strong>
                    </td>
                    <td>{domain.maxMarks}</td>
                    <td>{Number(domain.obtainedMarks).toFixed(1)}</td>
                    <td>
                      <span className="report-pill">{domain.percentage?.toFixed(1)}%</span>
                    </td>
                  </tr>
                );
              }

              const { domain, sub } = row;
              return (
                <tr key={`sub-${sub.subDomainId}`}>
                  <td className="report-table__subdomain">
                    પેટાક્ષેત્ર {domain.domainOrder}.{sub.subDomainOrder}: {sub.subDomainName}
                  </td>
                  <td>{sub.maxMarks}</td>
                  <td>{Number(sub.obtainedMarks).toFixed(1)}</td>
                  <td>
                    <span className="report-pill report-pill--light">{sub.percentage?.toFixed(1)}%</span>
                  </td>
                </tr>
              );
            })}
            {showTotal && (
              <tr className="report-table__total-row">
                <td>
                  <strong>એકંદર ગુણ</strong>
                </td>
                <td>
                  <strong>{summary.totalMaxMarks}</strong>
                </td>
                <td>
                  <strong>{Number(summary.totalObtained).toFixed(1)}</strong>
                </td>
                <td>
                  <span className="report-pill report-pill--overall">
                    {summary.overallPercentage?.toFixed(1)}%
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="report-page__footer">
        <GradingLegend />
      </div>
    </>
  );
}

function DomainDetailPage({ report, domain, showTotal, pageIndex }) {
  const yearLabel = report.academicYear?.replace("-", " - ") || "2024 - 2025";

  return (
    <>
      <ReportHeader title={`સ્કૂલ એક્રેડિટેશન રિપોર્ટ કાર્ડ ${yearLabel}`} />
      <div className="report-page__body">
        <table className="report-table report-table--detail">
          <thead>
            <tr>
              <th>ક્ષેત્રો</th>
              <th>મેળવેલ ગુણ %</th>
            </tr>
          </thead>
          <tbody>
            {pageIndex === 0 && (
              <tr className="report-table__domain-row">
                <td>
                  <strong>
                    મુખ્યક્ષેત્ર {domain.domainOrder}: {domain.domainName}
                  </strong>
                </td>
                <td>
                  <ProgressBar percentage={domain.percentage} />
                </td>
              </tr>
            )}
            {(domain.subDomains || []).map((sub) => (
              <React.Fragment key={`${sub.subDomainId}-${sub.questions?.[0]?.questionId || "sub"}`}>
                <tr className="report-table__subdomain-row">
                  <td>
                    <strong>
                      પેટાક્ષેત્ર {domain.domainOrder}.{sub.subDomainOrder}: {sub.subDomainName}
                    </strong>
                  </td>
                  <td>
                    <ProgressBar percentage={sub.percentage} />
                  </td>
                </tr>
                {(sub.questions || []).map((question) => (
                  <tr key={question.questionId} className="report-table__question-row">
                    <td>
                      ({domain.domainOrder}.{sub.subDomainOrder}.{question.qIndex + 1}){" "}
                      {question.questionText}
                    </td>
                    <td>
                      <ProgressBar percentage={question.percentage} compact />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {showTotal && (
              <tr className="report-table__total-row">
                <td>
                  <strong>કુલ</strong>
                </td>
                <td>
                  <ProgressBar percentage={domain.percentage} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="report-page__footer">
        <GradingLegend />
      </div>
    </>
  );
}

function renderPageContent(page) {
  switch (page.type) {
    case "cover":
      return <CoverPage report={page.report} />;
    case "summary":
      return (
        <SummaryTablePage
          report={page.report}
          rows={page.rows}
          showTotal={page.showTotal}
        />
      );
    case "domain-detail":
      return (
        <DomainDetailPage
          report={page.report}
          domain={page.domain}
          showTotal={page.showTotal}
          pageIndex={page.pageIndex}
        />
      );
    default:
      return null;
  }
}

export function ReportDocument({ report, pageRefs }) {
  const pages = useMemo(() => buildReportPageList(report), [report]);

  useEffect(() => {
    if (pageRefs?.current) {
      pageRefs.current.length = pages.length;
    }
  }, [pages.length, pageRefs]);

  if (!report) return null;

  return (
    <div className="report-document">
      {pages.map((page, index) => (
        <ReportPageFrame
          key={`${page.type}-${index}`}
          className={page.type === "cover" ? "report-page-frame--cover" : ""}
          pageRef={(el) => {
            pageRefs.current[index] = el;
          }}
        >
          {renderPageContent(page)}
        </ReportPageFrame>
      ))}
    </div>
  );
}
