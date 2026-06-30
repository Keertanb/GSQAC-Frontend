import React, { useMemo, useEffect } from "react";
import { GRADING_LEGEND } from "../../../../utils/assessmentGrading";
import emblemIndia from "../../../../assets/emblem_india.png";
import logoImage from "../../../../assets/logo_image.png";
import studentsBanner from "../../../../assets/students_image.jpeg";
import { buildReportPageList } from "../utils/reportPageUtils";
import {
  formatYearLabel,
  formatMarks,
  formatPercent,
  getPerformanceTier,
  computeReportStats,
  getDomainAccent,
  getScoreBarColor,
} from "../utils/reportHelpers";

function ReportPageFrame({ pageRef, children, className = "" }) {
  return (
    <div className={`rpt-frame ${className}`} ref={pageRef}>
      <div className="rpt-page">{children}</div>
    </div>
  );
}

function PageFooter({ pageNumber, totalPages, compact = false }) {
  return (
    <footer className={`rpt-footer ${compact ? "rpt-footer--compact" : ""}`}>
      {!compact && (
        <div className="rpt-legend">
          {GRADING_LEGEND.map((item) => (
            <span key={item.label} className="rpt-legend__chip" style={{ backgroundColor: item.color }}>
              {item.grade}
              {item.stars ? `·${item.stars}★` : ""} {item.label}
            </span>
          ))}
        </div>
      )}
      <div className="rpt-footer__meta">
        <span>GSQAC · Gunotsav 2.0</span>
        <span>Page {pageNumber} / {totalPages}</span>
      </div>
    </footer>
  );
}

