export const ADMIN_MONITOR_REPORT_PAGES = 3;

const ROWS_ON_PERFORMANCE_PAGE = 20;

/** Flat list of domain + subdomain rows (no questions). */
export function flattenDomainSubdomainRows(domains = []) {
  const rows = [];
  (domains || []).forEach((domain) => {
    rows.push({
      rowType: "domain",
      domainId: domain.domainId,
      domainName: domain.domainName,
      weightage: domain.weightage,
      obtainedMarks: domain.obtainedMarks,
      maxMarks: domain.maxMarks,
      percentage: domain.percentage,
      weightedScore: domain.weightedScore,
    });
    (domain.subDomains || []).forEach((sub) => {
      rows.push({
        rowType: "subdomain",
        domainId: domain.domainId,
        domainName: domain.domainName,
        subDomainId: sub.subDomainId,
        subDomainName: sub.subDomainName,
        obtainedMarks: sub.obtainedMarks,
        maxMarks: sub.maxMarks,
        percentage: sub.percentage,
      });
    });
  });
  return rows;
}

export function buildAdminMonitorReportPages(report) {
  if (!report) return [];

  const allRows = flattenDomainSubdomainRows(report.domains || []);
  const page2Rows = allRows.slice(0, ROWS_ON_PERFORMANCE_PAGE);
  const page3Rows = allRows.slice(ROWS_ON_PERFORMANCE_PAGE);

  const pages = [
    { type: "cover", report, pageNumber: 1, totalPages: ADMIN_MONITOR_REPORT_PAGES },
    {
      type: "performance",
      report,
      rows: page2Rows,
      pageIndex: 0,
      showOverview: true,
      pageNumber: 2,
      totalPages: ADMIN_MONITOR_REPORT_PAGES,
    },
    {
      type: "performance",
      report,
      rows: page3Rows,
      pageIndex: 1,
      showOverview: false,
      showInsights: true,
      pageNumber: 3,
      totalPages: ADMIN_MONITOR_REPORT_PAGES,
    },
  ];

  return pages;
}
