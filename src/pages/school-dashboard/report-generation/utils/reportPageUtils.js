export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

const SUMMARY_ROWS_PER_PAGE = 14;
const DOMAIN_QUESTIONS_PER_PAGE = 18;

export function splitDomainsForSummary(domains = []) {
  if (!domains.length) return [[]];

  const pages = [];
  let currentPage = [];
  let rowCount = 0;

  domains.forEach((domain) => {
    const rows = [
      { rowType: "domain", domain },
      ...(domain.subDomains || []).map((sub) => ({ rowType: "sub", domain, sub })),
    ];

    rows.forEach((row) => {
      if (rowCount >= SUMMARY_ROWS_PER_PAGE && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        rowCount = 0;
      }
      currentPage.push(row);
      rowCount += 1;
    });
  });

  if (currentPage.length) {
    pages.push(currentPage);
  }

  return pages.length ? pages : [[]];
}

export function splitDomainForDetailPages(domain) {
  const pages = [];
  let currentPage = {
    domainId: domain.domainId,
    domainOrder: domain.domainOrder,
    domainName: domain.domainName,
    percentage: domain.percentage,
    weightage: domain.weightage,
    obtainedMarks: domain.obtainedMarks,
    maxMarks: domain.maxMarks,
    questionCount: domain.questionCount,
    weightedScore: domain.weightedScore,
    subDomains: [],
  };
  let questionCount = 0;

  const pushPage = () => {
    if (currentPage.subDomains.length > 0) {
      pages.push(currentPage);
    }
    currentPage = {
      domainId: domain.domainId,
      domainOrder: domain.domainOrder,
      domainName: domain.domainName,
      percentage: domain.percentage,
      weightage: domain.weightage,
      obtainedMarks: domain.obtainedMarks,
      maxMarks: domain.maxMarks,
      questionCount: domain.questionCount,
      weightedScore: domain.weightedScore,
      subDomains: [],
    };
    questionCount = 0;
  };

  (domain.subDomains || []).forEach((sub) => {
    let subChunk = {
      subDomainId: sub.subDomainId,
      subDomainOrder: sub.subDomainOrder,
      subDomainName: sub.subDomainName,
      percentage: sub.percentage,
      obtainedMarks: sub.obtainedMarks,
      maxMarks: sub.maxMarks,
      questionCount: sub.questionCount,
      questions: [],
    };

    (sub.questions || []).forEach((question, qIndex) => {
      if (questionCount >= DOMAIN_QUESTIONS_PER_PAGE && subChunk.questions.length > 0) {
        currentPage.subDomains.push(subChunk);
        pushPage();
        subChunk = {
          subDomainId: sub.subDomainId,
          subDomainOrder: sub.subDomainOrder,
          subDomainName: sub.subDomainName,
          percentage: sub.percentage,
          obtainedMarks: sub.obtainedMarks,
          maxMarks: sub.maxMarks,
          questionCount: sub.questionCount,
          questions: [],
        };
      }

      subChunk.questions.push({ ...question, qIndex });
      questionCount += 1;
    });

    if (subChunk.questions.length > 0) {
      currentPage.subDomains.push(subChunk);
    }
  });

  if (currentPage.subDomains.length > 0) {
    pages.push(currentPage);
  }

  return pages.length
    ? pages
    : [
        {
          domainId: domain.domainId,
          domainOrder: domain.domainOrder,
          domainName: domain.domainName,
          percentage: domain.percentage,
          weightage: domain.weightage,
          obtainedMarks: domain.obtainedMarks,
          maxMarks: domain.maxMarks,
          questionCount: domain.questionCount,
          weightedScore: domain.weightedScore,
          subDomains: [],
        },
      ];
}

export function buildReportPageList(report) {
  if (!report) return [];

  const pages = [{ type: "cover", report }];

  const summaryChunks = splitDomainsForSummary(report.domains || []);
  summaryChunks.forEach((rows, index) => {
    pages.push({
      type: "summary",
      report,
      rows,
      pageIndex: index,
      pageCount: summaryChunks.length,
      showTotal: index === summaryChunks.length - 1,
      showOverview: index === 0,
    });
  });

  (report.domains || []).forEach((domain) => {
    const domainChunks = splitDomainForDetailPages(domain);
    domainChunks.forEach((chunk, index) => {
      pages.push({
        type: "domain-detail",
        report,
        domain: chunk,
        pageIndex: index,
        pageCount: domainChunks.length,
        showTotal: index === domainChunks.length - 1,
      });
    });
  });

  const totalPages = pages.length;
  return pages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
    totalPages,
  }));
}