function CoverScoreBand({ summary, stats }) {
  const pct = Math.min(100, Math.max(0, Number(summary?.overallPercentage) || 0));
  const color = getScoreBarColor(pct);

  return (
    <table className="rpt-cover-score-band">
      <tbody>
        <tr>
          <td className="rpt-cover-score-band__primary" style={{ borderColor: color }}>
            <span className="rpt-cover-score-band__label">એકંદર સ્કોર</span>
            <span className="rpt-cover-score-band__value" style={{ color }}>{pct.toFixed(1)}%</span>
          </td>
          <td className="rpt-cover-score-band__cell">
            <span className="rpt-cover-score-band__label">ગ્રેડ</span>
            <span className="rpt-cover-score-band__grade">{summary?.grade || "—"}</span>
            {summary?.stars > 0 && (
              <span className="rpt-cover-score-band__stars">{"★".repeat(summary.stars)}</span>
            )}
          </td>
          <td className="rpt-cover-score-band__cell">
            <span className="rpt-cover-score-band__label">મેળવેલ ગુણ</span>
            <span className="rpt-cover-score-band__stat">{formatMarks(summary?.totalObtained)}</span>
          </td>
          <td className="rpt-cover-score-band__cell">
            <span className="rpt-cover-score-band__label">કુલ ગુણ</span>
            <span className="rpt-cover-score-band__stat">{formatMarks(summary?.totalMaxMarks)}</span>
          </td>
          <td className="rpt-cover-score-band__cell">
            <span className="rpt-cover-score-band__label">પ્રશ્નો</span>
            <span className="rpt-cover-score-band__stat">{stats.answeredQuestions}/{stats.totalQuestions}</span>
          </td>
          <td className="rpt-cover-score-band__cell rpt-cover-score-band__cell--date">
            <span className="rpt-cover-score-band__label">રિપોર્ટ તારીખ</span>
            <span className="rpt-cover-score-band__stat rpt-cover-score-band__stat--sm">{stats.generatedOn}</span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function PageHeader({ sectionTag, title, subtitle, pageNumber, totalPages }) {
  return (
    <header className="rpt-page-header">
      <table className="rpt-page-header__table">
        <tbody>
          <tr>
            <td className="rpt-page-header__accent" />
            <td className="rpt-page-header__main">
              {sectionTag && <span className="rpt-page-header__tag">{sectionTag}</span>}
              <strong className="rpt-page-header__title">{title}</strong>
              {subtitle && <span className="rpt-page-header__subtitle">{subtitle}</span>}
            </td>
            <td className="rpt-page-header__page">
              <span className="rpt-page-header__page-label">પૃષ્ઠ</span>
              <strong>{pageNumber}</strong>
              <small>/ {totalPages}</small>
            </td>
          </tr>
        </tbody>
      </table>
    </header>
  );
}

function DomainTable({ domains }) {
  return (
    <table className="rpt-compact-table rpt-compact-table--domains">
      <thead>
        <tr>
          <th>ક્ષેત્ર</th>
          <th>વજન</th>
          <th>માર્ક્સ</th>
          <th>%</th>
          <th>સ્થિતિ</th>
        </tr>
      </thead>
      <tbody>
        {(domains || []).map((domain) => {
          const tier = getPerformanceTier(domain.percentage);
          const accent = getDomainAccent(domain.domainOrder);
          return (
            <tr key={domain.domainId}>
              <td>
                <span className="rpt-num-badge" style={{ backgroundColor: accent }}>{domain.domainOrder}</span>
                <span className="rpt-domain-name">{domain.domainName}</span>
              </td>
              <td className="rpt-num">{domain.weightage}%</td>
              <td className="rpt-num">{formatMarks(domain.obtainedMarks)}/{formatMarks(domain.maxMarks)}</td>
              <td className="rpt-num rpt-num--bold" style={{ color: accent }}>{formatPercent(domain.percentage)}</td>
              <td><span className={`rpt-tier rpt-tier--${tier.tone}`}>{tier.label}</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function InsightCard({ title, tone, mainDomain, mainPct, subDomains }) {
  return (
    <div className={`rpt-insight rpt-insight--${tone}`}>
      <h4>{title}</h4>
      <table className="rpt-insight-table">
        <tbody>
          <tr>
            <td>મુખ્ય ક્ષેત્ર</td>
            <td>
              <strong>{mainDomain || "—"}</strong>
              {mainPct != null && <span className="rpt-num"> ({formatPercent(mainPct)})</span>}
            </td>
          </tr>
          <tr>
            <td>પેટા ક્ષેત્રો</td>
            <td>{subDomains?.length ? subDomains.join(", ") : "—"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CoverPage({ report, pageNumber, totalPages }) {
  const { school, summary, domains, strengths, improvements, academicYear } = report;
  const yearLabel = formatYearLabel(academicYear);
  const stats = useMemo(() => computeReportStats(report), [report]);

  return (
    <>
      <div className="rpt-hero">
        <div
          className="rpt-hero__bg"
          style={{ backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.93), rgba(30,64,175,0.88)), url(${studentsBanner})` }}
        />
        <div className="rpt-hero__content">
          <table className="rpt-hero__table">
            <tbody>
              <tr>
                <td className="rpt-hero__logo-cell">
                  <img src={emblemIndia} alt="" className="rpt-hero__logo" />
                </td>
                <td className="rpt-hero__center">
                  <p className="rpt-hero__org">ગુજરાત શૈક્ષણિક સંશોધન અને તાલીમ પરિષદ · GSQAC</p>
                  <h1>સ્કૂલ એક્રેડિટેશન રિપોર્ટ કાર્ડ</h1>
                  <p className="rpt-hero__year">શૈક્ષણિક વર્ષ {yearLabel}</p>
                </td>
                <td className="rpt-hero__logo-cell">
                  <img src={logoImage} alt="" className="rpt-hero__logo" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rpt-page__body rpt-page__body--cover">
        <CoverScoreBand summary={summary} stats={stats} />

        <table className="rpt-school-header-table">
          <tbody>
            <tr>
              <td className="rpt-school-header-table__name">
                <small>શાળાનું નામ</small>
                <strong>{school?.schoolName || "—"}</strong>
              </td>
              <td className="rpt-school-header-table__meta">
                <div><small>UDISE</small><strong>{school?.schoolId || "—"}</strong></div>
              </td>
              <td className="rpt-school-header-table__meta">
                <div><small>જિલ્લો</small><strong>{school?.district || "—"}</strong></div>
              </td>
              <td className="rpt-school-header-table__meta">
                <div><small>તાલુકો</small><strong>{school?.taluka || "—"}</strong></div>
              </td>
              <td className="rpt-school-header-table__meta">
                <div><small>ક્લસ્ટર</small><strong>{school?.cluster || "—"}</strong></div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="rpt-block">
          <h3 className="rpt-block__title">ક્ષેત્રવાર પ્રદર્શન</h3>
          <DomainTable domains={domains} />
        </div>

        <table className="rpt-insight-grid-table">
          <tbody>
            <tr>
              <td>
                <InsightCard
                  title="શક્તિઓ"
                  tone="strength"
                  mainDomain={strengths?.mainDomain}
                  mainPct={strengths?.mainDomainPercentage}
                  subDomains={strengths?.subDomains}
                />
              </td>
              <td>
                <InsightCard
                  title="સુધારણાના ક્ષેત્રો"
                  tone="improve"
                  mainDomain={improvements?.mainDomain}
                  mainPct={improvements?.mainDomainPercentage}
                  subDomains={improvements?.subDomains}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <PageFooter pageNumber={pageNumber} totalPages={totalPages} compact />
    </>
  );
}

function SummaryTablePage({ report, rows, showTotal, showOverview, pageNumber, totalPages }) {
  const { summary, academicYear } = report;
  const yearLabel = formatYearLabel(academicYear);
  const stats = useMemo(() => computeReportStats(report), [report]);

  return (
    <>
      <PageHeader
        sectionTag="સારાંશ"
        title="સ્કોર સારાંશ"
        subtitle={`Score Summary · શૈક્ષણિક વર્ષ ${yearLabel}`}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
      <div className="rpt-page__body">
        {showOverview && (
          <table className="rpt-mini-kpi-table">
            <tbody>
              <tr>
                <td><small>એકંદર</small><strong className="rpt-num">{formatPercent(summary.overallPercentage)}</strong></td>
                <td><small>ગ્રેડ</small><strong>{summary.grade}</strong></td>
                <td><small>ક્ષેત્રો</small><strong className="rpt-num">{stats.domainCount}</strong></td>
                <td><small>પેટા ક્ષેત્રો</small><strong className="rpt-num">{stats.subdomainCount}</strong></td>
                <td><small>શ્રેષ્ઠ</small><strong>{stats.topDomain?.domainName || "—"}</strong></td>
                <td><small>સુધારણા</small><strong>{stats.lowestDomain?.domainName || "—"}</strong></td>
              </tr>
            </tbody>
          </table>
        )}

        <table className="rpt-compact-table rpt-compact-table--summary">
          <thead>
            <tr>
              <th>ક્ષેત્ર</th>
              <th>વજન</th>
              <th>કુલ</th>
              <th>મેળવેલ</th>
              <th>%</th>
              <th>વજનયુક્ત</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              if (row.rowType === "domain") {
                const { domain } = row;
                const accent = getDomainAccent(domain.domainOrder);
                return (
                  <tr key={`domain-${domain.domainId}`} className="rpt-row-domain">
                    <td>
                      <span className="rpt-num-badge" style={{ backgroundColor: accent }}>{domain.domainOrder}</span>
                      <span className="rpt-domain-name">{domain.domainName}</span>
                    </td>
                    <td className="rpt-num">{domain.weightage}%</td>
                    <td className="rpt-num">{domain.maxMarks}</td>
                    <td className="rpt-num">{formatMarks(domain.obtainedMarks)}</td>
                    <td className="rpt-num rpt-num--bold" style={{ color: accent }}>{formatPercent(domain.percentage)}</td>
                    <td className="rpt-num">{formatMarks(domain.weightedScore)}</td>
                  </tr>
                );
              }
              const { domain, sub } = row;
              return (
                <tr key={`sub-${sub.subDomainId}`} className="rpt-row-sub">
                  <td className="rpt-sub-name">{domain.domainOrder}.{sub.subDomainOrder} · {sub.subDomainName}</td>
                  <td />
                  <td className="rpt-num">{sub.maxMarks}</td>
                  <td className="rpt-num">{formatMarks(sub.obtainedMarks)}</td>
                  <td className="rpt-num">{formatPercent(sub.percentage)}</td>
                  <td className="rpt-num">—</td>
                </tr>
              );
            })}
            {showTotal && (
              <tr className="rpt-row-total">
                <td colSpan={2}><strong>એકંદર ગુણ</strong></td>
                <td className="rpt-num"><strong>{summary.totalMaxMarks}</strong></td>
                <td className="rpt-num"><strong>{formatMarks(summary.totalObtained)}</strong></td>
                <td className="rpt-num"><strong>{formatPercent(summary.overallPercentage)}</strong></td>
                <td className="rpt-num"><strong>{formatPercent(summary.overallPercentage)}</strong></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </>
  );
}

function DomainDetailPage({ report, domain, showTotal, pageIndex, pageNumber, totalPages }) {
  const yearLabel = formatYearLabel(report.academicYear);
  const accent = getDomainAccent(domain.domainOrder);

  return (
    <>
      <PageHeader
        sectionTag={`ક્ષેત્ર ${domain.domainOrder}`}
        title={domain.domainName}
        subtitle={`Domain Detail · વજન ${domain.weightage}% · ${yearLabel}`}
        pageNumber={pageNumber}
        totalPages={totalPages}
      />
      <div className="rpt-page__body">
        {pageIndex === 0 && (
          <table className="rpt-domain-header-table">
            <tbody>
              <tr>
                <td className="rpt-domain-header-table__score" style={{ color: accent }}>{formatPercent(domain.percentage)}</td>
                <td><small>મેળવેલ</small><strong className="rpt-num">{formatMarks(domain.obtainedMarks)}/{formatMarks(domain.maxMarks)}</strong></td>
                <td><small>વજનયુક્ત</small><strong className="rpt-num">{formatMarks(domain.weightedScore)}</strong></td>
                <td><small>પ્રશ્નો</small><strong className="rpt-num">{domain.questionCount || 0}</strong></td>
              </tr>
            </tbody>
          </table>
        )}

        {(domain.subDomains || []).map((sub) => (
          <div key={sub.subDomainId} className="rpt-block rpt-block--tight">
            <table className="rpt-sub-header-table">
              <tbody>
                <tr>
                  <td><strong>{domain.domainOrder}.{sub.subDomainOrder} · {sub.subDomainName}</strong></td>
                  <td className="rpt-num">{formatMarks(sub.obtainedMarks)}/{formatMarks(sub.maxMarks)}</td>
                  <td className="rpt-num rpt-num--bold" style={{ color: accent }}>{formatPercent(sub.percentage)}</td>
                </tr>
              </tbody>
            </table>
            <table className="rpt-compact-table rpt-compact-table--questions">
              <tbody>
                {(sub.questions || []).map((question) => (
                  <tr key={question.questionId}>
                    <td className="rpt-q-num">{domain.domainOrder}.{sub.subDomainOrder}.{question.qIndex + 1}</td>
                    <td className="rpt-q-text">{question.questionText}</td>
                    <td className="rpt-num">{formatMarks(question.obtainedMarks)}/{question.maxMarks}</td>
                    <td className="rpt-num rpt-num--bold">{formatPercent(question.percentage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {showTotal && (
          <table className="rpt-domain-total-table">
            <tbody>
              <tr>
                <td>ક્ષેત્ર કુલ સ્કોર</td>
                <td className="rpt-num rpt-num--bold" style={{ color: accent }}>{formatPercent(domain.percentage)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </>
  );
}

function renderPageContent(page) {
  switch (page.type) {
    case "cover":
      return <CoverPage report={page.report} pageNumber={page.pageNumber} totalPages={page.totalPages} />;
    case "summary":
      return (
        <SummaryTablePage
          report={page.report}
          rows={page.rows}
          showTotal={page.showTotal}
          showOverview={page.showOverview}
          pageNumber={page.pageNumber}
          totalPages={page.totalPages}
        />
      );
    case "domain-detail":
      return (
        <DomainDetailPage
          report={page.report}
          domain={page.domain}
          showTotal={page.showTotal}
          pageIndex={page.pageIndex}
          pageNumber={page.pageNumber}
          totalPages={page.totalPages}
        />
      );
    default:
      return null;
  }
}

export function ReportDocument({ report, pageRefs, pdfCapture = false, screenPreview = false }) {
  const pages = useMemo(() => buildReportPageList(report), [report]);

  useEffect(() => {
    if (pageRefs?.current) {
      pageRefs.current.length = pages.length;
    }
  }, [pages.length, pageRefs]);

  if (!report) return null;

  const docClass = [
    "report-document",
    pdfCapture ? "report-document--pdf-capture" : "",
    screenPreview ? "report-document--screen-preview" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={docClass}>
      {pages.map((page, index) => (
        <ReportPageFrame
          key={`${page.type}-${index}`}
          className={page.type === "cover" ? "rpt-frame--cover" : ""}
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
